import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  X,
  Search,
  MapPin,
  ThumbsUp,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const STEPS = [
  {
    icon: Search,
    color: "emerald",
    step: "01",
    title: "Search Medicines",
    desc: "Type any generic or brand name in the navbar search to instantly find medicines and nearby shops stocking them.",
  },
  {
    icon: MapPin,
    color: "sky",
    step: "02",
    title: "Find Nearby Shops",
    desc: "The map on the home page shows pharmacies near you. Tap a pin to see their inventory and get directions.",
  },
  {
    icon: ThumbsUp,
    color: "amber",
    step: "03",
    title: "Vote on Price Accuracy",
    desc: "See a wrong price? Vote it down. Community votes keep prices accurate and flag fraud shops automatically.",
  },
  {
    icon: Plus,
    color: "rose",
    step: "04",
    title: "Contribute Freely",
    desc: "Add medicines, register shops, or submit prices — no account needed. Your data goes live immediately.",
  },
];

const C = {
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-400/10",
    ring: "ring-emerald-400/20",
    bar: "bg-emerald-400",
  },
  sky: {
    icon: "text-sky-400",
    bg: "bg-sky-400/10",
    ring: "ring-sky-400/20",
    bar: "bg-sky-400",
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-400/10",
    ring: "ring-amber-400/20",
    bar: "bg-amber-400",
  },
  rose: {
    icon: "text-rose-400",
    bg: "bg-rose-400/10",
    ring: "ring-rose-400/20",
    bar: "bg-rose-400",
  },
};

const WelcomeBanner = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
  const t = setTimeout(() => {
    setShow(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  }, 400);
  return () => clearTimeout(t);
}, []);

  const close = () => {
  setAnimate(false);
  setTimeout(() => setShow(false), 300);
};

  if (!show) return null;

  return (
    /* Backdrop */
    <div
      onClick={close}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        backgroundColor: animate ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
        backdropFilter: animate ? "blur(4px)" : "blur(0px)",
        transition: "background-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80
                   rounded-2xl shadow-2xl overflow-hidden"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(16px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />

        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32
                        bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
        />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center shrink-0"
            >
              {/* <Sparkles size={18} className="text-emerald-400" />
               */}
              <img src="/favicon.svg" alt="logofav" sizes={18} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                Welcome to Medi-Quick
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Community-powered medicine tracker · Bangladesh
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                       text-slate-500 hover:text-white hover:bg-slate-800
                       transition-colors group ml-2 mt-0.5"
          >
            <X
              size={16}
              className="group-hover:rotate-90 transition-transform duration-200"
            />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800 mx-6" />

        {/* Steps */}
        <div className="px-6 py-4 space-y-3">
          {STEPS.map(({ icon: Icon, color, step, title, desc }) => {
            const c = C[color];
            return (
              <div key={step} className="flex items-start gap-4">
                {/* Icon + step number */}
                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center
                                   ${c.bg} ring-1 ${c.ring}`}
                  >
                    <Icon size={15} className={c.icon} />
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 text-[9px] font-black
                                   text-slate-700 leading-none"
                  >
                    {step}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-slate-100 text-sm font-semibold mb-0.5">
                    {title}
                  </p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800 mx-6" />

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-slate-600 text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            No login needed · Always free
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="px-3 py-1.5 text-slate-400 hover:text-white text-xs
                         font-medium transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <button
              onClick={() => {
                close();
                navigate("/add");
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500
                         hover:bg-emerald-400 text-white text-xs font-semibold
                         rounded-lg transition-colors cursor-pointer"
            >
              Start Contributing
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Click outside hint */}
        <p className="text-center text-slate-700 text-[10px] pb-3 -mt-1">
          Click anywhere outside to close
        </p>
      </div>
    </div>
  );
};

export default WelcomeBanner;
