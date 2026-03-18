import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../api/axios";
import {
  Search, Pill, ChevronRight, SlidersHorizontal,
  X, Loader2, PackageSearch, Plus,
} from "lucide-react";

const CATEGORIES = [
  "all", "antibiotic", "antifungal", "antiviral", "analgesic",
  "antacid", "antidiabetic", "antihypertensive", "antihistamine",
  "vitamin", "supplement", "other",
];

const CATEGORY_COLORS = {
  antibiotic:       "bg-rose-500/10 text-rose-400 border-rose-500/20",
  antifungal:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  antiviral:        "bg-orange-500/10 text-orange-400 border-orange-500/20",
  analgesic:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  antacid:          "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  antidiabetic:     "bg-pink-500/10 text-pink-400 border-pink-500/20",
  antihypertensive: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  antihistamine:    "bg-teal-500/10 text-teal-400 border-teal-500/20",
  vitamin:          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  supplement:       "bg-lime-500/10 text-lime-400 border-lime-500/20",
  other:            "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const MedicineCard = ({ medicine, onClick }) => {
  const badgeClass = CATEGORY_COLORS[medicine.category] || CATEGORY_COLORS.other;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-4
                 hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Icon / image */}
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                        flex items-center justify-center shrink-0">
          {medicine.image?.url ? (
            <img src={medicine.image.url} alt={medicine.genericName}
              className="w-full h-full rounded-lg object-cover" />
          ) : (
            <Pill size={16} className="text-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm capitalize leading-tight group-hover:text-emerald-400 transition-colors">
              {medicine.genericName}
            </h3>
            <ChevronRight size={14} className="text-slate-700 group-hover:text-emerald-500 shrink-0 mt-0.5 transition-colors" />
          </div>

          {medicine.brandNames?.length > 0 && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              {medicine.brandNames.slice(0, 3).join(" · ")}
              {medicine.brandNames.length > 3 && ` +${medicine.brandNames.length - 3}`}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs capitalize ${badgeClass}`}>
              {medicine.category}
            </span>
            {medicine.addedBy === "user" && (
              <span className="text-xs text-slate-600">community</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const MedicinesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query,    setQuery]    = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [medicines, setMedicines] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [page,      setPage]     = useState(1);
  const [totalPages,setTotalPages] = useState(1);
  const [total,     setTotal]    = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  const LIMIT = 18;

  const fetchMedicines = useCallback(async (p = 1, q = query, cat = category) => {
    setLoading(true);
    try {
      let res;
      if (q.trim()) {
        res = await api.get(`/medicines/search?q=${encodeURIComponent(q.trim())}`);
        setMedicines(res.data.data || []);
        setTotal(res.data.count || 0);
        setTotalPages(1);
      } else {
        const params = new URLSearchParams({ page: p, limit: LIMIT });
        if (cat && cat !== "all") params.append("category", cat);
        res = await api.get(`/medicines?${params}`);
        setMedicines(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync URL params → fetch
  useEffect(() => {
    const q   = searchParams.get("q") || "";
    const cat = searchParams.get("category") || "all";
    setQuery(q);
    setCategory(cat);
    setPage(1);
    fetchMedicines(1, q, cat);
  }, [searchParams]);

  // Debounce query changes
  useEffect(() => {
    const t = setTimeout(() => {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (category !== "all") params.category = category;
      setSearchParams(params, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [query, category]);

  const handlePageChange = (p) => {
    setPage(p);
    fetchMedicines(p, query, category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setSearchParams({});
  };

  const hasFilters = query.trim() || category !== "all";

  return (
    <div className="bg-slate-950 min-h-screen">

      {/* Header bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-bold text-lg">Medicines</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {loading ? "Loading..." : `${total} medicine${total !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-slate-400 hover:text-white text-xs rounded-lg hover:bg-slate-800 transition-colors border border-slate-700">
                  <X size={12} /> Clear
                </button>
              )}
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${showFilter
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"}`}
              >
                <SlidersHorizontal size={13} /> Filter
              </button>
              <button
                onClick={() => navigate("/add")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by generic name or brand name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                         text-white placeholder-slate-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category pills */}
          {showFilter && (
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors
                    ${category === cat
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <PackageSearch size={40} className="text-slate-700" />
            <p className="text-slate-500 text-sm">No medicines found</p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-emerald-400 hover:text-emerald-300 text-sm underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {medicines.map((med) => (
                <MedicineCard
                  key={med._id}
                  medicine={med}
                  onClick={() => navigate(`/medicines/${med._id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !query.trim() && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400
                             hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Prev
                </button>

                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors
                        ${page === p
                          ? "bg-emerald-500 text-white font-semibold"
                          : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"}`}>
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400
                             hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;
