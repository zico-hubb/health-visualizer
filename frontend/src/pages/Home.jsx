import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadFile from "../components/UploadFile";
import DataPreview from "../components/DataPreview";
import ForecastVisualizer from "../components/ForecastVisualizer";
import ChartSelector from "../components/ChartSelector";
import { uploadFile, getChartData, getForecast } from "../services/api";

const Home = () => {
  const [filePath, setFilePath] = useState("");
  const [columns, setColumns] = useState([]);
  const [preview, setPreview] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [chartType, setChartType] = useState("line");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastMode, setForecastMode] = useState("short"); // 🔁 new toggle

  const navigate = useNavigate();

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const res = await uploadFile(file);
      setFilePath(`uploads/${file.name}`);
      setColumns(res.columns);
      setPreview(res.preview);
    } catch (err) {
      alert("Upload failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleChartSelect = async (xColSelected, yColSelected, type) => {
    if (!filePath) return alert("Upload a file first");
    setChartType(type);
    setXCol(xColSelected);
    setYCol(yColSelected);
    setLoading(true);

    try {
      const res = await getChartData(filePath, xColSelected, yColSelected);
      setChartData(res);
      setForecastData(null);
    } catch (err) {
      alert("Failed to generate chart: " + err);
    } finally {
      setLoading(false);
    }
  };

  // 🔮 Generate forecast with mode
  const handleGenerateForecast = async () => {
    if (!filePath || !yCol) return alert("Generate a chart first!");
    setForecastLoading(true);

    try {
      const periods = forecastMode === "short" ? 30 : 365;
      const mode = forecastMode === "short" ? "interleaved" : "standalone";

      const forecast = await getForecast(filePath, yCol, "prophet", periods, mode);

      if (chartData && chartData.multi_series) {
        const countyForecasts = {};
        const counties = Object.keys(chartData.multi_series);
        counties.forEach((county) => {
          countyForecasts[county] = forecast.forecast[county] || [];
        });
        setForecastData(countyForecasts);
      } else {
        setForecastData(forecast.forecast);
      }
    } catch (err) {
      alert("Forecast generation failed: " + err);
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Health Data Visualizer & AI Forecast</h1>

      <button
        onClick={() => navigate("/map")}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "5px",
          marginBottom: "15px",
          cursor: "pointer",
        }}
      >
        View Geospatial Map
      </button>

      {loading && <p>Loading...</p>}
      <UploadFile onUpload={handleUpload} />
      <DataPreview preview={preview} />

      {columns.length > 0 && (
        <ChartSelector columns={columns} onSelect={handleChartSelect} />
      )}

      {chartData && (
        <>
          {/* 🔁 Forecast Mode Toggle */}
          <div style={{ marginTop: "15px" }}>
            <label style={{ marginRight: "10px" }}>Forecast Mode:</label>
            <select
              value={forecastMode}
              onChange={(e) => setForecastMode(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            >
              <option value="short">Short-Term (Interleaved)</option>
              <option value="long">Long-Term (Next Year)</option>
            </select>
          </div>

          <button
            onClick={handleGenerateForecast}
            disabled={forecastLoading}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: "5px",
              marginTop: "15px",
              cursor: forecastLoading ? "not-allowed" : "pointer",
            }}
          >
            {forecastLoading ? "Generating Forecast..." : "Generate Forecast"}
          </button>
        </>
      )}

      <ForecastVisualizer
        chartData={chartData}
        forecastData={forecastData}
        chartType={chartType}
      />
    </div>
  );
};

export default Home;
