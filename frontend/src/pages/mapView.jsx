// src/pages/MapView.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as XLSX from "xlsx";

function MapView() {
  const [geoData, setGeoData] = useState(null);
  const [excelData, setExcelData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightedRange, setHighlightedRange] = useState(null);

  // Load GeoJSON from public folder
  useEffect(() => {
    fetch("/kenya-counties.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => setError("Failed to load GeoJSON: " + err));
  }, []);

  // Handle Excel upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const counts = {};
        sheet.forEach((row) => {
          const county = row.county || row.County || row.CountyName;
          if (county) counts[county] = (counts[county] || 0) + 1;
        });
        setExcelData(counts);
      } catch (err) {
        setError("Error processing Excel file: " + err);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error reading Excel file.");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Color ranges
  const ranges = [
    { min: 0, max: 0, color: "#FFEDA0" },
    { min: 1, max: 5, color: "#FD8D3C" },
    { min: 6, max: 10, color: "#FC4E2A" },
    { min: 11, max: 15, color: "#E31A1C" },
    { min: 16, max: 20, color: "#BD0026" },
    { min: 21, max: Infinity, color: "#800026" },
  ];

  const getColor = (count) => {
    const range = ranges.find((r) => count >= r.min && count <= r.max);
    return range ? range.color : "#FFFFFF";
  };

  // Style GeoJSON features
  const styleFeature = (feature) => {
    const name = feature.properties.NAME_1;
    const count = excelData[name] || 0;
    let fillColor = getColor(count);
    if (highlightedRange && count >= highlightedRange.min && count <= highlightedRange.max) {
      fillColor = "#ffff00"; // highlight color
    }
    return {
      fillColor,
      weight: 1,
      color: "white",
      fillOpacity: 0.8,
    };
  };

  // Add tooltips
  const onEachFeature = (feature, layer) => {
    const name = feature.properties.NAME_1;
    const count = excelData[name] || 0;
    layer.bindTooltip(`${name}: ${count} case(s)`, { sticky: true });
  };

  // Interactive legend hover
  const handleLegendHover = (range) => {
    setHighlightedRange(range);
  };

  const handleLegendLeave = () => {
    setHighlightedRange(null);
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <h2 style={{ textAlign: "center", margin: "10px 0" }}>Kenya Counties Heatmap</h2>

      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
        {loading && <span style={{ marginLeft: "10px" }}>Processing Excel...</span>}
        {error && <span style={{ marginLeft: "10px", color: "red" }}>{error}</span>}
      </div>

      <MapContainer center={[-0.0236, 37.9062]} zoom={6} style={{ height: "90%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {geoData && <GeoJSON data={geoData} style={styleFeature} onEachFeature={onEachFeature} />}
      </MapContainer>

      {/* Interactive Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "30px",
          background: "rgba(255,255,255,0.9)",
          padding: "10px",
          borderRadius: "5px",
          boxShadow: "0 0 8px rgba(0,0,0,0.5)",
          lineHeight: "28px",
        }}
      >
        <strong>Cases per county</strong>
        {ranges.map((r, idx) => (
          <div
            key={idx}
            onMouseEnter={() => handleLegendHover(r)}
            onMouseLeave={handleLegendLeave}
            style={{ cursor: "pointer" }}
          >
            <span
              style={{
                background: r.color,
                width: "20px",
                height: "20px",
                display: "inline-block",
                marginRight: "5px",
              }}
            />
            {r.min === r.max ? r.min : `${r.min}-${r.max === Infinity ? "50+" : r.max}`}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapView;
