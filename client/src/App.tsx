import { useState } from 'react';
import { Sprout, BarChart3, Map, TreePine, Lightbulb, Award, Users, LogOut, Shield, Cpu, Menu, X } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import SoilHealthMonitor from './components/SoilHealthMonitor';
import LandMap from './components/LandMap';
import RestorationTracker from './components/RestorationTracker';
import Recommendations from './components/Recommendations';
import ImpactMetrics from './components/ImpactMetrics';
import Resilience from './components/Resilience';
import IoTSensorDashboard from './components/IoTSensorDashboard';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';

type NavItem = {
  id: string;
  label: string;
  icon: typeof Sprout;
  component: React.ComponentType;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: Dashboard },
    { id: 'soil-health', label: 'Soil Health', icon: Sprout, component: SoilHealthMonitor },
    { id: 'iot-sensors', label: 'IoT Sensors', icon: Cpu, component: IoTSensorDashboard },
    { id: 'map', label: 'Land Map', icon: Map, component: LandMap },
    { id: 'restoration', label: 'Restoration', icon: TreePine, component: RestorationTracker },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, component: Recommendations },
    { id: 'impact', label: 'Impact Metrics', icon: Award, component: ImpactMetrics },
    { id: 'resilience', label: 'Resilience', icon: Shield, component: Resilience },
  ];

  const ActiveComponent = navItems.find((item) => item.id === activeTab)?.component || Dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  TerraLink
                </h1>
                <p className="text-xs text-gray-500">Smart Land Health Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-8">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {!user && (
                  <>
                    <button
                      onClick={() => {
                        const element = document.getElementById('home');
                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => {
                        const element = document.getElementById('about');
                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                    >
                      About
                    </button>
                  </>
                )}
                {user ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm font-medium text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Collaborate
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 right-4 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-50 min-w-[150px]">
          {!user && (
            <>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  const element = document.getElementById('home');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  const element = document.getElementById('about');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                About
              </button>
            </>
          )}
          {user ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Collaborate
            </button>
          )}
        </div>
      )}

      {user && (
        <>
          <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible py-2 sm:py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ActiveComponent />
          </main>
        </>
      )}

      <main className="flex-1">
        {!user && <LandingPage onCollaborate={() => setIsAuthModalOpen(true)} />}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <footer className="bg-gradient-to-br from-emerald-50 to-teal-50 border-t border-emerald-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">TerraLink</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                A collaborative platform leveraging AI, IoT, and blockchain to monitor, predict, and restore land health.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Impact Areas</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Soil Health Monitoring</li>
                <li>• Sustainable Agriculture</li>
                <li>• Land Rehabilitation</li>
                <li>• Climate Resilience</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Technology</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• AI-Driven Analysis</li>
                <li>• Blockchain Verification</li>
                <li>• Real-time Monitoring</li>
                <li>• Community Collaboration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=60&h=40&fit=crop&crop=center"
                    alt="Documentation"
                    className="w-12 h-8 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Documentation</p>
                    <p className="text-xs text-gray-500">API & Guides</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=60&h=40&fit=crop&crop=center"
                    alt="Community"
                    className="w-12 h-8 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Community</p>
                    <p className="text-xs text-gray-500">Join Discussions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                Copyright © 2025 TerraLink - Connecting Technology, Collaboration, and Sustainability
              </p>
              <div className="flex gap-6 text-sm text-gray-500">
                <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
