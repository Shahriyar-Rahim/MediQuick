import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  LayoutDashboard,
  LogOut,
  Shield,
  Star,
  Menu,
  X,
  Activity,
} from "lucide-react";

const NavBar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md group-hover:bg-emerald-400 transition-colors">
              <Activity size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Medi<span className="text-emerald-400">-Quick</span>
            </span>
          </Link>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/add"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors shadow"
            >
              <Plus size={15} strokeWidth={2.5} />
              Add Medicine
            </Link>

            {admin ? (
              <div className="flex items-center gap-2">
                {/* Admin badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                  {admin.role === "superadmin" ? (
                    <Star size={13} className="text-yellow-400" fill="currentColor" />
                  ) : (
                    <Shield size={13} className="text-emerald-400" />
                  )}
                  <span className="text-slate-200 text-xs font-medium">{admin.name}</span>
                </div>

                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors"
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-sm font-medium rounded-lg transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors border border-slate-700"
              >
                <Shield size={14} />
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 flex flex-col gap-2">
          <Link
            to="/add"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg"
          >
            <Plus size={15} /> Add Medicine
          </Link>

          {admin ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                {admin.role === "superadmin" ? (
                  <Star size={13} className="text-yellow-400" fill="currentColor" />
                ) : (
                  <Shield size={13} className="text-emerald-400" />
                )}
                <span className="text-slate-200 text-sm font-medium">{admin.name}</span>
                <span className="ml-auto text-xs text-slate-500 capitalize">{admin.role}</span>
              </div>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-slate-300 hover:bg-slate-800 text-sm rounded-lg transition-colors"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-rose-400 hover:bg-rose-950/40 text-sm rounded-lg transition-colors text-left"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-slate-300 hover:bg-slate-800 text-sm rounded-lg border border-slate-700"
            >
              <Shield size={14} /> Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
