import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import MapView from "./pages/mapView";
import DashboardView from "./pages/DashboardView"; // ✅ Import dashboard
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* 🔹 Navigation Bar */}
        <nav style={{ padding: "10px", backgroundColor: "#f0f0f0" }}>
          <Link to="/" style={{ marginRight: "10px" }}>
            Home
          </Link>
          <Link to="/map" style={{ marginRight: "10px" }}>
            View Map
          </Link>
          <Link to="/dashboardview">Dashboard View</Link>
        </nav>

        {/* 🔹 Route Configuration */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/dashboardview" element={<DashboardView />} /> {/* ✅ Added route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
