import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  Plus, LayoutDashboard, LogOut, Shield, Star,
  Menu, X, Search, Pill, Store, Activity,
  Loader2, ChevronRight, MessageSquare,
  Home, Microscope, ShoppingBag, BarChart3,
} from "lucide-react";

// Nav links
const NAV_LINKS = [
  { to: "/",          label: "Home",      icon: Home        },
  { to: "/medicines", label: "Medicines", icon: Microscope  },
  { to: "/shops",     label: "Shops",     icon: ShoppingBag },
  { to: "/analytics", label: "Analytics", icon: BarChart3   },
];

// Global search
const NavSearch = ({ onClose }) => {
  const navigate     = useNavigate();
  const [query,      setQuery]   = useState("");
  const [results,    setResults] = useState({ medicines: [], shops: [] });
  const [loading,    setLoading] = useState(false);
  const [open,       setOpen]    = useState(false);
  const [focused,    setFocused] = useState(false);
  const [dropPos,    setDropPos] = useState({ top: 0, left: 0, width: 320 });
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  const updatePos = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 320) });
  };

  useEffect(() => { updatePos(); }, [open, focused, query]);
  useEffect(() => {
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false); setFocused(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults({ medicines: [], shops: [] }); setOpen(false); return; }
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
          .slice(0, 3);
        setResults({ medicines, shops });
        setOpen(medicines.length > 0 || shops.length > 0);
      } catch { setResults({ medicines: [], shops: [] }); }
      finally  { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const go = (path) => {
    navigate(path); setQuery(""); setOpen(false);
    setFocused(false); inputRef.current?.blur(); onClose?.();
  };

  const hasResults = results.medicines.length > 0 || results.shops.length > 0;
  const showEmpty  = focused && query.trim() && !loading && !hasResults;
  const dropStyle  = { position: "fixed", top: dropPos.top, left: dropPos.left,
                       width: dropPos.width, zIndex: 99999 };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border
                       transition-all duration-200
        ${focused
          ? "bg-white/10 border-emerald-400/40 shadow-lg shadow-emerald-500/10"
          : "bg-white/5 border-white/10 hover:border-white/20"}`}>
        {loading
          ? <Loader2 size={14} className="text-emerald-400 shrink-0 animate-spin" />
          : <Search  size={14} className="text-slate-400 shrink-0" />}
        <input ref={inputRef} type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); updatePos(); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
            if (e.key === "Enter" && query.trim())
              go(`/medicines?q=${encodeURIComponent(query.trim())}`);
          }}
          placeholder="Search medicines, shops..."
          className="bg-transparent text-white placeholder-slate-500 text-sm
                     focus:outline-none w-full min-w-0" />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }}
            className="text-slate-500 hover:text-slate-300 shrink-0 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && hasResults && (
        <div style={dropStyle}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl
                     shadow-black/40 overflow-hidden backdrop-blur-sm">

          {results.medicines.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-1">
                <Pill size={11} className="text-emerald-400" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Medicines
                </span>
              </div>
              {results.medicines.map((med) => (
                <button key={med._id} onClick={() => go(`/medicines/${med._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             hover:bg-slate-800/60 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {med.image?.url
                      ? <img src={med.image.url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : <Pill size={13} className="text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium capitalize truncate
                                  group-hover:text-emerald-300 transition-colors">
                      {med.genericName}
                    </p>
                    {med.brandNames?.length > 0 && (
                      <p className="text-slate-600 text-xs truncate">
                        {med.brandNames.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 capitalize shrink-0
                                   bg-slate-800 px-2 py-0.5 rounded-full">
                    {med.category}
                  </span>
                </button>
              ))}
              <button onClick={() => go(`/medicines?q=${encodeURIComponent(query)}`)}
                className="w-full flex items-center justify-between px-4 py-2
                           text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40
                           transition-colors text-xs font-medium">
                <span>See all medicine results</span>
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {results.medicines.length > 0 && results.shops.length > 0 && (
            <div className="h-px bg-slate-800 mx-4" />
          )}

          {results.shops.length > 0 && (
            <div className="pb-2">
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                <Store size={11} className="text-sky-400" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Shops
                </span>
              </div>
              {results.shops.map((shop) => (
                <button key={shop._id} onClick={() => go(`/shops/${shop._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5
                             hover:bg-slate-800/60 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20
                                  flex items-center justify-center shrink-0 overflow-hidden">
                    {shop.image?.url
                      ? <img src={shop.image.url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : <Store size={13} className="text-sky-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate
                                  group-hover:text-sky-300 transition-colors">
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
        </div>
      )}

      {showEmpty && (
        <div style={dropStyle}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl px-5 py-6 text-center">
          <p className="text-slate-500 text-sm">Nothing found for "{query}"</p>
          <button onClick={() => go(`/medicines?q=${encodeURIComponent(query)}`)}
            className="mt-2 text-emerald-400 hover:text-emerald-300 text-xs underline transition-colors">
            Browse all medicines →
          </button>
        </div>
      )}
    </div>
  );
};

// Navbar
const Navbar = () => {
  const { admin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); setMobileSearch(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/"); };

  const scrollToFeedback = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("feedback-section")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      document.getElementById("feedback-section")?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-[2000] bg-slate-900/95 backdrop-blur-md
                    border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center
                            shadow-md shadow-emerald-500/30 group-hover:bg-emerald-400
                            transition-all group-hover:scale-105">
              <Activity size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              Medi<span className="text-emerald-400">-Quick</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm
                            font-medium transition-all
                  ${isActive(to)
                    ? "text-white bg-slate-800 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
                <Icon size={13} strokeWidth={isActive(to) ? 2.5 : 2} />
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <NavSearch />
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button onClick={scrollToFeedback} title="Give Feedback"
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800
                         rounded-xl transition-colors">
              <MessageSquare size={16} />
            </button>

            <Link to="/add"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500
                         hover:bg-emerald-400 text-white text-sm font-semibold
                         rounded-xl transition-all shadow shadow-emerald-500/20
                         hover:shadow-emerald-500/30 hover:scale-[1.02]">
              <Plus size={14} strokeWidth={2.5} /> Add
            </Link>

            {admin ? (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800
                                rounded-xl border border-slate-700">
                  {admin.role === "superadmin"
                    ? <Star size={12} className="text-amber-400" fill="currentColor" />
                    : <Shield size={12} className="text-emerald-400" />}
                  <span className="text-slate-200 text-xs font-medium">{admin.name}</span>
                </div>
                <Link to="/admin/dashboard"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800
                             rounded-xl transition-colors" title="Dashboard">
                  <LayoutDashboard size={15} />
                </Link>
                <button onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30
                             rounded-xl transition-colors" title="Logout">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link to="/admin/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400
                           hover:text-white hover:bg-slate-800 text-sm rounded-xl
                           transition-colors border border-slate-700/60">
                <Shield size={13} /> Admin
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <button onClick={() => { setMobileSearch((v) => !v); setMobileOpen(false); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white
                         hover:bg-slate-800 transition-colors">
              <Search size={18} />
            </button>
            <button onClick={() => { setMobileOpen((v) => !v); setMobileSearch(false); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white
                         hover:bg-slate-800 transition-colors">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      {mobileSearch && (
        <div className="md:hidden border-t border-slate-800 px-4 py-3 bg-slate-900">
          <NavSearch onClose={() => setMobileSearch(false)} />
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98
                        px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                          font-medium transition-colors
                ${isActive(to)
                  ? "text-white bg-slate-800"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
              <Icon size={15} /> {label}
            </Link>
          ))}

          <div className="h-px bg-slate-800 my-1" />

          <Link to="/add" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500
                       text-white text-sm font-semibold rounded-xl">
            <Plus size={15} /> Add Medicine or Shop
          </Link>

          <button onClick={scrollToFeedback}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-400
                       hover:text-white hover:bg-slate-800 text-sm rounded-xl transition-colors">
            <MessageSquare size={15} /> Give Feedback
          </button>

          {admin ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800
                              rounded-xl border border-slate-700">
                {admin.role === "superadmin"
                  ? <Star size={13} className="text-amber-400" fill="currentColor" />
                  : <Shield size={13} className="text-emerald-400" />}
                <span className="text-slate-200 text-sm font-medium">{admin.name}</span>
                <span className="ml-auto text-xs text-slate-500 capitalize">{admin.role}</span>
              </div>
              <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-slate-300
                           hover:bg-slate-800 text-sm rounded-xl transition-colors">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-rose-400
                           hover:bg-rose-950/40 text-sm rounded-xl transition-colors text-left">
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-slate-300
                         hover:bg-slate-800 text-sm rounded-xl border border-slate-700/60">
              <Shield size={14} /> Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
