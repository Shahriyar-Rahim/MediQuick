import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ScanLine, Camera, X, Upload,
  AlertTriangle, Eye,
} from "lucide-react";
import api from "../api/axios";

// ── Gemini 3 Flash ──────────────────────────────────────────────────────────
const GEMINI_PROMPT = `You are a medical prescription analyzer. Look at this prescription image carefully.

Extract ONLY the medicine/drug names. Return this exact JSON:
{
  "medicines": ["Medicine1", "Medicine2"],
  "confidence": "high|medium|low",
  "notes": "any notes about image quality or prescription"
}

Rules:
- Only medicine/drug names (generic OR brand names)
- Exclude: doctor name, patient name, dosage, dates, clinic, hospital names
- Include both generic (Paracetamol) and brand names (Napa, Ace, Seclo)
- Unclear image → { "medicines": [], "confidence": "low", "notes": "reason" }
- Return ONLY valid JSON, no extra text`;

const runGemini = async (base64, mime, apiKey) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/Gemini 3 Flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: GEMINI_PROMPT },
          { inline_data: { mime_type: mime, data: base64 } },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Something went wrong");
  return JSON.parse(match[0]);
};

// ── DB helpers ────────────────────────────────────────────────────────────────
const searchMedicine = async (name) => {
  try {
    const { data } = await api.get(`/medicines/search?q=${encodeURIComponent(name)}`);
    return data.data || [];
  } catch { return []; }
};

const getMedicineEntries = async (id) => {
  try {
    const { data } = await api.get(`/entries/medicine/${id}`);
    return data.data || [];
  } catch { return []; }
};

// ── Component ─────────────────────────────────────────────────────────────────
const PrescriptionScanner = () => {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);

  const [open,         setOpen]         = useState(false);
  const [preview,      setPreview]      = useState(null);
  const [imgData,      setImgData]      = useState({ base64: "", mime: "" });
  const [scanning,     setScanning]     = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [progressMsg,  setProgressMsg]  = useState("");
  const [error,        setError]        = useState("");
  
  // Directly pull from ENV
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  const reset = () => {
    setPreview(null);
    setImgData({ base64: "", mime: "" });
    setScanning(false);
    setProgress(0);
    setProgressMsg("");
    setError("");
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImgData({ base64: e.target.result.split(",")[1], mime: file.type || "image/jpeg" });
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imgData.base64) return;
    
    // Check if key exists in env
    if (!apiKey) {
      setError("Something went wrong. Please contact support.");
      return;
    }

    setScanning(true);
    setError("");
    setProgress(10);
    const startTime = Date.now();

    try {
      setProgressMsg("MediQuick is reading the prescription...");
      setProgress(15);
      const geminiResult = await runGemini(imgData.base64, imgData.mime, apiKey);
      setProgress(50);

      const names = geminiResult.medicines || [];
      if (names.length === 0) {
        setError(geminiResult.notes || "No medicines detected. Try a clearer image.");
        setScanning(false);
        return;
      }

      setProgressMsg(`Found ${names.length} medicines · Searching database...`);
      const stepSize = 38 / names.length;
      const detectedMedicines = [];

      for (const name of names) {
        setProgressMsg(`Searching: ${name}...`);
        const matches  = await searchMedicine(name);
        const medicine = matches[0] || null;
        const entries  = medicine ? await getMedicineEntries(medicine._id) : [];

        detectedMedicines.push({
          detectedName:        name,
          medicineId:          medicine?._id || null,
          medicineGenericName: medicine?.genericName || "",
          medicine,
          entries,
          shopEntries: entries.map((e) => ({
            shop:        e.shop?._id,
            shopName:    e.shop?.name    || "",
            shopAddress: e.shop?.address || "",
            coordinates: e.shop?.location?.coordinates
              ? { lng: e.shop.location.coordinates[0], lat: e.shop.location.coordinates[1] }
              : { lat: 0, lng: 0 },
            price:       e.price,
            isAvailable: e.isAvailable,
            brandName:   e.brandName || "",
          })),
        });
        setProgress((p) => Math.min(90, p + stepSize));
      }

      setProgressMsg("Saving to database...");
      setProgress(93);

      const { data: saved } = await api.post("/prescriptions", {
        imageBase64:      imgData.base64,
        geminiRaw:        JSON.stringify(geminiResult),
        confidence:       geminiResult.confidence,
        geminiNotes:      geminiResult.notes || "",
        detectedMedicines,
        scanDurationMs:   Date.now() - startTime,
      });

      setProgress(100);
      setProgressMsg("Done! Opening results...");

      setTimeout(() => {
        setOpen(false);
        reset();
        navigate(`/prescription/${saved.data._id}`, {
          state: {
            prescriptionId:    saved.data._id,
            detectedMedicines,
            confidence:        geminiResult.confidence,
            geminiNotes:       geminiResult.notes || "",
            imagePreview:      preview,
          },
        });
      }, 500);

    } catch (err) {
      setError(err.message || "Scan failed. Please try again.");
      setScanning(false);
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} title="Scan Prescription"
      className="fixed bottom-24 right-4 sm:right-6 z-[7000]
                 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white
                 rounded-2xl shadow-xl shadow-emerald-500/25
                 flex items-center justify-center
                 transition-all hover:scale-110 active:scale-95">
      <ScanLine size={22} />
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full
                       border-2 border-slate-950 flex items-center justify-center">
        <Camera size={9} className="text-slate-900" />
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(2,6,23,0.88)", backdropFilter: "blur(6px)" }}>

      <div className="w-full sm:max-w-md bg-slate-950 border border-slate-800
                      rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center">
              <ScanLine size={15} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Prescription Scanner</h2>
              <p className="text-slate-600 text-xs">
                {scanning ? progressMsg : "Instant AI Analysis"}
              </p>
            </div>
          </div>
          {!scanning && (
            <button onClick={() => { setOpen(false); reset(); }}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group">
              <X size={15} className="group-hover:rotate-90 transition-transform duration-150" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {scanning ? (
            <div className="flex flex-col items-center py-12 gap-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
                <div className="absolute inset-0 rounded-full border-2
                                border-t-emerald-400 border-r-emerald-400/40
                                border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanLine size={26} className="text-emerald-400" />
                </div>
              </div>
              <div className="text-center space-y-1 w-full max-w-xs">
                <p className="text-white font-semibold text-sm">{progressMsg}</p>
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400
                                  rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-slate-700 text-xs mt-1">{progress}%</p>
              </div>
            </div>
          ) : (
            <>
              {!preview ? (
                <>
                  <label className="flex flex-col items-center justify-center gap-3 h-52
                                     rounded-2xl border-2 border-dashed border-slate-700
                                     hover:border-emerald-500/40 cursor-pointer transition-colors
                                     bg-slate-900/40 group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20
                                    flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                      <Upload size={22} className="text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-200 text-sm font-medium">Upload prescription</p>
                      <p className="text-slate-600 text-xs mt-1">JPG · PNG · WEBP</p>
                    </div>
                    <input ref={fileRef} type="file"
                      accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])} />
                  </label>

                  <button onClick={() => cameraRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5
                               bg-slate-800 hover:bg-slate-700 border border-slate-700
                               text-slate-300 hover:text-white text-sm rounded-xl transition-colors">
                    <Camera size={15} /> Take Photo
                  </button>
                  <input ref={cameraRef} type="file" accept="image/*"
                    capture="environment" className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])} />
                </>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                    <img src={preview} alt="prescription"
                      className="w-full max-h-64 object-contain bg-slate-900" />
                    <button onClick={reset}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80
                                 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors">
                      <X size={13} />
                    </button>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute left-0 right-0 h-px bg-gradient-to-r
                                      from-transparent via-emerald-400 to-transparent opacity-70"
                        style={{ animation: "scanPass 2.5s ease-in-out infinite" }} />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl">
                      <AlertTriangle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-rose-300 text-xs leading-relaxed">{error}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <Eye size={11} className="text-emerald-400 shrink-0" />
                    <p className="text-slate-500 text-xs">
                      Scanned medicines will be saved to your history.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!scanning && preview && (
          <div className="px-5 py-4 border-t border-slate-800 shrink-0">
            <button onClick={handleScan}
              className="w-full flex items-center justify-center gap-2 py-3
                         bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800
                         disabled:text-slate-600 text-white font-semibold text-sm
                         rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
              <ScanLine size={16} />
              Scan &amp; Find Medicines
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionScanner;
