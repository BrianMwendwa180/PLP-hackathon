import { useEffect, useState } from 'react';
import { Sprout, TrendingUp, AlertTriangle, Award, Eye, Edit, Download, Plus } from 'lucide-react';
import { landParcelsAPI, soilHealthAPI, alertsAPI, type LandParcel } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { exportLandParcels } from '../lib/csvExport';
import ParcelModal from './ParcelModal';

// Use the LandParcel type from API
type APILandParcel = LandParcel;

type APISoilHealthRecord = {
  vitalityScore?: number;
};

type APIDegradationAlert = {
  isResolved: boolean;
};

type DashboardStats = {
  totalParcels: number;
  averageVitality: number;
  activeAlerts: number;
  impactPoints: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalParcels: 0,
    averageVitality: 0,
    activeAlerts: 0,
    impactPoints: 0,
  });
  const [allParcels, setAllParcels] = useState<APILandParcel[]>([]);
  const [recentParcels, setRecentParcels] = useState<APILandParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<APILandParcel | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      // Use API calls instead of direct Supabase queries
      const [parcelsRes, soilRes, alertsRes] = await Promise.all([
        landParcelsAPI.getMyParcels(),
        soilHealthAPI.getAllRecords(),
        alertsAPI.getAllAlerts(),
      ]);

      const apiParcels = parcelsRes.data || [];
      const apiSoilRecords = soilRes.data || [];
      const apiAlerts = alertsRes.data || [];

      // Extract vitality scores from API soil records
      const vitalityScores = apiSoilRecords.map((r: APISoilHealthRecord) => r.vitalityScore || 0);
      const avgVitality = vitalityScores.length > 0
        ? vitalityScores.reduce((sum: number, score: number) => sum + score, 0) / vitalityScores.length
        : 0;

      // Filter active alerts from API
      const activeAlertsCount = apiAlerts.filter((a: APIDegradationAlert) => !a.isResolved).length;

      setStats({
        totalParcels: apiParcels.length,
        averageVitality: Math.round(avgVitality),
        activeAlerts: activeAlertsCount,
        impactPoints: user.impactPoints || 0,
      });

      setAllParcels(apiParcels);
      setRecentParcels(apiParcels.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
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

  const statCards = [
    {
      icon: Sprout,
      label: 'Land Parcels',
      value: stats.totalParcels,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: TrendingUp,
      label: 'Avg Vitality Score',
      value: `${stats.averageVitality}%`,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: AlertTriangle,
      label: 'Active Alerts',
      value: stats.activeAlerts,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      icon: Award,
      label: 'Impact Points',
      value: stats.impactPoints,
      color: 'violet',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative mb-8">
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=300&fit=crop&crop=center"
          alt="Dashboard overview background"
          className="w-full h-48 object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/80 to-teal-500/80 rounded-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-3xl font-bold text-white text-center">Land Health Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=60&fit=crop&crop=center"
              alt="Land parcels overview"
              className="w-16 h-10 object-cover rounded-lg"
            />
            <h3 className="text-lg font-semibold text-gray-900">Land Parcels</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedParcel(null);
                setModalMode('create');
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Parcel
            </button>
            {allParcels.length > 0 && (
              <button
                onClick={() => exportLandParcels(allParcels)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
        {allParcels.length > 0 ? (
          <div className="space-y-3">
            {allParcels.map((parcel) => (
              <div
                key={parcel._id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img
                  src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=60&h=40&fit=crop&crop=center"
                  alt="Land parcel"
                  className="w-12 h-8 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{parcel.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{parcel.location}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-900">{parcel.sizeHectares} ha</p>
                  <p className="text-xs text-gray-500 capitalize">{parcel.landUseType}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedParcel(parcel);
                      setModalMode('view');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedParcel(parcel);
                      setModalMode('edit');
                    }}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit Parcel"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No land parcels yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first land parcel to track its health and restoration activities.</p>
            <button
              onClick={() => {
                setSelectedParcel(null);
                setModalMode('create');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Parcel
            </button>
          </div>
        )}
      </div>

      <ParcelModal
        parcel={selectedParcel}
        isOpen={!!selectedParcel || modalMode === 'create'}
        onClose={() => {
          setSelectedParcel(null);
          setModalMode('view');
        }}
        onSave={(updatedParcel) => {
          setAllParcels(prev => {
            if (modalMode === 'create') {
              return [...prev, updatedParcel];
            } else {
              return prev.map(p => p._id === updatedParcel._id ? updatedParcel : p);
            }
          });
          setRecentParcels(prev => {
            if (modalMode === 'create') {
              return [updatedParcel, ...prev.slice(0, 2)];
            } else {
              return prev.map(p => p._id === updatedParcel._id ? updatedParcel : p);
            }
          });
          loadDashboardData();
          setSelectedParcel(null);
          setModalMode('view');
        }}
        mode={modalMode}
      />
    </div>
  );
}