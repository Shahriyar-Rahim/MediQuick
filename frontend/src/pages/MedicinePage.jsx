import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import api from "../api/axios";
import PriceUpdateModal from "../components/PriceUpdateModal";
import {
  Pill, ArrowLeft, MapPin, ThumbsUp, ThumbsDown,
  CheckCircle, XCircle, Store, ArrowUpDown,
  BadgeCheck, AlertTriangle, ImagePlus, Loader2,
  ChevronDown, ChevronUp, Pencil,
} from "lucide-react";

//Reusable small badge
const Badge = ({ children, color = "emerald" }) => {
  const c = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    amber:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    slate:   "bg-slate-700 text-slate-400 border-slate-600",
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs capitalize ${c}`}>
      {children}
    </span>
  );
};

//Price vote buttons
const PriceVoteRow = ({ entry, onVote }) => {
  const [myVote, setMyVote] = useState(null);
  const [votes,  setVotes]  = useState(entry.priceVotes || { correct: 0, incorrect: 0 });
  const [busy,   setBusy]   = useState(false);

  // Check if IP already voted
  useEffect(() => {
    api.get(`/votes/check?type=price&targetId=${entry._id}`)
      .then(({ data }) => { if (data.hasVoted) setMyVote(data.currentVote); })
      .catch(() => {});
  }, [entry._id]);

  const handleVote = async (value) => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/votes/price/${entry._id}`, { value });
      setVotes(data.data.priceVotes);
      setMyVote(value);
      toast.success("Vote recorded!");
      onVote?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Vote failed");
    } finally {
      setBusy(false);
    }
  };

  const total = votes.correct + votes.incorrect;
  const pct   = total > 0 ? Math.round((votes.correct / total) * 100) : null;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVote("correct")}
        disabled={busy || myVote === "correct"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
          ${myVote === "correct"
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"}`}
      >
        <ThumbsUp size={11} /> {votes.correct}
      </button>
      <button
        onClick={() => handleVote("incorrect")}
        disabled={busy || myVote === "incorrect"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
          ${myVote === "incorrect"
            ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"}`}
      >
        <ThumbsDown size={11} /> {votes.incorrect}
      </button>
      {pct !== null && (
        <span className={`text-xs font-medium ${pct >= 60 ? "text-emerald-400" : "text-rose-400"}`}>
          {pct}% accurate
        </span>
      )}
    </div>
  );
};

// Main component
const MedicinesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine,   setMedicine]   = useState(null);
  const [entries,    setEntries]    = useState([]);
  const [compare,    setCompare]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState("price"); // price | availability
  const [showDesc,   setShowDesc]   = useState(false);
  const [updateEntry,setUpdateEntry]= useState(null); // entry being price-updated

  const fetchData = async () => {
    try {
      const [medRes, entryRes, compareRes] = await Promise.allSettled([
        api.get(`/medicines/${id}`),
        api.get(`/entries/medicine/${id}`),
        api.get(`/entries/compare/${id}`),
      ]);
      if (medRes.status     === "fulfilled") setMedicine(medRes.value.data.data);
      if (entryRes.status   === "fulfilled") setEntries(entryRes.value.data.data || []);
      if (compareRes.status === "fulfilled") setCompare(compareRes.value.data);
    } catch {
      toast.error("Failed to load medicine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === "price")        return a.price - b.price;
    if (sortBy === "availability") return (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0);
    return 0;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="text-emerald-400 animate-spin" />
        <p className="text-slate-500 text-sm">Loading medicine...</p>
      </div>
    </div>
  );

  if (!medicine) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Pill size={36} className="text-slate-700" />
      <p className="text-slate-400 text-sm">Medicine not found</p>
      <button onClick={() => navigate("/medicines")}
        className="text-emerald-400 hover:text-emerald-300 text-sm underline">
        Back to Medicines
      </button>
    </div>
  );

  return (
    <div className="bg-slate-950 min-h-screen">
      {updateEntry && (
        <PriceUpdateModal
          entry={updateEntry}
          medicine={medicine}
          onClose={() => setUpdateEntry(null)}
          onSuccess={fetchData}
        />
      )}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Medicine header card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start gap-4">
            {/* Image / icon */}
            <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center shrink-0 overflow-hidden">
              {medicine.image?.url ? (
                <img src={medicine.image.url} alt={medicine.genericName}
                  className="w-full h-full object-cover" />
              ) : (
                <Pill size={24} className="text-emerald-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-white text-xl font-bold capitalize">{medicine.genericName}</h1>
                  {medicine.brandNames?.length > 0 && (
                    <p className="text-slate-400 text-sm mt-0.5">
                      {medicine.brandNames.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge color="emerald">{medicine.category}</Badge>
                  {medicine.addedBy === "user" && <Badge color="slate">community</Badge>}
                </div>
              </div>

              {/* Description toggle */}
              {medicine.description && (
                <div className="mt-3">
                  <button onClick={() => setShowDesc((v) => !v)}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs transition-colors">
                    {showDesc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showDesc ? "Hide" : "Show"} description
                  </button>
                  {showDesc && (
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">{medicine.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload image prompt */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
            <ImagePlus size={13} className="text-slate-600" />
            <span className="text-slate-600 text-xs">
              Have a better photo?{" "}
              <button onClick={() => navigate(`/add?type=medicineImage&id=${id}`)}
                className="text-emerald-500 hover:text-emerald-400 underline">
                Upload one
              </button>
            </span>
          </div>
        </div>

        {/* Price comparison summary */}
        {compare && compare.count > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Lowest Price",  value: `৳${compare.lowestPrice}`,  color: "emerald" },
              { label: "Highest Price", value: `৳${compare.highestPrice}`, color: "rose"    },
              { label: "Price Gap",     value: `৳${compare.priceGap}`,     color: "amber"   },
            ].map(({ label, value, color }) => (
              <div key={label}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <p className={`font-bold text-lg ${
                  color === "emerald" ? "text-emerald-400" :
                  color === "rose"    ? "text-rose-400"    : "text-amber-400"
                }`}>{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Shop availability table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-400/10 flex items-center justify-center">
                <Store size={14} className="text-sky-400" />
              </div>
              <h2 className="text-slate-100 font-semibold text-sm">
                Available At ({entries.length} shop{entries.length !== 1 ? "s" : ""})
              </h2>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1">
              <ArrowUpDown size={12} className="text-slate-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg px-2 py-1
                           focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="price">Sort: Cheapest</option>
                <option value="availability">Sort: Available first</option>
              </select>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertTriangle size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No shops carry this medicine yet</p>
              <button onClick={() => navigate(`/add?type=entry&medicineId=${id}`)}
                className="text-emerald-400 hover:text-emerald-300 text-sm underline">
                Add this medicine to a shop
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {sortedEntries.map((entry, i) => (
                <div key={entry._id}
                  className={`px-5 py-4 hover:bg-slate-800/40 transition-colors ${i === 0 ? "bg-emerald-950/10" : ""}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      {/* Cheapest badge */}
                      {i === 0 && entries.length > 1 && (
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30
                                        flex items-center justify-center shrink-0 mt-0.5">
                          <BadgeCheck size={12} className="text-emerald-400" />
                        </div>
                      )}

                      <div>
                        <button
                          onClick={() => navigate(`/shops/${entry.shop?._id}`)}
                          className="text-white font-semibold text-sm hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                          <MapPin size={12} className="text-slate-500" />
                          {entry.shop?.name || "Unknown shop"}
                        </button>
                        {entry.shop?.address && (
                          <p className="text-slate-600 text-xs mt-0.5">{entry.shop.address}</p>
                        )}
                        {entry.brandName && (
                          <p className="text-slate-500 text-xs mt-1">Brand: {entry.brandName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-white font-bold text-lg">৳{entry.price.toFixed(2)}</span>
                        {compare && i === 0 && entries.length > 1 && (
                          <span className="text-emerald-400 text-xs font-medium">Cheapest</span>
                        )}
                        {compare && i > 0 && (
                          <span className="text-slate-600 text-xs">
                            +৳{(entry.price - compare.lowestPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {entry.isAvailable ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle size={11} /> In stock
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 text-xs">
                          <XCircle size={11} /> Out of stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price vote row */}
                  <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-slate-600 text-xs">Is this price accurate?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUpdateEntry(entry)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800
                                   hover:bg-slate-700 border border-slate-700 text-slate-400
                                   hover:text-white text-xs rounded-lg transition-colors">
                        <Pencil size={11} /> Update Price
                      </button>
                      <PriceVoteRow entry={entry} onVote={fetchData} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add to shop CTA */}
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl px-5 py-4
                        flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-slate-300 text-sm font-medium">Know a shop that carries this?</p>
            <p className="text-slate-600 text-xs mt-0.5">Add availability + price so others can find it</p>
          </div>
          <button
            onClick={() => navigate(`/add?type=entry&medicineId=${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400
                       text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            <Store size={14} /> Add to Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicinesPage;
