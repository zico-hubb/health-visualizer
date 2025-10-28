import React, { useState, useEffect } from "react";

const ChartSelector = ({ columns, onSelect }) => {
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [chartType, setChartType] = useState("line");

  const prettify = (col) => col.replace(/_/g, " ");

  // 🔹 Auto-suggest defaults for common columns (date, infections, etc.)
  useEffect(() => {
    if (columns.length > 0) {
      const dateCol = columns.find((c) =>
        ["date", "time", "month", "year"].some((k) => c.toLowerCase().includes(k))
      );
      const infectedCol = columns.find((c) =>
        ["infected", "cases", "number_of_infected"].some((k) =>
          c.toLowerCase().includes(k)
        )
      );
      if (dateCol) setXCol(dateCol);
      if (infectedCol) setYCol(infectedCol);
    }
  }, [columns]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!xCol || !yCol) {
      alert("Please select both X and Y columns");
      return;
    }
    onSelect(xCol, yCol, chartType);
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h3>Select Columns to Visualize</h3>
      <form onSubmit={handleSubmit}>
        <label>
          X-Axis:
          <select
            value={xCol}
            onChange={(e) => setXCol(e.target.value)}
            style={{ marginLeft: "10px", marginRight: "20px" }}
          >
            <option value="">--Select--</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {prettify(col)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Y-Axis:
          <select
            value={yCol}
            onChange={(e) => setYCol(e.target.value)}
            style={{ marginLeft: "10px", marginRight: "20px" }}
          >
            <option value="">--Select--</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {prettify(col)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Chart Type:
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            style={{ marginLeft: "10px", marginRight: "20px" }}
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </label>

        <button
          type="submit"
          style={{
            marginLeft: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Generate Chart
        </button>
      </form>
    </div>
  );
};

export default ChartSelector;
