import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Droplets, Siren, ChevronRight, MapPin, Loader2 } from "lucide-react";
import api from "../api/axios";

const EmergencyCards = ({ userLat, userLng }) => {
  const navigate = useNavigate();
  const [bloodStats, setBloodStats] = useState(null);
  const [ambStats,   setAmbStats]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const params = userLat && userLng
      ? `?lat=${userLat}&lng=${userLng}` : "";

    Promise.allSettled([
      api.get(`/blood/donors/stats${params}`),
      api.get(`/ambulance/stats${params}`),
    ]).then(([bRes, aRes]) => {
      if (bRes.status === "fulfilled") setBloodStats(bRes.value.data.data);
      if (aRes.status === "fulfilled") setAmbStats(aRes.value.data.data);
      setLoading(false);
    });
  }, [userLat, userLng]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

      {/* Blood Donation card */}
      <button
        onClick={() => navigate("/blood")}
        className="group relative overflow-hidden flex items-center gap-4 p-4
                   bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100
                   border border-red-100 hover:border-red-200 rounded-2xl
                   transition-all text-left shadow-sm hover:shadow-md">

        {/* Decorative circle */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-100/60 rounded-full
                        group-hover:scale-110 transition-transform duration-300" />

        <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center
                        shrink-0 shadow-md shadow-red-500/25 group-hover:scale-105
                        transition-transform">
          <Droplets size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-red-800 font-bold text-sm">Blood Donation</p>
          <div className="mt-1 space-y-0.5">
            {loading ? (
              <div className="h-3 w-24 bg-red-100 rounded animate-pulse" />
            ) : bloodStats ? (
              <>
                <p className="text-red-600 text-xs font-medium">
                  {bloodStats.nearbyCount > 0
                    ? `${bloodStats.nearbyCount} donor${bloodStats.nearbyCount > 1 ? "s" : ""} nearby`
                    : `${bloodStats.total} total donors`}
                </p>
                {bloodStats.nearbyCount > 0 && userLat && (
                  <p className="text-red-400 text-[10px] flex items-center gap-0.5">
                    <MapPin size={8} /> Within 10km
                  </p>
                )}
              </>
            ) : (
              <p className="text-red-500 text-xs">Find & register donors</p>
            )}
          </div>
        </div>

        <ChevronRight size={16}
          className="text-red-300 group-hover:text-red-500 group-hover:translate-x-1
                     transition-all shrink-0 relative z-10" />
      </button>

      {/* Ambulance card */}
      <button
        onClick={() => navigate("/ambulance")}
        className="group relative overflow-hidden flex items-center gap-4 p-4
                   bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100
                   border border-blue-100 hover:border-blue-200 rounded-2xl
                   transition-all text-left shadow-sm hover:shadow-md">

        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100/60 rounded-full
                        group-hover:scale-110 transition-transform duration-300" />

        <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center
                        shrink-0 shadow-md shadow-blue-700/25 group-hover:scale-105
                        transition-transform">
          <Siren size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-blue-900 font-bold text-sm">Ambulance</p>
          <div className="mt-1 space-y-0.5">
            {loading ? (
              <div className="h-3 w-24 bg-blue-100 rounded animate-pulse" />
            ) : ambStats ? (
              <>
                <p className="text-blue-700 text-xs font-medium">
                  {ambStats.nearbyCount > 0
                    ? `${ambStats.nearbyCount} service${ambStats.nearbyCount > 1 ? "s" : ""} nearby`
                    : `${ambStats.total} listed services`}
                </p>
                {ambStats.nearbyCount > 0 && userLat && (
                  <p className="text-blue-400 text-[10px] flex items-center gap-0.5">
                    <MapPin size={8} /> Within 10km
                  </p>
                )}
              </>
            ) : (
              <p className="text-blue-600 text-xs">Find ambulances near you</p>
            )}
          </div>
        </div>

        <ChevronRight size={16}
          className="text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1
                     transition-all shrink-0 relative z-10" />
      </button>
    </div>
  );
};

export default EmergencyCards;