import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  MessageSquare, Star, Bug, Lightbulb, Heart, HelpCircle,
  CheckCheck, Trash2, Archive, Loader2, ChevronDown,
  MailOpen, Mail,
} from "lucide-react";

const TYPE_META = {
  general:    { icon: HelpCircle, color: "text-slate-400",   bg: "bg-slate-700/50"        },
  suggestion: { icon: Lightbulb,  color: "text-amber-400",   bg: "bg-amber-500/10"        },
  bug:        { icon: Bug,        color: "text-rose-400",    bg: "bg-rose-500/10"         },
  praise:     { icon: Heart,      color: "text-emerald-400", bg: "bg-emerald-500/10"      },
};

const StarDisplay = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <Star key={s} size={10}
        className={s <= (value || 0) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
    ))}
  </div>
);

const AdminFeedback = () => {
  const [feedbacks,  setFeedbacks]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [busy,       setBusy]       = useState({});

  const fetchFeedbacks = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (readFilter !== "all") params.append("isRead", readFilter === "unread" ? "false" : "true");

      const [fbRes, statRes] = await Promise.all([
        api.get(`/feedback/admin?${params}`),
        api.get("/feedback/admin/stats"),
      ]);
      setFeedbacks(fbRes.data.data || []);
      setTotal(fbRes.data.total    || 0);
      setStats(statRes.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(1); }, [typeFilter, readFilter]);

  const action = async (id, route, method = "patch") => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await api[method](route);
      fetchFeedbacks(page);
    } catch {
      // silent
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const markAllRead = async () => {
    await api.patch("/feedback/admin/read-all");
    fetchFeedbacks(page);
  };

  return (
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
        <button onClick={markAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700
                     border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
          <CheckCheck size={12} /> Mark all read
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 py-3 border-b border-slate-800">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{stats.total}</p>
            <p className="text-slate-600 text-xs">Total</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-400 font-bold text-lg">{stats.unread}</p>
            <p className="text-slate-600 text-xs">Unread</p>
          </div>
          <div className="text-center">
            <p className="text-amber-400 font-bold text-lg">
              {stats.avgRating ? `${stats.avgRating}★` : "—"}
            </p>
            <p className="text-slate-600 text-xs">Avg Rating</p>
          </div>
          <div className="text-center">
            <p className="text-rose-400 font-bold text-lg">{stats.byType?.bug || 0}</p>
            <p className="text-slate-600 text-xs">Bugs</p>
          </div>
          <div className="text-center">
            <p className="text-amber-400 font-bold text-lg">{stats.byType?.suggestion || 0}</p>
            <p className="text-slate-600 text-xs">Suggestions</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 flex-wrap">
        {/* Type filter */}
        <div className="flex items-center gap-1">
          {["all", "general", "suggestion", "bug", "praise"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors
                ${typeFilter === t
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        {/* Read filter */}
        <div className="flex items-center gap-1">
          {["all", "unread", "read"].map((r) => (
            <button key={r} onClick={() => setReadFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors
                ${readFilter === r
                  ? "bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-500 hover:text-white"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
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
            <div key={fb._id}
              className={`px-5 py-4 transition-colors hover:bg-slate-800/30
                ${!fb.isRead ? "border-l-2 border-emerald-500" : "border-l-2 border-transparent"}`}>

              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Type icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <Icon size={14} className={meta.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white text-sm font-medium">{fb.name}</span>
                      <span className="text-slate-600 text-xs capitalize px-1.5 py-0.5
                                       bg-slate-800 rounded-full">{fb.type}</span>
                      {!fb.isRead && (
                        <span className="text-emerald-400 text-xs font-medium">• New</span>
                      )}
                      {fb.rating && <StarDisplay value={fb.rating} />}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{fb.message}</p>
                    <p className="text-slate-600 text-xs mt-1.5">
                      {new Date(fb.createdAt).toLocaleString("en-BD", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!fb.isRead && (
                    <button
                      onClick={() => action(fb._id, `/feedback/admin/${fb._id}/read`)}
                      disabled={busy[fb._id]}
                      title="Mark as read"
                      className="p-1.5 bg-slate-800 hover:bg-emerald-500/10 border border-slate-700
                                 hover:border-emerald-500/30 text-slate-500 hover:text-emerald-400
                                 rounded-lg transition-colors">
                      {busy[fb._id]
                        ? <Loader2 size={12} className="animate-spin" />
                        : <MailOpen size={12} />}
                    </button>
                  )}
                  <button
                    onClick={() => action(fb._id, `/feedback/admin/${fb._id}/archive`)}
                    disabled={busy[fb._id]}
                    title="Archive"
                    className="p-1.5 bg-slate-800 hover:bg-amber-500/10 border border-slate-700
                               hover:border-amber-500/30 text-slate-500 hover:text-amber-400
                               rounded-lg transition-colors">
                    <Archive size={12} />
                  </button>
                  <button
                    onClick={() => action(fb._id, `/feedback/admin/${fb._id}`, "delete")}
                    disabled={busy[fb._id]}
                    title="Delete"
                    className="p-1.5 bg-slate-800 hover:bg-rose-950/50 border border-slate-700
                               hover:border-rose-500/30 text-slate-500 hover:text-rose-400
                               rounded-lg transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
          <button disabled={page === 1}
            onClick={() => { setPage(page - 1); fetchFeedbacks(page - 1); }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400
                       hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Prev
          </button>
          <span className="text-slate-600 text-xs">
            Page {page} of {Math.ceil(total / 10)} · {total} total
          </span>
          <button disabled={page * 10 >= total}
            onClick={() => { setPage(page + 1); fetchFeedbacks(page + 1); }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400
                       hover:text-white text-xs rounded-lg disabled:opacity-30 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
