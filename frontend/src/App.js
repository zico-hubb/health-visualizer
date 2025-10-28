import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import MapView from "./pages/mapView";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav style={{ padding: "10px", backgroundColor: "#f0f0f0" }}>
          <Link to="/" style={{ marginRight: "10px" }}>
            Dashboard
          </Link>
          <Link to="/map">View Map</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
