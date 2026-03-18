import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  Users, ArrowLeft, Plus, Shield, Star,
  Trash2, ToggleLeft, ToggleRight, KeyRound, Loader2,
} from "lucide-react";

const AccountsPage = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get("/admin/accounts");
      setAccounts(data.data || []);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required"); return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/accounts", form);
      toast.success("Account created");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "admin" });
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await api.patch(`/admin/accounts/${id}/status`, { isActive: !isActive });
      toast.success(isActive ? "Account deactivated" : "Account activated");
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const promoteRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "superadmin" : "admin";
    try {
      await api.patch(`/admin/accounts/${id}/status`, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const deleteAccount = async (id) => {
    if (!confirm("Delete this account?")) return;
    try {
      await api.delete(`/admin/accounts/${id}`);
      toast.success("Account deleted");
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const isSuperAdmin = admin?.role === "superadmin";

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/dashboard")}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 className="text-white font-bold text-lg">Admin Accounts</h1>
              <p className="text-slate-500 text-xs mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {isSuperAdmin && (
            <button onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400
                         text-white text-sm font-semibold rounded-lg transition-colors">
              <Plus size={14} /> New Account
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && isSuperAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Create New Admin Account</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "name",     placeholder: "Full name",   type: "text"     },
                { name: "email",    placeholder: "Email",       type: "email"    },
                { name: "password", placeholder: "Password",    type: "password" },
              ].map(({ name, placeholder, type }) => (
                <input key={name} type={type} placeholder={placeholder}
                  value={form[name]}
                  onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                             text-white placeholder-slate-600 text-sm focus:outline-none
                             focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              ))}
              <select value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl
                           text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400
                             disabled:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-emerald-400 animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Users size={32} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No accounts found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {accounts.map((acc) => (
                <div key={acc._id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                      ${acc.role === "superadmin" ? "bg-yellow-500/10" : "bg-emerald-500/10"}`}>
                      {acc.role === "superadmin"
                        ? <Star size={15} className="text-yellow-400" fill="currentColor" />
                        : <Shield size={15} className="text-emerald-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{acc.name}</p>
                        {acc._id === admin?._id && (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">you</span>
                        )}
                        {!acc.isActive && (
                          <span className="text-xs text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">inactive</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">{acc.email} · {acc.role}</p>
                    </div>
                  </div>

                  {/* Actions — superadmin only, can't act on self */}
                  {isSuperAdmin && acc._id !== admin?._id && (
                    <div className="flex items-center gap-2">
                      {/* Toggle role */}
                      <button onClick={() => promoteRole(acc._id, acc.role)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700
                                   border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
                        <KeyRound size={11} />
                        {acc.role === "admin" ? "Make Super" : "Make Admin"}
                      </button>

                      {/* Toggle active */}
                      <button onClick={() => toggleStatus(acc._id, acc.isActive)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 border text-xs rounded-lg transition-colors
                          ${acc.isActive
                            ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"}`}>
                        {acc.isActive ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                        {acc.isActive ? "Deactivate" : "Activate"}
                      </button>

                      {/* Delete */}
                      <button onClick={() => deleteAccount(acc._id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50
                                   border border-rose-800/50 text-rose-400 text-xs rounded-lg transition-colors">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;