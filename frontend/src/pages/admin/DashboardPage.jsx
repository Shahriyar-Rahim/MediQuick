import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  Pill, Store, FileText, BarChart3, ShieldAlert,
  TrendingUp, Activity, RefreshCw, ChevronRight,
  AlertTriangle, BadgeCheck, ThumbsDown, PackageX,
  Users, LogOut, Star, Shield, Loader2, Trash2,
} from "lucide-react";

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = "emerald" }) => {
  const colors = {
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", val: "text-emerald-400" },
    rose:    { bg: "bg-rose-500/10",    icon: "text-rose-400",    val: "text-rose-400"    },
    amber:   { bg: "bg-amber-500/10",   icon: "text-amber-400",   val: "text-amber-400"   },
    sky:     { bg: "bg-sky-500/10",     icon: "text-sky-400",     val: "text-sky-400"     },
    slate:   { bg: "bg-slate-700/50",   icon: "text-slate-400",   val: "text-slate-300"   },
  }[color];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon size={16} className={colors.icon} />
        </div>
        {sub !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            color === "rose" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-500"
          }`}>
            {sub}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold mt-3 ${colors.val}`}>{value ?? "—"}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  );
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, accent = "emerald", action, children, loading }) => {
  const ring = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    rose:    "text-rose-400 bg-rose-400/10",
    amber:   "text-amber-400 bg-amber-400/10",
    sky:     "text-sky-400 bg-sky-400/10",
  }[accent];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ring}`}>
            <Icon size={14} />
          </div>
          <h2 className="text-slate-100 font-semibold text-sm">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg" />)}
          </div>
        ) : children}
      </div>
    </div>
  );
};

// ── Block button ──────────────────────────────────────────────────────────────
const BlockBtn = ({ route, label = "Block", onDone }) => {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await api.patch(route);
      toast.success("Done");
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={handle} disabled={busy}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50
                 border border-rose-800/50 text-rose-400 text-xs rounded-lg transition-colors disabled:opacity-50">
      {busy ? <Loader2 size={10} className="animate-spin" /> : null}
      {label}
    </button>
  );
};

const DeleteBtn = ({ route, label = "Delete", onDone }) => {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (!confirm(`Are you sure you want to delete this ${label.toLowerCase()}?`)) return;
    setBusy(true);
    try {
      await api.delete(route);
      toast.success("Deleted");
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handle} disabled={busy}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50
                 border border-rose-800/50 text-rose-400 text-xs rounded-lg transition-colors disabled:opacity-50">
      {busy ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
      Delete
    </button>
  );
};

// ── Medicines admin list ──────────────────────────────────────────────────────
const MedicinesAdminList = ({ onRefresh, navigate }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  const fetchMeds = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/medicines/admin/all?page=${p}&limit=10`);
      setMedicines(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeds(); }, []);

  if (loading) return (
    <div className="space-y-2 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg" />)}
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-slate-600 text-xs mb-3">{total} total medicines</p>
      {medicines.map((med) => (
        <div key={med._id}
          className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-800/40 rounded-xl flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Pill size={12} className="text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-slate-200 text-sm font-medium capitalize truncate">{med.genericName}</p>
              <p className="text-slate-600 text-xs capitalize">{med.category}</p>
            </div>
            {med.isBlocked && (
              <span className="text-xs text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full shrink-0">blocked</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => navigate(`/medicines/${med._id}`)}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600
                         text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
              View
            </button>
            <BlockBtn
              route={`/medicines/${med._id}/block`}
              label={med.isBlocked ? "Unblock" : "Block"}
              onDone={() => fetchMeds(page)}
            />
            <DeleteBtn
              route={`/medicines/${med._id}`}
              label="medicine"
              onDone={() => { fetchMeds(page); onRefresh(); }}
            />
          </div>
        </div>
      ))}
      {total > 10 && (
        <div className="flex items-center justify-between pt-2">
          <button disabled={page === 1}
            onClick={() => { setPage(page - 1); fetchMeds(page - 1); }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400
                       hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Prev
          </button>
          <span className="text-slate-600 text-xs">Page {page}</span>
          <button disabled={page * 10 >= total}
            onClick={() => { setPage(page + 1); fetchMeds(page + 1); }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400
                       hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ── Shops admin list ──────────────────────────────────────────────────────────
const ShopsAdminList = ({ onRefresh, navigate }) => {
  const [shops,   setShops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  const fetchShops = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/shops/admin/all?page=${p}&limit=10`);
      setShops(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, []);

  if (loading) return (
    <div className="space-y-2 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg" />)}
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-slate-600 text-xs mb-3">{total} total shops</p>
      {shops.map((shop) => (
        <div key={shop._id}
          className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-800/40 rounded-xl flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Store size={12} className="text-sky-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-slate-200 text-sm font-medium truncate">{shop.name}</p>
              {shop.address && <p className="text-slate-600 text-xs truncate">{shop.address}</p>}
            </div>
            {shop.isBlocked && (
              <span className="text-xs text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full shrink-0">blocked</span>
            )}
            {shop.isSuspected && !shop.isBlocked && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">suspected</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => navigate(`/shops/${shop._id}`)}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600
                         text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
              View
            </button>
            <BlockBtn
              route={`/shops/${shop._id}/block`}
              label={shop.isBlocked ? "Unblock" : "Block"}
              onDone={() => fetchShops(page)}
            />
            <DeleteBtn
              route={`/shops/${shop._id}`}
              label="shop"
              onDone={() => { fetchShops(page); onRefresh(); }}
            />
          </div>
        </div>
      ))}
      {total > 10 && (
        <div className="flex items-center justify-between pt-2">
          <button disabled={page === 1}
            onClick={() => { setPage(page - 1); fetchShops(page - 1); }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400
                       hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Prev
          </button>
          <span className="text-slate-600 text-xs">Page {page}</span>
          <button disabled={page * 10 >= total}
            onClick={() => { setPage(page + 1); fetchShops(page + 1); }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400
                       hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ── DashboardPage ─────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [fraud,      setFraud]      = useState([]);
  const [disputes,   setDisputes]   = useState([]);
  const [gap,        setGap]        = useState(null);
  const [topShops,   setTopShops]   = useState([]);
  const [trending,   setTrending]   = useState([]);
  const [activity,   setActivity]   = useState(null);
  const [loadingAll, setLoadingAll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoadingAll(true);
    else setRefreshing(true);
    try {
      const [statsRes, fraudRes, dispRes, gapRes, topRes, trendRes, actRes] =
        await Promise.allSettled([
          api.get("/admin/dashboard"),
          api.get("/admin/dashboard/fraud-shops?limit=5"),
          api.get("/admin/dashboard/price-disputes?limit=5"),
          api.get("/admin/dashboard/gap-analysis"),
          api.get("/admin/dashboard/top-shops"),
          api.get("/admin/dashboard/trending"),
          api.get("/admin/dashboard/activity?limit=5"),
        ]);
      if (statsRes.status  === "fulfilled") setStats(statsRes.value.data.data);
      if (fraudRes.status  === "fulfilled") setFraud(fraudRes.value.data.data || []);
      if (dispRes.status   === "fulfilled") setDisputes(dispRes.value.data.data || []);
      if (gapRes.status    === "fulfilled") setGap(gapRes.value.data);
      if (topRes.status    === "fulfilled") setTopShops(topRes.value.data.data || []);
      if (trendRes.status  === "fulfilled") setTrending(trendRes.value.data.data || []);
      if (actRes.status    === "fulfilled") setActivity(actRes.value.data.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoadingAll(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="bg-slate-950 min-h-screen">

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white font-bold text-lg">Admin Dashboard</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {admin?.role === "superadmin"
                ? <Star size={11} className="text-yellow-400" fill="currentColor" />
                : <Shield size={11} className="text-emerald-400" />}
              <span className="text-slate-500 text-xs capitalize">{admin?.name} · {admin?.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchAll(true)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                         border border-slate-700 text-slate-400 hover:text-white text-sm rounded-lg transition-colors">
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button onClick={() => navigate("/admin/accounts")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                         border border-slate-700 text-slate-400 hover:text-white text-sm rounded-lg transition-colors">
              <Users size={13} /> Accounts
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50
                         border border-rose-800/50 text-rose-400 text-sm rounded-lg transition-colors">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Stat grid ─────────────────────────────────────────────────── */}
        {loadingAll ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <StatCard icon={Pill}       label="Total Medicines"  value={stats.medicines.total}        sub={`${stats.medicines.blocked} blocked`}  color="emerald" />
              <StatCard icon={Store}      label="Total Shops"      value={stats.shops.total}             sub={`${stats.shops.blocked} blocked`}      color="sky"     />
              <StatCard icon={FileText}   label="Medicine Entries" value={stats.entries.total}           sub={`today +${stats.entries.addedToday}`}  color="amber"   />
              <StatCard icon={ShieldAlert}label="Suspected Fraud"  value={stats.shops.suspectedFraud}   color="rose"    />
              <StatCard icon={Users}      label="Admin Accounts"   value={stats.admins.total}            color="slate"   />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Pill}   label="Active Medicines"  value={stats.medicines.active}        color="emerald" />
              <StatCard icon={Store}  label="Active Shops"      value={stats.shops.active}            color="sky"     />
              <StatCard icon={FileText} label="This Week Entries" value={stats.entries.addedThisWeek} color="amber"   />
              <StatCard icon={BarChart3} label="Total Votes"     value={stats.votes.total}            color="slate"   />
            </div>
          </>
        )}

        {/* ── Row: fraud + disputes ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Fraud shops */}
          <Section icon={ShieldAlert} title="Suspected Fraud Shops" accent="rose"
            loading={loadingAll}
            action={
              <span className="text-xs text-slate-600">
                Threshold: {parseInt(import.meta.env.VITE_FRAUD_THRESHOLD || "10")} votes
              </span>
            }>
            {fraud.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">No suspected fraud shops</p>
            ) : (
              <div className="space-y-2">
                {fraud.map((shop) => (
                  <div key={shop._id}
                    className="flex items-center justify-between gap-3 p-3 bg-rose-950/10
                               border border-rose-900/20 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{shop.name}</p>
                      <p className="text-rose-400 text-xs mt-0.5">
                        {shop.fraudVotes.fraud} fraud votes · {shop.fraudPercent}% suspect
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => navigate(`/shops/${shop._id}`)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
                                   text-slate-400 text-xs rounded-lg transition-colors">
                        View
                      </button>
                      <BlockBtn route={`/shops/${shop._id}/block`} onDone={() => fetchAll(true)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Price disputes */}
          <Section icon={ThumbsDown} title="Price Disputes" accent="amber"
            loading={loadingAll}>
            {disputes.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">No price disputes flagged</p>
            ) : (
              <div className="space-y-2">
                {disputes.map((entry) => (
                  <div key={entry._id}
                    className="flex items-center justify-between gap-3 p-3 bg-amber-950/10
                               border border-amber-900/20 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-medium capitalize truncate">
                        {entry.medicine?.genericName || "—"}
                      </p>
                      <p className="text-slate-500 text-xs">{entry.shop?.name} · ৳{entry.price}</p>
                      <p className="text-amber-400 text-xs mt-0.5">
                        {entry.priceVotes.incorrect} incorrect votes · {entry.incorrectPercent}% dispute
                      </p>
                    </div>
                    <BlockBtn route={`/entries/${entry._id}/block`} onDone={() => fetchAll(true)} />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Row: gap analysis + top shops ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Gap analysis */}
          <Section icon={PackageX} title="Gap Analysis — Rare Medicines" accent="rose"
            loading={loadingAll}
            action={gap && (
              <span className="text-xs text-slate-600">
                {gap.summary?.notAvailableAnywhere} unavailable
              </span>
            )}>
            {!gap ? (
              <p className="text-slate-600 text-sm text-center py-4">No data</p>
            ) : (
              <>
                {/* Summary pills */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {[
                    { label: "Unavailable", val: gap.summary.notAvailableAnywhere, c: "rose" },
                    { label: "Scarce",      val: gap.summary.scarce,               c: "amber" },
                    { label: "Available",   val: gap.summary.wellAvailable,         c: "emerald" },
                  ].map(({ label, val, c }) => (
                    <div key={label}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium
                        ${c === "rose"    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"    :
                          c === "amber"   ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                      {val} {label}
                    </div>
                  ))}
                </div>

                {/* Rare list */}
                {gap.data.rare.length === 0 ? (
                  <p className="text-slate-600 text-sm">All medicines have at least one shop</p>
                ) : (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {gap.data.rare.slice(0, 10).map((item) => (
                      <li key={item.medicine._id}
                        className="flex items-center justify-between gap-2 px-3 py-2
                                   bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle size={11} className="text-rose-400 shrink-0" />
                          <span className="text-slate-300 text-xs capitalize truncate">
                            {item.medicine.genericName}
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 shrink-0">0 shops</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Section>

          {/* Top shops */}
          <Section icon={BadgeCheck} title="Top Contributing Shops" accent="amber"
            loading={loadingAll}>
            {topShops.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {topShops.slice(0, 6).map((item, i) => (
                  <div key={item.shop?._id || i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <span className="text-base shrink-0 w-6 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{item.shop?.name}</p>
                      <p className="text-slate-500 text-xs">{item.entryCount} medicines listed</p>
                    </div>
                    <button onClick={() => navigate(`/shops/${item.shop?._id}`)}
                      className="text-slate-600 hover:text-emerald-400 transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Row: trending + activity ───────────────────────────────────── */}
        {/* ── Row: trending + activity ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Trending today */}
          <Section icon={TrendingUp} title="Trending Medicines Today" accent="emerald"
            loading={loadingAll}>
            {trending.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">No trending data today</p>
            ) : (
              <div className="space-y-2">
                {trending.map((item, i) => (
                  <div key={item.medicine?._id || i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <span className="text-slate-600 text-xs font-bold w-4 shrink-0">{i + 1}</span>
                    <Pill size={13} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm capitalize truncate">{item.medicine?.genericName}</p>
                      <p className="text-slate-600 text-xs">avg ৳{item.avgPrice} · {item.updateCount} updates</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recent activity feed */}
          <Section icon={Activity} title="Recent Activity" accent="sky"
            loading={loadingAll}>
            {!activity ? (
              <p className="text-slate-600 text-sm text-center py-4">No activity data</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {[
                  ...(activity.recentMedicines || []).map((m) => ({
                    type: "medicine", name: m.genericName,
                    label: m.addedBy === "admin" ? "by admin" : "by community",
                    blocked: m.isBlocked, time: m.createdAt,
                  })),
                  ...(activity.recentShops || []).map((s) => ({
                    type: "shop", name: s.name,
                    label: s.addedBy === "admin" ? "by admin" : "by community",
                    blocked: s.isBlocked, time: s.createdAt,
                  })),
                ]
                  .sort((a, b) => new Date(b.time) - new Date(a.time))
                  .slice(0, 10)
                  .map((item, i) => (
                    <div key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/40">
                      {item.type === "medicine"
                        ? <Pill size={12} className="text-emerald-400 shrink-0" />
                        : <Store size={12} className="text-sky-400 shrink-0" />}
                      <span className="text-slate-300 text-xs capitalize truncate flex-1">{item.name}</span>
                      <span className="text-slate-600 text-xs shrink-0">{item.label}</span>
                      {item.blocked && (
                        <span className="text-rose-400 text-xs shrink-0">blocked</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Medicines management ──────────────────────────────────────── */}
        <Section icon={Pill} title="Medicines Management" accent="emerald"
          action={
            <button onClick={() => navigate("/medicines")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </button>
          }>
          <MedicinesAdminList onRefresh={() => fetchAll(true)} navigate={navigate} />
        </Section>

        {/* ── Shops management ──────────────────────────────────────────── */}
        <Section icon={Store} title="Shops Management" accent="sky"
          action={
            <button onClick={() => navigate("/shops")}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
              View all →
            </button>
          }>
          <ShopsAdminList onRefresh={() => fetchAll(true)} navigate={navigate} />
        </Section>
      </div>
    </div>
  );
};

export default DashboardPage;
