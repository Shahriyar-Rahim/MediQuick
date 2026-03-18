import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import {
  Search, Locate, TrendingUp, AlertTriangle, Trophy,
  BadgeCheck, ThumbsUp, ThumbsDown, ChevronRight,
  Pill, Store, ArrowUpDown,
} from "lucide-react";

// Fix Leaflet default icon broken by Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Emerald teardrop shop marker
const shopIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:#10b981;border:2px solid #fff;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(16,185,129,.45)">
  </div>`,
  iconSize:   [28, 28],
  iconAnchor: [14, 28],
  popupAnchor:[0, -30],
});

// Flies map to user on trigger change
const LocateControl = ({ trigger, pos }) => {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;
    map.flyTo(pos, 15, { animate: true, duration: 1 });
  }, [trigger]);
  return null;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ rows = 4 }) => (
  <div className="space-y-2 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-10 bg-slate-800 rounded-lg" />
    ))}
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, accent = "emerald", children }) => {
  const ring = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    rose:    "text-rose-400 bg-rose-400/10",
    amber:   "text-amber-400 bg-amber-400/10",
    sky:     "text-sky-400 bg-sky-400/10",
  }[accent];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ring}`}>
          <Icon size={14} />
        </div>
        <h2 className="text-slate-100 font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
};

// ── HomePage ──────────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();

  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [showDrop,     setShowDrop]     = useState(false);
  const searchRef = useRef(null);

  const [userPos,      setUserPos]      = useState([23.8103, 90.4125]);
  const [locateTrig,   setLocateTrig]   = useState(0);
  const [shops,        setShops]        = useState([]);

  const [trending,     setTrending]     = useState([]);
  const [stockAlerts,  setStockAlerts]  = useState([]);
  const [topShops,     setTopShops]     = useState([]);
  const [priceRows,    setPriceRows]    = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);

  // Fetch nearby shops
  useEffect(() => {
    api.get(`/shops/nearby?lat=${userPos[0]}&lng=${userPos[1]}&radius=8000`)
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]));
  }, [userPos]);

  // Dashboard data
  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
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
          setPriceRows(entries.slice(0, 4));
          setStockAlerts(entries.filter((e) => !e.isAvailable).slice(0, 4));
        }
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`);
        setResults(data.data || []);
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (!searchRef.current?.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => { setUserPos([coords.latitude, coords.longitude]); setLocateTrig((v) => v + 1); },
      () => setLocateTrig((v) => v + 1)
    );
  };

  return (
    <div className="bg-slate-950 min-h-screen">

      {/* Search bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-5">
        <div className="max-w-3xl mx-auto relative" ref={searchRef}>
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Medicine or Generic Name (e.g., Paracetamol)..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl
                         text-white placeholder-slate-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Dropdown */}
          {showDrop && (
            <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {results.length === 0 ? (
                <p className="px-4 py-5 text-center text-slate-500 text-sm">No medicines found for "{query}"</p>
              ) : (
                <ul>
                  {results.map((med) => (
                    <li key={med._id}>
                      <button
                        onClick={() => { navigate(`/medicines/${med._id}`); setShowDrop(false); setQuery(""); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Pill size={13} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium capitalize">{med.genericName}</p>
                          {med.brandNames?.length > 0 && (
                            <p className="text-slate-500 text-xs truncate">{med.brandNames.join(", ")}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full capitalize shrink-0">
                          {med.category}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Leaflet map */}
      <div className="relative h-[340px] border-b border-slate-800">
        <MapContainer center={userPos} zoom={13} className="h-full w-full" zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
          />
          <LocateControl trigger={locateTrig} pos={userPos} />

          {shops.map((shop) => {
            const [lng, lat] = shop.location.coordinates;
            return (
              <Marker key={shop._id} position={[lat, lng]} icon={shopIcon}>
                <Popup>
                  <div className="min-w-[170px] p-0.5">
                    <p className="font-semibold text-slate-800 text-sm">{shop.name}</p>
                    {shop.address && <p className="text-slate-500 text-xs mt-0.5">{shop.address}</p>}
                    <div className="text-amber-500 text-xs mt-1">★★★★★ <span className="text-slate-400">crowd rating</span></div>
                    <button
                      onClick={() => navigate(`/shops/${shop._id}`)}
                      className="mt-2 w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      View Inventory
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <button
          onClick={handleLocate}
          className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 px-4 py-2.5
                     bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold
                     rounded-xl shadow-lg shadow-emerald-500/25 transition-colors"
        >
          <Locate size={14} /> Locate Me
        </button>
      </div>

      {/* Dashboard sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Row 1 — three panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Trending */}
          <Section icon={TrendingUp} title="Trending Medicines (Today)" accent="emerald">
            {loadingData ? <Skeleton /> : trending.length === 0 ? (
              <p className="text-slate-600 text-sm">No activity today yet</p>
            ) : (
              <ul className="space-y-1">
                {trending.slice(0, 5).map((item, i) => (
                  <li key={item.medicine?._id || i}>
                    <button
                      onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                    >
                      <span className="text-slate-600 text-xs w-4 shrink-0 font-bold">{i + 1}</span>
                      <Pill size={13} className="text-emerald-400 shrink-0" />
                      <span className="text-slate-300 text-sm capitalize group-hover:text-white transition-colors flex-1 truncate">
                        {item.medicine?.genericName || "—"}
                      </span>
                      <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-500 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Stock Alerts */}
          <Section icon={AlertTriangle} title="Stock Alerts (Running Low)" accent="rose">
            {loadingData ? <Skeleton /> : stockAlerts.length === 0 ? (
              <p className="text-slate-600 text-sm">No alerts right now</p>
            ) : (
              <ul className="space-y-2">
                {stockAlerts.slice(0, 4).map((item, i) => (
                  <li key={item._id || i}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-slate-200 text-sm font-medium capitalize">
                        {item.medicine?.genericName || item.brandName || "—"}
                      </p>
                      <p className="text-rose-400/70 text-xs mt-0.5">
                        {item.shop?.name || "Unknown shop"} — low stock
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Top Shops Leaderboard */}
          <Section icon={Trophy} title="Top Contributing Shops (Leaderboard)" accent="amber">
            {loadingData ? <Skeleton /> : topShops.length === 0 ? (
              <p className="text-slate-600 text-sm">No data yet</p>
            ) : (
              <ul className="space-y-1">
                {topShops.slice(0, 4).map((item, i) => (
                  <li key={item.shop?._id || i}>
                    <button
                      onClick={() => navigate(`/shops/${item.shop?._id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                    >
                      <span className="text-base shrink-0">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate group-hover:text-white">
                          {item.shop?.name || "—"}
                        </p>
                        <div className="flex items-center gap-1">
                          <BadgeCheck size={10} className="text-emerald-400 shrink-0" />
                          <p className="text-slate-500 text-xs">{item.entryCount} medicines listed</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Row 2 — price tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Price Comparison */}
          <Section icon={ArrowUpDown} title="Price Comparison & Crowdsourcing" accent="sky">
            {loadingData ? <Skeleton rows={3} /> : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Medicine", "Shop", "Price"].map((h) => (
                        <th key={h} className={`text-slate-500 text-xs font-medium pb-2 ${h === "Price" ? "text-right" : "text-left"} pr-3 last:pr-0`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {priceRows.length === 0 ? (
                      <tr><td colSpan={3} className="py-4 text-center text-slate-600 text-xs">No data yet</td></tr>
                    ) : priceRows.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pr-3">
                          <button onClick={() => navigate(`/medicines/${item.medicine?._id}`)}
                            className="text-slate-300 hover:text-emerald-400 capitalize transition-colors font-medium text-xs">
                            {item.medicine?.genericName || item.brandName || "—"}
                          </button>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 text-xs">{item.shop?.name || "—"}</td>
                        <td className="py-2.5 text-right">
                          <span className="text-emerald-400 font-semibold text-xs">{item.price?.toFixed(2)}</span>
                          <span className="text-slate-600 text-xs ml-1">BDT</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Price Verification */}
          <Section icon={BadgeCheck} title="Price Verification" accent="emerald">
            {loadingData ? <Skeleton rows={3} /> : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Medicine", "Shop", "Price", "Community Vote"].map((h) => (
                        <th key={h} className={`text-slate-500 text-xs font-medium pb-2 ${h === "Price" || h === "Community Vote" ? "text-right" : "text-left"} pr-3 last:pr-0`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {priceRows.length === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-600 text-xs">No data yet</td></tr>
                    ) : priceRows.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 pr-3 text-slate-300 capitalize text-xs font-medium">
                          {item.medicine?.genericName || item.brandName || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 text-xs">{item.shop?.name || "—"}</td>
                        <td className="py-2.5 pr-3 text-right text-xs">
                          <span className="text-slate-300 font-medium">{item.price?.toFixed(2)}</span>
                          <span className="text-slate-600 ml-1">BDT</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                              <ThumbsUp size={10} /> {item.priceVotes?.correct ?? 0}
                            </span>
                            <span className="text-slate-700 text-xs">/</span>
                            <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                              <ThumbsDown size={10} /> {item.priceVotes?.incorrect ?? 0}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* Quick action row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
          {[
            { icon: Pill,      label: "Browse All Medicines",   to: "/medicines", c: "emerald" },
            { icon: Store,     label: "View All Shops",          to: "/shops",     c: "sky"     },
            { icon: TrendingUp,label: "Add Medicine / Shop",     to: "/add",       c: "amber"   },
          ].map(({ icon: Icon, label, to, c }) => (
            <button key={to} onClick={() => navigate(to)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors group
                ${c === "emerald" ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40" :
                  c === "sky"     ? "bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-500/40" :
                                    "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40"}`}>
              <div className="flex items-center gap-2.5">
                <Icon size={14} className={c === "emerald" ? "text-emerald-400" : c === "sky" ? "text-sky-400" : "text-amber-400"} />
                <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
              </div>
              <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
