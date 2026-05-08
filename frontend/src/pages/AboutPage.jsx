import { Link } from "react-router";
import {
  Activity, Heart, Users, Shield, MapPin,
  Droplets, Siren, Pill, ArrowRight, Github,
} from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: Heart,
      color: "text-red-500",
      bg:    "bg-red-50 border-red-100",
      title: "Community First",
      desc:  "Built by the community, for the community. Every data point comes from real people helping their neighbors.",
    },
    {
      icon: Shield,
      color: "text-[#1E40AF]",
      bg:    "bg-blue-50 border-blue-100",
      title: "Accuracy Matters",
      desc:  "Community voting and admin oversight keep prices and availability trustworthy.",
    },
    {
      icon: MapPin,
      color: "text-emerald-600",
      bg:    "bg-emerald-50 border-emerald-100",
      title: "Hyper-Local",
      desc:  "Focused on Bangladesh. GPS-powered results show what's actually near you.",
    },
    {
      icon: Users,
      color: "text-purple-500",
      bg:    "bg-purple-50 border-purple-100",
      title: "Always Free",
      desc:  "No accounts, no fees, no ads. Just open access to healthcare information.",
    },
  ];

  const features = [
    { icon: Pill,     label: "Medicine Search",   desc: "Find any medicine by generic or brand name" },
    { icon: MapPin,   label: "Nearby Shops",       desc: "See pharmacies on a live map near you"      },
    { icon: Droplets, label: "Blood Donation",     desc: "Connect donors with patients in need"       },
    { icon: Siren,    label: "Ambulance Finder",   desc: "Locate ambulance services instantly"        },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFB]">

      {/* Hero */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          {/* <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#1E40AF] flex items-center justify-center shadow-md shadow-blue-700/20">
              <Activity size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-800 font-extrabold text-xl tracking-tight">
              Medi<span className="text-[#1E40AF]">-Quick</span>
            </span>
          </div> */}
          <h1 className="text-slate-800 text-2xl sm:text-3xl font-extrabold leading-snug mb-3">
            Making medicine accessible<br />
            <span style={{ color: "#059669" }}>for every Bangladeshi</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Medi-Quick is a free, community-powered platform that helps people find
            medicines, compare prices, locate nearby pharmacies, connect blood donors,
            and find ambulance services — all in one place.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Values */}
        <div>
          <h2 className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-4">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {values.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title}
                className={`flex items-start gap-4 p-4 bg-white border rounded-2xl shadow-sm ${bg}`}>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{title}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-4">
            What We Offer
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label}
                className="flex flex-col items-center text-center gap-2 p-4
                           bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#1E40AF]/5 border border-blue-100
                                flex items-center justify-center">
                  <Icon size={16} className="text-[#1E40AF]" />
                </div>
                <p className="text-slate-800 text-xs font-semibold">{label}</p>
                <p className="text-slate-400 text-[11px] leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-slate-700 text-sm font-bold uppercase tracking-wider mb-3">
            Our Mission
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Healthcare information in Bangladesh is fragmented. Patients travel between
            pharmacies not knowing who has what medicine, at what price. Medi-Quick
            solves this by crowdsourcing real-time availability data — directly from
            pharmacists, patients, and community volunteers.
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mt-3">
            We believe access to medicine information is a right, not a privilege.
            That's why Medi-Quick will always be free, open, and community-driven.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-amber-800 text-xs font-semibold uppercase tracking-wider mb-2">
            ⚠️ Important Disclaimer
          </p>
          <p className="text-amber-700 text-sm leading-relaxed">
            All data on Medi-Quick is community-sourced and may not be 100% accurate.
            Always verify medicine availability and prices with a licensed pharmacist
            before making any purchase or medical decision.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to="/medicines"
            className="flex items-center gap-2 px-5 py-3 bg-[#1E40AF] hover:bg-blue-900
                       text-white text-sm font-semibold rounded-xl transition-colors
                       shadow-sm shadow-blue-700/15 w-full sm:w-auto justify-center">
            Start Searching <ArrowRight size={14} />
          </Link>
          <Link to="/add"
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200
                       hover:border-slate-300 text-slate-600 hover:text-slate-800
                       text-sm font-semibold rounded-xl transition-colors
                       w-full sm:w-auto justify-center">
            Contribute Data <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;