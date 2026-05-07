import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  MapContainer, TileLayer, Marker, Popup, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import MapSearchBox from "../components/MapSearchBox";
import {
  Store, MapPin, Search, Locate, Satellite, Map,
  Loader2, ChevronRight, Phone, ShieldAlert, X,
  Layers,
} from "lucide-react";

//Leaflet icon fix
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

const activeIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;
    background:#f59e0b;border:2px solid #fff;transform:rotate(-45deg);
    box-shadow:0 2px 12px rgba(245,158,11,.55)"></div>`,
  iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -32],
});

const userIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(59,130,246,.3)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

//Map controls
const FlyToCoords = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { animate: true, duration: 0.8 });
  }, [coords]);
  return null;
};

const LocateMe = ({ onLocate }) => {
  const map = useMap();
  const handle = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        const pos = [c.latitude, c.longitude];
        map.flyTo(pos, 15, { animate: true, duration: 1 });
        onLocate(pos);
      },
      () => alert("Could not get your location")
    );
  };
  return (
    <button onClick={handle}
      title="Locate Me"
      className="absolute bottom-16 right-3 z-[1000] w-9 h-9
                 bg-white hover:bg-slate-50 border border-slate-200
                 rounded-lg shadow-lg flex items-center justify-center
                 transition-colors group">
      <Locate size={16} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
    </button>
  );
};

//Tile layers
const TILE_LAYERS = {
  street: {
    url:         "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
    label:       "Street",
  },
  satellite: {
    url:         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Esri, DigitalGlobe",
    label:       "Satellite",
  },
  hybrid: {
    url:         "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelUrl:    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; Esri, OSM",
    label:       "Hybrid",
  },
};

// Switches tile layer reactively
const TileLayerSwitcher = ({ mode }) => {
  const map  = useMap();
  const tile = TILE_LAYERS[mode] || TILE_LAYERS.street;
  return (
    <>
      <TileLayer key={mode} url={tile.url} attribution={tile.attribution} />
      {mode === "hybrid" && (
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
          opacity={0.4}
        />
      )}
    </>
  );
};

//ShopsPage
const ShopsPage = () => {
  const navigate = useNavigate();

  const [shops,      setShops]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [query,      setQuery]      = useState("");
  const [activeShop, setActiveShop] = useState(null);
  const [userPos,    setUserPos]    = useState(null);
  const [flyTo,      setFlyTo]      = useState(null);
  const [tileMode,   setTileMode]   = useState("street"); // street | satellite | hybrid
  const [mapCenter,  setMapCenter]  = useState([23.8103, 90.4125]);
  const [showList,   setShowList]   = useState(true);

  useEffect(() => {
    api.get("/shops?limit=200")
      .then(({ data }) => setShops(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter shops by search query
  const filtered = shops.filter((s) =>
    !query.trim() ||
    s.name?.toLowerCase().includes(query.toLowerCase()) ||
    s.address?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectShop = (shop) => {
    const [lng, lat] = shop.location?.coordinates || [0, 0];
    setActiveShop(shop);
    if (lat && lng) setFlyTo([lat, lng]);
  };

  const handleLocate = (pos) => {
    setUserPos(pos);
    setFlyTo(pos);
  };

  const tileOptions = [
    { id: "street",    label: "Street",    icon: Map       },
    { id: "satellite", label: "Satellite", icon: Satellite },
    { id: "hybrid",    label: "Hybrid",    icon: Layers    },
  ];

  return (
    <div className="bg-slate-950 min-h-screen flex flex-col">

      {/* Header — compact */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-400/10 flex items-center justify-center">
              <Store size={13} className="text-sky-400" />
            </div>
            <h1 className="text-white font-bold text-sm">All Shops</h1>
            <span className="text-slate-600 text-xs">({shops.length})</span>
          </div>

          {/* Tile mode switcher — header version */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-800
                          border border-slate-700 rounded-xl">
            {tileOptions.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTileMode(id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                            transition-colors
                  ${tileMode === id
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"}`}>
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          <button onClick={() => navigate("/add?type=shop")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400
                       text-white text-xs font-semibold rounded-xl transition-colors">
            <Store size={12} /> Add Shop
          </button>
        </div>
      </div>

      {/* Main — map + list */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 gap-4">

      {/* Main — map + list side by side */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full
                      px-4 sm:px-6 py-4 gap-4 min-h-0">

        {/* Map panel — compact */}
        <div className="lg:flex-1 relative">
          <div className="h-[300px] lg:h-[calc(100vh-13rem)] rounded-xl overflow-hidden
                          border border-slate-800 relative">

            {/* Search overlay */}
            <div className="absolute top-2 left-2 right-12 z-[1000]">
              <MapSearchBox
                placeholder="Search areas, pharmacies..."
                onSelect={(lat, lng) => setFlyTo([lat, lng])}
              />
            </div>

            {/* Tile mode buttons — compact, stacked top-right */}
            <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
              {tileOptions.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTileMode(id)}
                  title={label}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shadow
                              transition-all
                    ${tileMode === id
                      ? "bg-emerald-500 text-white"
                      : "bg-white/90 text-slate-600 hover:bg-white"}`}>
                  <Icon size={13} />
                </button>
              ))}
            </div>

            {/* Active shop info — compact bottom bar */}
            {activeShop && (
              <div className="absolute bottom-10 left-2 right-2 z-[1000]
                              bg-slate-900/95 backdrop-blur border border-slate-700
                              rounded-xl px-3 py-2 flex items-center gap-2">
                <Store size={13} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{activeShop.name}</p>
                  {activeShop.address && (
                    <p className="text-slate-500 text-[10px] truncate">{activeShop.address}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/shops/${activeShop._id}`)}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-medium
                             flex items-center gap-0.5 shrink-0 transition-colors">
                  View <ChevronRight size={10} />
                </button>
                <button onClick={() => setActiveShop(null)}
                  className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
                  <X size={12} />
                </button>
              </div>
            )}

            <MapContainer
              center={mapCenter} zoom={13}
              className="h-full w-full"
              style={{ minHeight: "300px" }}
            >
              <TileLayerSwitcher mode={tileMode} />
              {flyTo && <FlyToCoords coords={flyTo} />}

              {/* Locate Me — compact */}
              <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000 }}>
                <LocateMe onLocate={handleLocate} />
              </div>

              {/* User position */}
              {userPos && <Marker position={userPos} icon={userIcon} />}

              {/* Shop markers */}
              {filtered.map((shop) => {
                const [lng, lat] = shop.location?.coordinates || [0, 0];
                if (!lat || !lng) return null;
                const isActive = activeShop?._id === shop._id;
                return (
                  <Marker key={shop._id} position={[lat, lng]}
                    icon={isActive ? activeIcon : shopIcon}
                    eventHandlers={{ click: () => handleSelectShop(shop) }}>
                    <Popup>
                      <div className="min-w-[160px] p-0.5">
                        <p className="font-semibold text-slate-800 text-sm">{shop.name}</p>
                        {shop.address && (
                          <p className="text-slate-500 text-xs mt-0.5">{shop.address}</p>
                        )}
                        {shop.contact && (
                          <p className="text-slate-500 text-xs mt-0.5">📞 {shop.contact}</p>
                        )}
                        <button
                          onClick={() => navigate(`/shops/${shop._id}`)}
                          className="mt-2 w-full py-1.5 bg-emerald-500 hover:bg-emerald-400
                                     text-white text-xs font-semibold rounded-lg transition-colors">
                          View Inventory
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Shop list panel — compact */}
        <div className="lg:w-72 xl:w-80 flex flex-col min-h-0">
          {/* List search */}
          <div className="relative mb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter shops..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-800
                         text-white placeholder-slate-600 text-xs rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          <p className="text-slate-600 text-xs mb-2 px-0.5">
            {filtered.length} shop{filtered.length !== 1 ? "s" : ""}
            {query && ` for "${query}"`}
          </p>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-1.5
                          max-h-[300px] lg:max-h-[calc(100vh-16rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="text-emerald-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Store size={24} className="text-slate-700" />
                <p className="text-slate-500 text-sm">No shops found</p>
              </div>
            ) : filtered.map((shop) => {
              const isActive = activeShop?._id === shop._id;
              const fraudPct = shop.fraudVotes
                ? Math.round((shop.fraudVotes.fraud /
                    Math.max(1, shop.fraudVotes.fraud + shop.fraudVotes.legit)) * 100)
                : 0;

              return (
                <button
                  key={shop._id}
                  onClick={() => handleSelectShop(shop)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border
                              text-left transition-all group
                    ${isActive
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"}`}>

                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                   shrink-0 overflow-hidden border
                    ${isActive ? "bg-amber-500/10 border-amber-500/20"
                               : "bg-sky-500/10 border-sky-500/20"}`}>
                    {shop.image?.url
                      ? <img src={shop.image.url} alt="" className="w-full h-full object-cover" />
                      : <Store size={13} className={isActive ? "text-amber-400" : "text-sky-400"} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate transition-colors
                      ${isActive ? "text-amber-300" : "text-white group-hover:text-emerald-400"}`}>
                      {shop.name}
                    </p>
                    {shop.address && (
                      <p className="text-slate-600 text-[10px] truncate">{shop.address}</p>
                    )}
                    {fraudPct > 30 && (
                      <span className="text-rose-400 text-[10px] flex items-center gap-0.5">
                        <ShieldAlert size={8} /> {fraudPct}% flagged
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/shops/${shop._id}`); }}
                    className="flex items-center gap-0.5 px-2 py-1 bg-emerald-500/10
                               hover:bg-emerald-500/20 border border-emerald-500/20
                               text-emerald-400 text-[10px] font-medium rounded-lg
                               transition-colors shrink-0">
                    View <ChevronRight size={8} />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    <div />
  </div>
  );
};

export default ShopsPage;
