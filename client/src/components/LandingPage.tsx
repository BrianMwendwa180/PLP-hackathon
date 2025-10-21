import React from 'react';
import { Sprout, Users, BarChart3, Map, TreePine, Lightbulb, Award, ArrowRight, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onCollaborate: () => void;
}

export default function LandingPage({ onCollaborate }: LandingPageProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">


      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden min-h-screen flex items-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&h=1080&fit=crop&crop=center)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 rounded-2xl">
                  <Sprout className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                TerraLink
              </h1>
              <p className="text-xl text-gray-100 mb-8 max-w-3xl mx-auto lg:mx-0">
                Smart Land Health Intelligence Platform. Monitor, predict, and restore land health through AI, IoT, and collaborative technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={onCollaborate}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg font-semibold text-lg"
                >
                  <Users className="w-5 h-5" />
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="hidden lg:block"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Land Health Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access powerful tools and insights to monitor and improve land health across your operations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 group hover:shadow-lg transition-all">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center"
                  alt="Dashboard analytics and metrics"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <BarChart3 className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600">Real-time overview of your land health metrics and key performance indicators.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 group hover:shadow-lg transition-all">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=200&fit=crop&crop=center"
                  alt="Soil health monitoring"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <Sprout className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Soil Health</h3>
              <p className="text-gray-600">Monitor soil quality, nutrients, and health indicators with advanced sensors.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 group hover:shadow-lg transition-all">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=200&fit=crop&crop=center"
                  alt="Interactive land mapping"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <Map className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Land Map</h3>
              <p className="text-gray-600">Interactive mapping of your land parcels with health overlays and zoning.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 group hover:shadow-lg transition-all">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=200&fit=crop&crop=center"
                  alt="Land restoration activities"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <TreePine className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Restoration</h3>
              <p className="text-gray-600">Track restoration activities and measure progress towards land rehabilitation.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 group hover:shadow-lg transition-all">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop&crop=center"
                  alt="AI-powered recommendations"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <Lightbulb className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recommendations</h3>
              <p className="text-gray-600">AI-powered recommendations for optimal land management practices.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100 group hover:shadow-lg transition-all">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop&crop=center"
                  alt="Environmental impact metrics"
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <Award className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Impact Metrics</h3>
              <p className="text-gray-600">Measure and report on your environmental impact and sustainability goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-24 bg-cover bg-center bg-no-repeat min-h-[600px] flex items-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&crop=center)' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                About TerraLink
              </h2>
              <p className="text-lg mb-6">
                TerraLink is a revolutionary platform that combines artificial intelligence, Internet of Things (IoT) sensors, and blockchain technology to create a comprehensive land health monitoring and management system.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">AI-Driven Insights</h4>
                    <p>Leverage machine learning to predict land degradation and optimize restoration efforts.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Real-Time Monitoring</h4>
                    <p>Continuous data collection from IoT sensors for immediate response to changes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Blockchain Verification</h4>
                    <p>Immutable records of land health data and restoration activities for transparency.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Community Collaboration</h4>
                    <p>Connect with experts, researchers, and stakeholders for shared knowledge.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Join Our Mission</h3>
                <p className="text-gray-700 mb-6">
                  Be part of the movement to restore and protect our planet's most valuable resource - healthy land.
                </p>
                <button
                  onClick={onCollaborate}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md font-semibold"
                >
                  <Users className="w-5 h-5" />
                  Collaborate Now
                </button>
              </div>
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&crop=center"
                  alt="Sustainable technology and land monitoring"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">Advanced Monitoring Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
