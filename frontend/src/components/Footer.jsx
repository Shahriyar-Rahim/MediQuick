import { Link } from "react-router";
import {
  Activity,
  MapPin,
  Shield,
  Info,
  Phone,
  PlusCircle,
  Pill,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 group w-fit">
              <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
                <Activity size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white font-bold tracking-tight">
                Medi<span className="text-emerald-400">-Quick</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              A crowdsourced platform. All users can update medicine
              availability, generic names, pictures, and prices. Admin
              controls and user votes ensure accuracy.
            </p>
            <p className="mt-3 text-xs text-slate-600 italic">
              Use with discretion.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-slate-200 text-xs font-semibold uppercase tracking-widest mb-4">
              Platform
            </p>
            <ul className="space-y-2.5">
              {[
                { to: "/", icon: MapPin, label: "Home & Map" },
                { to: "/add", icon: PlusCircle, label: "Add Medicine" },
                { to: "/medicines", icon: Pill, label: "Browse Medicines" },
              ].map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                  >
                    <Icon size={13} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin links */}
          <div>
            <p className="text-slate-200 text-xs font-semibold uppercase tracking-widest mb-4">
              Admin
            </p>
            <ul className="space-y-2.5">
              {[
                { to: "/admin/login", icon: Shield, label: "Admin Login" },
                { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
              ].map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                  >
                    <Icon size={13} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info links */}
          <div>
            <p className="text-slate-200 text-xs font-semibold uppercase tracking-widest mb-4">
              Info
            </p>
            <ul className="space-y-2.5">
              {[
                { to: "/about", icon: Info, label: "About Us" },
                { to: "/contact", icon: Phone, label: "Contact" },
              ].map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                  >
                    <Icon size={13} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer bar */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Medi-Quick. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5 text-amber-600/80 text-xs">
            <AlertTriangle size={11} className="shrink-0" />
            Data is community-sourced. Verify with a licensed pharmacist before purchase.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
