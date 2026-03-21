import { useState } from "react";
import { X, DollarSign, Loader2, CheckCircle, Store } from "lucide-react";
import api from "../api/axios";
import { toast } from "react-toastify";

const PriceUpdateModal = ({ entry, medicine, onClose, onSuccess }) => {
  const [price,       setPrice]       = useState(entry.price?.toFixed(2) || "");
  const [isAvailable, setIsAvailable] = useState(entry.isAvailable);
  const [brandName,   setBrandName]   = useState(entry.brandName || "");
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);

  const [anim, setAnim] = useState(true);

  const close = () => {
    setAnim(false);
    setTimeout(onClose, 250);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!price || isNaN(parseFloat(price))) {
      toast.error("Enter a valid price");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/entries/${entry._id}`, {
        price:       parseFloat(price),
        isAvailable,
        brandName:   brandName.trim() || undefined,
      });
      setDone(true);
      toast.success("Price updated!");
      setTimeout(() => { close(); onSuccess?.(); }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: anim ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0)", backdropFilter: "blur(4px)",
               transition: "background 0.25s ease" }}
      onClick={close}
    >
      <div
        className="w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-t-2xl
                   sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{
          opacity:   anim ? 1 : 0,
          transform: anim ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center">
              <DollarSign size={14} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Update Price</h3>
              <p className="text-slate-500 text-xs capitalize">{medicine?.genericName}</p>
            </div>
          </div>
          <button onClick={close}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group">
            <X size={15} className="group-hover:rotate-90 transition-transform duration-150" />
          </button>
        </div>

        {/* Shop info */}
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-800/40 border-b border-slate-800">
          <Store size={13} className="text-sky-400 shrink-0" />
          <div>
            <p className="text-slate-200 text-xs font-medium">{entry.shop?.name}</p>
            {entry.shop?.address && (
              <p className="text-slate-600 text-xs">{entry.shop.address}</p>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-slate-500 text-xs">Current</p>
            <p className="text-slate-300 text-sm font-bold">৳{entry.price?.toFixed(2)}</p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <CheckCircle size={32} className="text-emerald-400" />
            <p className="text-white font-semibold text-sm">Price updated!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-4 space-y-4">
            {/* New price */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">New Price (BDT)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">৳</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                             text-white text-sm placeholder-slate-600
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Brand name */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Brand Name <span className="text-slate-600">(optional)</span></label>
              <input
                type="text" placeholder="e.g. Napa, Ace..."
                value={brandName} onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                           text-white text-sm placeholder-slate-600
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Availability toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 text-xs font-medium">In Stock</span>
              <button type="button"
                onClick={() => setIsAvailable((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isAvailable ? "bg-emerald-500" : "bg-slate-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${isAvailable ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5
                         bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800
                         disabled:text-emerald-600 text-white font-semibold text-sm
                         rounded-xl transition-colors">
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Updating...</>
                : <><DollarSign size={14} /> Update Price</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PriceUpdateModal;
