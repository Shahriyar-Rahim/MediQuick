import { useState } from "react";
import api from "../api/axios";
import {
  MessageSquare, Star, Send, CheckCircle,
  Loader2, Bug, Lightbulb, Heart, HelpCircle,
} from "lucide-react";

const TYPES = [
  { id: "general",    icon: HelpCircle, label: "General"    },
  { id: "suggestion", icon: Lightbulb,  label: "Suggestion" },
  { id: "bug",        icon: Bug,        label: "Bug Report"  },
  { id: "praise",     icon: Heart,      label: "Praise"      },
];

const StarRating = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star === value ? null : star)}
        className="transition-transform hover:scale-110"
      >
        <Star
          size={20}
          className={star <= (value || 0)
            ? "text-amber-400 fill-amber-400"
            : "text-slate-600 hover:text-amber-400"}
        />
      </button>
    ))}
    {value && (
      <span className="text-slate-500 text-xs ml-1">
        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
      </span>
    )}
  </div>
);

const FeedbackSection = () => {
  const [form, setForm] = useState({
    name: "", message: "", rating: null, type: "general",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { setError("Please write a message"); return; }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/feedback", form);
      setDone(true);
      setForm({ name: "", message: "", rating: null, type: "general" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center">
          <MessageSquare size={14} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-slate-100 font-semibold text-sm">Share Your Feedback</h2>
          <p className="text-slate-600 text-xs mt-0.5">Help us improve Medi-Quick</p>
        </div>
      </div>

      <div className="p-5">
        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Thank you!</p>
            <p className="text-slate-400 text-sm text-center">
              Your feedback has been submitted and will be reviewed by our team.
            </p>
            <button
              onClick={() => setDone(false)}
              className="text-emerald-400 hover:text-emerald-300 text-sm underline transition-colors"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Type selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: id }))}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center
                              transition-colors text-xs font-medium
                    ${form.type === id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>

            {/* Name */}
            <input
              type="text"
              placeholder="Your name (optional)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                         text-white placeholder-slate-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-500
                         focus:border-transparent transition-colors"
            />

            {/* Message */}
            <textarea
              placeholder="Write your feedback here..."
              value={form.message}
              onChange={(e) => {
                setError("");
                setForm((p) => ({ ...p, message: e.target.value }));
              }}
              rows={4}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                         text-white placeholder-slate-600 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-emerald-500
                         focus:border-transparent transition-colors"
            />
            <div className="flex items-center justify-between -mt-2">
              {error
                ? <p className="text-rose-400 text-xs">{error}</p>
                : <span />}
              <span className="text-slate-700 text-xs">{form.message.length}/1000</span>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs font-medium">Rate us:</span>
              <StarRating
                value={form.rating}
                onChange={(r) => setForm((p) => ({ ...p, rating: r }))}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5
                         bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800
                         disabled:text-emerald-600 text-white text-sm font-semibold
                         rounded-xl transition-colors"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                : <><Send size={14} /> Submit Feedback</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackSection;
