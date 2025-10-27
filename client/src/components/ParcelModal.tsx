import { useState, useEffect } from 'react';
import { X, Edit3, Save, MapPin, Calendar, User, Plus } from 'lucide-react';
import { landParcelsAPI, type LandParcel } from '../lib/api';

interface ParcelModalProps {
  parcel: LandParcel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedParcel: LandParcel) => void;
  mode: 'view' | 'edit' | 'create';
}

export default function ParcelModal({ parcel, isOpen, onClose, onSave, mode }: ParcelModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
  const [formData, setFormData] = useState<Partial<LandParcel>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsEditing(mode === 'edit' || mode === 'create');
    if (parcel) {
      setFormData({
        name: parcel.name,
        location: parcel.location,
        latitude: parcel.latitude,
        longitude: parcel.longitude,
        sizeHectares: parcel.sizeHectares,
        landUseType: parcel.landUseType,
        soilType: parcel.soilType || '',
        vegetationType: parcel.vegetationType || '',
        irrigationType: parcel.irrigationType || '',
        climateZone: parcel.climateZone || '',
      });
    } else if (mode === 'create') {
      // Initialize empty form for creation
      setFormData({
        name: '',
        location: '',
        latitude: 0,
        longitude: 0,
        sizeHectares: 0,
        landUseType: 'agriculture',
        soilType: '',
        vegetationType: '',
        irrigationType: '',
        climateZone: '',
      });
    }
  }, [parcel, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Parcel name is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    if (formData.latitude === undefined || formData.latitude === null || isNaN(formData.latitude)) newErrors.latitude = 'Valid latitude is required';
    if (formData.longitude === undefined || formData.longitude === null || isNaN(formData.longitude)) newErrors.longitude = 'Valid longitude is required';
    if (formData.sizeHectares === undefined || formData.sizeHectares === null || formData.sizeHectares <= 0) newErrors.sizeHectares = 'Size must be a positive number';
    if (!formData.landUseType) newErrors.landUseType = 'Land use type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'create') {
        const response = await landParcelsAPI.createParcel({
          name: formData.name!.trim(),
          location: formData.location!.trim(),
          latitude: formData.latitude!,
          longitude: formData.longitude!,
          sizeHectares: formData.sizeHectares!,
          landUseType: formData.landUseType!,
          soilType: formData.soilType || undefined,
          vegetationType: formData.vegetationType || undefined,
          irrigationType: formData.irrigationType || undefined,
          climateZone: formData.climateZone || undefined,
        });
        if (onSave) {
          onSave(response.data.landParcel);
        }
        onClose();
      } else if (parcel) {
        const response = await landParcelsAPI.updateParcel(parcel._id, formData);
        if (onSave) {
          onSave(response.data.landParcel);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving parcel:', error);
      alert(`Failed to ${mode === 'create' ? 'create' : 'update'} parcel. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Land Parcel' : isEditing ? 'Edit Land Parcel' : 'Land Parcel Details'}
          </h2>
          <div className="flex items-center gap-2">
            {mode === 'edit' && !isEditing && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parcel Name</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter parcel name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </>
              ) : (
                parcel && <p className="text-gray-900 font-medium">{parcel.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Land Use Type</label>
              {isEditing ? (
                <>
                  <select
                    value={formData.landUseType || ''}
                    onChange={(e) => handleInputChange('landUseType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.landUseType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select type</option>
                    <option value="agriculture">Agricultural</option>
                    <option value="forest">Forest</option>
                    <option value="grassland">Grassland</option>
                    <option value="urban">Urban</option>
                    <option value="wetland">Wetland</option>
                  </select>
                  {errors.landUseType && <p className="text-red-500 text-xs mt-1">{errors.landUseType}</p>}
                </>
              ) : (
                parcel && <p className="text-gray-900 capitalize">{parcel.landUseType}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter location"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </>
            ) : (
              parcel && <p className="text-gray-900">{parcel.location}</p>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.latitude ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., 40.7128"
                  />
                  {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
                </>
              ) : (
                parcel && <p className="text-gray-900">{parcel.latitude}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.longitude ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., -74.0060"
                  />
                  {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
                </>
              ) : (
                parcel && <p className="text-gray-900">{parcel.longitude}</p>
              )}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Size (Hectares)</label>
            {isEditing ? (
              <>
                <input
                  type="number"
                  step="any"
                  value={formData.sizeHectares || ''}
                  onChange={(e) => handleInputChange('sizeHectares', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.sizeHectares ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 10.5"
                  min="0"
                />
                {errors.sizeHectares && <p className="text-red-500 text-xs mt-1">{errors.sizeHectares}</p>}
              </>
            ) : (
              parcel && <p className="text-gray-900">{parcel.sizeHectares} hectares</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
              {isEditing ? (
                <select
                  value={formData.soilType || ''}
                  onChange={(e) => handleInputChange('soilType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select soil type (optional)</option>
                  <option value="sandy">Sandy</option>
                  <option value="clay">Clay</option>
                  <option value="loam">Loam</option>
                  <option value="silt">Silt</option>
                  <option value="peat">Peat</option>
                  <option value="chalk">Chalk</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                parcel && <p className="text-gray-900 capitalize">{parcel.soilType || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vegetation Type</label>
              {isEditing ? (
                <select
                  value={formData.vegetationType || ''}
                  onChange={(e) => handleInputChange('vegetationType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select vegetation type (optional)</option>
                  <option value="grassland">Grassland</option>
                  <option value="forest">Forest</option>
                  <option value="cropland">Cropland</option>
                  <option value="shrubland">Shrubland</option>
                  <option value="wetland">Wetland</option>
                  <option value="barren">Barren</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                parcel && <p className="text-gray-900 capitalize">{parcel.vegetationType || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* Irrigation and Climate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation Type</label>
              {isEditing ? (
                <select
                  value={formData.irrigationType || ''}
                  onChange={(e) => handleInputChange('irrigationType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select irrigation type (optional)</option>
                  <option value="rainfed">Rainfed</option>
                  <option value="irrigated">Irrigated</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="flood">Flood Irrigation</option>
                  <option value="none">None</option>
                </select>
              ) : (
                parcel && <p className="text-gray-900 capitalize">{parcel.irrigationType || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Climate Zone</label>
              {isEditing ? (
                <select
                  value={formData.climateZone || ''}
                  onChange={(e) => handleInputChange('climateZone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select climate zone (optional)</option>
                  <option value="tropical">Tropical</option>
                  <option value="subtropical">Subtropical</option>
                  <option value="temperate">Temperate</option>
                  <option value="continental">Continental</option>
                  <option value="polar">Polar</option>
                  <option value="arid">Arid</option>
                  <option value="semiarid">Semi-arid</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                parcel && <p className="text-gray-900 capitalize">{parcel.climateZone || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* Owner Information */}
          {mode !== 'create' && parcel && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Owner Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{parcel.ownerId.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{parcel.ownerId.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Created Date */}
          {mode !== 'create' && parcel && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Registration Details
              </h3>
              <p className="text-gray-900">
                Created on {new Date(parcel.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            {mode !== 'create' && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {mode === 'create' ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : mode === 'create' ? 'Create Parcel' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
