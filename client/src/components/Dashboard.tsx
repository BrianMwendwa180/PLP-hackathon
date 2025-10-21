import { useEffect, useState } from 'react';
import { Sprout, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { landParcelsAPI, soilHealthAPI, alertsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { LandParcel as APILandParcel, SoilHealthRecord as APISoilHealthRecord, DegradationAlert as APIDegradationAlert } from '../lib/api';

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
  const [recentParcels, setRecentParcels] = useState<APILandParcel[]>([]);
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

      {recentParcels.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=60&fit=crop&crop=center"
              alt="Land parcels overview"
              className="w-16 h-10 object-cover rounded-lg"
            />
            <h3 className="text-lg font-semibold text-gray-900">Recent Land Parcels</h3>
          </div>
          <div className="space-y-3">
            {recentParcels.map((parcel) => (
              <div
                key={parcel._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=60&h=40&fit=crop&crop=center"
                    alt="Land parcel"
                    className="w-12 h-8 object-cover rounded"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{parcel.name}</h4>
                    <p className="text-sm text-gray-600">{parcel.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{parcel.sizeHectares} ha</p>
                  <p className="text-xs text-gray-500 capitalize">{parcel.landUseType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
