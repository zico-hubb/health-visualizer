import React, { useState } from "react";

const UploadFile = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleChange = (e) => setFile(e.target.files[0]);

  const handleUpload = () => {
    if (!file) return alert("Select a file first");
    onUpload(file);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleChange} />
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
        Upload
      </button>
    </div>
  );
};

export default UploadFile;
