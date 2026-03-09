import { Marker, Popup } from "react-leaflet";

function PharmacyMarker({ shop }) {
  return (
    <Marker position={shop.position}>
      <Popup>
        <div className="p-1">
          <h3 className="font-bold text-blue-700 text-lg">{shop.name}</h3>
          <p className="text-gray-500 text-xs">{shop.address}</p>

          <span className="text-sm font-medium text-gray-700">
            📦 {shop.medicineCount} Medicines listed
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

export default PharmacyMarker;