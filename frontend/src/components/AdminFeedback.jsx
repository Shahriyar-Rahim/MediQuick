import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import {
  MessageSquare, Star, Bug, Lightbulb, Heart, HelpCircle,
  CheckCheck, Trash2, Archive, Loader2, MailOpen,
  X, ChevronLeft, ChevronRight, ExternalLink, Eye,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_META = {
  general:    { icon: HelpCircle, color: "text-slate-400",   bg: "bg-slate-700/50",   label: "General"    },
  suggestion: { icon: Lightbulb,  color: "text-amber-400",   bg: "bg-amber-500/10",   label: "Suggestion" },
  bug:        { icon: Bug,        color: "text-rose-400",    bg: "bg-rose-500/10",    label: "Bug"        },
  praise:     { icon: Heart,      color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Praise"     },
};

const StarDisplay = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <Star key={s} size={10}
        className={s <= (value || 0) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
    ))}
  </div>
);

const fmt = (d) => new Date(d).toLocaleString("en-BD", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

// ── Toast popup for a single feedback ────────────────────────────────────────
const FeedbackToast = ({ fb, onClose, onAction, busy }) => {
  const meta = TYPE_META[fb.type] || TYPE_META.general;
  const Icon = meta.icon;
  const ref  = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const barColor =
    fb.type === "bug"        ? "bg-rose-500"    :
    fb.type === "suggestion" ? "bg-amber-500"   :
    fb.type === "praise"     ? "bg-emerald-500" : "bg-slate-600";

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center
                    justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}>
      <div ref={ref}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "fbSlideUp 0.25s ease" }}>
        <style>{`@keyframes fbSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        <div className={`h-1 w-full ${barColor}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
              <Icon size={16} className={meta.color} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{fb.name}</span>
                {!fb.isRead && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10
                                   px-1.5 py-0.5 rounded-full border border-emerald-400/20">NEW</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-slate-500 text-xs capitalize">{meta.label}</span>
                {fb.rating && (
                  <><span className="text-slate-700 text-xs">·</span><StarDisplay value={fb.rating} /></>
                )}
                <span className="text-slate-700 text-xs">·</span>
                <span className="text-slate-600 text-xs">{fmt(fb.createdAt)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800
                       rounded-lg transition-colors shrink-0 group">
            <X size={15} className="group-hover:rotate-90 transition-transform duration-150" />
          </button>
        </div>

        {/* Message */}
        <div className="px-5 pb-4">
          <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
            <p className="text-slate-200 text-sm leading-relaxed">{fb.message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
          {!fb.isRead && (
            <button onClick={() => onAction(fb._id, `/feedback/admin/${fb._id}/read`)}
              disabled={busy[fb._id]}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10
                         hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400
                         text-xs font-medium rounded-lg transition-colors">
              {busy[fb._id] ? <Loader2 size={11} className="animate-spin" /> : <MailOpen size={11} />}
              Mark Read
            </button>
          )}
          <button onClick={() => onAction(fb._id, `/feedback/admin/${fb._id}/archive`)}
            disabled={busy[fb._id]}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800
                       hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/30
                       text-slate-400 hover:text-amber-400 text-xs font-medium rounded-lg transition-colors">
            <Archive size={11} /> Archive
          </button>
          <button onClick={() => onAction(fb._id, `/feedback/admin/${fb._id}`, "delete")}
            disabled={busy[fb._id]}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800
                       hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/30
                       text-slate-400 hover:text-rose-400 text-xs font-medium rounded-lg transition-colors">
            <Trash2 size={11} /> Delete
          </button>
          <button onClick={onClose}
            className="ml-auto text-slate-500 hover:text-slate-300 text-xs transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View All modal ────────────────────────────────────────────────────────────
const ViewAllModal = ({ onClose, onAction, busy }) => {
  const [feedbacks,  setFeedbacks]  = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected,   setSelected]   = useState(null);
  const LIMIT = 5;

  const fetchAll = async (p = 1, type = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (type !== "all") params.append("type", type);
      const { data } = await api.get(`/feedback/admin?${params}`);
      setFeedbacks(data.data || []);
      setTotal(data.total || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(1, "all"); }, []);
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const changeType = (t) => { setTypeFilter(t); setPage(1); fetchAll(1, t); };
  const changePage = (p) => { setPage(p); fetchAll(p); };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>

      {selected && (
        <FeedbackToast
          fb={selected}
          onClose={() => { setSelected(null); fetchAll(page); }}
          onAction={async (id, route, method) => {
            await onAction(id, route, method);
            setSelected(null);
            fetchAll(page);
          }}
          busy={busy}
        />
      )}

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl
                      shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <MessageSquare size={14} className="text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold text-sm">All Feedback</h2>
            <span className="text-slate-600 text-xs">({total} total)</span>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800
                       rounded-lg transition-colors group">
            <X size={15} className="group-hover:rotate-90 transition-transform duration-150" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-800 shrink-0 flex-wrap">
          {["all", "general", "suggestion", "bug", "praise"].map((t) => (
            <button key={t} onClick={() => changeType(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors
                ${typeFilter === t ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-emerald-400 animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <MessageSquare size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No feedback found</p>
            </div>
          ) : feedbacks.map((fb) => {
            const meta = TYPE_META[fb.type] || TYPE_META.general;
            const Icon = meta.icon;
            return (
              <button key={fb._id} onClick={() => setSelected(fb)}
                className={`w-full flex items-start gap-3 px-5 py-3.5 text-left
                            hover:bg-slate-800/50 transition-colors group
                            ${!fb.isRead ? "border-l-2 border-emerald-500" : "border-l-2 border-transparent"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                 shrink-0 mt-0.5 ${meta.bg}`}>
                  <Icon size={13} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-white text-sm font-medium">{fb.name}</span>
                    {!fb.isRead && <span className="text-[10px] font-bold text-emerald-400">NEW</span>}
                    {fb.rating && <StarDisplay value={fb.rating} />}
                    <span className="text-slate-600 text-xs capitalize">{meta.label}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{fb.message}</p>
                  <p className="text-slate-700 text-xs mt-1">{fmt(fb.createdAt)}</p>
                </div>
                <Eye size={13} className="text-slate-700 group-hover:text-slate-400
                                          shrink-0 mt-1 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 shrink-0">
          <button onClick={() => changePage(page - 1)} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700
                       text-slate-400 hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-slate-500 text-xs">
            Page {page} of {totalPages || 1} · {total} total
          </span>
          <button onClick={() => changePage(page + 1)} disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700
                       text-slate-400 hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main widget ───────────────────────────────────────────────────────────────
const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [busy,      setBusy]      = useState({});
  const [selected,  setSelected]  = useState(null);
  const [viewAll,   setViewAll]   = useState(false);
  const LIMIT = 5;

  const fetchFeedbacks = async (p = 1) => {
    setLoading(true);
    try {
      const [fbRes, statRes] = await Promise.all([
        api.get(`/feedback/admin?page=${p}&limit=${LIMIT}`),
        api.get("/feedback/admin/stats"),
      ]);
      setFeedbacks(fbRes.data.data || []);
      setTotal(fbRes.data.total    || 0);
      setStats(statRes.data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedbacks(1); }, []);

  const action = async (id, route, method = "patch") => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await api[method](route);
      fetchFeedbacks(page);
    } catch { /* silent */ }
    finally { setBusy((b) => ({ ...b, [id]: false })); }
  };

  const markAllRead = async () => {
    await api.patch("/feedback/admin/read-all");
    fetchFeedbacks(page);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {selected && (
        <FeedbackToast
          fb={selected}
          onClose={() => { setSelected(null); fetchFeedbacks(page); }}
          onAction={async (id, route, method) => {
            await action(id, route, method);
            setSelected(null);
          }}
          busy={busy}
        />
      )}

      {viewAll && (
        <ViewAllModal
          onClose={() => { setViewAll(false); fetchFeedbacks(page); }}
          onAction={action}
          busy={busy}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <MessageSquare size={14} className="text-emerald-400" />
            </div>
            <h2 className="text-slate-100 font-semibold text-sm">User Feedback</h2>
            {stats?.unread > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                {stats.unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                         border border-slate-700 text-slate-400 hover:text-white text-xs
                         rounded-lg transition-colors">
              <CheckCheck size={12} /> Mark all read
            </button>
            <button onClick={() => setViewAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10
                         hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400
                         hover:text-emerald-300 text-xs font-medium rounded-lg transition-colors">
              <ExternalLink size={12} /> View All
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-2 px-5 py-3 border-b border-slate-800">
            {[
              { label: "Total",       value: stats.total,                          color: "text-white"       },
              { label: "Unread",      value: stats.unread,                         color: "text-emerald-400" },
              { label: "Avg Rating",  value: stats.avgRating ? `${stats.avgRating}★` : "—", color: "text-amber-400" },
              { label: "Bugs",        value: stats.byType?.bug || 0,               color: "text-rose-400"    },
              { label: "Suggestions", value: stats.byType?.suggestion || 0,        color: "text-amber-400"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`font-bold text-lg ${color}`}>{value}</p>
                <p className="text-slate-600 text-xs">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cards — click to open toast */}
        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="text-emerald-400 animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <MessageSquare size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No feedback yet</p>
            </div>
          ) : feedbacks.map((fb) => {
            const meta = TYPE_META[fb.type] || TYPE_META.general;
            const Icon = meta.icon;
            return (
              <button key={fb._id}
                onClick={() => setSelected(fb)}
                className={`w-full flex items-start gap-3 px-5 py-4 text-left
                            hover:bg-slate-800/40 transition-colors group cursor-pointer
                            ${!fb.isRead ? "border-l-2 border-emerald-500" : "border-l-2 border-transparent"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                 shrink-0 mt-0.5 ${meta.bg}`}>
                  <Icon size={13} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-white text-sm font-medium">{fb.name}</span>
                    {!fb.isRead && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10
                                       px-1.5 py-0.5 rounded-full">NEW</span>
                    )}
                    {fb.rating && <StarDisplay value={fb.rating} />}
                    <span className="text-slate-600 text-xs capitalize">{meta.label}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-1">{fb.message}</p>
                  <p className="text-slate-700 text-xs mt-1">{fmt(fb.createdAt)}</p>
                </div>
                <Eye size={13} className="text-slate-700 group-hover:text-slate-400
                                          shrink-0 mt-1 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Pagination — 5 per page */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
          <button onClick={() => { const p = page - 1; setPage(p); fetchFeedbacks(p); }}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700
                       text-slate-400 hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-slate-600 text-xs">
            {total === 0
              ? "No feedback"
              : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`}
          </span>
          <button onClick={() => { const p = page + 1; setPage(p); fetchFeedbacks(p); }}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700
                       text-slate-400 hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminFeedback;
