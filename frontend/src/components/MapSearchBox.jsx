import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Loader2, Navigation } from "lucide-react";

// ── Nominatim geocoding (free, no API key, OpenStreetMap data) ────────────────
const nominatimSearch = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q:              query,
      format:         "json",
      limit:          "6",
      addressdetails: "1",
      countrycodes:   "bd",   // bias to Bangladesh — remove for worldwide
    }),
    { headers: { "Accept-Language": "en", "User-Agent": "Medi-Quick/1.0" } }
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
};

// ── Result type icon ──────────────────────────────────────────────────────────
const typeLabel = (type, cls) => {
  const map = {
    pharmacy: "💊", hospital: "🏥", clinic: "🏥",
    pharmacy_store: "💊", chemist: "💊",
    city: "🏙️", town: "🏘️", village: "🏡",
    neighbourhood: "📍", suburb: "📍",
    road: "🛣️", street: "🛣️",
  };
  return map[type] || map[cls] || "📍";
};

// ── MapSearchBox ──────────────────────────────────────────────────────────────
// Props:
//   onSelect(lat, lng, label) — called when user picks a result
//   placeholder — input placeholder text
//   className   — wrapper className
const MapSearchBox = ({ onSelect, placeholder = "Search map…", className = "" }) => {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [error,   setError]   = useState("");
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setError("");
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await nominatimSearch(query.trim());
        setResults(data);
        setOpen(data.length > 0);
        if (data.length === 0) setError("No results found");
      } catch {
        setError("Search failed — check your connection");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (result) => {
    const lat   = parseFloat(result.lat);
    const lng   = parseFloat(result.lon);
    const label = result.display_name.split(",").slice(0, 3).join(", ");
    setQuery(label);
    setOpen(false);
    onSelect?.(lat, lng, label);
  };

  const clear = () => { setQuery(""); setResults([]); setOpen(false); setError(""); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white/95 backdrop-blur
                      border border-slate-200 rounded-xl shadow-lg">
        {loading
          ? <Loader2 size={15} className="text-slate-400 shrink-0 animate-spin" />
          : <Search   size={15} className="text-slate-400 shrink-0" />}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400
                     text-sm focus:outline-none min-w-0"
        />
        {query && (
          <button onClick={clear} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200
                        rounded-xl shadow-2xl overflow-hidden z-[9000] max-h-72 overflow-y-auto">
          {results.map((r, i) => {
            const icon  = typeLabel(r.type, r.class);
            const name  = r.display_name.split(",")[0];
            const rest  = r.display_name.split(",").slice(1, 3).join(",");
            return (
              <button key={i}
                onClick={() => handleSelect(r)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left
                           hover:bg-slate-50 transition-colors border-b border-slate-100
                           last:border-b-0 group">
                <span className="text-base shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate
                                group-hover:text-emerald-600 transition-colors">
                    {name}
                  </p>
                  {rest && (
                    <p className="text-slate-400 text-xs truncate mt-0.5">{rest}</p>
                  )}
                </div>
                <Navigation size={12} className="text-slate-300 group-hover:text-emerald-400
                                                  shrink-0 mt-1 transition-colors" />
              </button>
            );
          })}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <span>Powered by</span>
              <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer"
                className="text-emerald-500 hover:text-emerald-400 underline font-medium">
                OpenStreetMap
              </a>
              <span>· Free · No API key</span>
            </p>
          </div>
        </div>
      )}

      {/* Error / no results */}
      {!open && error && query.trim().length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200
                        rounded-xl shadow-lg px-4 py-3 z-[9000]">
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MapSearchBox;
