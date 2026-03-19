import { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor, Apple, Chrome } from "lucide-react";

// ── Detect OS / Browser ───────────────────────────────────────────────────────
const getEnv = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS     = /iphone|ipad|ipod/.test(ua);
  const isMac     = /macintosh|mac os x/.test(ua) && !isIOS;
  const isAndroid = /android/.test(ua);
  const isWindows = /windows/.test(ua);
  const isSafari  = /safari/.test(ua) && !/chrome/.test(ua);
  const isChrome  = /chrome/.test(ua) && !/edg/.test(ua);
  const isFirefox = /firefox/.test(ua);
  const isEdge    = /edg/.test(ua);
  return { isIOS, isMac, isAndroid, isWindows, isSafari, isChrome, isFirefox, isEdge };
};

// ── OS-specific install steps ─────────────────────────────────────────────────
const getSteps = (env) => {
  if (env.isIOS) {
    return {
      os: "iOS (Safari)",
      icon: "🍎",
      color: "sky",
      steps: [
        { n: "1", text: <>Tap the <strong className="text-white">Share</strong> button <span className="text-lg">⎙</span> at the bottom of Safari</> },
        { n: "2", text: <>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></> },
        { n: "3", text: <>Tap <strong className="text-white">"Add"</strong> in the top right to install</> },
      ],
      note: "Works best in Safari. If using Chrome on iOS, switch to Safari first.",
    };
  }
  if (env.isAndroid) {
    return {
      os: "Android",
      icon: "🤖",
      color: "emerald",
      steps: [
        { n: "1", text: <>Tap the <strong className="text-white">⋮ menu</strong> in the top right of Chrome</> },
        { n: "2", text: <>Tap <strong className="text-white">"Add to Home screen"</strong> or <strong className="text-white">"Install app"</strong></> },
        { n: "3", text: <>Tap <strong className="text-white">"Install"</strong> to confirm</> },
      ],
      note: "A shortcut will appear on your home screen.",
    };
  }
  if (env.isWindows && env.isChrome) {
    return {
      os: "Windows (Chrome)",
      icon: "🪟",
      color: "blue",
      steps: [
        { n: "1", text: <>Click the <strong className="text-white">install icon ⊕</strong> in the address bar (right side)</> },
        { n: "2", text: <>Click <strong className="text-white">"Install"</strong> in the popup</> },
        { n: "3", text: <>Medi-Quick opens as a <strong className="text-white">standalone app</strong> on your desktop</> },
      ],
      note: "If you don't see the icon, click ⋮ → More tools → Create shortcut.",
    };
  }
  if (env.isWindows && env.isEdge) {
    return {
      os: "Windows (Edge)",
      icon: "🪟",
      color: "blue",
      steps: [
        { n: "1", text: <>Click <strong className="text-white">⋯ menu</strong> in the top right</> },
        { n: "2", text: <>Click <strong className="text-white">"Apps"</strong> → <strong className="text-white">"Install this site as an app"</strong></> },
        { n: "3", text: <>Click <strong className="text-white">"Install"</strong> to confirm</> },
      ],
      note: "The app will appear in your Start menu and taskbar.",
    };
  }
  if (env.isMac && env.isSafari) {
    return {
      os: "macOS (Safari)",
      icon: "🍎",
      color: "sky",
      steps: [
        { n: "1", text: <>Click <strong className="text-white">File</strong> in the menu bar</> },
        { n: "2", text: <>Click <strong className="text-white">"Add to Dock"</strong></> },
        { n: "3", text: <>Click <strong className="text-white">"Add"</strong> to confirm — it appears in your Dock</> },
      ],
      note: "Requires macOS Sonoma or later with Safari.",
    };
  }
  if (env.isMac && env.isChrome) {
    return {
      os: "macOS (Chrome)",
      icon: "🍎",
      color: "sky",
      steps: [
        { n: "1", text: <>Click the <strong className="text-white">install icon ⊕</strong> in the address bar</> },
        { n: "2", text: <>Click <strong className="text-white">"Install"</strong> in the popup</> },
        { n: "3", text: <>Medi-Quick launches as a <strong className="text-white">standalone app</strong></> },
      ],
      note: "If you don't see the icon, try ⋮ → More tools → Create shortcut.",
    };
  }
  // Fallback — generic
  return {
    os: "Your Browser",
    icon: "💻",
    color: "emerald",
    steps: [
      { n: "1", text: <>Open the <strong className="text-white">browser menu</strong> (⋮ or ⋯)</> },
      { n: "2", text: <>Look for <strong className="text-white">"Install app"</strong>, <strong className="text-white">"Add to Home Screen"</strong>, or <strong className="text-white">"Create shortcut"</strong></> },
      { n: "3", text: <>Confirm the installation</> },
    ],
    note: "For the best experience, use Chrome or Safari.",
  };
};

const COLORS = {
  emerald: { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", btn: "bg-emerald-500 hover:bg-emerald-400", num: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  sky:     { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",             dot: "bg-sky-400",     btn: "bg-sky-500 hover:bg-sky-400",         num: "bg-sky-500/10 text-sky-400 border-sky-500/20"             },
  blue:    { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",           dot: "bg-blue-400",    btn: "bg-blue-500 hover:bg-blue-400",        num: "bg-blue-500/10 text-blue-400 border-blue-500/20"           },
};

// ── Main component ────────────────────────────────────────────────────────────
const InstallPrompt = () => {
  const [show,       setShow]       = useState(false);
  const [showSteps,  setShowSteps]  = useState(false);
  const [animate,    setAnimate]    = useState(false);
  const [stepAnim,   setStepAnim]   = useState(false);
  const [env,        setEnv]        = useState(null);
  const [deferredEvt,setDeferredEvt]= useState(null); // Chrome install event

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem("mq_install_dismissed")) return;

    setEnv(getEnv());

    // Capture Chrome's native install event
    const handler = (e) => { e.preventDefault(); setDeferredEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    // Show banner after short delay
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
    setStepAnim(false);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("mq_install_dismissed", "1");
    }, 300);
  };

  // const handleInstall = async () => {
  //   // If Chrome's native prompt is available, use it
  //   if (deferredEvt) {
  //     deferredEvt.prompt();
  //     const { outcome } = await deferredEvt.userChoice;
  //     if (outcome === "accepted") { dismiss(); return; }
  //   }
  //   // Otherwise show manual steps
  //   setShowSteps(true);
  //   requestAnimationFrame(() => requestAnimationFrame(() => setStepAnim(true)));
  // };

  const handleInstall = () => {
  setShowSteps(true);
  requestAnimationFrame(() => requestAnimationFrame(() => setStepAnim(true)));
};

  if (!show || !env) return null;

  const info = getSteps(env);
  const c    = COLORS[info.color] || COLORS.emerald;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[8000] px-3 pb-3 sm:px-4 sm:pb-4">
      {/* Steps modal */}
      {showSteps && (
        <div
          className="fixed inset-0 z-[8001] flex items-end sm:items-center justify-center p-3 sm:p-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => { setStepAnim(false); setTimeout(() => setShowSteps(false), 250); }}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl
                       shadow-2xl overflow-hidden"
            style={{
              opacity:   stepAnim ? 1 : 0,
              transform: stepAnim ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className={`h-1 w-full bg-gradient-to-r
              ${info.color === "emerald" ? "from-emerald-500 to-emerald-400" :
                info.color === "sky"     ? "from-sky-500 to-sky-400"         :
                                           "from-blue-500 to-blue-400"}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xl">{info.icon}</span>
                  <h3 className="text-white font-bold text-base">Install Medi-Quick</h3>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                                  border text-xs font-medium ${c.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {info.os}
                </div>
              </div>
              <button
                onClick={() => { setStepAnim(false); setTimeout(() => setShowSteps(false), 250); }}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800
                           rounded-lg transition-colors group">
                <X size={15} className="group-hover:rotate-90 transition-transform duration-150" />
              </button>
            </div>

            {/* Steps */}
            <div className="px-5 pb-4 space-y-3">
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
              <div className="mx-5 mb-4 px-3 py-2.5 bg-slate-800/60 rounded-xl
                              border border-slate-700/50">
                <p className="text-slate-500 text-xs leading-relaxed">
                  💡 {info.note}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => { setStepAnim(false); setTimeout(() => setShowSteps(false), 250); }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
                           text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-colors">
                Got it!
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom banner */}
      <div
        className="max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl
                   shadow-2xl overflow-hidden"
        style={{
          opacity:   animate ? 1 : 0,
          transform: animate ? "translateY(0)" : "translateY(100%)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        <div className={`h-0.5 w-full
          ${info.color === "emerald" ? "bg-emerald-500" :
            info.color === "sky"     ? "bg-sky-500"     : "bg-blue-500"}`} />

        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* App icon */}
          <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-white font-black text-lg leading-none">M</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">Install Medi-Quick</p>
            <p className="text-slate-500 text-xs mt-0.5">Add to your home screen for quick access</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs
                          font-semibold rounded-xl transition-colors shadow ${c.btn}`}>
              <Download size={12} />
              Install
            </button>
            <button
              onClick={dismiss}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800
                         rounded-lg transition-colors group">
              <X size={14} className="group-hover:rotate-90 transition-transform duration-150" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
