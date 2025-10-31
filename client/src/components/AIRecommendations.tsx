import { useState, useEffect } from 'react';
import {
  Brain,
  Cloud,
  TrendingUp,
  Zap,
  Camera,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Target,
  Leaf,
  Droplets,
  Bug,
  Eye
} from 'lucide-react';
import { aiRecommendationsAPI, imageAnalysisAPI, backgroundProcessingAPI, type ImageAnalysisResult } from '../lib/enhancedApi';
import { landParcelsAPI, type LandParcel } from '../lib/api';

export default function AIRecommendations() {
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [imageAnalysisResults, setImageAnalysisResults] = useState<ImageAnalysisResult[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [analysisType, setAnalysisType] = useState<string>('crop-disease');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [queueStatus, setQueueStatus] = useState<any>(null);

  useEffect(() => {
    loadParcels();
    loadQueueStatus();
  }, []);

  const loadParcels = async () => {
    try {
      const response = await landParcelsAPI.getMyParcels();
      setParcels(response.data);
      if (response.data.length > 0 && !selectedParcel) {
        setSelectedParcel(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error loading parcels:', error);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const response = await backgroundProcessingAPI.getQueueStatus();
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Error loading queue status:', error);
    }
  };

  const generateAIRecommendations = async () => {
    if (!selectedParcel) return;

    setGenerating(true);
    try {
      const response = await aiRecommendationsAPI.generateComprehensiveRecommendations(selectedParcel);
      console.log('AI Recommendations generated:', response.data);

      // Refresh recommendations list
      // Note: In a real implementation, you'd want to refresh the recommendations from the API
      alert('AI recommendations generated successfully! Check the Recommendations tab to view them.');
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      alert('Failed to generate AI recommendations. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(files);
  };

  const analyzeImages = async () => {
    if (!selectedParcel || selectedImages.length === 0) return;

    setAnalyzingImages(true);
    try {
      let response;
      switch (analysisType) {
        case 'crop-disease':
          response = await imageAnalysisAPI.analyzeCropDisease({
            parcelId: selectedParcel,
            images: selectedImages
          });
          break;
        case 'soil-structure':
          response = await imageAnalysisAPI.analyzeSoilStructure({
            parcelId: selectedParcel,
            images: selectedImages
          });
          break;
        case 'irrigation':
          response = await imageAnalysisAPI.analyzeIrrigationSystem({
            parcelId: selectedParcel,
            images: selectedImages
          });
          break;
        case 'degradation':
          response = await imageAnalysisAPI.analyzeLandDegradation({
            parcelId: selectedParcel,
            images: selectedImages
          });
          break;
        case 'batch':
          response = await imageAnalysisAPI.batchAnalyze({
            parcelId: selectedParcel,
            images: selectedImages,
            analysisTypes: ['crop-disease', 'soil-structure', 'degradation']
          });
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      console.log('Image analysis completed:', response.data);
      setImageAnalysisResults(prev => [...prev, response.data]);
      setSelectedImages([]);
      setShowImageUpload(false);
      alert('Image analysis completed successfully!');
    } catch (error) {
      console.error('Error analyzing images:', error);
      alert('Failed to analyze images. Please try again.');
    } finally {
      setAnalyzingImages(false);
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'crop-disease': return <Bug className="w-4 h-4" />;
      case 'soil-structure': return <Target className="w-4 h-4" />;
      case 'irrigation': return <Droplets className="w-4 h-4" />;
      case 'degradation': return <AlertCircle className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'crop-disease': return 'Crop Disease Detection';
      case 'soil-structure': return 'Soil Structure Analysis';
      case 'irrigation': return 'Irrigation System Analysis';
      case 'degradation': return 'Land Degradation Assessment';
      case 'batch': return 'Comprehensive Analysis';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8" />
              Enhanced AI Recommendations
            </h2>
            <p className="text-purple-50">
              Advanced AI-powered land management with weather integration, image analysis, and predictive insights
            </p>
          </div>
          {queueStatus && (
            <div className="text-right">
              <p className="text-sm opacity-90">Background Processing</p>
              <p className="text-lg font-semibold">
                {queueStatus.activeJobs} active, {queueStatus.queuedJobs} queued
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Parcel Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Land Parcel
            </label>
            <select
              value={selectedParcel}
              onChange={(e) => setSelectedParcel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a parcel...</option>
              {parcels.map((parcel) => (
                <option key={parcel._id} value={parcel._id}>
                  {parcel.name} - {parcel.location} ({parcel.sizeHectares} ha)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
              <p className="text-sm text-gray-600">Generate comprehensive land management recommendations</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                <span>Weather Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Historical Trends</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <span>Precision Agriculture</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-500" />
                <span>Sustainability Scoring</span>
              </div>
            </div>

            <button
              onClick={generateAIRecommendations}
              disabled={!selectedParcel || generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {generating ? 'Generating...' : 'Generate AI Recommendations'}
            </button>
          </div>
        </div>

        {/* Image Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Image Analysis</h3>
              <p className="text-sm text-gray-600">AI-powered analysis of land and crop images</p>
            </div>
          </div>

          <div className="space-y-4">
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="crop-disease">Crop Disease Detection</option>
              <option value="soil-structure">Soil Structure Analysis</option>
              <option value="irrigation">Irrigation System Analysis</option>
              <option value="degradation">Land Degradation Assessment</option>
              <option value="batch">Comprehensive Analysis</option>
            </select>

            {!showImageUpload ? (
              <button
                onClick={() => setShowImageUpload(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileImage className="w-4 h-4" />
                Upload Images for Analysis
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedImages.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {selectedImages.length} image(s) selected
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={analyzeImages}
                    disabled={analyzingImages || selectedImages.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {analyzingImages ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {analyzingImages ? 'Analyzing...' : 'Analyze Images'}
                  </button>
                  <button
                    onClick={() => {
                      setShowImageUpload(false);
                      setSelectedImages([]);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {imageAnalysisResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Analysis Results</h3>
          <div className="space-y-4">
            {imageAnalysisResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {getAnalysisTypeIcon(result.analysisType)}
                  <span className="font-medium text-gray-900">
                    {getAnalysisTypeLabel(result.analysisType)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(result.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Findings</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.results.findings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.results.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Confidence: {(result.results.confidence * 100).toFixed(1)}%
                    </span>
                    {result.results.severity && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.results.severity === 'high' ? 'bg-red-100 text-red-700' :
                        result.results.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {result.results.severity.toUpperCase()} severity
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Background Processing Status */}
      {queueStatus && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Background Processing Status</h3>
            <button
              onClick={loadQueueStatus}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.activeJobs}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStatus.queuedJobs}</div>
              <div className="text-sm text-gray-600">Queued Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStatus.completedJobs}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queueStatus.failedJobs}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="font-semibold text-gray-900 mb-4">Enhanced AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Cloud className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Weather Integration</h4>
              <p className="text-sm text-gray-600">Real-time weather data for accurate recommendations</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Historical Analysis</h4>
              <p className="text-sm text-gray-600">Trend analysis for predictive insights</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Image Analysis</h4>
              <p className="text-sm text-gray-600">AI-powered crop and soil analysis</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Precision Agriculture</h4>
              <p className="text-sm text-gray-600">Variable rate recommendations</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Leaf className="w-5 h-5 text-emerald-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Sustainability Scoring</h4>
              <p className="text-sm text-gray-600">Environmental impact assessment</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-500 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Background Processing</h4>
              <p className="text-sm text-gray-600">Asynchronous heavy computations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
