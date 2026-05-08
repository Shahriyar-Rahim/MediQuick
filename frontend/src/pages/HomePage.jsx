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
  Store, MapPin, Package, Droplets, Siren,
  Search, Plus, Heart, Clock, Sparkles,
  AlertCircle, Activity,
} from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:#10b981;border:2.5px solid #fff;transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(16,185,129,.35)"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30],
});

const LocateControl = ({ trigger, pos }) => {
  const map = useMap();
  useEffect(() => { if (trigger) map.flyTo(pos, 15, { animate: true, duration: 1 }); }, [trigger]);
  return null;
};

const FlyToSearch = ({ coords }) => {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 16, { animate: true, duration: 0.8 }); }, [coords]);
  return null;
};

const Pulse = ({ h = "h-10", rounded = "rounded-xl" }) => (
  <div className={`${h} w-full ${rounded} bg-slate-100 animate-pulse`} />
);

const SectionTitle = ({ icon: Icon, color, children, action }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Icon size={15} className={color} />
      <h2 className="text-slate-700 text-sm font-bold">{children}</h2>
    </div>
    {action}
  </div>
);

const VoteButtons = ({ entry }) => {
  const [votes,  setVotes]  = useState(entry.priceVotes || { correct: 0, incorrect: 0 });
  const [myVote, setMyVote] = useState(null);
  const [busy,   setBusy]   = useState(false);

  const vote = async (v) => {
    if (busy || myVote) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/votes/price/${entry._id}`, { value: v });
      setVotes(data.data.priceVotes);
      setMyVote(v);
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  return (
    <div className="flex gap-1">
      <button onClick={() => vote("correct")} disabled={busy || !!myVote}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border transition-all
          ${myVote === "correct"
            ? "bg-emerald-50 border-emerald-300 text-emerald-600"
            : "border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600"}`}>
        <ThumbsUp size={9} /> {votes.correct ?? 0}
      </button>
      <button onClick={() => vote("incorrect")} disabled={busy || !!myVote}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border transition-all
          ${myVote === "incorrect"
            ? "bg-red-50 border-red-300 text-red-500"
            : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500"}`}>
        <ThumbsDown size={9} /> {votes.incorrect ?? 0}
      </button>
    </div>
  );
};

const EmergencyCards = ({ lat, lng }) => {
  const navigate = useNavigate();
  const [bloodStats, setBloodStats] = useState(null);
  const [ambStats,   setAmbStats]   = useState(null);

  useEffect(() => {
    const p = lat && lng ? `?lat=${lat}&lng=${lng}` : "";
    Promise.allSettled([
      api.get(`/blood/donors/stats${p}`),
      api.get(`/ambulance/stats${p}`),
    ]).then(([b, a]) => {
      if (b.status === "fulfilled") setBloodStats(b.value.data.data);
      if (a.status === "fulfilled") setAmbStats(a.value.data.data);
    });
  }, [lat, lng]);

  const cards = [
    {
      route:   "/blood",
      icon:    Droplets,
      label:   "Blood Donation",
      hint:    bloodStats
        ? bloodStats.nearbyCount > 0
          ? `${bloodStats.nearbyCount} donor${bloodStats.nearbyCount !== 1 ? "s" : ""} nearby`
          : `${bloodStats.total} registered donors`
        : "Find & register donors",
      accent:  { bg: "bg-red-500", ring: "ring-red-100", text: "text-red-600",
                 subtle: "bg-red-50 border-red-100 hover:border-red-200 hover:bg-red-50/80" },
    },
    {
      route:   "/ambulance",
      icon:    Siren,
      label:   "Ambulance",
      hint:    ambStats
        ? ambStats.nearbyCount > 0
          ? `${ambStats.nearbyCount} service${ambStats.nearbyCount !== 1 ? "s" : ""} nearby`
          : `${ambStats.total} listed services`
        : "Find ambulances near you",
      accent:  { bg: "bg-[#1E40AF]", ring: "ring-blue-100", text: "text-[#1E40AF]",
                 subtle: "bg-blue-50 border-blue-100 hover:border-blue-200 hover:bg-blue-50/80" },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ route, icon: Icon, label, hint, accent }) => (
        <button key={route} onClick={() => navigate(route)}
          className={`group flex items-center gap-3 p-4 border rounded-2xl
                      transition-all text-left shadow-sm hover:shadow-md ${accent.subtle}`}>
          <div className={`w-10 h-10 rounded-xl ${accent.bg} ring-4 ${accent.ring}
                           flex items-center justify-center shrink-0
                           group-hover:scale-105 transition-transform shadow-sm`}>
            <Icon size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 font-semibold text-sm leading-tight">{label}</p>
            <p className={`text-xs mt-0.5 ${accent.text} opacity-80 leading-snug`}>{hint}</p>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500
                                             group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      ))}
    </div>
  );
};

export default function HomePage() {
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

  useEffect(() => {
    api.get(`/shops/nearby?lat=${userPos[0]}&lng=${userPos[1]}&radius=8000`)
      .then(({ data }) => setShops(data.data || [])).catch(() => {});
  }, [userPos]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [t, s, e] = await Promise.allSettled([
        api.get("/entries/trending"),
        api.get("/admin/dashboard/top-shops"),
        api.get("/entries?limit=8"),
      ]);
      if (t.status === "fulfilled") setTrending(t.value.data.data || []);
      if (s.status === "fulfilled") setTopShops(s.value.data.data   || []);
      if (e.status === "fulfilled") {
        const rows = e.value.data.data || [];
        setPriceRows(rows.slice(0, 5));
        setStockAlerts(rows.filter((r) => !r.isAvailable).slice(0, 4));
      }
      setLoading(false);
    })();
  }, []);

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => { setUserPos([c.latitude, c.longitude]); setLocateTrig((v) => v + 1); },
      () => setLocateTrig((v) => v + 1)
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <WelcomeBanner />
      <PrescriptionScanner />

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              {/* <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#1E40AF] flex items-center justify-center">
                  <Activity size={12} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[#1E40AF] text-[11px] font-bold uppercase tracking-widest">
                  Medi-Quick · Bangladesh
                </span>
              </div> */}
              <h1 className="text-slate-800 text-xl sm:text-2xl font-extrabold leading-snug">
                Find medicines{" "}
                <span style={{ color: "#059669" }}>near you</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Community-powered · real prices · always free
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/medicines"
                className="flex items-center gap-2 px-4 py-2 bg-[#1E40AF] hover:bg-blue-900
                           text-white text-sm font-semibold rounded-xl transition-colors
                           shadow-sm shadow-blue-700/15">
                <Search size={14} /> Search Medicines
              </Link>
              <Link to="/add"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200
                           text-slate-600 hover:text-slate-800 hover:border-slate-300
                           text-sm font-semibold rounded-xl transition-colors">
                <Plus size={14} /> Contribute
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <EmergencyCards lat={userPos[0]} lng={userPos[1]} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Map — takes 3/5 */}
          <div className="lg:col-span-3">
            <SectionTitle icon={MapPin} color="text-[#1E40AF]">
              Nearby Pharmacies
            </SectionTitle>
            <div className="relative h-75 sm:h-85 rounded-2xl overflow-hidden
                            border border-slate-200 shadow-sm">
              {/* Search overlay */}
              <div className="absolute top-3 left-3 right-14 z-1000">
                <MapSearchBox
                  placeholder="Search areas or pharmacies..."
                  onSelect={(lat, lng) => setFlyToSearch([lat, lng])}
                />
              </div>

              {/* Tile toggle */}
              <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
                {[{ id: "street", emoji: "🗺️" }, { id: "satellite", emoji: "🛰️" }].map(({ id, emoji }) => (
                  <button key={id} onClick={() => setTileMode(id)}
                    className={`w-8 h-8 rounded-xl text-sm shadow-sm border transition-all
                      ${tileMode === id
                        ? "bg-[#1E40AF] border-blue-700 text-white"
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
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                        <div className="min-w-40 p-1">
                          <p className="font-semibold text-slate-800 text-sm">{shop.name}</p>
                          {shop.address && <p className="text-slate-400 text-xs mt-0.5">{shop.address}</p>}
                          <button onClick={() => navigate(`/shops/${shop._id}`)}
                            className="mt-2 w-full py-1.5 bg-[#1E40AF] text-white
                                       text-xs font-semibold rounded-lg">
                            View Inventory →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              <button onClick={handleLocate}
                className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5
                           px-3 py-2 bg-white/95 hover:bg-white border border-slate-200
                           text-slate-600 hover:text-[#1E40AF] text-xs font-semibold
                           rounded-xl shadow-sm transition-all">
                <Locate size={12} /> Locate Me
              </button>
            </div>
          </div>

          {/* Nearby shops list — takes 2/5 */}
          <div className="lg:col-span-2">
            <SectionTitle icon={Store} color="text-sky-500"
              action={
                <Link to="/shops"
                  className="text-[#1E40AF] text-xs font-medium flex items-center gap-0.5
                             hover:text-blue-900 transition-colors">
                  All shops <ChevronRight size={11} />
                </Link>
              }>
              Nearby Shops
            </SectionTitle>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {shops.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-center px-4">
                  <Store size={24} className="text-slate-200" />
                  <p className="text-slate-400 text-sm font-medium">No shops nearby</p>
                  <button onClick={handleLocate}
                    className="text-[#1E40AF] text-xs hover:text-blue-900 transition-colors">
                    Enable location →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {shops.slice(0, 6).map((shop) => (
                    <button key={shop._id} onClick={() => navigate(`/shops/${shop._id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 hover:bg-slate-50 transition-colors text-left group">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100
                                      flex items-center justify-center shrink-0 overflow-hidden">
                        {shop.image?.url
                          ? <img src={shop.image.url} alt=""
                              className="w-full h-full object-cover rounded-xl" />
                          : <Store size={13} className="text-sky-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-xs font-semibold truncate
                                      group-hover:text-[#1E40AF] transition-colors">
                          {shop.name}
                        </p>
                        {shop.address && (
                          <p className="text-slate-400 text-[10px] truncate mt-0.5">
                            {shop.address}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={12}
                        className="text-slate-200 group-hover:text-[#1E40AF] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Trending medicines */}
          <div>
            <SectionTitle icon={TrendingUp} color="text-amber-500"
              action={
                <Link to="/medicines"
                  className="text-[#1E40AF] text-xs font-medium flex items-center gap-0.5
                             hover:text-blue-900 transition-colors">
                  Browse all <ChevronRight size={11} />
                </Link>
              }>
              Trending Medicines
            </SectionTitle>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2.5">
                  {[...Array(4)].map((_, i) => <Pulse key={i} />)}
                </div>
              ) : trending.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-300 text-2xl mb-1">📊</p>
                  <p className="text-slate-400 text-xs">No trending data yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {trending.slice(0, 5).map((item, i) => (
                    <button key={item._id || i}
                      onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 hover:bg-slate-50 transition-colors text-left group">
                      <span className="text-slate-200 text-xs font-bold w-4 text-center shrink-0">
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
                        <p className="text-slate-700 text-xs font-semibold capitalize truncate
                                      group-hover:text-[#1E40AF] transition-colors">
                          {item.medicine?.genericName || item.brandName || "—"}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          {item.voteCount || 0} votes
                        </p>
                      </div>
                      {item.price && (
                        <span className="text-emerald-600 text-xs font-bold shrink-0">
                          ৳{item.price.toFixed(0)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top shops */}
          <div>
            <SectionTitle icon={Trophy} color="text-rose-400"
              action={
                <Link to="/shops"
                  className="text-[#1E40AF] text-xs font-medium flex items-center gap-0.5
                             hover:text-blue-900 transition-colors">
                  All shops <ChevronRight size={11} />
                </Link>
              }>
              Top Shops
            </SectionTitle>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2.5">
                  {[...Array(4)].map((_, i) => <Pulse key={i} />)}
                </div>
              ) : topShops.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-300 text-2xl mb-1">🏆</p>
                  <p className="text-slate-400 text-xs">No rankings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {topShops.slice(0, 5).map((item, i) => (
                    <button key={item._id || i}
                      onClick={() => navigate(`/shops/${item.shop?._id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 hover:bg-slate-50 transition-colors text-left group">
                      <span className="text-base shrink-0 w-6 text-center">
                        {["🥇","🥈","🥉"][i] || (
                          <span className="text-slate-200 text-xs font-bold">#{i+1}</span>
                        )}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100
                                      flex items-center justify-center shrink-0 overflow-hidden">
                        {item.shop?.image?.url
                          ? <img src={item.shop.image.url} alt=""
                              className="w-full h-full object-cover rounded-lg" />
                          : <Store size={12} className="text-rose-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-xs font-semibold truncate
                                      group-hover:text-[#1E40AF] transition-colors">
                          {item.shop?.name || "—"}
                        </p>
                        <p className="text-slate-400 text-[10px] flex items-center gap-1">
                          <BadgeCheck size={9} className="text-emerald-500" />
                          {item.entryCount} medicines
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Stock alerts */}
          <div>
            <SectionTitle icon={AlertCircle} color="text-red-400">
              Stock Alerts
            </SectionTitle>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2.5">
                  {[...Array(3)].map((_, i) => <Pulse key={i} />)}
                </div>
              ) : stockAlerts.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-slate-400 text-xs font-medium">All medicines in stock</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {stockAlerts.map((item) => (
                    <button key={item._id}
                      onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 hover:bg-slate-50 transition-colors text-left group">
                      <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-xs font-semibold capitalize truncate
                                      group-hover:text-[#1E40AF] transition-colors">
                          {item.medicine?.genericName || item.brandName || "—"}
                        </p>
                        <p className="text-slate-400 text-[10px] truncate">{item.shop?.name}</p>
                      </div>
                      <span className="text-red-500 text-[10px] font-semibold shrink-0
                                       bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                        Out of stock
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price verification */}
          <div>
            <SectionTitle icon={BadgeCheck} color="text-sky-500"
              action={<span className="text-slate-400 text-xs">Tap to vote</span>}>
              Price Verification
            </SectionTitle>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2.5">
                  {[...Array(3)].map((_, i) => <Pulse key={i} />)}
                </div>
              ) : priceRows.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-400 text-xs">No price data yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {priceRows.slice(0, 4).map((item) => (
                    <div key={item._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <button onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                          className="text-slate-700 text-xs font-semibold capitalize truncate
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Pill,     label: "Medicines", sub: "Browse & search", to: "/medicines",
              cls: "bg-emerald-600 hover:bg-emerald-700" },
            { icon: Store,    label: "Shops",     sub: "Find nearby",     to: "/shops",
              cls: "bg-[#1E40AF] hover:bg-blue-900" },
            { icon: Sparkles, label: "Contribute",sub: "Add data",        to: "/add",
              cls: "bg-slate-600 hover:bg-slate-700" },
          ].map(({ icon: Icon, label, sub, to, cls }) => (
            <button key={to} onClick={() => navigate(to)}
              className={`group flex flex-col items-center gap-1.5 py-4 px-3
                          ${cls} text-white rounded-2xl transition-all shadow-sm hover:shadow-md`}>
              <Icon size={17} className="group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold">{label}</p>
              <p className="text-white/50 text-[10px]">{sub}</p>
            </button>
          ))}
        </div>

        <div id="feedback-section" className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">

          <FeedbackSection />

          <div className="space-y-4">
            {/* About */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-red-400" />
                <h3 className="text-slate-700 text-sm font-bold">About Medi-Quick</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                A community-powered medicine tracker for Bangladesh. No login needed —
                add medicines, shops, and prices freely. Together we make healthcare
                more accessible.
              </p>
            </div>

            {/* How it works */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[#1E40AF]" />
                <h3 className="text-slate-700 text-sm font-bold">How it works</h3>
              </div>
              <div className="space-y-3">
                {[
                  "Search for a medicine by generic or brand name",
                  "See which shops carry it and compare prices",
                  "Vote on prices to help the community",
                  "Add missing medicines or shops to help others",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200
                                    flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#1E40AF] text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}