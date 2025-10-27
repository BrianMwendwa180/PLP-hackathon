import jsPDF from 'jspdf';

export function exportSensorDataToPDF(data: any[], title: string = 'Sensor Data Report'): void {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);

  // Add date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

  let yPosition = 50;

  // Group data by sensor type
  const groupedData = data.reduce((acc, record) => {
    const type = record.sensorType || 'Unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(record);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(groupedData).forEach(([sensorType, records]) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Sensor type header
    doc.setFontSize(16);
    doc.text(`Sensor Type: ${sensorType}`, 20, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(10);
    const headers = ['Date', 'Location', 'Value', 'Unit', 'Status'];
    const columnWidths = [30, 40, 25, 20, 25];
    let xPosition = 20;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });

    yPosition += 10;

    // Table rows
    (records as any[]).slice(0, 10).forEach((record: any) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const rowData = [
        new Date(record.recordedAt).toLocaleDateString(),
        record.location || '',
        String(record.value || ''),
        record.unit || '',
        record.status || ''
      ];

      rowData.forEach((data, index) => {
        doc.text(data, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      yPosition += 8;
    });

    yPosition += 10;

    // Summary
    doc.setFontSize(12);
    doc.text(`Total Records: ${(records as any[]).length}`, 20, yPosition);
    yPosition += 15;
  });

  // Save the PDF
  doc.save(`sensor-data-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportSoilHealthToPDF(data: any[], title: string = 'Soil Health Report'): void {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);

  // Add date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

  let yPosition = 50;

  data.slice(0, 20).forEach(record => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Parcel info
    doc.setFontSize(14);
    doc.text(`Parcel: ${record.parcelId?.name || 'Unknown'}`, 20, yPosition);
    yPosition += 10;

    // Metrics
    doc.setFontSize(10);
    const metrics = [
      `Date: ${new Date(record.recordedAt).toLocaleDateString()}`,
      `Vitality Score: ${record.vitalityScore || 'N/A'}`,
      `pH Level: ${record.phLevel || 'N/A'}`,
      `Moisture: ${record.moistureLevel || 'N/A'}%`,
      `Temperature: ${record.temperature || 'N/A'}°C`,
      `Rainfall: ${record.rainfall || 'N/A'} mm`,
      `Erosion Rate: ${record.erosionRate || 'N/A'} tons/ha`,
      `Data Source: ${record.dataSource || 'N/A'}`
    ];

    metrics.forEach(metric => {
      doc.text(metric, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;
  });

  // Save the PDF
  doc.save(`soil-health-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportSensorsToPDF(data: any[], title: string = 'IoT Sensors Report'): void {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);

  // Add date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

  let yPosition = 50;

  // Group data by parcel
  const groupedData = data.reduce((acc, sensor) => {
    const parcelName = sensor.parcelId?.name || 'Unknown Parcel';
    if (!acc[parcelName]) acc[parcelName] = [];
    acc[parcelName].push(sensor);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(groupedData).forEach(([parcelName, sensors]) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Parcel header
    doc.setFontSize(16);
    doc.text(`Parcel: ${parcelName}`, 20, yPosition);
    yPosition += 15;

    // Table headers
    doc.setFontSize(10);
    const headers = ['Sensor ID', 'Type', 'Location', 'Status', 'Last Seen'];
    const columnWidths = [35, 30, 40, 25, 35];
    let xPosition = 20;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });

    yPosition += 10;

    // Table rows
    (sensors as any[]).forEach((sensor: any) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const rowData = [
        sensor.sensorId || '',
        sensor.sensorType || '',
        sensor.location || '',
        sensor.status || '',
        sensor.lastSeen ? new Date(sensor.lastSeen).toLocaleDateString() : 'Never'
      ];

      rowData.forEach((data, index) => {
        doc.text(data, xPosition, yPosition);
        xPosition += columnWidths[index];
      });

      yPosition += 8;
    });

    yPosition += 10;

    // Summary
    doc.setFontSize(12);
    doc.text(`Total Sensors: ${(sensors as any[]).length}`, 20, yPosition);
    yPosition += 15;
  });

  // Save the PDF
  doc.save(`sensors-${new Date().toISOString().split('T')[0]}.pdf`);
}
