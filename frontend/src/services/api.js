import axios from "axios";

const API_BASE = "http://127.0.0.1:5000";

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getChartData = async (file_path, x_column, y_column) => {
  const res = await axios.post(`${API_BASE}/visualize`, { file_path, x_column, y_column });
  return res.data;
};

// 🧠 Now supports forecast mode (short vs long)
export const getForecast = async (file_path, column, model_type, periods, mode = "short") => {
  const res = await axios.post(`${API_BASE}/forecast`, {
    file_path,
    column,
    model_type,
    periods,
    mode, // send mode to backend
  });
  return res.data;
};
