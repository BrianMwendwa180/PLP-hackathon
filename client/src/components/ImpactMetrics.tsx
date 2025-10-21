import { useEffect, useState } from 'react';
import { Award, Trophy, Target, Zap, Star } from 'lucide-react';
import { usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { User as APIUser } from '../lib/api';

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
};

export default function ImpactMetrics() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<APIUser | null>(null);
  const [loading, setLoading] = useState(true);

  const allBadges: Badge[] = [
    {
      id: 'first_parcel',
      name: 'Land Pioneer',
      description: 'Register your first land parcel',
      icon: '🌱',
      earned: false,
    },
    {
      id: 'first_tree',
      name: 'Tree Planter',
      description: 'Plant your first tree',
      icon: '🌳',
      earned: false,
    },
    {
      id: 'soil_monitor',
      name: 'Soil Guardian',
      description: 'Record 10 soil health measurements',
      icon: '🔬',
      earned: false,
    },
    {
      id: 'carbon_hero',
      name: 'Carbon Hero',
      description: 'Offset 1000kg of carbon',
      icon: '🌍',
      earned: false,
    },
    {
      id: 'restoration_master',
      name: 'Restoration Master',
      description: 'Complete 50 restoration activities',
      icon: '⭐',
      earned: false,
    },
    {
      id: 'community_leader',
      name: 'Community Leader',
      description: 'Reach 10,000 impact points',
      icon: '👑',
      earned: false,
    },
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const response = await usersAPI.getProfile();
      const apiUser = response.data;

      if (apiUser) {
        setProfile(apiUser);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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

  const getLevel = (points: number) => {
    if (points >= 10000) return 5;
    if (points >= 5000) return 4;
    if (points >= 2000) return 3;
    if (points >= 500) return 2;
    return 1;
  };

  const getNextLevelPoints = (points: number) => {
    const level = getLevel(points);
    const thresholds = [0, 500, 2000, 5000, 10000];
    return level < 5 ? thresholds[level] : 10000;
  };

  const userPoints = profile?.impactPoints || 0;
  const userLevel = getLevel(userPoints);
  const nextLevelPoints = getNextLevelPoints(userPoints);
  const currentLevelStart = userLevel > 1 ? [0, 500, 2000, 5000, 10000][userLevel - 1] : 0;
  const progressPercent = ((userPoints - currentLevelStart) / (nextLevelPoints - currentLevelStart)) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Gamified Impact Metrics</h2>
        <p className="text-violet-50">
          Track your progress and earn badges for environmental contributions
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
              {userLevel}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Level {userLevel}</h3>
              <p className="text-sm text-gray-600">
                {userPoints.toLocaleString()} Impact Points
              </p>
            </div>
          </div>
          <div className="text-right">
            <Trophy className="w-12 h-12 text-amber-500 ml-auto mb-2" />
            <p className="text-xs text-gray-500">
              {nextLevelPoints - userPoints > 0
                ? `${(nextLevelPoints - userPoints).toLocaleString()} to next level`
                : 'Max Level!'}
            </p>
          </div>
        </div>

        {userLevel < 5 && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress to Level {userLevel + 1}</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBadges.map((badge) => {
          const earned = profile?.badges?.includes(badge.id) || false;
          return (
            <div
              key={badge.id}
              className={`rounded-xl border-2 p-6 transition-all ${
                earned
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-md'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`text-4xl p-3 rounded-lg ${
                    earned ? 'bg-white shadow-sm' : 'bg-gray-200 opacity-50 grayscale'
                  }`}
                >
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
                      {badge.name}
                    </h4>
                    {earned && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className={`text-sm ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
                    {badge.description}
                  </p>
                  {!earned && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-300 rounded-full h-1.5">
                        <div
                          className="bg-violet-500 h-full rounded-full"
                          style={{ width: `${badge.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Earn Points</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Register land parcel: +50 points
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Record soil data: +10 points
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Complete restoration: +100 points
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Verify activity: +25 points
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Level Benefits</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Priority support access
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Advanced AI recommendations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Community recognition
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Exclusive insights dashboard
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500 p-3 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Badge Collection</h3>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {profile?.badges?.length || 0}/{allBadges.length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Badges Earned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
