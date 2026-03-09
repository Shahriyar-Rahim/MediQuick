import React from "react";
import MapComponent from "../components/map/Map";
import Dashboard from "./Dashboard";

const Home = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
  {/* Left Side: Map */}
  <div className="w-full md:w-1/2 h-100 md:h-screen sticky top-0">
    <MapComponent />
  </div>

  {/* Right Side: Dashboard Scrollable Area */}
  <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-50">
    <Dashboard />
  </div>
</div>
  );
};

export default Home;
