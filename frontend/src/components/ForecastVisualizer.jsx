import React from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const ForecastVisualizer = ({ chartData, forecastData, chartType, mode }) => {
  if (!chartData) return null;

  // 🧭 Define chart title dynamically
  const chartTitle =
    mode === "rolling"
      ? "Rolling Forecast — Actual vs Next Month Prediction"
      : "Longterm Forecast — Actual vs Next Year Projection";

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: chartTitle,
        font: { size: 18, weight: "bold" },
        padding: { bottom: 10 },
      },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: { title: { display: true, text: "Infected Count" } },
    },
  };

  let data;

  // 🌍 Multi-county handling
  if (chartData.multi_series) {
    const counties = Object.keys(chartData.multi_series);

    const datasets = counties.flatMap((county, i) => {
      const actualSet = chartData.multi_series[county];
      const forecastSet = forecastData?.[county] || [];

      const baseColor = `hsl(${(i * 360) / counties.length}, 70%, 50%)`;
      const forecastColor = `hsl(${(i * 360) / counties.length}, 80%, 40%)`;

      return [
        {
          label: `${county} ${mode === "rolling" ? "Actual (Jan)" : "Actual"}`,
          data: actualSet.y,
          borderColor: baseColor,
          backgroundColor: `${baseColor}40`,
          fill: chartType !== "bar",
          tension: 0.3,
        },
        forecastSet.length > 0 && {
          label: `${county} ${
            mode === "rolling" ? "Forecast (Feb)" : "Forecast (Next Year)"
          }`,
          data: forecastSet.map((f) => f.yhat1 ?? f.yhat),
          borderColor: forecastColor,
          borderDash: [5, 5],
          backgroundColor: `${forecastColor}30`,
          fill: chartType !== "bar",
          tension: 0.3,
        },
      ].filter(Boolean);
    });

    data = {
      labels: chartData.multi_series[counties[0]].x,
      datasets,
    };
  }

  // 📈 Single-series handling
  else {
    const actualLabels = chartData.x;
    const actualValues = chartData.y;
    const forecastLabels = forecastData?.map((f) => f.ds) || [];
    const forecastValues = forecastData?.map((f) => f.yhat1 ?? f.yhat) || [];

    const mergedLabels = [...new Set([...actualLabels, ...forecastLabels])].sort();

    data = {
      labels: mergedLabels,
      datasets: [
        {
          label: mode === "rolling" ? "Actual (Jan)" : "Actual",
          data: mergedLabels.map((d) => {
            const idx = actualLabels.indexOf(d);
            return idx !== -1 ? actualValues[idx] : null;
          }),
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.3)",
          fill: chartType !== "bar",
          tension: 0.3,
        },
        {
          label: mode === "rolling" ? "Forecast (Feb)" : "Forecast (Next Year)",
          data: mergedLabels.map((d) => {
            const f = forecastData?.find((row) => row.ds === d);
            return f ? f.yhat1 ?? f.yhat : null;
          }),
          borderColor: "red",
          borderDash: [5, 5],
          backgroundColor: "rgba(255,0,0,0.3)",
          fill: chartType !== "bar",
          tension: 0.3,
        },
      ],
    };
  }

  if (chartType === "line") return <Line data={data} options={options} />;
  if (chartType === "bar") return <Bar data={data} options={options} />;
  if (chartType === "pie") return <Pie data={data} options={options} />;
  return null;
};

export default ForecastVisualizer;
