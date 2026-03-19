import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { Map, Marker } from "pigeon-maps";
import {
  ScanLine, Pill, Store, ArrowUpDown, MapPin,
  ChevronRight, ChevronDown, Search, ArrowLeft,
  CheckCircle, AlertTriangle, Clock, Share2,
  ThumbsUp, ThumbsDown, ExternalLink, Loader2,
} from "lucide-react";
import api from "../api/axios";

// ── Pigeon map pin ────────────────────────────────────────────────────────────
const ShopPin = ({ active }) => (
  <div style={{
    width:        active ? 28 : 22,
    height:       active ? 28 : 22,
    borderRadius: "50% 50% 50% 0",
    background:   active ? "#f59e0b" : "#10b981",
    border:       "2px solid white",
    transform:    "rotate(-45deg)",
    boxShadow:    active
      ? "0 2px 12px rgba(245,158,11,.6)"
      : "0 2px 8px rgba(16,185,129,.4)",
    cursor:       "pointer",
    transition:   "all 0.2s ease",
  }} />
);

// ── Medicine card ─────────────────────────────────────────────────────────────
const MedicineCard = ({ item, onNavigate, onSelectShop, activeShopId }) => {
  const [open, setOpen] = useState(false);
  const prices   = item.entries.map((e) => e.price).filter(Boolean);
  const inStock  = item.entries.filter((e) => e.isAvailable).length;
  const found    = !!item.medicine;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all
      ${found ? "bg-slate-900 border-emerald-500/20" : "bg-slate-900/50 border-slate-800"}`}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          ${found ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-800 border border-slate-700"}`}>
          {item.medicine?.image?.url
            ? <img src={item.medicine.image.url} alt=""
                className="w-full h-full object-cover rounded-xl" />
            : <Pill size={15} className={found ? "text-emerald-400" : "text-slate-600"} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-400 text-xs">
              Detected: <span className="text-slate-100 font-medium">{item.detectedName}</span>
            </p>
            {found
              ? <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10
                                  px-1.5 py-0.5 rounded-full border border-emerald-400/20">✓ Found</span>
              : <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">
                  Not in DB
                </span>}
          </div>
          {found && (
            <p className="text-white text-sm font-semibold capitalize mt-0.5">
              {item.medicine.genericName}
            </p>
          )}
          {found && item.medicine.category && (
            <p className="text-slate-600 text-xs capitalize">{item.medicine.category}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {found && prices.length > 0 && (
            <div className="text-right">
              <p className="text-emerald-400 text-sm font-bold">
                ৳{Math.min(...prices).toFixed(0)}
              </p>
              {prices.length > 1 && (
                <p className="text-slate-600 text-xs">–৳{Math.max(...prices).toFixed(0)}</p>
              )}
            </div>
          )}
          {found && (
            <button onClick={() => onNavigate(`/medicines/${item.medicine._id}`)}
              title="View medicine"
              className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors">
              <ExternalLink size={13} />
            </button>
          )}
          {found && item.entries.length > 0 && (
            <button onClick={() => setOpen((v) => !v)}
              className="p-1.5 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Shop list */}
      {open && item.entries.length > 0 && (
        <div className="border-t border-slate-800">
          <div className="px-4 py-2 flex items-center gap-2">
            <Store size={11} className="text-sky-400" />
            <span className="text-slate-500 text-xs">
              {inStock} in stock · {item.entries.length} shop{item.entries.length !== 1 ? "s" : ""}
            </span>
          </div>
          {item.entries.slice(0, 6).map((entry) => {
            const [lng, lat] = entry.shop?.location?.coordinates || [0, 0];
            const isActive   = activeShopId === entry.shop?._id;
            return (
              <button key={entry._id}
                onClick={() => onSelectShop(entry.shop, lat && lng ? [lat, lng] : null)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left
                            hover:bg-slate-800/50 transition-colors
                            ${isActive
                              ? "bg-amber-500/5 border-l-2 border-amber-400"
                              : "border-l-2 border-transparent"}`}>
                <div className={`w-2 h-2 rounded-full shrink-0
                  ${entry.isAvailable ? "bg-emerald-400" : "bg-slate-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 text-sm font-medium truncate">{entry.shop?.name}</p>
                  {entry.shop?.address && (
                    <p className="text-slate-600 text-xs truncate">{entry.shop.address}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 text-sm font-bold">৳{entry.price?.toFixed(0)}</p>
                  <p className={`text-xs ${entry.isAvailable ? "text-emerald-600" : "text-slate-600"}`}>
                    {entry.isAvailable ? "In stock" : "Out of stock"}
                  </p>
                </div>
                {/* Vote counts */}
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="flex items-center gap-0.5 text-emerald-600 text-xs">
                    <ThumbsUp size={9} />{entry.priceVotes?.correct || 0}
                  </span>
                  <span className="flex items-center gap-0.5 text-rose-600 text-xs">
                    <ThumbsDown size={9} />{entry.priceVotes?.incorrect || 0}
                  </span>
                </div>
                <MapPin size={12} className={isActive ? "text-amber-400" : "text-slate-700"} />
              </button>
            );
          })}
          {item.entries.length > 6 && (
            <button onClick={() => onNavigate(`/medicines/${item.medicine._id}`)}
              className="w-full flex items-center justify-center gap-1 py-2.5
                         text-slate-500 hover:text-emerald-400 text-xs transition-colors
                         border-t border-slate-800">
              View all {item.entries.length} shops <ChevronRight size={11} />
            </button>
          )}
        </div>
      )}

      {open && item.entries.length === 0 && (
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-slate-600 text-xs">No shops have listed this medicine yet.</p>
          <button onClick={() => onNavigate("/add?type=entry")}
            className="text-emerald-400 text-xs mt-1 hover:text-emerald-300 transition-colors">
            + Add it to a shop
          </button>
        </div>
      )}
    </div>
  );
};

// ── Results page ──────────────────────────────────────────────────────────────
const PrescriptionResultPage = () => {
  const { id }       = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();
  const stateData    = location.state;

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(!stateData);
  const [error,       setError]       = useState("");
  const [mapCenter,   setMapCenter]   = useState([23.8103, 90.4125]);
  const [mapZoom,     setMapZoom]     = useState(12);
  const [activeShop,  setActiveShop]  = useState(null);
  const [copied,      setCopied]      = useState(false);

  // Use state data immediately (just navigated from scanner)
  // OR fetch from DB if opened via share link
  useEffect(() => {
    if (stateData?.detectedMedicines) {
      setData(stateData);
      // Center map on first shop
      const firstCoords = stateData.detectedMedicines
        .flatMap((m) => m.entries || [])
        .map((e) => e.shop?.location?.coordinates)
        .find(Boolean);
      if (firstCoords) setMapCenter([firstCoords[1], firstCoords[0]]);
    } else {
      // Fetch from DB
      setLoading(true);
      api.get(`/prescriptions/${id}`)
        .then(({ data: res }) => {
          // Rebuild detectedMedicines from DB format
          const rebuilt = (res.data.detectedMedicines || []).map((m) => ({
            detectedName:        m.detectedName,
            medicine:            m.medicine,
            entries:             m.shopEntries?.map((se) => ({
              _id:         se._id || se.shop,
              shop:        { _id: se.shop, name: se.shopName, address: se.shopAddress,
                             location: { coordinates: [se.coordinates?.lng, se.coordinates?.lat] } },
              price:       se.price,
              isAvailable: se.isAvailable,
              brandName:   se.brandName,
              priceVotes:  { correct: 0, incorrect: 0 },
            })) || [],
          }));
          setData({
            detectedMedicines: rebuilt,
            confidence:  res.data.confidence,
            geminiNotes: res.data.geminiNotes,
            imagePreview: null,
          });
          const firstCoords = rebuilt
            .flatMap((m) => m.entries)
            .map((e) => e.shop?.location?.coordinates)
            .find(Boolean);
          if (firstCoords) setMapCenter([firstCoords[1], firstCoords[0]]);
        })
        .catch(() => setError("Could not load prescription results."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSelectShop = (shop, coords) => {
    setActiveShop(shop);
    if (coords) { setMapCenter(coords); setMapZoom(15); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/prescription/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="text-emerald-400 animate-spin" />
        <p className="text-slate-500 text-sm">Loading prescription results...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <AlertTriangle size={32} className="text-rose-400 mx-auto" />
        <p className="text-white font-semibold">{error}</p>
        <button onClick={() => navigate("/")}
          className="text-emerald-400 hover:text-emerald-300 text-sm underline">
          Go home
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const { detectedMedicines, confidence, geminiNotes, imagePreview } = data;

  // Aggregate stats
  const foundCount   = detectedMedicines.filter((m) => m.medicine).length;
  const notFound     = detectedMedicines.length - foundCount;
  const allEntries   = detectedMedicines.flatMap((m) => m.entries || []);
  const allPrices    = allEntries.map((e) => e.price).filter(Boolean);

  // Unique shops for map
  const uniqueShops = [];
  const seen = new Set();
  for (const m of detectedMedicines) {
    for (const e of (m.entries || [])) {
      if (e.shop?._id && !seen.has(e.shop._id)) {
        seen.add(e.shop._id);
        uniqueShops.push({ ...e, medicineName: m.medicine?.genericName || m.detectedName });
      }
    }
  }

  return (
    <div className="bg-slate-950 min-h-screen">

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                              flex items-center justify-center">
                <ScanLine size={13} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">Prescription Results</h1>
                <div className="flex items-center gap-1.5">
                  <Clock size={9} className="text-slate-600" />
                  <p className="text-slate-600 text-xs">
                    {new Date().toLocaleString("en-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {confidence && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                      ${confidence === "high"   ? "text-emerald-400 bg-emerald-400/10" :
                        confidence === "medium" ? "text-amber-400 bg-amber-400/10"    :
                                                  "text-rose-400 bg-rose-400/10"}`}>
                      {confidence} confidence
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                       border border-slate-700 text-slate-400 hover:text-white
                       text-xs rounded-lg transition-colors">
            <Share2 size={12} />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Pill,      color: "emerald", label: "Detected",   value: detectedMedicines.length },
            { icon: CheckCircle,color: "emerald",label: "Found in DB", value: foundCount              },
            { icon: Store,     color: "sky",     label: "Shops",       value: uniqueShops.length      },
            { icon: ArrowUpDown,color: "amber",  label: "Lowest Price",
              value: allPrices.length ? `৳${Math.min(...allPrices).toFixed(0)}` : "—"                 },
          ].map(({ icon: Icon, color, label, value }) => {
            const c = {
              emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
              sky:     { bg: "bg-sky-500/10",     text: "text-sky-400"     },
              amber:   { bg: "bg-amber-500/10",   text: "text-amber-400"   },
            }[color];
            return (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                  <Icon size={14} className={c.text} />
                </div>
                <p className={`text-xl font-bold ${c.text}`}>{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>

        {/* Gemini note */}
        {geminiNotes && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/5
                          border border-amber-500/20 rounded-xl">
            <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300/80 text-xs leading-relaxed">{geminiNotes}</p>
          </div>
        )}

        {/* Map + image side by side on desktop */}
        <div className={`grid gap-4 ${imagePreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>

          {/* Prescription image */}
          {imagePreview && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                <ScanLine size={12} className="text-slate-500" />
                <span className="text-slate-500 text-xs font-medium">Scanned Prescription</span>
              </div>
              <img src={imagePreview} alt="prescription"
                className="w-full max-h-64 object-contain bg-slate-950 p-2" />
            </div>
          )}

          {/* Map */}
          {uniqueShops.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-sky-400" />
                  <span className="text-slate-400 text-xs font-medium">
                    {uniqueShops.length} Shop{uniqueShops.length !== 1 ? "s" : ""} Nearby
                  </span>
                </div>
                {activeShop && (
                  <span className="text-amber-400 text-xs truncate max-w-[160px]">
                    📍 {activeShop.name}
                  </span>
                )}
              </div>
              <Map
                center={mapCenter}
                zoom={mapZoom}
                onBoundsChanged={({ center, zoom }) => { setMapCenter(center); setMapZoom(zoom); }}
                height={280}
                attribution={false}
              >
                {uniqueShops.map((entry) => {
                  const [lng, lat] = entry.shop?.location?.coordinates || [0, 0];
                  if (!lat || !lng) return null;
                  const isActive = activeShop?._id === entry.shop._id;
                  return (
                    <Marker key={entry.shop._id} anchor={[lat, lng]}
                      onClick={() => {
                        handleSelectShop(entry.shop, [lat, lng]);
                        navigate(`/shops/${entry.shop._id}`);
                      }}>
                      <ShopPin active={isActive} />
                    </Marker>
                  );
                })}
              </Map>
            </div>
          )}
        </div>

        {/* Medicine cards */}
        <div>
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Detected Medicines · tap to expand shops & prices
          </h2>
          <div className="space-y-3">
            {detectedMedicines.map((item, i) => (
              <MedicineCard
                key={i}
                item={item}
                onNavigate={navigate}
                onSelectShop={handleSelectShop}
                activeShopId={activeShop?._id}
              />
            ))}
          </div>
        </div>

        {/* Price comparison table */}
        {detectedMedicines.some((m) => (m.entries || []).length > 0) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <ArrowUpDown size={13} className="text-amber-400" />
              <h2 className="text-slate-100 font-semibold text-sm">Price Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-500 text-xs font-medium px-4 py-2.5">Medicine</th>
                    <th className="text-left text-slate-500 text-xs font-medium px-4 py-2.5 hidden sm:table-cell">Shop</th>
                    <th className="text-right text-slate-500 text-xs font-medium px-4 py-2.5">Price</th>
                    <th className="text-center text-slate-500 text-xs font-medium px-4 py-2.5">Stock</th>
                    <th className="text-center text-slate-500 text-xs font-medium px-4 py-2.5 hidden sm:table-cell">Votes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {detectedMedicines.flatMap((m) =>
                    (m.entries || []).slice(0, 4).map((e) => (
                      <tr key={e._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-200 capitalize text-xs font-medium">
                          {m.medicine?.genericName || m.detectedName}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[120px] hidden sm:table-cell">
                          {e.shop?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-400 text-sm font-bold">
                          ৳{e.price?.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                            ${e.isAvailable
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-800 text-slate-500"}`}>
                            {e.isAvailable ? "In Stock" : "Out"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            <span className="flex items-center gap-0.5 text-emerald-600 text-xs">
                              <ThumbsUp size={9} />{e.priceVotes?.correct || 0}
                            </span>
                            <span className="flex items-center gap-0.5 text-rose-600 text-xs">
                              <ThumbsDown size={9} />{e.priceVotes?.incorrect || 0}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Not found section */}
        {notFound > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Not Found in Database ({notFound})
            </h3>
            <div className="flex flex-wrap gap-2">
              {detectedMedicines
                .filter((m) => !m.medicine)
                .map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5
                                          bg-slate-800 border border-slate-700 rounded-lg">
                    <span className="text-slate-300 text-xs">{m.detectedName}</span>
                    <button onClick={() => navigate(`/add?type=medicine`)}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Add to database">
                      <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
            </div>
            <p className="text-slate-600 text-xs mt-3">
              Help the community by adding these medicines to the database →{" "}
              <button onClick={() => navigate("/add")}
                className="text-emerald-400 hover:text-emerald-300 underline transition-colors">
                Add Medicine
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PrescriptionResultPage;
