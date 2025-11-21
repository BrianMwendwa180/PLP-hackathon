import ee from '@google/earthengine';
import dotenv from 'dotenv';

dotenv.config();

class GoogleEarthEngineService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Earth Engine with service account or user credentials
      const privateKey = process.env.EE_PRIVATE_KEY;
      const serviceAccount = process.env.EE_SERVICE_ACCOUNT;

      if (privateKey && serviceAccount) {
        // Service account authentication
        const key = JSON.parse(privateKey);
        ee.data.authenticateViaPrivateKey(key, () => {
          ee.initialize(null, null, () => {
            console.log('Earth Engine initialized with service account');
            this.initialized = true;
          }, (error) => {
            console.error('Earth Engine service account initialization failed:', error);
          });
        });
      } else {
        // User authentication (from earthengine authenticate)
        ee.data.authenticateViaOauth(process.env.EE_CLIENT_ID || '517222506229-vsmmajv00ul0bs7p89v5m89qs8eb9359.apps.googleusercontent.com', () => {
          ee.initialize(null, null, () => {
            console.log('Earth Engine initialized with user credentials');
            this.initialized = true;
          }, (error) => {
            console.error('Earth Engine user authentication failed:', error);
          });
        });
      }
    } catch (error) {
      console.error('Failed to initialize Earth Engine:', error);
      throw error;
    }
  }

  async analyzeParcel(parcel) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { latitude, longitude, size } = parcel;

      if (!latitude || !longitude) {
        throw new Error('Parcel coordinates are required for Earth Engine analysis');
      }

      // Create a point geometry for the parcel center
      const point = ee.Geometry.Point([longitude, latitude]);

      // Define a buffer around the point based on parcel size (approximate)
      // Convert hectares to square meters, then to radius in meters
      const areaSqM = (size || 1) * 10000; // Default 1 hectare if size not provided
      const radius = Math.sqrt(areaSqM / Math.PI);

      const parcelGeometry = point.buffer(radius);

      // Get current date and date 30 days ago
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // NDVI Analysis using Sentinel-2
      const sentinel2 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
        .filterBounds(parcelGeometry)
        .filterDate(startDateStr, endDateStr)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
        .sort('CLOUDY_PIXEL_PERCENTAGE');

      const ndviImage = sentinel2
        .map(image => {
          const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
          return image.addBands(ndvi);
        })
        .select('NDVI')
        .median();

      const ndviValue = await this.getImageValue(ndviImage, point);

      // Land Cover Analysis using ESA WorldCover
      const worldCover = ee.ImageCollection('ESA/WorldCover/v200')
        .filterBounds(parcelGeometry)
        .first();

      const landCoverValue = await this.getImageValue(worldCover, point);

      // Precipitation Analysis using CHIRPS
      const chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
        .filterBounds(parcelGeometry)
        .filterDate(startDateStr, endDateStr);

      const precipitationImage = chirps.sum();
      const precipitationValue = await this.getImageValue(precipitationImage, point);

      // Land Surface Temperature (optional)
      const lst = ee.ImageCollection('MODIS/061/MOD11A1')
        .filterBounds(parcelGeometry)
        .filterDate(startDateStr, endDateStr)
        .select('LST_Day_1km')
        .median();

      const lstValue = await this.getImageValue(lst, point);

      // Convert LST from Kelvin to Celsius
      const temperatureCelsius = lstValue ? (lstValue * 0.02) - 273.15 : null;

      return {
        ndvi: ndviValue ? parseFloat(ndviValue.toFixed(3)) : null,
        landCover: this.getLandCoverDescription(landCoverValue),
        landCoverCode: landCoverValue,
        precipitation: precipitationValue ? parseFloat(precipitationValue.toFixed(1)) : null,
        temperature: temperatureCelsius ? parseFloat(temperatureCelsius.toFixed(1)) : null,
        analysisDate: endDateStr,
        parcelCoordinates: { latitude, longitude },
        confidence: ndviValue !== null ? 0.85 : 0.5
      };

    } catch (error) {
      console.error('Earth Engine parcel analysis error:', error);
      throw new Error(`Failed to analyze parcel: ${error.message}`);
    }
  }

  async getImageValue(image, point) {
    try {
      const value = await new Promise((resolve, reject) => {
        image.sample(point, 30).first().evaluate((feature, error) => {
          if (error) {
            reject(error);
          } else {
            const properties = feature?.properties || {};
            const bandNames = Object.keys(properties);
            const firstBand = bandNames[0];
            resolve(properties[firstBand] || null);
          }
        });
      });
      return value;
    } catch (error) {
      console.warn('Failed to get image value:', error.message);
      return null;
    }
  }

  getLandCoverDescription(code) {
    const landCoverTypes = {
      10: 'Tree cover',
      20: 'Shrubland',
      30: 'Grassland',
      40: 'Cropland',
      50: 'Built-up',
      60: 'Bare / sparse vegetation',
      70: 'Snow and ice',
      80: 'Permanent water bodies',
      90: 'Herbaceous wetland',
      95: 'Mangroves',
      100: 'Moss and lichen'
    };

    return landCoverTypes[code] || 'Unknown';
  }

  async getVegetationTrends(parcel, months = 12) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { latitude, longitude } = parcel;
      if (!latitude || !longitude) {
        throw new Error('Parcel coordinates required');
      }

      const point = ee.Geometry.Point([longitude, latitude]);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Monthly NDVI time series
      const sentinel2 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
        .filterBounds(point)
        .filterDate(startDateStr, endDateStr)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30));

      const monthlyNdvi = ee.List.sequence(0, months - 1).map(monthOffset => {
        const start = ee.Date(startDateStr).advance(monthOffset, 'month');
        const end = start.advance(1, 'month');

        const monthlyImage = sentinel2
          .filterDate(start, end)
          .map(image => image.normalizedDifference(['B8', 'B4']).rename('NDVI'))
          .select('NDVI')
          .median();

        return ee.Feature(null, {
          month: start.format('YYYY-MM'),
          ndvi: monthlyImage.reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 10
          }).get('NDVI')
        });
      });

      const ndviFeatures = monthlyNdvi;
      const ndviValues = await this.evaluateFeatures(ndviFeatures);

      return ndviValues.map(item => ({
        month: item.month,
        ndvi: item.ndvi ? parseFloat(item.ndvi.toFixed(3)) : null
      }));

    } catch (error) {
      console.error('Vegetation trends analysis error:', error);
      return [];
    }
  }

  async evaluateFeatures(featureList) {
    return new Promise((resolve, reject) => {
      ee.FeatureCollection(featureList).evaluate((collection, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(collection.features.map(f => f.properties));
        }
      });
    });
  }
}

export const googleEarthEngineService = new GoogleEarthEngineService();
