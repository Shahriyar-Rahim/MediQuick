import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LocationMarker from "./LocationMarker";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const pharmacies = [
  { id: 1, name: "City Pharma", position: [25.7785, 88.8974], medicineCount: 45, address: "Main Road, Saidpur" },
  { id: 2, name: "Saidpur Central Medicine", position: [25.777, 88.893], medicineCount: 12, address: "Thana Road" },
];

function MapComponent() {
  return (
    <div className="w-full h-112.5 rounded-xl overflow-hidden shadow-inner border-4 border-white relative z-0">
      <MapContainer
        center={[25.7785, 88.8974]}
        zoom={14}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        
        <LocationMarker />

        {pharmacies.map((shop) => (
          <Marker key={shop.id} position={shop.position}>
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-blue-700 text-lg m-0">{shop.name}</h3>
                <p className="text-gray-500 text-xs mb-2">{shop.address}</p>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    📦 {shop.medicineCount} Medicines listed
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;