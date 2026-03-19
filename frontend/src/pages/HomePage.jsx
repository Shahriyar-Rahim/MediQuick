import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import WelcomeBanner from "../components/WelcomeBanner";
import PrescriptionScanner from "../components/PrescriptionScanner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";
import HomeAnalytics from "../components/HomeAnalytics";
import FeedbackSection from "../components/FeedbackSection";

import {
  Locate,
  TrendingUp,
  AlertTriangle,
  Trophy,
  BadgeCheck,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Pill,
  Store,
  ArrowUpDown,
} from "lucide-react";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:#10b981;border:2px solid #fff;transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(16,185,129,.45)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

const LocateControl = ({ trigger, pos }) => {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;
    map.flyTo(pos, 15, { animate: true, duration: 1 });
  }, [trigger]);
  return null;
};

const Skeleton = ({ rows = 4 }) => (
  <div className="space-y-2 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-10 bg-slate-800 rounded-lg" />
    ))}
  </div>
);

const Section = ({ icon: Icon, title, accent = "emerald", children }) => {
  const ring = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    rose: "text-rose-400 bg-rose-400/10",
    amber: "text-amber-400 bg-amber-400/10",
    sky: "text-sky-400 bg-sky-400/10",
  }[accent];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${ring}`}
        >
          <Icon size={14} />
        </div>
        <h2 className="text-slate-100 font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const [userPos, setUserPos] = useState([23.8103, 90.4125]);
  const [locateTrig, setLocateTrig] = useState(0);
  const [shops, setShops] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [topShops, setTopShops] = useState([]);
  const [priceRows, setPriceRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    api
      .get(`/shops/nearby?lat=${userPos[0]}&lng=${userPos[1]}&radius=8000`)
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]));
  }, [userPos]);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [trendRes, topRes, entryRes] = await Promise.allSettled([
          api.get("/entries/trending"),
          api.get("/admin/dashboard/top-shops"),
          api.get("/entries?limit=8"),
        ]);
        if (trendRes.status === "fulfilled")
          setTrending(trendRes.value.data.data || []);
        if (topRes.status === "fulfilled")
          setTopShops(topRes.value.data.data || []);
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

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setUserPos([coords.latitude, coords.longitude]);
        setLocateTrig((v) => v + 1);
      },
      () => setLocateTrig((v) => v + 1),
    );
  };

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Welcome banner */}
      <WelcomeBanner />
      <PrescriptionScanner />

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="relative h-[380px] border-b border-slate-800">
        <MapContainer
          center={userPos}
          zoom={13}
          className="h-full w-full"
          zoomControl
        >
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
                    <p className="font-semibold text-slate-800 text-sm">
                      {shop.name}
                    </p>
                    {shop.address && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        {shop.address}
                      </p>
                    )}
                    <div className="text-amber-500 text-xs mt-1">
                      ★★★★★ <span className="text-slate-400">crowd rating</span>
                    </div>
                    <button
                      onClick={() => navigate(`/shops/${shop._id}`)}
                      className="mt-2 w-full py-1.5 bg-emerald-500 hover:bg-emerald-400
                                 text-white text-xs font-semibold rounded-lg transition-colors"
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
          className="absolute bottom-4 right-4 z-1000 flex items-center gap-2 px-4 py-2.5
                     bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold
                     rounded-xl shadow-lg shadow-emerald-500/25 transition-colors"
        >
          <Locate size={14} /> Locate Me
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Trending | Stock Alerts | Top Shops */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Section
            icon={TrendingUp}
            title="Trending Medicines (Today)"
            accent="emerald"
          >
            {loadingData ? (
              <Skeleton />
            ) : trending.length === 0 ? (
              <p className="text-slate-600 text-sm">No activity today yet</p>
            ) : (
              <ul className="space-y-1">
                {trending.slice(0, 5).map((item, i) => (
                  <li key={item.medicine?._id || i}>
                    <button
                      onClick={() =>
                        navigate(`/medicines/${item.medicine?._id}`)
                      }
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                                 hover:bg-slate-800 transition-colors text-left group"
                    >
                      <span className="text-slate-600 text-xs w-4 shrink-0 font-bold">
                        {i + 1}
                      </span>
                      <Pill size={13} className="text-emerald-400 shrink-0" />
                      <span
                        className="text-slate-300 text-sm capitalize group-hover:text-white
                                       transition-colors flex-1 truncate"
                      >
                        {item.medicine?.genericName || "—"}
                      </span>
                      <ChevronRight
                        size={13}
                        className="text-slate-700 group-hover:text-slate-500 shrink-0"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            icon={AlertTriangle}
            title="Stock Alerts (Running Low)"
            accent="rose"
          >
            {loadingData ? (
              <Skeleton />
            ) : stockAlerts.length === 0 ? (
              <p className="text-slate-600 text-sm">No alerts right now</p>
            ) : (
              <ul className="space-y-2">
                {stockAlerts.slice(0, 4).map((item, i) => (
                  <li
                    key={item._id || i}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg
                               bg-rose-950/20 border border-rose-900/30"
                  >
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

          <Section icon={Trophy} title="Top Contributing Shops" accent="amber">
            {loadingData ? (
              <Skeleton />
            ) : topShops.length === 0 ? (
              <p className="text-slate-600 text-sm">No data yet</p>
            ) : (
              <ul className="space-y-1">
                {topShops.slice(0, 4).map((item, i) => (
                  <li key={item.shop?._id || i}>
                    <button
                      onClick={() => navigate(`/shops/${item.shop?._id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                 hover:bg-slate-800 transition-colors text-left group"
                    >
                      <span className="text-base shrink-0">
                        {i === 0
                          ? "🥇"
                          : i === 1
                            ? "🥈"
                            : i === 2
                              ? "🥉"
                              : `#${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate group-hover:text-white">
                          {item.shop?.name || "—"}
                        </p>
                        <div className="flex items-center gap-1">
                          <BadgeCheck
                            size={10}
                            className="text-emerald-400 shrink-0"
                          />
                          <p className="text-slate-500 text-xs">
                            {item.entryCount} medicines listed
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Price Comparison | Price Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section
            icon={ArrowUpDown}
            title="Price Comparison & Crowdsourcing"
            accent="sky"
          >
            {loadingData ? (
              <Skeleton rows={3} />
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Medicine", "Shop", "Price"].map((h) => (
                        <th
                          key={h}
                          className={`text-slate-500 text-xs font-medium pb-2
                          ${h === "Price" ? "text-right" : "text-left"} pr-3 last:pr-0`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {priceRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 text-center text-slate-600 text-xs"
                        >
                          No data yet
                        </td>
                      </tr>
                    ) : (
                      priceRows.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 pr-3">
                            <button
                              onClick={() =>
                                navigate(`/medicines/${item.medicine?._id}`)
                              }
                              className="text-slate-300 hover:text-emerald-400 capitalize
                                       transition-colors font-medium text-xs"
                            >
                              {item.medicine?.genericName ||
                                item.brandName ||
                                "—"}
                            </button>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 text-xs">
                            {item.shop?.name || "—"}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="text-emerald-400 font-semibold text-xs">
                              {item.price?.toFixed(2)}
                            </span>
                            <span className="text-slate-600 text-xs ml-1">
                              BDT
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section
            icon={BadgeCheck}
            title="Price Verification"
            accent="emerald"
          >
            {loadingData ? (
              <Skeleton rows={3} />
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Medicine", "Shop", "Price", "Community Vote"].map(
                        (h) => (
                          <th
                            key={h}
                            className={`text-slate-500 text-xs font-medium pb-2
                          ${h === "Price" || h === "Community Vote" ? "text-right" : "text-left"}
                          pr-3 last:pr-0`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {priceRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-4 text-center text-slate-600 text-xs"
                        >
                          No data yet
                        </td>
                      </tr>
                    ) : (
                      priceRows.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 pr-3 text-slate-300 capitalize text-xs font-medium">
                            {item.medicine?.genericName ||
                              item.brandName ||
                              "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 text-xs">
                            {item.shop?.name || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-right text-xs">
                            <span className="text-slate-300 font-medium">
                              {item.price?.toFixed(2)}
                            </span>
                            <span className="text-slate-600 ml-1">BDT</span>
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                <ThumbsUp size={10} />{" "}
                                {item.priceVotes?.correct ?? 0}
                              </span>
                              <span className="text-slate-700 text-xs">/</span>
                              <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                                <ThumbsDown size={10} />{" "}
                                {item.priceVotes?.incorrect ?? 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Pill,
              label: "Browse All Medicines",
              to: "/medicines",
              c: "emerald",
            },
            { icon: Store, label: "View All Shops", to: "/shops", c: "sky" },
            {
              icon: TrendingUp,
              label: "Add Medicine / Shop",
              to: "/add",
              c: "amber",
            },
          ].map(({ icon: Icon, label, to, c }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl border
                          transition-colors group
                ${
                  c === "emerald"
                    ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                    : c === "sky"
                      ? "bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-500/40"
                      : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  size={14}
                  className={
                    c === "emerald"
                      ? "text-emerald-400"
                      : c === "sky"
                        ? "text-sky-400"
                        : "text-amber-400"
                  }
                />
                <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">
                  {label}
                </span>
              </div>
              <ChevronRight
                size={13}
                className="text-slate-600 group-hover:text-slate-400 transition-colors"
              />
            </button>
          ))}
        </div>

        {/* Analytics */}
        <div className="border-t border-slate-800 pt-6">
          <HomeAnalytics />
        </div>

        {/* Feedback + About */}
        <div className="border-t border-slate-800 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <FeedbackSection />

            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-slate-100 font-semibold text-sm mb-3">
                  About Medi-Quick
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Medi-Quick is a community-powered medicine availability
                  tracker. Anyone can add medicines, shops, and prices — no
                  account needed. Admins review and moderate to keep data
                  accurate.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-slate-100 font-semibold text-sm mb-4">
                  How it works
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      text: "Search for a medicine by generic or brand name",
                    },
                    {
                      step: "2",
                      text: "See which shops carry it and compare prices",
                    },
                    {
                      step: "3",
                      text: "Vote on price accuracy to help the community",
                    },
                    {
                      step: "4",
                      text: "Add missing medicines or shops to help others",
                    },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20
                                      flex items-center justify-center shrink-0 mt-0.5"
                      >
                        <span className="text-emerald-400 text-xs font-bold">
                          {step}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
