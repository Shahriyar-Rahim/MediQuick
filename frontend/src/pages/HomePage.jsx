import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import FeedbackSection from "../components/FeedbackSection";
import MapSearchBox from "../components/MapSearchBox";
import WelcomeBanner from "../components/WelcomeBanner";
import PrescriptionScanner from "../components/PrescriptionScanner";
import {
  Locate, TrendingUp, Trophy, BadgeCheck,
  ThumbsUp, ThumbsDown, ChevronRight, Pill,
  Store, ArrowUpDown, MapPin, Sparkles,
  Clock, Heart, Package, Droplets, Siren,
  Search, Plus, Activity, Star,
} from "lucide-react";

//Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:#10b981;border:2.5px solid #fff;transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(16,185,129,.4)"></div>`,
  iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -28],
});

const LocateControl = ({ trigger, pos }) => {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;
    map.flyTo(pos, 15, { animate: true, duration: 1 });
  }, [trigger]);
  return null;
};

const FlyToSearch = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { animate: true, duration: 0.8 });
  }, [coords]);
  return null;
};

//Vote buttons
const VoteButtons = ({ entry }) => {
  const [votes,  setVotes]  = useState(entry.priceVotes || { correct: 0, incorrect: 0 });
  const [myVote, setMyVote] = useState(null);
  const [busy,   setBusy]   = useState(false);

  const vote = async (value) => {
    if (busy || myVote) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/votes/price/${entry._id}`, { value });
      setVotes(data.data.priceVotes);
      setMyVote(value);
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => vote("correct")} disabled={busy || !!myVote}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all
          ${myVote === "correct"
            ? "bg-emerald-50 border-emerald-300 text-emerald-600"
            : "border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300"}`}>
        <ThumbsUp size={9} /> {votes.correct ?? 0}
      </button>
      <button onClick={() => vote("incorrect")} disabled={busy || !!myVote}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all
          ${myVote === "incorrect"
            ? "bg-red-50 border-red-300 text-red-500"
            : "border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300"}`}>
        <ThumbsDown size={9} /> {votes.incorrect ?? 0}
      </button>
    </div>
  );
};

//Skeleton
const Pulse = ({ h = "h-9", w = "w-full", rounded = "rounded-xl" }) => (
  <div className={`${h} ${w} ${rounded} bg-slate-100 animate-pulse`} />
);

//Section card wrapper
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, iconBg, iconColor, title, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <div className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={14} className={iconColor} />
      </div>
      <span className="text-slate-800 text-sm font-semibold">{title}</span>
    </div>
    {action}
  </div>
);

//Emergency Cards
const EmergencyCards = ({ userLat, userLng }) => {
  const navigate = useNavigate();
  const [bloodStats, setBloodStats] = useState(null);
  const [ambStats,   setAmbStats]   = useState(null);

  useEffect(() => {
    const p = userLat && userLng ? `?lat=${userLat}&lng=${userLng}` : "";
    Promise.allSettled([
      api.get(`/blood/donors/stats${p}`),
      api.get(`/ambulance/stats${p}`),
    ]).then(([bRes, aRes]) => {
      if (bRes.status === "fulfilled") setBloodStats(bRes.value.data.data);
      if (aRes.status === "fulfilled") setAmbStats(aRes.value.data.data);
    });
  }, [userLat, userLng]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Blood */}
      <button onClick={() => navigate("/blood")}
        className="group relative overflow-hidden flex items-center gap-4 p-4
                   bg-gradient-to-br from-red-50 via-rose-50 to-pink-50
                   hover:from-red-100 hover:to-pink-100
                   border border-red-100 hover:border-red-200
                   rounded-2xl transition-all text-left shadow-sm hover:shadow-md">
        <div className="absolute -right-5 -top-5 w-28 h-28 bg-red-100/70 rounded-full
                        group-hover:scale-125 transition-transform duration-500" />
        <div className="w-12 h-12 rounded-2xl bg-red-500 shadow-lg shadow-red-500/30
                        flex items-center justify-center shrink-0
                        group-hover:scale-105 transition-transform">
          <Droplets size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-red-900 font-bold text-sm">Blood Donation</p>
          <p className="text-red-500 text-xs mt-0.5">
            {bloodStats
              ? bloodStats.nearbyCount > 0
                ? `${bloodStats.nearbyCount} donor${bloodStats.nearbyCount !== 1 ? "s" : ""} nearby`
                : `${bloodStats.total} registered donors`
              : "Find & register donors"}
          </p>
        </div>
        <ChevronRight size={16}
          className="text-red-300 group-hover:text-red-500 group-hover:translate-x-1
                     transition-all shrink-0 relative z-10" />
      </button>

      {/* Ambulance */}
      <button onClick={() => navigate("/ambulance")}
        className="group relative overflow-hidden flex items-center gap-4 p-4
                   bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50
                   hover:from-blue-100 hover:to-sky-100
                   border border-blue-100 hover:border-blue-200
                   rounded-2xl transition-all text-left shadow-sm hover:shadow-md">
        <div className="absolute -right-5 -top-5 w-28 h-28 bg-blue-100/70 rounded-full
                        group-hover:scale-125 transition-transform duration-500" />
        <div className="w-12 h-12 rounded-2xl bg-[#1E40AF] shadow-lg shadow-blue-700/30
                        flex items-center justify-center shrink-0
                        group-hover:scale-105 transition-transform">
          <Siren size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-blue-900 font-bold text-sm">Ambulance</p>
          <p className="text-blue-600 text-xs mt-0.5">
            {ambStats
              ? ambStats.nearbyCount > 0
                ? `${ambStats.nearbyCount} service${ambStats.nearbyCount !== 1 ? "s" : ""} nearby`
                : `${ambStats.total} listed services`
              : "Find ambulances near you"}
          </p>
        </div>
        <ChevronRight size={16}
          className="text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1
                     transition-all shrink-0 relative z-10" />
      </button>
    </div>
  );
};

//HomePage
const HomePage = () => {
  const navigate = useNavigate();

  const [userPos,     setUserPos]     = useState([23.8103, 90.4125]);
  const [locateTrig,  setLocateTrig]  = useState(0);
  const [flyToSearch, setFlyToSearch] = useState(null);
  const [tileMode,    setTileMode]    = useState("street");
  const [shops,       setShops]       = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [topShops,    setTopShops]    = useState([]);
  const [priceRows,   setPriceRows]   = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const navItems = [
    { label: "Medicines", icon: Pill,  color: "text-emerald-600", path: "/medicines" },
    { label: "Shops",     icon: Store, color: "text-blue-600",    path: "/shops"     },
    { label: "Community", icon: Heart, color: "text-red-500",     path: "#" },
  ];

  useEffect(() => {
    api.get(`/shops/nearby?lat=${userPos[0]}&lng=${userPos[1]}&radius=8000`)
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]));
  }, [userPos]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [trendRes, topRes, entryRes] = await Promise.allSettled([
          api.get("/entries/trending"),
          api.get("/admin/dashboard/top-shops"),
          api.get("/entries?limit=8"),
        ]);
        if (trendRes.status === "fulfilled") setTrending(trendRes.value.data.data || []);
        if (topRes.status   === "fulfilled") setTopShops(topRes.value.data.data   || []);
        if (entryRes.status === "fulfilled") {
          const entries = entryRes.value.data.data || [];
          setPriceRows(entries.slice(0, 5));
          setStockAlerts(entries.filter((e) => !e.isAvailable).slice(0, 4));
        }
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setUserPos([coords.latitude, coords.longitude]);
        setLocateTrig((v) => v + 1);
      },
      () => setLocateTrig((v) => v + 1)
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <WelcomeBanner />
      <PrescriptionScanner />

      {/* Hero */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              {/* <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#1E40AF] flex items-center justify-center">
                  <Activity size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[#1E40AF] text-xs font-bold uppercase tracking-widest">
                  MediQuick
                </span>
              </div> */}
              <h1 className="text-slate-800 text-2xl sm:text-3xl font-extrabold
                             leading-tight tracking-tight">
                Find medicines,{" "}
                <span style={{ color: "#10B981" }}>near you</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 max-w-md">
                Community-powered availability · real prices · 
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Link to="/medicines"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1E40AF] hover:bg-blue-800
                             text-white text-xs font-semibold rounded-xl transition-colors shadow-sm
                             shadow-blue-700/20">
                  <Search size={13} /> Search Medicines
                </Link>
                <Link to="/add"
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50
                             border border-slate-200 text-slate-700 hover:text-slate-900
                             text-xs font-semibold rounded-xl transition-colors">
                  <Plus size={13} /> Contribute
                </Link>
              </div>
            </div>

            {/* Live stats strip */}
            <div className="flex items-center gap-3 flex-wrap">
      {navItems.map(({ label, icon: Icon, color, path }) => (
        <button 
          key={label}
          type="button"
          onClick={() => navigate(path)}
          className="flex sm:hidden items-center gap-2 px-4 py-2.5 
                     bg-white border border-slate-100 rounded-2xl shadow-sm
                     active:scale-95 active:bg-slate-50 transition-all duration-75
                     hover:border-blue-200 outline-none"
        >
          <Icon size={14} className={color} />
          <span className="text-slate-600 text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/*Emergency module cards*/}
        <EmergencyCards userLat={userPos[0]} userLng={userPos[1]} />

        {/*Map + Nearby*/}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Map */}
          <div className="lg:col-span-2 relative h-[320px] sm:h-[360px] rounded-2xl overflow-hidden
                          border border-slate-200 shadow-sm">
            {/* Search overlay */}
            <div className="absolute top-3 left-3 right-14 z-[1000]">
              <MapSearchBox
                placeholder="Search areas, pharmacies..."
                onSelect={(lat, lng) => setFlyToSearch([lat, lng])}
              />
            </div>

            {/* Tile toggle */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
              {[
                { id: "street",    emoji: "🗺️" },
                { id: "satellite", emoji: "🛰️" },
              ].map(({ id, emoji }) => (
                <button key={id} onClick={() => setTileMode(id)}
                  className={`w-8 h-8 rounded-xl text-sm shadow border transition-all
                    ${tileMode === id
                      ? "bg-[#1E40AF] border-blue-600 text-white"
                      : "bg-white/95 border-slate-200 hover:bg-white"}`}>
                  {emoji}
                </button>
              ))}
            </div>

            <MapContainer center={userPos} zoom={13} className="h-full w-full" zoomControl>
              {tileMode === "satellite" ? (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri" />
              ) : (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OSM' />
              )}
              <LocateControl trigger={locateTrig} pos={userPos} />
              {flyToSearch && <FlyToSearch coords={flyToSearch} />}
              {shops.map((shop) => {
                const [lng, lat] = shop.location?.coordinates || [0, 0];
                if (!lat || !lng) return null;
                return (
                  <Marker key={shop._id} position={[lat, lng]} icon={shopIcon}>
                    <Popup>
                      <div className="min-w-[160px] p-0.5">
                        <p className="font-semibold text-slate-800 text-sm">{shop.name}</p>
                        {shop.address && (
                          <p className="text-slate-500 text-xs mt-0.5">{shop.address}</p>
                        )}
                        <button onClick={() => navigate(`/shops/${shop._id}`)}
                          className="mt-2 w-full py-1.5 bg-[#1E40AF] text-white
                                     text-xs font-semibold rounded-lg">
                          View Inventory
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <button onClick={handleLocate}
              className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2
                         px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200
                         text-slate-700 hover:text-[#1E40AF] text-xs font-semibold
                         rounded-xl shadow-md transition-all">
              <Locate size={13} /> Locate Me
            </button>
          </div>

          {/* Nearby shops */}
          <Card>
            <CardHeader
              icon={MapPin} iconBg="bg-sky-50" iconColor="text-sky-600"
              title="Nearby Shops"
              action={
                <Link to="/shops" className="text-[#1E40AF] hover:text-blue-800
                                             text-xs flex items-center gap-0.5 font-medium">
                  All <ChevronRight size={11} />
                </Link>
              }
            />
            <div className="divide-y divide-slate-50">
              {shops.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center px-4">
                  <Store size={22} className="text-slate-300" />
                  <p className="text-slate-400 text-xs">No shops found nearby</p>
                  <button onClick={handleLocate}
                    className="text-[#1E40AF] text-xs hover:text-blue-800 transition-colors">
                    Try locating yourself →
                  </button>
                </div>
              ) : shops.slice(0, 5).map((shop) => (
                <button key={shop._id} onClick={() => navigate(`/shops/${shop._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3
                             hover:bg-slate-50 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {shop.image?.url
                      ? <img src={shop.image.url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : <Store size={13} className="text-[#1E40AF]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-semibold truncate
                                  group-hover:text-[#1E40AF] transition-colors">
                      {shop.name}
                    </p>
                    {shop.address && (
                      <p className="text-slate-400 text-[10px] truncate mt-0.5">{shop.address}</p>
                    )}
                  </div>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1E40AF]
                                                      shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/*Trending + Top Shops */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Trending */}
          <Card>
            <CardHeader
              icon={TrendingUp} iconBg="bg-amber-50" iconColor="text-amber-500"
              title="Trending Medicines"
              action={
                <Link to="/medicines"
                  className="text-slate-400 hover:text-[#1E40AF] text-xs flex items-center gap-0.5 transition-colors">
                  All <ChevronRight size={10} />
                </Link>
              }
            />
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <Pulse key={i} h="h-10" />)}
                </div>
              ) : trending.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-400 text-xs">No trending data yet</p>
                </div>
              ) : trending.slice(0, 5).map((item, i) => (
                <button key={item._id || i}
                  onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3
                             hover:bg-slate-50 transition-colors text-left group">
                  <span className="text-slate-300 text-xs font-bold w-4 shrink-0 text-center">
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {item.medicine?.image?.url
                      ? <img src={item.medicine.image.url} alt=""
                          className="w-full h-full object-cover rounded-lg" />
                      : <Pill size={12} className="text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-medium capitalize truncate
                                  group-hover:text-[#1E40AF] transition-colors">
                      {item.medicine?.genericName || item.brandName || "—"}
                    </p>
                    <p className="text-slate-400 text-[10px]">{item.voteCount || 0} price votes</p>
                  </div>
                  {item.price && (
                    <span className="text-emerald-600 text-xs font-bold shrink-0">
                      ৳{item.price.toFixed(0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Top Shops */}
          <Card>
            <CardHeader
              icon={Trophy} iconBg="bg-rose-50" iconColor="text-rose-500"
              title="Top Shops"
              action={
                <Link to="/shops"
                  className="text-slate-400 hover:text-[#1E40AF] text-xs flex items-center gap-0.5 transition-colors">
                  All <ChevronRight size={10} />
                </Link>
              }
            />
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <Pulse key={i} h="h-10" />)}
                </div>
              ) : topShops.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-400 text-xs">No shop rankings yet</p>
                </div>
              ) : topShops.slice(0, 5).map((item, i) => (
                <button key={item._id || i}
                  onClick={() => navigate(`/shops/${item.shop?._id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3
                             hover:bg-slate-50 transition-colors text-left group">
                  <span className="text-base shrink-0 w-6 text-center leading-none">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉"
                      : <span className="text-slate-300 text-xs font-bold">#{i + 1}</span>}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {item.shop?.image?.url
                      ? <img src={item.shop.image.url} alt=""
                          className="w-full h-full object-cover rounded-lg" />
                      : <Store size={12} className="text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-xs font-medium truncate
                                  group-hover:text-[#1E40AF] transition-colors">
                      {item.shop?.name || "—"}
                    </p>
                    <p className="text-slate-400 text-[10px] flex items-center gap-1">
                      <BadgeCheck size={9} className="text-emerald-500" />
                      {item.entryCount} medicines listed
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/*Stock Alerts + Price Verification*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Stock Alerts */}
          <Card>
            <CardHeader
              icon={Package} iconBg="bg-red-50" iconColor="text-red-400"
              title="Stock Alerts"
            />
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Pulse key={i} h="h-10" />)}
              </div>
            ) : stockAlerts.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-2xl">🎉</span>
                <p className="text-slate-400 text-xs mt-1">All medicines in stock</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {stockAlerts.map((item) => (
                  <button key={item._id}
                    onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3
                               hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-xs font-medium capitalize truncate
                                    group-hover:text-[#1E40AF] transition-colors">
                        {item.medicine?.genericName || item.brandName || "—"}
                      </p>
                      <p className="text-slate-400 text-[10px] truncate">{item.shop?.name}</p>
                    </div>
                    <span className="text-red-500 text-[10px] font-semibold shrink-0
                                     bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      Out
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Price Verification */}
          <Card>
            <CardHeader
              icon={BadgeCheck} iconBg="bg-sky-50" iconColor="text-sky-500"
              title="Price Verification"
              action={<span className="text-slate-400 text-xs">Vote to help</span>}
            />
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Pulse key={i} h="h-10" />)}
              </div>
            ) : priceRows.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-slate-400 text-xs">No price data yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {priceRows.slice(0, 4).map((item) => (
                  <div key={item._id}
                    className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <button onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                        className="text-slate-700 text-xs font-medium capitalize truncate
                                   hover:text-[#1E40AF] transition-colors block">
                        {item.medicine?.genericName || item.brandName || "—"}
                      </button>
                      <p className="text-slate-400 text-[10px] truncate">{item.shop?.name}</p>
                    </div>
                    <span className="text-emerald-600 text-xs font-bold shrink-0">
                      ৳{item.price?.toFixed(0)}
                    </span>
                    <VoteButtons entry={item} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions*/}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Pill, label: "Browse Medicines", sub: "Search by name",
              to: "/medicines",
              bg: "bg-emerald-600 hover:bg-emerald-700",
            },
            {
              icon: Store, label: "View Shops", sub: "Find nearby",
              to: "/shops",
              bg: "bg-[#1E40AF] hover:bg-blue-900",
            },
            {
              icon: Sparkles, label: "Contribute", sub: "Add data",
              to: "/add",
              bg: "bg-slate-700 hover:bg-slate-800",
            },
          ].map(({ icon: Icon, label, sub, to, bg }) => (
            <button key={to} onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-2 px-3 py-4
                          ${bg} text-white rounded-2xl transition-all
                          shadow-sm hover:shadow-md group`}>
              <Icon size={18} className="opacity-90 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="text-xs font-bold leading-tight">{label}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/*Feedback + About*/}
        <div id="feedback-section" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FeedbackSection />

          <div className="space-y-4">
            <Card className="">
              <div className="p-5">
                <h3 className="text-slate-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Heart size={14} className="text-red-400" />
                  About Medi-Quick
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  A community-powered medicine tracker for Bangladesh.
                  No login needed — add medicines, shops, and prices freely.
                  Together we make healthcare more accessible.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-5">
                <h3 className="text-slate-800 font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-[#1E40AF]" />
                  How it works
                </h3>
                <div className="space-y-3.5">
                  {[
                    { n: "1", text: "Search for a medicine by generic or brand name" },
                    { n: "2", text: "See which shops carry it and compare prices"    },
                    { n: "3", text: "Vote on prices to help the community"           },
                    { n: "4", text: "Add missing medicines or shops to help others"  },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200
                                      flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#1E40AF] text-[10px] font-bold">{n}</span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
