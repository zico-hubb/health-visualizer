import React from "react";

const DataPreview = ({ preview }) => {
  if (!preview || preview.length === 0) return null;

  const columns = Object.keys(preview[0]);

  return (
    <table border="1" style={{ marginTop: "20px", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} style={{ padding: "5px" }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col} style={{ padding: "5px" }}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataPreview;
