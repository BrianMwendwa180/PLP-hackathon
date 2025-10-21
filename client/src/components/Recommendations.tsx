import { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { recommendationsAPI } from '../lib/api';
import type { Recommendation as APIRecommendation } from '../lib/api';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<APIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await recommendationsAPI.getAllRecommendations();
      const apiRecommendations = Array.isArray(response.data) ? response.data : [];

      setRecommendations(apiRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'implemented') {
        updates.implementedAt = new Date().toISOString();
      }

      const response = await recommendationsAPI.updateRecommendation(id, updates);
      const updatedRecommendation = response.data.recommendation;

      setRecommendations((prev) =>
        prev.map((rec) =>
          rec._id === id ? updatedRecommendation : rec
        )
      );
    } catch (error) {
      console.error('Error updating recommendation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-emerald-100 text-emerald-700';
      case 'dismissed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const implementedRecs = recommendations.filter((r) => r.status === 'implemented');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Land Restoration Recommendations</h2>
        <p className="text-amber-50">
          AI-powered suggestions for improving soil health and land vitality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-sm text-gray-500">Pending Actions</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRecs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-500">Implemented</p>
              <p className="text-2xl font-bold text-gray-900">{implementedRecs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600">
            AI recommendations will appear here based on your land health data
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium uppercase border ${getPriorityColor(
                          rec.priority
                        )}`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                  {rec.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-11 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ${rec.estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Expected Impact</p>
                    <p className="text-sm font-semibold text-gray-900">
                      High
                    </p>
                  </div>
                </div>

                {rec.aiConfidence !== null && rec.aiConfidence !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                    <div>
                      <p className="text-xs text-gray-500">AI Confidence</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {(rec.aiConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {rec.status === 'pending' && (
                <div className="flex gap-2 ml-11 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleStatusUpdate(rec._id, 'implemented')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Implemented
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(rec._id, 'dismissed')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </div>
              )}

              {rec.implementedAt && (
                <div className="ml-11 pt-4 border-t border-gray-100 text-xs text-emerald-600 font-medium">
                  Implemented on {new Date(rec.implementedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
