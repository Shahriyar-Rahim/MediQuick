import { useState } from "react";
import api from "../api/axios";
import {
  Download,
  FileText,
  FileJson,
  Table2,
  Pill,
  Store,
  Layers,
  Calendar,
  ChevronDown,
  Loader2,
  CheckCircle,
  FileDown,
  X,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPeriodStart = (period) => {
  const d = new Date();
  d.setDate(d.getDate() - (period === "weekly" ? 7 : 28));
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ── CSV builder ───────────────────────────────────────────────────────────────
const buildMedicineCSV = (medicines, entries) => {
  const headers = [
    "Generic Name",
    "Brand Names",
    "Category",
    "Description",
    "Total Shops",
    "Lowest Price (BDT)",
    "Highest Price (BDT)",
    "Avg Price (BDT)",
    "In Stock Shops",
    "Added By",
    "Added On",
  ];

  const rows = medicines.map((med) => {
    const medEntries = entries.filter(
      (e) => e.medicine?._id === med._id || e.medicine === med._id,
    );
    const prices = medEntries.map((e) => e.price).filter(Boolean);
    const inStock = medEntries.filter((e) => e.isAvailable).length;

    return [
      med.genericName || "—",
      (med.brandNames || []).join("; ") || "—",
      med.category || "—",
      (med.description || "—").replace(/,/g, ";"),
      medEntries.length,
      prices.length ? Math.min(...prices).toFixed(2) : "—",
      prices.length ? Math.max(...prices).toFixed(2) : "—",
      prices.length
        ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
        : "—",
      inStock,
      med.addedBy || "user",
      formatDate(med.createdAt),
    ];
  });

  return [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
};

const buildShopCSV = (shops, entries) => {
  const headers = [
    "Shop Name",
    "Address",
    "Contact",
    "Latitude",
    "Longitude",
    "Total Medicines",
    "In Stock Medicines",
    "Fraud Votes",
    "Legit Votes",
    "Added By",
    "Added On",
    "Status",
  ];

  const rows = shops.map((shop) => {
    const shopEntries = entries.filter(
      (e) => e.shop?._id === shop._id || e.shop === shop._id,
    );
    const inStock = shopEntries.filter((e) => e.isAvailable).length;
    const [lng, lat] = shop.location?.coordinates || [0, 0];

    return [
      shop.name || "—",
      shop.address || "—",
      shop.contact || "—",
      lat.toFixed(6),
      lng.toFixed(6),
      shopEntries.length,
      inStock,
      shop.fraudVotes?.fraud || 0,
      shop.fraudVotes?.legit || 0,
      shop.addedBy || "user",
      formatDate(shop.createdAt),
      shop.isBlocked ? "Blocked" : "Active",
    ];
  });

  return [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
};

const buildCombinedCSV = (medicines, shops, entries) => {
  return (
    "=== MEDICINES ===\n" +
    buildMedicineCSV(medicines, entries) +
    "\n\n=== SHOPS ===\n" +
    buildShopCSV(shops, entries)
  );
};

// ── JSON builder ──────────────────────────────────────────────────────────────
const buildJSON = (medicines, shops, entries, filter) => {
  const enrichedMedicines = medicines.map((med) => {
    const medEntries = entries.filter(
      (e) => e.medicine?._id === med._id || e.medicine === med._id,
    );
    const prices = medEntries.map((e) => e.price).filter(Boolean);
    return {
      id: med._id,
      genericName: med.genericName,
      brandNames: med.brandNames || [],
      category: med.category,
      description: med.description || "",
      image: med.image?.url || null,
      addedBy: med.addedBy,
      addedOn: med.createdAt,
      availability: {
        totalShops: medEntries.length,
        inStockAt: medEntries.filter((e) => e.isAvailable).length,
        lowestPrice: prices.length ? Math.min(...prices) : null,
        highestPrice: prices.length ? Math.max(...prices) : null,
        avgPrice: prices.length
          ? parseFloat(
              (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
            )
          : null,
      },
    };
  });

  const enrichedShops = shops.map((shop) => {
    const shopEntries = entries.filter(
      (e) => e.shop?._id === shop._id || e.shop === shop._id,
    );
    const [lng, lat] = shop.location?.coordinates || [0, 0];
    return {
      id: shop._id,
      name: shop.name,
      address: shop.address || "",
      contact: shop.contact || "",
      coordinates: { lat, lng },
      medicinesListed: shopEntries.length,
      inStockMedicines: shopEntries.filter((e) => e.isAvailable).length,
      fraudVotes: shop.fraudVotes || { fraud: 0, legit: 0 },
      addedBy: shop.addedBy,
      addedOn: shop.createdAt,
      status: shop.isBlocked ? "blocked" : "active",
      inventory: shopEntries.map((e) => ({
        medicine: e.medicine?.genericName || e.medicine,
        brandName: e.brandName || null,
        price: e.price,
        isAvailable: e.isAvailable,
        priceVotes: e.priceVotes,
      })),
    };
  });

  const out = {};
  if (filter !== "shops") out.medicines = enrichedMedicines;
  if (filter !== "medicines") out.shops = enrichedShops;
  out.exportedAt = new Date().toISOString();
  out.totalEntries = entries.length;

  return JSON.stringify(out, null, 2);
};

// ── Plain-text report for download ────────────────────────────────────────────
const buildTextReport = (medicines, shops, entries, period, filter) => {
  const now = new Date().toLocaleString("en-BD");
  const periodLabel = period === "weekly" ? "Last 7 Days" : "Last 28 Days";
  const start = getPeriodStart(period);

  const newMeds = medicines.filter(
    (m) => new Date(m.createdAt) >= start,
  ).length;
  const newShops = shops.filter((s) => new Date(s.createdAt) >= start).length;
  const newEntries = entries.filter(
    (e) => new Date(e.createdAt) >= start,
  ).length;
  const inStock = entries.filter((e) => e.isAvailable).length;
  const totalVotes = entries.reduce(
    (s, e) => s + (e.priceVotes?.correct || 0) + (e.priceVotes?.incorrect || 0),
    0,
  );
  const fraudShops = shops.filter(
    (s) => (s.fraudVotes?.fraud || 0) >= 5,
  ).length;

  const catCount = medicines.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  let report = `MEDI-QUICK REPORT — ${periodLabel}\n`;
  report += `Generated: ${now}\n`;
  report += `${"=".repeat(50)}\n\n`;

  report += `SUMMARY\n${"-".repeat(30)}\n`;
  report += `Total Medicines:   ${medicines.length}  (${newMeds} new this period)\n`;
  report += `Total Shops:       ${shops.length}  (${newShops} new this period)\n`;
  report += `Total Entries:     ${entries.length}  (${newEntries} new this period)\n`;
  report += `In Stock:          ${inStock} / ${entries.length}\n`;
  report += `Total Votes:       ${totalVotes}\n`;
  report += `Suspected Fraud:   ${fraudShops} shops\n\n`;

  if (filter !== "shops") {
    report += `MEDICINE CATEGORIES\n${"-".repeat(30)}\n`;
    Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        report += `  ${cat.padEnd(20)} ${count}\n`;
      });
    report += "\n";

    report += `TOP 10 MEDICINES (by shop coverage)\n${"-".repeat(30)}\n`;
    const topMeds = medicines
      .map((m) => ({
        name: m.genericName,
        count: entries.filter(
          (e) => e.medicine?._id === m._id || e.medicine === m._id,
        ).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    topMeds.forEach((m, i) => {
      report += `  ${(i + 1).toString().padStart(2)}. ${m.name.padEnd(25)} ${m.count} shops\n`;
    });
    report += "\n";
  }

  if (filter !== "medicines") {
    report += `TOP 10 SHOPS (by medicines listed)\n${"-".repeat(30)}\n`;
    const topShops = shops
      .map((s) => ({
        name: s.name,
        count: entries.filter((e) => e.shop?._id === s._id || e.shop === s._id)
          .length,
        fraud: s.fraudVotes?.fraud || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    topShops.forEach((s, i) => {
      report += `  ${(i + 1).toString().padStart(2)}. ${s.name.padEnd(25)} ${s.count} medicines  ${s.fraud > 0 ? `(${s.fraud} fraud votes)` : ""}\n`;
    });
    report += "\n";
  }

  report += `${"=".repeat(50)}\n`;
  report += `Medi-Quick · Community Medicine Tracker\n`;

  return report;
};

// ── Downloader ────────────────────────────────────────────────────────────────
const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Main component ────────────────────────────────────────────────────────────
const DataExport = () => {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("weekly");
  const [filter, setFilter] = useState("both"); // medicines | shops | both
  const [format, setFormat] = useState("csv"); // csv | json | txt
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setDone(false);
    try {
      const start = getPeriodStart(period);

      const [medRes, shopRes, entryRes] = await Promise.allSettled([
        api.get("/medicines?limit=500"),
        api.get("/shops?limit=500"),
        api.get("/entries?limit=500"),
      ]);

      let medicines =
        medRes.status === "fulfilled" ? medRes.value.data.data || [] : [];
      let shops =
        shopRes.status === "fulfilled" ? shopRes.value.data.data || [] : [];
      let entries =
        entryRes.status === "fulfilled" ? entryRes.value.data.data || [] : [];

      // Filter by period
      medicines = medicines.filter((m) => new Date(m.createdAt) >= start);
      shops = shops.filter((s) => new Date(s.createdAt) >= start);
      entries = entries.filter((e) => new Date(e.createdAt) >= start);

      // Filter by type
      if (filter === "medicines") shops = [];
      if (filter === "shops") medicines = [];

      const periodLabel = period === "weekly" ? "weekly" : "monthly";
      const timestamp = new Date().toISOString().slice(0, 10);
      const baseName = `medi-quick_${filter}_${periodLabel}_${timestamp}`;

      if (format === "csv") {
        let csv = "";
        if (filter === "medicines") csv = buildMedicineCSV(medicines, entries);
        else if (filter === "shops") csv = buildShopCSV(shops, entries);
        else csv = buildCombinedCSV(medicines, shops, entries);
        downloadFile(csv, `${baseName}.csv`, "text/csv");
      }

      if (format === "json") {
        const json = buildJSON(medicines, shops, entries, filter);
        downloadFile(json, `${baseName}.json`, "application/json");
      }

      if (format === "txt") {
        const txt = buildTextReport(medicines, shops, entries, period, filter);
        downloadFile(txt, `${baseName}.txt`, "text/plain");
      }

      if (format === "pdf") {
        const doc = buildPDF(medicines, shops, entries, period, filter);
        doc.save(`${baseName}.pdf`);
      }

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700
                   border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white
                   text-sm font-medium rounded-xl transition-colors"
      >
        <Download size={14} />
        Export Data
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="absolute right-0 top-full mt-2 z-50 w-72
                          bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-sm">Export Data</p>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Period */}
            <div className="space-y-1.5">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                Period
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "weekly", label: "Weekly", sub: "Last 7 days" },
                  { id: "monthly", label: "Monthly", sub: "Last 28 days" },
                ].map(({ id, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setPeriod(id)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-colors
                      ${
                        period === id
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <span className="text-xs text-slate-600 mt-0.5">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter */}
            <div className="space-y-1.5">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                Data
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "both", icon: Layers, label: "Both" },
                  { id: "medicines", icon: Pill, label: "Medicines" },
                  { id: "shops", icon: Store, label: "Shops" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-colors
                      ${
                        filter === id
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                  >
                    <Icon size={13} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-1.5">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                Format
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "csv", icon: Table2, label: "CSV", sub: "Spreadsheet" },
                  {
                    id: "json",
                    icon: FileJson,
                    label: "JSON",
                    sub: "Developers",
                  },
                  { id: "txt", icon: FileText, label: "TXT", sub: "Report" },
                ].map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setFormat(id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-colors
                      ${
                        format === id
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                  >
                    <Icon size={13} />
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-xs text-slate-600">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary line */}
            <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <p className="text-slate-400 text-xs">
                Downloading{" "}
                <span className="text-white font-medium capitalize">
                  {filter}
                </span>{" "}
                data for the{" "}
                <span className="text-white font-medium">
                  {period === "weekly" ? "last 7 days" : "last 28 days"}
                </span>{" "}
                as{" "}
                <span className="text-emerald-400 font-medium uppercase">
                  {format}
                </span>
              </p>
            </div>

            {/* Download button */}
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5
                         bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800
                         disabled:text-emerald-600 text-white text-sm font-semibold
                         rounded-xl transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Preparing...
                </>
              ) : done ? (
                <>
                  <CheckCircle size={14} /> Downloaded!
                </>
              ) : (
                <>
                  <Download size={14} /> Download {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataExport;
