import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { IoTSensor, sensorsAPI, LandParcel, landParcelsAPI } from '../lib/api';
import { exportSensors } from '../lib/csvExport';
import { exportSensorsToPDF } from '../lib/pdfExport';
import { Download, FileText } from 'lucide-react';

interface ParcelSensor {
  parcelId: string;
  parcelName: string;
  sensors: IoTSensor[];
}

const IoTSensorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [sensors, setSensors] = useState<ParcelSensor[]>([]);
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveReadings, setLiveReadings] = useState<Record<string, any>>({});
  const [newSensor, setNewSensor] = useState({
    parcelId: '',
    sensorType: '',
    location: '',
    apiKey: ''
  });

  useEffect(() => {
    if (user) {
      loadSensors();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('sensorUpdate', (data: any) => {
        setLiveReadings(prev => ({
          ...prev,
          [data.sensorId]: {
            ...prev[data.sensorId],
            ...data.data,
            timestamp: new Date()
          }
        }));
      });

      return () => {
        socket.off('sensorUpdate');
      };
    }
  }, [socket]);

  const loadSensors = async () => {
    try {
      setLoading(true);
      // Fetch all user parcels
      const parcelsResponse = await landParcelsAPI.getMyParcels();
      const userParcels = parcelsResponse.data;
      setParcels(userParcels);

      // Fetch all sensors
      const sensorsResponse = await sensorsAPI.getAllSensors();
      const userSensors = sensorsResponse.data;

      // Create a map of sensors by parcel ID for efficient lookup
      const sensorsByParcel = new Map<string, IoTSensor[]>();
      userSensors.forEach((sensor: IoTSensor) => {
        const parcelId = sensor.parcelId._id;
        if (!sensorsByParcel.has(parcelId)) {
          sensorsByParcel.set(parcelId, []);
        }
        sensorsByParcel.get(parcelId)!.push(sensor);
      });

      // Build ParcelSensor array from all parcels, including those without sensors
      const parcelSensors: ParcelSensor[] = userParcels.map((parcel: LandParcel) => ({
        parcelId: parcel._id,
        parcelName: parcel.name,
        sensors: sensorsByParcel.get(parcel._id) || []
      }));

      setSensors(parcelSensors);
    } catch (error) {
      console.error('Failed to load sensors or parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSensor.parcelId || !newSensor.sensorType || !newSensor.location || !newSensor.apiKey) {
      alert('Please fill all fields');
      return;
    }
    try {
      await sensorsAPI.registerSensor({
        parcelId: newSensor.parcelId,
        sensorType: newSensor.sensorType,
        sensorId: `sensor_${Date.now()}`,
        name: `${newSensor.sensorType} Sensor`,
        location: newSensor.location,
        status: 'active'
      });
      setNewSensor({ parcelId: '', sensorType: '', location: '', apiKey: '' });
      loadSensors();
      alert('Sensor registered successfully');
    } catch (error) {
      console.error('Failed to register sensor:', error);
      alert('Failed to register sensor');
    }
  };

  const handleExportSensors = () => {
    const allSensors = sensors.flatMap(ps => ps.sensors);
    exportSensors(allSensors);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">IoT Sensor Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportSensors}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportSensorsToPDF(sensors.flatMap(ps => ps.sensors))}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Register New Sensor Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Register New Sensor</h3>
        <form onSubmit={handleRegisterSensor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={newSensor.parcelId}
            onChange={(e) => setNewSensor({...newSensor, parcelId: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            <option value="">Select Parcel</option>
            {parcels.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <select
            value={newSensor.sensorType}
            onChange={(e) => setNewSensor({...newSensor, sensorType: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            <option value="">Select Type</option>
            <option value="soil_moisture">Soil Moisture</option>
            <option value="ph">pH</option>
            <option value="temperature">Temperature</option>
            <option value="rainfall">Rainfall</option>
            <option value="erosion">Erosion</option>
            <option value="npk">NPK</option>
            <option value="organic_matter">Organic Matter</option>
          </select>
          <input
            type="text"
            placeholder="Location (e.g., Field North)"
            value={newSensor.location}
            onChange={(e) => setNewSensor({...newSensor, location: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
            required
          />
          <input
            type="text"
            placeholder="API Key"
            value={newSensor.apiKey}
            onChange={(e) => setNewSensor({...newSensor, apiKey: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
            required
          />
          <button
            type="submit"
            className="md:col-span-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
          >
            Register Sensor
          </button>
        </form>
      </div>

      {/* Sensors by Parcel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sensors.map((parcelSensors) => (
          <div key={parcelSensors.parcelId} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{parcelSensors.parcelName}</h3>
              <p className="text-sm text-gray-500">Parcel ID: {parcelSensors.parcelId}</p>
            </div>
            <div className="p-6">
              {parcelSensors.sensors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sensors registered for this parcel</p>
              ) : (
                <div className="space-y-4">
                  {parcelSensors.sensors.map((sensor) => (
                    <div key={sensor.sensorId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{sensor.sensorType.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-sm text-gray-600">Location: {sensor.location}</p>
                        <p className="text-sm text-gray-500">Status: <span className={sensor.status === 'active' ? 'text-emerald-600' : 'text-red-600'}>{sensor.status}</span></p>
                        {sensor.lastSeen && (
                          <p className="text-xs text-gray-400">Last Seen: {new Date(sensor.lastSeen).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {liveReadings[sensor.sensorId] && (
                          <div className="bg-emerald-50 p-2 rounded text-sm">
                            <p>Live: {JSON.stringify(liveReadings[sensor.sensorId].value || liveReadings[sensor.sensorId])}</p>
                            <p className="text-xs text-gray-500">{new Date(liveReadings[sensor.sensorId].timestamp).toLocaleTimeString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IoTSensorDashboard;
