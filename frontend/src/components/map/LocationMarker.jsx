import React, { useState } from 'react';
import { CircleMarker, Circle, Popup, useMapEvents } from 'react-leaflet';

const LocationMarker = () => {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(0);

  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      map.flyTo(e.latlng, 16);
    },
    locationerror() {
      alert("Please enable location services to use this feature.");
    }
  });

  return (
    <>
      <button
        onClick={() => map.locate()}
        className="absolute bottom-5 right-5 z-1000 bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-blue-600 transition-all active:scale-90"
        title="Locate Me"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {position && (
        <>
          {/* Outer Circle: Represents Accuracy/Range */}
          <Circle 
            center={position} 
            radius={accuracy} 
            pathOptions={{ 
              color: '#3b82f6', 
              fillColor: '#3b82f6', 
              fillOpacity: 0.15, 
              weight: 1 
            }} 
          />

          {/* Inner Circle: The "Blue Dot" */}
          <CircleMarker
            center={position}
            radius={8}
            pathOptions={{
              color: 'white',       // Border color
              fillColor: '#2563eb', // Core blue color
              fillOpacity: 1,
              weight: 3             // Border width
            }}
          >
            <Popup>You are within {Math.round(accuracy)} meters of this point</Popup>
          </CircleMarker>
        </>
      )}
    </>
  );
};

export default LocationMarker;