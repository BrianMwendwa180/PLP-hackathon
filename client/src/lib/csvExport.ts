export interface CSVData {
  [key: string]: string | number | boolean | null | undefined;
}

export function exportToCSV(data: CSVData[], filename: string): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get all unique keys from the data
  const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Specific export functions for different data types
export function exportLandParcels(data: any[]): void {
  const csvData = data.map(parcel => ({
    'Parcel ID': parcel._id,
    'Name': parcel.name,
    'Location': parcel.location,
    'Latitude': parcel.latitude,
    'Longitude': parcel.longitude,
    'Size (Hectares)': parcel.sizeHectares,
    'Land Use Type': parcel.landUseType,
    'Owner Name': parcel.ownerId?.fullName || '',
    'Owner Email': parcel.ownerId?.email || '',
    'Created At': parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString() : ''
  }));
  exportToCSV(csvData, 'land_parcels');
}

export function exportSoilHealthRecords(data: any[]): void {
  const csvData = data.map(record => ({
    'Record ID': record._id,
    'Parcel Name': record.parcelId?.name || '',
    'Parcel Location': record.parcelId?.location || '',
    'Vitality Score': record.vitalityScore,
    'pH Level': record.phLevel || '',
    'Moisture Level': record.moistureLevel || '',
    'Nitrogen Level': record.nitrogenLevel || '',
    'Phosphorus Level': record.phosphorusLevel || '',
    'Potassium Level': record.potassiumLevel || '',
    'Organic Matter': record.organicMatter || '',
    'Temperature': record.temperature || '',
    'Rainfall (mm)': record.rainfall || '',
    'Erosion Rate (tons/ha)': record.erosionRate || '',
    'Data Source': record.dataSource,
    'Recorded At': record.recordedAt ? new Date(record.recordedAt).toLocaleDateString() : '',
    'Created At': record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''
  }));
  exportToCSV(csvData, 'soil_health_records');
}

export function exportSensorData(data: any[]): void {
  const csvData = data.map(record => ({
    'Record ID': record._id,
    'Parcel Name': record.parcelId?.name || '',
    'Parcel Location': record.parcelId?.location || '',
    'Sensor ID': record.sensorId || '',
    'Sensor Type': record.sensorType || '',
    'Location': record.location || '',
    'Value': record.value || '',
    'Unit': record.unit || '',
    'Status': record.status || '',
    'Data Source': record.dataSource || '',
    'Recorded At': record.recordedAt ? new Date(record.recordedAt).toLocaleDateString() : '',
    'Created At': record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''
  }));
  exportToCSV(csvData, 'sensor_data');
}

export function exportSensors(data: any[]): void {
  const csvData = data.map(sensor => ({
    'Sensor ID': sensor.sensorId,
    'Type': sensor.sensorType,
    'Location': sensor.location,
    'Parcel': sensor.parcelId?.name || 'Unknown',
    'Status': sensor.status,
    'Last Seen': sensor.lastSeen ? new Date(sensor.lastSeen).toISOString() : 'Never'
  }));
  exportToCSV(csvData, 'sensors');
}

export function exportRestorationActivities(data: any[]): void {
  const csvData = data.map(activity => ({
    'Activity ID': activity._id,
    'Parcel Name': activity.parcelId?.name || '',
    'Parcel Location': activity.parcelId?.location || '',
    'Activity Type': activity.activityType,
    'Description': activity.description,
    'Quantity': activity.quantity,
    'Unit': activity.unit,
    'Performed By': activity.performedBy?.fullName || '',
    'Carbon Offset (kg)': activity.carbonOffsetKg,
    'Verification Status': activity.verificationStatus,
    'Blockchain Hash': activity.blockchainHash || '',
    'Performed At': activity.performedAt ? new Date(activity.performedAt).toLocaleDateString() : '',
    'Verified At': activity.verifiedAt ? new Date(activity.verifiedAt).toLocaleDateString() : '',
    'Created At': activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : ''
  }));
  exportToCSV(csvData, 'restoration_activities');
}

export function exportRecommendations(data: any[]): void {
  const csvData = data.map(rec => ({
    'Recommendation ID': rec._id,
    'Parcel Name': rec.parcelId?.name || '',
    'Parcel Location': rec.parcelId?.location || '',
    'User Name': rec.userId?.fullName || '',
    'Type': rec.recommendationType,
    'Title': rec.title,
    'Description': rec.description,
    'Priority': rec.priority,
    'Estimated Cost': rec.estimatedCost,
    'Estimated Time (Days)': rec.estimatedTimeDays || '',
    'AI Generated': rec.aiGenerated ? 'Yes' : 'No',
    'AI Confidence': rec.aiConfidence || '',
    'Status': rec.status,
    'Created At': rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '',
    'Implemented At': rec.implementedAt ? new Date(rec.implementedAt).toLocaleDateString() : ''
  }));
  exportToCSV(csvData, 'recommendations');
}

export function exportAlerts(data: any[]): void {
  const csvData = data.map(alert => ({
    'Alert ID': alert._id,
    'Parcel Name': alert.parcelId?.name || '',
    'Parcel Location': alert.parcelId?.location || '',
    'Alert Type': alert.alertType,
    'Severity': alert.severity,
    'Message': alert.message,
    'Recommended Action': alert.recommendedAction || '',
    'Is Resolved': alert.isResolved ? 'Yes' : 'No',
    'Created At': alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : '',
    'Resolved At': alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString() : ''
  }));
  exportToCSV(csvData, 'degradation_alerts');
}
