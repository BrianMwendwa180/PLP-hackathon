import { useEffect, useState } from 'react';
import { TreePine, Shield, Leaf, TrendingUp } from 'lucide-react';
import { restorationAPI } from '../lib/api';
import type { RestorationActivity as APIRestorationActivity } from '../lib/api';

export default function RestorationTracker() {
  const [activities, setActivities] = useState<APIRestorationActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestorationActivities();
  }, []);

  const loadRestorationActivities = async () => {
    try {
      const response = await restorationAPI.getAllActivities();
      const apiActivities = Array.isArray(response.data) ? response.data : [];

      setActivities(apiActivities);
    } catch (error) {
      console.error('Error loading restoration activities:', error);
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

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <Shield className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('tree')) return TreePine;
    if (type.includes('cover')) return Leaf;
    return TrendingUp;
  };

  const totalCarbonOffset = activities.reduce((sum, act) => sum + act.carbonOffsetKg, 0);
  const totalActivities = activities.length;
  const verifiedActivities = activities.filter((a) => a.verificationStatus === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Reforestation Tracker</h2>
        <p className="text-teal-50">
          Blockchain-powered transparent tracking of restoration activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <TreePine className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{totalActivities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified Activities</p>
              <p className="text-2xl font-bold text-gray-900">{verifiedActivities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-50 p-3 rounded-lg">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Carbon Offset</p>
              <p className="text-2xl font-bold text-gray-900">{totalCarbonOffset.toFixed(0)} kg</p>
            </div>
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <TreePine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Restoration Activities Yet</h3>
          <p className="text-gray-600">Start recording restoration activities to build transparency</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activityType);
              return (
                <div key={activity._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-50 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {activity.activityType.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    {getVerificationBadge(activity.verificationStatus)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 ml-11">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.quantity} {activity.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Carbon Offset</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.carbonOffsetKg.toFixed(1)} kg
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Blockchain Hash</p>
                      <p className="text-xs font-mono text-gray-900 truncate">
                        {activity.blockchainHash || 'Pending verification...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 ml-11 text-xs text-gray-500">
                    <span>Performed: {new Date(activity.performedAt).toLocaleDateString()}</span>
                    {activity.verifiedAt && (
                      <span className="text-emerald-600 font-medium">
                        Verified: {new Date(activity.verifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500 p-3 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Blockchain Verification</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Each restoration activity is recorded on a blockchain ledger, ensuring complete transparency
              and traceability. This allows sponsors, organizations, and stakeholders to verify the
              authenticity and impact of every environmental action taken.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
