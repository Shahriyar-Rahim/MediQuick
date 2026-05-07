import { useState, useEffect } from "react";
import { X, Download, ChevronRight } from "lucide-react";

const getEnv = () => {
  const ua        = navigator.userAgent.toLowerCase();
  const isIOS     = /iphone|ipad|ipod/.test(ua);
  const isMac     = /macintosh|mac os x/.test(ua) && !isIOS;
  const isAndroid = /android/.test(ua);
  const isWindows = /windows/.test(ua);
  const isSafari  = /safari/.test(ua) && !/chrome|crios/.test(ua);
  const isChrome  = /chrome/.test(ua) && !/edg/.test(ua);
  const isEdge    = /edg/.test(ua);
  const isFirefox = /firefox/.test(ua);

  // Supports native beforeinstallprompt (Chrome & Edge on Android/Desktop)
  const supportsNative = (isChrome || isEdge) && (isAndroid || isWindows || isMac);

  return { isIOS, isMac, isAndroid, isWindows, isSafari, isChrome, isEdge, isFirefox, supportsNative };
};

const getInstructions = (env) => {
  if (env.isIOS) return {
    os: "iOS — Safari",
    emoji: "🍎",
    color: "sky",
    steps: [
      { n: "1", text: <>Tap the <strong className="text-white">Share</strong> button <span className="font-bold">⎙</span> at the bottom of Safari</> },
      { n: "2", text: <>Scroll and tap <strong className="text-white">"Add to Home Screen"</strong></> },
      { n: "3", text: <>Tap <strong className="text-white">"Add"</strong> in the top-right corner</> },
    ],
    note: "Must use Safari. Chrome on iOS doesn't support installation.",
  };

  if (env.isAndroid) return {
    os: "Android — Chrome",
    emoji: "🤖",
    color: "emerald",
    steps: [
      { n: "1", text: <>Tap <strong className="text-white">⋮</strong> (menu) in the top-right of Chrome</> },
      { n: "2", text: <>Tap <strong className="text-white">"Add to Home screen"</strong> or <strong className="text-white">"Install app"</strong></> },
      { n: "3", text: <>Tap <strong className="text-white">"Install"</strong> to confirm</> },
    ],
    note: null,
  };

  if (env.isFirefox) return {
    os: "Firefox",
    emoji: "🦊",
    color: "amber",
    steps: [
      { n: "1", text: <>Click the <strong className="text-white">address bar</strong> and look for a home icon</> },
      { n: "2", text: <>Or open <strong className="text-white">☰ menu</strong> → <strong className="text-white">"Install"</strong></> },
      { n: "3", text: <>Confirm installation in the popup</> },
    ],
    note: "For best PWA support, Chrome or Edge is recommended.",
  };

  if (env.isMac && env.isSafari) return {
    os: "macOS — Safari",
    emoji: "🍎",
    color: "sky",
    steps: [
      { n: "1", text: <>Click <strong className="text-white">File</strong> in the menu bar</> },
      { n: "2", text: <>Click <strong className="text-white">"Add to Dock"</strong></> },
      { n: "3", text: <>Click <strong className="text-white">"Add"</strong> — app appears in your Dock</> },
    ],
    note: "Requires macOS Sonoma (14) or later.",
  };

  // Fallback
  return {
    os: "Your Browser",
    emoji: "💻",
    color: "emerald",
    steps: [
      { n: "1", text: <>Open the <strong className="text-white">browser menu</strong> (⋮ or ☰)</> },
      { n: "2", text: <>Look for <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home Screen"</strong></> },
      { n: "3", text: <>Confirm the installation</> },
    ],
    note: "For the best experience, use Chrome or Edge.",
  };
};

const COLOR = {
  emerald: { bar: "from-emerald-500 to-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", num: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  sky:     { bar: "from-sky-500 to-sky-400",         badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",             dot: "bg-sky-400",     num: "bg-sky-500/10 text-sky-400 border-sky-500/20"             },
  amber:   { bar: "from-amber-500 to-amber-400",     badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",       dot: "bg-amber-400",   num: "bg-amber-500/10 text-amber-400 border-amber-500/20"       },
};

const InstructionsModal = ({ env, onClose }) => {
  const [anim, setAnim] = useState(false);
  const info = getInstructions(env);
  const c    = COLOR[info.color] || COLOR.emerald;

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    const fn = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const close = () => {
    setAnim(false);
    setTimeout(onClose, 260);
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-4"
      style={{
        background:     anim ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0)",
        backdropFilter: anim ? "blur(4px)"         : "blur(0px)",
        transition: "background 0.3s ease, backdrop-filter 0.3s ease",
      }}
      onClick={close}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl
                   shadow-2xl overflow-hidden"
        style={{
          opacity:   anim ? 1 : 0,
          transform: anim ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
          transition: "opacity 0.26s ease, transform 0.26s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${c.bar}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-2xl">{info.emoji}</span>
              <h3 className="text-white font-bold text-base">Install Medi-Quick</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                              border text-xs font-medium ${c.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {info.os}
            </span>
          </div>
          <button onClick={close}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800
                       rounded-lg transition-colors group mt-0.5">
            <X size={15} className="group-hover:rotate-90 transition-transform duration-150" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 pb-4 space-y-3.5">
          {info.steps.map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center
                               shrink-0 text-xs font-black ${c.num}`}>
                {n}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-1">{text}</p>
            </div>
          ))}
        </div>

        {/* Note */}
        {info.note && (
          <div className="mx-5 mb-4 px-3.5 py-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-slate-500 text-xs leading-relaxed">💡 {info.note}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5">
          <button onClick={close}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
                       text-slate-200 hover:text-white text-sm font-semibold rounded-xl
                       transition-colors">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

const InstallPrompt = () => {
  const [show,        setShow]        = useState(false);
  const [animate,     setAnimate]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [env,         setEnv]         = useState(null);
  const [deferredEvt, setDeferredEvt] = useState(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Dismissed this session
    if (sessionStorage.getItem("mq_install_dismissed")) return;

    const detectedEnv = getEnv();
    setEnv(detectedEnv);

    // Capture Chrome/Edge native install event
    const handler = (e) => { e.preventDefault(); setDeferredEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    const t = setTimeout(() => {
      setShow(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }, 1500);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const dismiss = () => {
    setAnimate(false);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("mq_install_dismissed", "1");
    }, 320);
  };

  const handleInstall = async () => {
    if (deferredEvt) {
      // Chrome / Edge on Android or Desktop — trigger native install directly
      deferredEvt.prompt();
      const { outcome } = await deferredEvt.userChoice;
      if (outcome === "accepted") { dismiss(); return; }
      // User declined native prompt — fall through to show instructions
    }
    // iOS / Safari / Firefox / others — show step-by-step instructions
    setShowModal(true);
  };

  if (!show || !env) return null;

  return (
    <>
      {showModal && (
        <InstructionsModal
          env={env}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[8000] px-3 pb-3 sm:px-4 sm:pb-5
                      pointer-events-none">
        <div
          className="max-w-lg mx-auto pointer-events-auto bg-slate-900 border border-slate-700/80
                     rounded-2xl shadow-2xl overflow-hidden"
          style={{
            opacity:   animate ? 1 : 0,
            transform: animate ? "translateY(0)" : "translateY(110%)",
            transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Thin top accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500" />

          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* App icon */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600
                            flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-xl leading-none">M</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">Install Medi-Quick</p>
              <p className="text-slate-500 text-xs mt-0.5">Add to home screen for quick access</p>
            </div>

            {/* Install + dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400
                           text-white text-xs font-semibold rounded-xl transition-colors
                           shadow shadow-emerald-500/20"
              >
                <Download size={12} />
                Install
              </button>
              <button
                onClick={dismiss}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800
                           rounded-lg transition-colors group"
              >
                <X size={14} className="group-hover:rotate-90 transition-transform duration-150" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallPrompt;
