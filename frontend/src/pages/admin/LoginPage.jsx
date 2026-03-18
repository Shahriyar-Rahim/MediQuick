import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  Eye,
  EyeOff,
  LogIn,
  Activity,
  MapPin,
  ShieldCheck,
  BarChart3,
  Settings,
  ArrowLeft,
  Mail,
  Lock,
} from "lucide-react";

const FEATURES = [
  { icon: MapPin,      text: "Monitor medicine availability across the map" },
  { icon: ShieldCheck, text: "Review and act on fraud-flagged shops" },
  { icon: BarChart3,   text: "Gap analysis & trending medicine data" },
  { icon: Settings,    text: "Full control over all platform data" },
];

const LoginPage = () => {
  const { login, loading, admin, clearError } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/admin/dashboard";

  const [form, setForm]               = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Already logged in
  useEffect(() => {
    if (admin) navigate(from, { replace: true });
  }, [admin]);

  const handleChange = (e) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast.error("Both fields are required");
      return;
    }
    setSubmitting(true);
    const result = await login(form.email.trim(), form.password);
    setSubmitting(false);
    if (result.success) {
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } else {
      toast.error(result.message || "Invalid credentials");
    }
  };

  const isLoading = loading || submitting;

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between p-10 bg-slate-900 overflow-hidden">

        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Activity size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Medi<span className="text-emerald-400">-Quick</span>
          </span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Admin Control Center
            </p>
            <h1 className="text-white text-3xl font-bold leading-tight">
              Manage the platform
              <br />
              <span className="text-slate-400 font-normal">with full control</span>
            </h1>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-emerald-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative">
          <p className="text-slate-600 text-xs">
            Medi-Quick © {new Date().getFullYear()} · Community-powered medicine data
          </p>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-950">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
              <Activity size={12} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-sm">
              Medi<span className="text-emerald-400">-Quick</span>
            </span>
          </div>
          <div className="w-24" /> {/* spacer */}
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-white text-2xl font-bold mb-1">Admin Login</h2>
              <p className="text-slate-400 text-sm">
                Enter your credentials to access the dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@mediquick.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full pl-9 pr-11 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                           bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-emerald-600
                           text-white text-sm font-semibold rounded-lg transition-colors
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950
                           disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-8 text-center text-xs text-slate-600 leading-relaxed">
              Only authorized administrators can log in.
              <br />
              Users do{" "}
              <span className="text-slate-500 font-medium">not</span>{" "}
              need an account to contribute data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
