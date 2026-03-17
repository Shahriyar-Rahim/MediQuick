import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

function ClickHandler({ setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      console.log(`Selected Location: ${lat}, ${lng}`);
    },
  });
  return null;
}

const AddMedicineMap = () => {
  const [position, setPosition] = useState(null); 

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-700">
        <strong>Instruction:</strong> Click on the map to pin the pharmacy location.
      </div>

      <div className="h-80 w-full rounded-xl overflow-hidden border-2 border-gray-200">
        <MapContainer center={[25.7785, 88.8974]} zoom={14} className="h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Listens for clicks */}
          <ClickHandler setPosition={setPosition} />

          {/* Shows a marker where the user clicked */}
          {position && <Marker position={position}></Marker>}
        </MapContainer>
      </div>

      {/* Displaying coordinates for the user */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase">Latitude</label>
          <input 
            readOnly 
            value={position ? position[0].toFixed(6) : ""} 
            className="w-full bg-gray-100 p-2 rounded border" 
            placeholder="Click map..."
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase">Longitude</label>
          <input 
            readOnly 
            value={position ? position[1].toFixed(6) : ""} 
            className="w-full bg-gray-100 p-2 rounded border" 
            placeholder="Click map..."
          />
        </div>
      </div>
    </div>
  );
};

export default AddMedicineMap;