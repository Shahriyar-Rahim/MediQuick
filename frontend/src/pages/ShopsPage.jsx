import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import { Store, MapPin, ChevronRight, Search } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:#10b981;border:2px solid #fff;transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(16,185,129,.45)"></div>`,
  iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -28],
});

const ShopsPage = () => {
  const navigate = useNavigate();
  const [shops,   setShops]   = useState([]);
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shops?limit=100")
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = shops.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-bold text-lg">All Shops</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {loading ? "Loading..." : `${filtered.length} shop${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button onClick={() => navigate("/add?type=shop")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400
                         text-white text-sm font-semibold rounded-lg transition-colors">
              + Add Shop
            </button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                         text-white placeholder-slate-600 text-sm focus:outline-none
                         focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Map */}
        <div className="h-64 rounded-xl overflow-hidden border border-slate-800">
          <MapContainer center={[23.8103, 90.4125]} zoom={12} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OSM" />
            {filtered.map((shop) => {
              const [lng, lat] = shop.location?.coordinates || [90.4125, 23.8103];
              return (
                <Marker key={shop._id} position={[lat, lng]} icon={shopIcon}>
                  <Popup>
                    <div className="min-w-[150px]">
                      <p className="font-semibold text-sm">{shop.name}</p>
                      {shop.address && <p className="text-xs text-slate-500 mt-0.5">{shop.address}</p>}
                      <button onClick={() => navigate(`/shops/${shop._id}`)}
                        className="mt-2 w-full py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg">
                        View Inventory
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Shop list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Store size={36} className="text-slate-700" />
            <p className="text-slate-500 text-sm">No shops found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((shop) => (
              <button key={shop._id} onClick={() => navigate(`/shops/${shop._id}`)}
                className="text-left bg-slate-900 border border-slate-800 rounded-xl p-4
                           hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {shop.image?.url
                      ? <img src={shop.image.url} alt={shop.name} className="w-full h-full object-cover" />
                      : <Store size={16} className="text-sky-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors">
                      {shop.name}
                    </p>
                    {shop.address && (
                      <p className="flex items-center gap-1 text-slate-500 text-xs mt-0.5 truncate">
                        <MapPin size={10} /> {shop.address}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-emerald-500 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsPage;