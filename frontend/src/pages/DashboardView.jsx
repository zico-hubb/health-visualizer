import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { jsPDF } from "jspdf";
import { uploadFile } from "../services/api"; // reuse your API call
import "./dashboard.css";

const DashboardView = () => {
  const [filePath, setFilePath] = useState("");
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [allCounties, setAllCounties] = useState([]);
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔹 Handle file upload
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      setFilePath(`uploads/${file.name}`);
      setColumns(res.columns || []);
      setData(res.preview || []);
      // set counties for selection if "county" column exists
      if (res.columns.includes("county")) {
        const unique = [...new Set(res.preview.map((d) => d.county))];
        setAllCounties(unique.map((c) => ({ value: c, label: c })));
      }
    } catch (err) {
      alert("Upload failed: " + err);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Handle county selection
  const handleCountySelect = (selected) => {
    setSelectedCounties(selected || []);
    const selectedNames = (selected || []).map((s) => s.value);

    if (selectedNames.length === 0) {
      // No counties selected, show all uploaded data
      setData((prev) => prev);
    } else {
      const filtered = data.filter((d) => selectedNames.includes(d.county));
      setData(filtered);
    }
  };

  // 🔹 Generate PDF Report
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Health Visualizer County Report", 20, 20);
    data.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.county}: ${item.number_of_infected} infections`,
        20,
        30 + index * 10
      );
    });
    doc.save("health_report.pdf");
  };

  // 🔹 Stats
  const highest = data.length ? Math.max(...data.map((d) => d.number_of_infected)) : null;
  const lowest = data.length ? Math.min(...data.map((d) => d.number_of_infected)) : null;
  const topCounty = data.find((d) => d.number_of_infected === highest)?.county || "—";
  const lowCounty = data.find((d) => d.number_of_infected === lowest)?.county || "—";

  return (
    <div className="dashboard-container">
      <h1>📊 Health Data Dashboard</h1>
      <p className="subtitle">Upload and visualize health data by county</p>

      {/* 🔹 Upload Section */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => handleUpload(e.target.files[0])}
          disabled={uploading}
        />
        {uploading && <span style={{ marginLeft: "10px" }}>Uploading...</span>}
      </div>

      {/* 🔹 Filters */}
      {data.length > 0 && (
        <div className="filter-section">
          <div className="select-group">
            <label>Select Counties:</label>
            <Select
              options={allCounties}
              isMulti
              onChange={handleCountySelect}
              placeholder="Choose counties..."
              className="county-select"
            />
          </div>

          <div className="select-group">
            <label>Chart Type:</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>

          <button className="download-btn" onClick={downloadPDF}>
            Download Report (PDF)
          </button>
        </div>
      )}

      {/* 🔹 Loading */}
      {loading && <p>Loading chart...</p>}

      {/* 🔹 Stats */}
      {data.length > 0 && !loading && (
        <>
          <div className="summary-cards">
            <div className="card">
              <h3>Highest</h3>
              <p>{topCounty}</p>
              <span>{highest ? highest : "—"} cases</span>
            </div>
            <div className="card">
              <h3>Lowest</h3>
              <p>{lowCounty}</p>
              <span>{lowest ? lowest : "—"} cases</span>
            </div>
          </div>

          {/* 🔹 Chart */}
          <div className="chart-section">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                {chartType === "bar" ? (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="county" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="number_of_infected" fill="#007BFF" />
                  </BarChart>
                ) : (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="county" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="number_of_infected" stroke="#28a745" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Upload data or select counties to view chart.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;
