import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import api from "../api/axios";
import {
  Store, ArrowLeft, MapPin, Phone, Pill, ShieldAlert,
  CheckCircle, XCircle, Loader2, SlidersHorizontal,
  ChevronRight, AlertTriangle,
} from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORIES = [
  "all","antibiotic","antifungal","antiviral","analgesic","antacid",
  "antidiabetic","antihypertensive","antihistamine","vitamin","supplement","other",
];

// ── Fraud vote row ────────────────────────────────────────────────────────────
const FraudVoteRow = ({ shop, onVote }) => {
  const [myVote, setMyVote] = useState(null);
  const [votes,  setVotes]  = useState(shop.fraudVotes || { fraud: 0, legit: 0 });
  const [busy,   setBusy]   = useState(false);

  useEffect(() => {
    api.get(`/votes/check?type=fraud&targetId=${shop._id}`)
      .then(({ data }) => { if (data.hasVoted) setMyVote(data.currentVote); })
      .catch(() => {});
  }, [shop._id]);

  const handleVote = async (value) => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/votes/fraud/${shop._id}`, { value });
      setVotes(data.data.fraudVotes);
      setMyVote(value);
      toast.success("Vote recorded");
      onVote?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Vote failed");
    } finally {
      setBusy(false);
    }
  };

  const total    = votes.fraud + votes.legit;
  const fraudPct = total > 0 ? Math.round((votes.fraud / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button onClick={() => handleVote("fraud")} disabled={busy || myVote === "fraud"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
          ${myVote === "fraud"
            ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"}`}>
        <ShieldAlert size={11} /> Fraud ({votes.fraud})
      </button>
      <button onClick={() => handleVote("legit")} disabled={busy || myVote === "legit"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
          ${myVote === "legit"
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"}`}>
        <CheckCircle size={11} /> Legit ({votes.legit})
      </button>
      {total > 0 && (
        <span className={`text-xs font-medium ${fraudPct > 50 ? "text-rose-400" : "text-emerald-400"}`}>
          {fraudPct}% flagged
        </span>
      )}
    </div>
  );
};

// ── ShopPage ──────────────────────────────────────────────────────────────────
const ShopPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shop,     setShop]     = useState(null);
  const [entries,  setEntries]  = useState([]);
  const [category, setCategory] = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [showCats, setShowCats] = useState(false);

  const fetchData = async () => {
    try {
      const [shopRes, entryRes] = await Promise.allSettled([
        api.get(`/shops/${id}`),
        api.get(`/entries/shop/${id}`),
      ]);
      if (shopRes.status  === "fulfilled") setShop(shopRes.value.data.data);
      if (entryRes.status === "fulfilled") setEntries(entryRes.value.data.data || []);
    } catch {
      toast.error("Failed to load shop");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const filtered = category === "all"
    ? entries
    : entries.filter((e) => e.medicine?.category === category);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 size={24} className="text-emerald-400 animate-spin" />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Store size={36} className="text-slate-700" />
      <p className="text-slate-400 text-sm">Shop not found</p>
      <button onClick={() => navigate(-1)} className="text-emerald-400 text-sm underline">Go back</button>
    </div>
  );

  const [lng, lat] = shop.location?.coordinates || [90.4125, 23.8103];

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Shop header card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Mini map */}
          <div className="h-44 border-b border-slate-800">
            <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full"
              zoomControl={false} scrollWheelZoom={false} dragging={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
              <Marker position={[lat, lng]} />
            </MapContainer>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20
                              flex items-center justify-center shrink-0 overflow-hidden">
                {shop.image?.url
                  ? <img src={shop.image.url} alt={shop.name} className="w-full h-full object-cover" />
                  : <Store size={20} className="text-sky-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg truncate">{shop.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {shop.address && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <MapPin size={11} /> {shop.address}
                    </span>
                  )}
                  {shop.contact && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Phone size={11} /> {shop.contact}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-xs mb-2.5">Is this shop legitimate?</p>
              <FraudVoteRow shop={shop} onVote={fetchData} />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <Pill size={14} className="text-emerald-400" />
              </div>
              <h2 className="text-slate-100 font-semibold text-sm">
                Inventory ({filtered.length} medicine{filtered.length !== 1 ? "s" : ""})
              </h2>
            </div>
            <button onClick={() => setShowCats((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors
                ${showCats
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>
              <SlidersHorizontal size={11} /> Filter
            </button>
          </div>

          {showCats && (
            <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs capitalize border transition-colors
                    ${category === cat
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <AlertTriangle size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">
                {category === "all" ? "No medicines listed yet" : `No ${category} medicines here`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filtered.map((entry) => (
                <div key={entry._id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5
                             hover:bg-slate-800/40 transition-colors">
                  <button onClick={() => navigate(`/medicines/${entry.medicine?._id}`)}
                    className="flex items-center gap-2.5 min-w-0 group text-left flex-1">
                    <Pill size={13} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-medium capitalize
                                    group-hover:text-emerald-400 transition-colors truncate">
                        {entry.medicine?.genericName || "—"}
                      </p>
                      {entry.brandName && (
                        <p className="text-slate-600 text-xs">{entry.brandName}</p>
                      )}
                    </div>
                    <ChevronRight size={13} className="text-slate-700 group-hover:text-emerald-500 shrink-0" />
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    {entry.isAvailable ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle size={11} /> In stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 text-xs">
                        <XCircle size={11} /> Out
                      </span>
                    )}
                    <span className="text-white font-bold text-sm">৳{entry.price?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl px-5 py-4
                        flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-slate-300 text-sm font-medium">Add a medicine to this shop</p>
            <p className="text-slate-600 text-xs mt-0.5">Know a medicine available here? Share it</p>
          </div>
          <button onClick={() => navigate(`/add?type=entry&shopId=${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400
                       text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
            <Pill size={13} /> Add Medicine
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
