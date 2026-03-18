import { useState, useEffect } from "react";
import api from "../api/axios";
import DataExport from "./DataExport";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import {
  TrendingUp, BarChart3, PieChart as PieIcon,
  Calendar, RefreshCw, Pill, Store, FileText, ThumbsUp,
} from "lucide-react";

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

const CATEGORY_COLORS = {
  antibiotic:       "#ef4444",
  antifungal:       "#8b5cf6",
  antiviral:        "#f97316",
  analgesic:        "#3b82f6",
  antacid:          "#f59e0b",
  antidiabetic:     "#ec4899",
  antihypertensive: "#06b6d4",
  antihistamine:    "#14b8a6",
  vitamin:          "#10b981",
  supplement:       "#84cc16",
  other:            "#64748b",
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 shadow-xl">
      {label && <p className="text-slate-400 text-xs mb-1 capitalize">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Period toggle ─────────────────────────────────────────────────────────────
const PeriodToggle = ({ value, onChange }) => (
  <div className="flex items-center gap-1 p-1 bg-slate-800 border border-slate-700 rounded-lg">
    {["weekly", "monthly"].map((p) => (
      <button key={p} onClick={() => onChange(p)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
          ${value === p
            ? "bg-emerald-500 text-white"
            : "text-slate-400 hover:text-white"}`}>
        <Calendar size={11} />
        {p}
      </button>
    ))}
  </div>
);

// ── Chart card wrapper ────────────────────────────────────────────────────────
const ChartCard = ({ icon: Icon, title, accent = "emerald", children, className = "" }) => {
  const ring = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    sky:     "text-sky-400 bg-sky-400/10",
    amber:   "text-amber-400 bg-amber-400/10",
    rose:    "text-rose-400 bg-rose-400/10",
  }[accent];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ring}`}>
          <Icon size={14} />
        </div>
        <h3 className="text-slate-100 font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
};

// ── Build date buckets ────────────────────────────────────────────────────────
const buildDateLabels = (period) => {
  const now = new Date();
  if (period === "weekly") {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return { label: days[d.getDay()], date: d };
    });
  } else {
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (21 - i * 7));
      return { label: `Wk ${i + 1}`, date: d };
    });
  }
};

const bucketByDate = (items, period, dateField = "createdAt") => {
  const labels = buildDateLabels(period);
  const now = new Date();

  return labels.map(({ label, date }) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);

    if (period === "weekly") {
      end.setHours(23, 59, 59, 999);
    } else {
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    const count = items.filter((item) => {
      const d = new Date(item[dateField]);
      return d >= start && d <= end;
    }).length;

    return { label, count };
  });
};

// ── Main analytics component ──────────────────────────────────────────────────
const HomeAnalytics = () => {
  const [period,    setPeriod]    = useState("weekly");
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  // Raw data
  const [medicines, setMedicines] = useState([]);
  const [shops,     setShops]     = useState([]);
  const [entries,   setEntries]   = useState([]);
  const [votes,     setVotes]     = useState([]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [medRes, shopRes, entryRes] = await Promise.allSettled([
        api.get("/medicines?limit=200"),
        api.get("/shops?limit=200"),
        api.get("/entries?limit=200"),
      ]);
      if (medRes.status   === "fulfilled") setMedicines(medRes.value.data.data   || []);
      if (shopRes.status  === "fulfilled") setShops(shopRes.value.data.data      || []);
      if (entryRes.status === "fulfilled") setEntries(entryRes.value.data.data   || []);
    } catch {
      // silent fail — charts just show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Derived chart data ──────────────────────────────────────────────────────

  // 1. Medicines added over time (bar)
  const medicinesOverTime = bucketByDate(medicines, period);

  // 2. Shops added over time (bar)
  const shopsOverTime = bucketByDate(shops, period);

  // 3. Entries added over time (line)
  const entriesOverTime = bucketByDate(entries, period);

  // 4. Category distribution (donut)
  const categoryData = Object.entries(
    medicines.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // 5. Price accuracy (donut) — from entries' vote data
  const totalCorrect   = entries.reduce((s, e) => s + (e.priceVotes?.correct   || 0), 0);
  const totalIncorrect = entries.reduce((s, e) => s + (e.priceVotes?.incorrect || 0), 0);
  const priceAccuracyData = totalCorrect + totalIncorrect > 0
    ? [
        { name: "Accurate",   value: totalCorrect   },
        { name: "Disputed",   value: totalIncorrect },
      ]
    : [];

  // 6. Stock availability (donut)
  const inStock    = entries.filter((e) => e.isAvailable).length;
  const outOfStock = entries.filter((e) => !e.isAvailable).length;
  const stockData  = inStock + outOfStock > 0
    ? [
        { name: "In Stock",    value: inStock    },
        { name: "Out of Stock",value: outOfStock },
      ]
    : [];

  // 7. Combined activity line (medicines + shops + entries)
  const activityData = buildDateLabels(period).map(({ label }, i) => ({
    label,
    medicines: medicinesOverTime[i]?.count || 0,
    shops:     shopsOverTime[i]?.count     || 0,
    entries:   entriesOverTime[i]?.count   || 0,
  }));

  // ── Summary stats ───────────────────────────────────────────────────────────
  const periodStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - (period === "weekly" ? 7 : 28));
    return d;
  })();

  const newMedicines = medicines.filter((m) => new Date(m.createdAt) >= periodStart).length;
  const newShops     = shops.filter((s)     => new Date(s.createdAt) >= periodStart).length;
  const newEntries   = entries.filter((e)   => new Date(e.createdAt) >= periodStart).length;
  const totalVotes   = totalCorrect + totalIncorrect;

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <BarChart3 size={14} className="text-emerald-400" />
          </div>
          <h2 className="text-slate-100 font-bold text-base">Analytics Report</h2>
        </div>
        <div className="flex items-center gap-2">
          <PeriodToggle value={period} onChange={setPeriod} />
          <DataExport /> 
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700
                       text-slate-400 hover:text-white rounded-lg transition-colors">
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary mini-stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Pill,     label: `New Medicines`,  value: newMedicines, color: "emerald" },
          { icon: Store,    label: `New Shops`,       value: newShops,     color: "sky"     },
          { icon: FileText, label: `New Entries`,     value: newEntries,   color: "amber"   },
          { icon: ThumbsUp, label: `Total Votes`,     value: totalVotes,   color: "rose"    },
        ].map(({ icon: Icon, label, value, color }) => {
          const c = {
            emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
            sky:     { bg: "bg-sky-500/10",     text: "text-sky-400"     },
            amber:   { bg: "bg-amber-500/10",   text: "text-amber-400"   },
            rose:    { bg: "bg-rose-500/10",     text: "text-rose-400"    },
          }[color];
          return (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <Icon size={14} className={c.text} />
              </div>
              <p className={`text-xl font-bold ${c.text}`}>{value}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {label} <span className="text-slate-700">({period})</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Row 1: Activity line + Category donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Combined activity line chart */}
        <ChartCard icon={TrendingUp} title="Platform Activity" accent="emerald">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "8px" }} />
              <Line type="monotone" dataKey="medicines" name="Medicines" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
              <Line type="monotone" dataKey="shops"     name="Shops"     stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
              <Line type="monotone" dataKey="entries"   name="Entries"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category donut */}
        <ChartCard icon={PieIcon} title="Medicine Categories" accent="sky">
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-600 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "capitalize" }}>{value}</span>}
                  wrapperStyle={{ paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Medicines bar + Entries bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Medicines added bar */}
        <ChartCard icon={Pill} title="Medicines Added" accent="emerald">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={medicinesOverTime} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
              <Bar dataKey="count" name="Medicines" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Entries added bar */}
        <ChartCard icon={FileText} title="Entries Added" accent="amber">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={entriesOverTime} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.05)" }} />
              <Bar dataKey="count" name="Entries" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Price accuracy donut + Stock availability donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Price accuracy */}
        <ChartCard icon={ThumbsUp} title="Price Vote Accuracy" accent="rose">
          {priceAccuracyData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-slate-600 text-sm">No votes yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={priceAccuracyData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-400 text-xs">Accurate</span>
                  </div>
                  <p className="text-white font-bold text-lg">{totalCorrect}</p>
                  <p className="text-slate-600 text-xs">
                    {totalVotes > 0 ? Math.round((totalCorrect / totalVotes) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-slate-400 text-xs">Disputed</span>
                  </div>
                  <p className="text-white font-bold text-lg">{totalIncorrect}</p>
                  <p className="text-slate-600 text-xs">
                    {totalVotes > 0 ? Math.round((totalIncorrect / totalVotes) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        {/* Stock availability */}
        <ChartCard icon={Store} title="Stock Availability" accent="sky">
          {stockData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-slate-600 text-sm">No entries yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={stockData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-400 text-xs">In Stock</span>
                  </div>
                  <p className="text-white font-bold text-lg">{inStock}</p>
                  <p className="text-slate-600 text-xs">
                    {inStock + outOfStock > 0 ? Math.round((inStock / (inStock + outOfStock)) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-slate-400 text-xs">Out of Stock</span>
                  </div>
                  <p className="text-white font-bold text-lg">{outOfStock}</p>
                  <p className="text-slate-600 text-xs">
                    {inStock + outOfStock > 0 ? Math.round((outOfStock / (inStock + outOfStock)) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Shops added bar — full width */}
      <ChartCard icon={Store} title="Shops Added" accent="sky">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={shopsOverTime} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
            <Bar dataKey="count" name="Shops" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
};

export default HomeAnalytics;
