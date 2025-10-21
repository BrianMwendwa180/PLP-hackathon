import { useEffect, useState } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { landParcelsAPI, alertsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { LandParcel as APILandParcel, DegradationAlert as APIDegradationAlert } from '../lib/api';

type ParcelWithAlerts = APILandParcel & {
  alerts: APIDegradationAlert[];
};

export default function LandMap() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<ParcelWithAlerts[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelWithAlerts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const [parcelsResponse, alertsResponse] = await Promise.all([
        landParcelsAPI.getMyParcels(),
        alertsAPI.getAllAlerts(),
      ]);

      const apiParcels = parcelsResponse.data || [];
      const apiAlerts = alertsResponse.data || [];

      // Filter unresolved alerts
      const unresolvedAlerts = apiAlerts.filter((a: APIDegradationAlert) => !a.isResolved);

      const parcelsWithAlerts = apiParcels.map((parcel: APILandParcel) => ({
        ...parcel,
        alerts: unresolvedAlerts.filter((alert: APIDegradationAlert) => alert.parcelId._id === parcel._id),
      }));

      setParcels(parcelsWithAlerts);
      if (parcelsWithAlerts.length > 0) {
        setSelectedParcel(parcelsWithAlerts[0]);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Land Degradation Map & Alerts</h2>
        <p className="text-blue-50">
          Real-time monitoring of land health and degradation risks
        </p>
      </div>

      {parcels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Land Parcels Yet</h3>
          <p className="text-gray-600">Register your land parcels to start monitoring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="aspect-video bg-gradient-to-br from-emerald-100 via-blue-50 to-cyan-100 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-bounce" />
                    <p className="text-lg font-semibold text-gray-700">Interactive Map View</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Integrate with Google Earth Engine or Mapbox for satellite imagery
                    </p>
                  </div>
                </div>

                {parcels.map((parcel, index) => (
                  <div
                    key={parcel._id}
                    className={`absolute w-8 h-8 rounded-full ${
                      parcel.alerts.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                    } border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                    style={{
                      left: `${20 + index * 25}%`,
                      top: `${30 + (index % 2) * 20}%`,
                    }}
                    onClick={() => setSelectedParcel(parcel)}
                  >
                    {parcel.alerts.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {parcel.alerts.length}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {selectedParcel && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedParcel.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{selectedParcel.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Size</p>
                      <p className="font-medium text-gray-900">{selectedParcel.sizeHectares} hectares</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Coordinates</p>
                      <p className="font-medium text-gray-900">
                        {selectedParcel.latitude.toFixed(4)}, {selectedParcel.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Land Use</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedParcel.landUseType}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Active Alerts
              </h3>

              {parcels.flatMap((p) => p.alerts).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No active alerts</p>
                  <p className="text-xs text-gray-500 mt-1">All land parcels are healthy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parcels.flatMap((parcel) =>
                    parcel.alerts.map((alert) => (
                      <div
                        key={alert._id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4"
                        style={{ borderColor: getSeverityColor(alert.severity).replace('bg-', '') }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">
                            {alert.severity}
                          </p>
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getSeverityColor(alert.severity)}`}>
                            {alert.alertType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{alert.message}</p>
                        {alert.recommendedAction && (
                          <p className="text-xs text-gray-600 mt-2">
                            <span className="font-medium">Action:</span> {alert.recommendedAction}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Severity Legend</h3>
              <div className="space-y-2">
                {[
                  { level: 'Critical', color: 'bg-red-500' },
                  { level: 'High', color: 'bg-orange-500' },
                  { level: 'Medium', color: 'bg-amber-500' },
                  { level: 'Low', color: 'bg-yellow-500' },
                ].map((item) => (
                  <div key={item.level} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
