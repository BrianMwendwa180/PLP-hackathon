import { useEffect, useState } from 'react';
import { TreePine, Shield, Leaf, Plus, Calendar, CheckCircle, MapPin, Lightbulb, Target, Download, MessageCircle, Send, Bot, User, X } from 'lucide-react';
import { restorationAPI } from '../lib/api';
import type { RestorationActivity as APIRestorationActivity } from '../lib/api';
import { exportToCSV } from '../lib/csvExport';
import { aiRecommendationsAPI } from '../lib/enhancedApi';

export default function RestorationTracker() {
  const [activities, setActivities] = useState<APIRestorationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleExportCSV = () => {
    const csvData = activities.map(activity => ({
      Date: new Date(activity.performedAt).toLocaleDateString(),
      'Activity Type': activity.activityType,
      'Description': activity.description,
      'Quantity': activity.quantity,
      'Unit': activity.unit,
      'Carbon Offset (kg)': activity.carbonOffsetKg,
      'Verification Status': activity.verificationStatus,
      'Verified At': activity.verifiedAt ? new Date(activity.verifiedAt).toLocaleDateString() : 'N/A'
    }));
    exportToCSV(csvData, 'restoration-activities');
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    // Create a custom PDF for restoration activities
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Restoration Activities Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

    let yPosition = 50;
    activities.slice(0, 15).forEach(activity => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`${activity.activityType.replace(/_/g, ' ')} - ${activity.quantity} ${activity.unit}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Description: ${activity.description}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Carbon Offset: ${activity.carbonOffsetKg.toFixed(1)} kg`, 20, yPosition);
      yPosition += 8;
      doc.text(`Status: ${activity.verificationStatus}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Date: ${new Date(activity.performedAt).toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;
    });

    doc.save(`restoration-activities-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const getAISuggestions = () => {
    const suggestions = [
      {
        type: 'tree_planting',
        title: 'Tree Planting Campaign',
        description: 'Plant native tree species to restore biodiversity and sequester carbon.',
        estimatedCost: 2500,
        estimatedTime: '2-3 months',
        priority: 'high'
      },
      {
        type: 'cover_cropping',
        title: 'Cover Cropping Program',
        description: 'Implement cover crops to prevent soil erosion and improve soil health.',
        estimatedCost: 800,
        estimatedTime: '1 month',
        priority: 'medium'
      },
      {
        type: 'terracing',
        title: 'Terrace Construction',
        description: 'Build terraces to prevent soil erosion on slopes.',
        estimatedCost: 5000,
        estimatedTime: '3-4 months',
        priority: 'high'
      },
      {
        type: 'grass_strips',
        title: 'Grass Buffer Strips',
        description: 'Install grass strips along waterways to filter runoff and prevent erosion.',
        estimatedCost: 1200,
        estimatedTime: '1-2 months',
        priority: 'medium'
      }
    ];

    return suggestions.filter(suggestion => {
      // Filter out suggestions that are already implemented
      return !activities.some(activity =>
        activity.activityType.toLowerCase().includes(suggestion.type.split('_')[0])
      );
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    // Add user message to chat
    const newUserMessage = { role: 'user' as const, content: userMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      // Get parcel ID from activities (assuming all activities belong to the same parcel)
      const parcelId = activities.length > 0 ? activities[0].parcelId : null;
      if (!parcelId) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I need access to your land parcel data to provide personalized restoration advice. Please ensure you have restoration activities recorded.',
          timestamp: new Date()
        }]);
        return;
      }

      const parcelIdString = typeof parcelId === 'string' ? parcelId : parcelId._id;
      const conversationHistory = chatMessages.map(msg => ({ role: msg.role, content: msg.content }));

      const response = await aiRecommendationsAPI.chatWithRestorationAI(parcelIdString, userMessage, conversationHistory);

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant' as const,
        content: response.data.response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    return Shield;
  };

  const totalCarbonOffset = activities.reduce((sum, act) => sum + act.carbonOffsetKg, 0);
  const totalActivities = activities.length;
  const verifiedActivities = activities.filter((a) => a.verificationStatus === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Reforestation Tracker</h2>
            <p className="text-teal-50">
              Blockchain-powered transparent tracking of restoration activities
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              AI Suggestions
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              AI Chat
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-t-lg transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-b-lg transition-colors"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSuggestions && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Restoration Suggestions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAISuggestions().map((suggestion, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    suggestion.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Est. Cost: ${suggestion.estimatedCost}</span>
                  <span>Time: {suggestion.estimatedTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activities</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Target className="w-4 h-4" />
              <span>{activities.length} activities tracked</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.activityType);
              return (
                <div key={activity._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-emerald-50 p-2 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {activity.activityType.replace(/_/g, ' ')}
                          </h4>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getVerificationBadge(activity.verificationStatus)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 ml-11">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.quantity} {activity.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Carbon Offset</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.carbonOffsetKg.toFixed(1)} kg
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Blockchain Hash</p>
                        <p className="text-xs font-mono text-gray-900 truncate">
                          {activity.blockchainHash || 'Pending verification...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 ml-11 text-xs text-gray-500 gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Performed: {new Date(activity.performedAt).toLocaleDateString()}
                      </span>
                      {activity.verifiedAt && (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified: {new Date(activity.verifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{activity.parcelId?.name || 'Unknown Parcel'}</span>
                    </div>
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

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Restoration Assistant</h3>
                  <p className="text-sm text-gray-600">Ask questions about land restoration practices</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Welcome to AI Restoration Chat!</p>
                  <p className="text-sm">Ask me anything about land restoration, soil health, or sustainable farming practices.</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-400">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setChatInput("How can I improve soil health on degraded land?")}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition-colors"
                      >
                        Soil health improvement
                      </button>
                      <button
                        onClick={() => setChatInput("What are the best cover crops for erosion control?")}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition-colors"
                      >
                        Cover crop recommendations
                      </button>
                      <button
                        onClick={() => setChatInput("How much does terracing cost per hectare?")}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition-colors"
                      >
                        Cost estimates
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {chatMessages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                      <Bot className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <div className={`max-w-[70%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="bg-emerald-600 p-2 rounded-lg flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about restoration practices..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Menu */}
      {showExportMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Export Options</h3>
              <div className="space-y-3">
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export as PDF
                </button>
              </div>
              <button
                onClick={() => setShowExportMenu(false)}
                className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
