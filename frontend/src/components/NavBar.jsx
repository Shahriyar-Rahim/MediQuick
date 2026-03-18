import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  Plus, LayoutDashboard, LogOut, Shield, Star,
  Menu, X, Activity, Search, Pill, Store,
  Loader2, ChevronRight,
} from "lucide-react";

// ── Global search dropdown ────────────────────────────────────────────────────
const NavSearch = () => {
  const navigate     = useNavigate();
  const [query,      setQuery]   = useState("");
  const [results,    setResults] = useState({ medicines: [], shops: [] });
  const [loading,    setLoading] = useState(false);
  const [open,       setOpen]    = useState(false);
  const [focused,    setFocused] = useState(false);
  const [dropPos,    setDropPos] = useState({ top: 0, left: 0, width: 288 });
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  // Recalculate fixed dropdown position whenever state changes
  const updatePos = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 288) });
  };

  useEffect(() => { updatePos(); }, [open, focused, query]);

  // Also update on scroll/resize so it tracks correctly
  useEffect(() => {
    window.addEventListener("scroll",  updatePos, true);
    window.addEventListener("resize",  updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ medicines: [], shops: [] });
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [medRes, shopRes] = await Promise.allSettled([
          api.get(`/medicines/search?q=${encodeURIComponent(query.trim())}`),
          api.get(`/shops?limit=100`),
        ]);
        const medicines = medRes.status === "fulfilled"
          ? (medRes.value.data.data || []).slice(0, 5) : [];
        const allShops  = shopRes.status === "fulfilled"
          ? shopRes.value.data.data || [] : [];
        const shops = allShops
          .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 4);
        setResults({ medicines, shops });
        setOpen(medicines.length > 0 || shops.length > 0);
      } catch {
        setResults({ medicines: [], shops: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    setQuery("");
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
  };

  const hasResults = results.medicines.length > 0 || results.shops.length > 0;
  const showEmpty  = focused && query.trim() && !loading && !hasResults;

  // fixed positioning completely escapes Leaflet's stacking context
  const dropStyle = {
    position: "fixed",
    top:      dropPos.top,
    left:     dropPos.left,
    width:    dropPos.width,
    zIndex:   99999,
  };

  return (
    <div ref={containerRef} className="relative">

      {/* Input box */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
          ${focused
            ? "bg-slate-800 border-emerald-500/50 w-64"
            : "bg-slate-800/60 border-slate-700 w-44 hover:w-52"}`}
        style={{ transition: "width 0.2s ease" }}
      >
        {loading
          ? <Loader2 size={14} className="text-slate-500 shrink-0 animate-spin" />
          : <Search size={14} className="text-slate-500 shrink-0" />}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); updatePos(); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
          }}
          placeholder="Search medicines, shops..."
          className="bg-transparent text-white placeholder-slate-600 text-sm
                     focus:outline-none w-full min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }}
            className="text-slate-600 hover:text-slate-400 shrink-0">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Results dropdown — rendered with fixed position, above everything */}
      {open && hasResults && (
        <div style={dropStyle}
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

          {/* Medicines section */}
          {results.medicines.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5">
                <Pill size={11} className="text-emerald-400" />
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Medicines
                </span>
              </div>
              {results.medicines.map((med) => (
                <button key={med._id}
                  onClick={() => handleSelect(`/medicines/${med._id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5
                             hover:bg-slate-800 transition-colors text-left group">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {med.image?.url
                      ? <img src={med.image.url} alt="" className="w-full h-full object-cover rounded-lg" />
                      : <Pill size={12} className="text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium capitalize truncate
                                  group-hover:text-emerald-400 transition-colors">
                      {med.genericName}
                    </p>
                    {med.brandNames?.length > 0 && (
                      <p className="text-slate-600 text-xs truncate">
                        {med.brandNames.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5
                                   rounded-full capitalize shrink-0 group-hover:bg-slate-700">
                    {med.category}
                  </span>
                </button>
              ))}
              <button
                onClick={() => handleSelect(`/medicines?q=${encodeURIComponent(query)}`)}
                className="w-full flex items-center justify-between px-3 py-2
                           text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/50
                           transition-colors text-xs font-medium">
                <span>View all medicine results</span>
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {results.medicines.length > 0 && results.shops.length > 0 && (
            <div className="h-px bg-slate-800 mx-3" />
          )}

          {/* Shops section */}
          {results.shops.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5">
                <Store size={11} className="text-sky-400" />
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Shops
                </span>
              </div>
              {results.shops.map((shop) => (
                <button key={shop._id}
                  onClick={() => handleSelect(`/shops/${shop._id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5
                             hover:bg-slate-800 transition-colors text-left group">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {shop.image?.url
                      ? <img src={shop.image.url} alt="" className="w-full h-full object-cover" />
                      : <Store size={12} className="text-sky-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate
                                  group-hover:text-sky-400 transition-colors">
                      {shop.name}
                    </p>
                    {shop.address && (
                      <p className="text-slate-600 text-xs truncate">{shop.address}</p>
                    )}
                  </div>
                  <ChevronRight size={12} className="text-slate-700 group-hover:text-sky-400
                                                      shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}

          <div className="h-2" />
        </div>
      )}

      {/* Empty state — also fixed */}
      {showEmpty && (
        <div style={dropStyle}
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl px-4 py-6 text-center">
          <p className="text-slate-500 text-sm">No results for "{query}"</p>
          <button
            onClick={() => handleSelect(`/medicines?q=${encodeURIComponent(query)}`)}
            className="mt-2 text-emerald-400 hover:text-emerald-300 text-xs underline">
            Browse all medicines →
          </button>
        </div>
      )}
    </div>
  );
};

// ── Navbar ────────────────────────────────────────────────────────────────────
const NavBar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-[2000] bg-slate-900 border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0"
            onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center
                            shadow-md group-hover:bg-emerald-400 transition-colors">
              <Activity size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Medi<span className="text-emerald-400">-Quick</span>
            </span>
          </Link>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavSearch />
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link to="/add"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400
                         text-white text-sm font-semibold rounded-lg transition-colors shadow">
              <Plus size={15} strokeWidth={2.5} />
              Add
            </Link>

            {admin ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800
                                rounded-lg border border-slate-700">
                  {admin.role === "superadmin"
                    ? <Star size={13} className="text-yellow-400" fill="currentColor" />
                    : <Shield size={13} className="text-emerald-400" />}
                  <span className="text-slate-200 text-xs font-medium">{admin.name}</span>
                </div>
                <Link to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-white
                             hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors">
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300
                             hover:bg-rose-950/40 text-sm font-medium rounded-lg transition-colors">
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/admin/login"
                className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-white
                           hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors
                           border border-slate-700">
                <Shield size={14} />
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => { setMobileSearch((v) => !v); setMobileOpen(false); }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Search size={18} />
            </button>
            <button
              onClick={() => { setMobileOpen((v) => !v); setMobileSearch(false); }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      {mobileSearch && (
        <div className="sm:hidden border-t border-slate-800 px-4 py-3 bg-slate-900">
          <NavSearch />
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 flex flex-col gap-2">
          <Link to="/add" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500
                       text-white text-sm font-semibold rounded-lg">
            <Plus size={15} /> Add Medicine
          </Link>

          {admin ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800
                              rounded-lg border border-slate-700">
                {admin.role === "superadmin"
                  ? <Star size={13} className="text-yellow-400" fill="currentColor" />
                  : <Shield size={13} className="text-emerald-400" />}
                <span className="text-slate-200 text-sm font-medium">{admin.name}</span>
                <span className="ml-auto text-xs text-slate-500 capitalize">{admin.role}</span>
              </div>
              <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-slate-300
                           hover:bg-slate-800 text-sm rounded-lg transition-colors">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-rose-400
                           hover:bg-rose-950/40 text-sm rounded-lg transition-colors text-left">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-slate-300
                         hover:bg-slate-800 text-sm rounded-lg border border-slate-700">
              <Shield size={14} /> Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
