import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ScanLine,
  Camera,
  X,
  Upload,
  Key,
  AlertTriangle,
  Eye,
  Sparkles,
} from "lucide-react";
import api from "../api/axios";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

// ── Gemini 3 Flash  — prescription OCR

const OCR_PROMPT = `You are a medical prescription analyzer. Carefully examine this prescription image.

Extract ONLY the medicine/drug names. Return this exact JSON:
{
  "medicines": ["Medicine1", "Medicine2"],
  "confidence": "high|medium|low",
  "notes": "brief note about image quality or prescription type"
}

Rules:
- Only medicine/drug names (generic OR brand)
- Exclude: doctor name, patient name, dosage, date, clinic/hospital name
- Include both generic (Paracetamol) and brand (Napa, Ace, Seclo)
- Return ONLY valid JSON`;

const runGeminiOCR = async (base64, mime, apiKey) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: OCR_PROMPT },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
          response_mime_type: "application/json",
        },
      }),
    },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("Raw OCR Response:", text);
      throw new Error("OCR could not find medicine names in this image.");
    }
    return JSON.parse(match[0]);
  } catch (parseErr) {
    throw new Error("Failed to parse medicine data. Please try a clearer photo.");
  }
};

const ENRICH_PROMPT = (name, country) => `
Search the web for complete medical information about: "${name}"

Return ONLY this exact JSON:
{
  "found": true,
  "genericName": "scientific/generic name",
  "brandNames": ["brand1", "brand2"],
  "category": "antibiotic|antifungal|antiviral|analgesic|antacid|antidiabetic|antihypertensive|antihistamine|vitamin|supplement|other",
  "description": "2-3 sentence description",
  "uses": "what conditions it treats",
  "sideEffects": "common side effects",
  "price": {
    "amount": 10,
    "currency": "BDT",
    "unit": "per tablet",
    "note": "approximate price in ${country}"
  }
}

If not found: { "found": false, "reason": "why" }
Return ONLY valid JSON.`;

const runGeminiEnrich = async (
  medicineName,
  apiKey,
  country = "Bangladesh",
) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: ENRICH_PROMPT(medicineName, country) }] }],
        tools: [{ google_search: {} }], // Google Search grounding
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { found: false, reason: "No data found" };
  return JSON.parse(match[0]);
};

// dB helper
const searchMedicine = async (name) => {
  try {
    const { data } = await api.get(
      `/medicines/search?q=${encodeURIComponent(name)}`,
    );
    return data.data || [];
  } catch {
    return [];
  }
};

const getMedicineEntries = async (id) => {
  try {
    const { data } = await api.get(`/entries/medicine/${id}`);
    return data.data || [];
  } catch {
    return [];
  }
};

// Auto-create medicine via backend enrichment
const autoCreateMedicine = async (name, apiKey, country) => {
  try {
    const { data } = await api.post("/medicines/enrich", {
      medicineName: name,
      apiKey,
      country,
    });
    return data.data || null;
  } catch {
    return null;
  }
};

//Get user country
const getUserCountry = async () => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return data.country_name || "Bangladesh";
  } catch {
    return "Bangladesh";
  }
};

// Main component
const PrescriptionScanner = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imgData, setImgData] = useState({ base64: "", mime: "" });
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [progressSub, setProgressSub] = useState("");
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState(
    import.meta.env.VITE_GEMINI_API_KEY || "",
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  const reset = () => {
    setPreview(null);
    setImgData({ base64: "", mime: "" });
    setScanning(false);
    setProgress(0);
    setProgressMsg("");
    setProgressSub("");
    setError("");
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setScanning(true);
    setProgress(5);
    setProgressMsg("Processing image...");

    try {
      let blobToCompress = file;

      // Step 1: Handle HEIC Conversion
      const isHeic =
        file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic");
      if (isHeic) {
        setProgressMsg("Converting iPhone photo...");
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });
        blobToCompress = Array.isArray(converted) ? converted[0] : converted;
      }

      // Step 2: Handle Compression (Fixes 413 Error)
      setProgressMsg("Optimizing size...");
      const options = {
        maxSizeMB: 1, // Force under 1MB to avoid 413
        maxWidthOrHeight: 1600, // Good balance for AI legibility
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(blobToCompress, options);

      // Step 3: Finalize for Preview and API
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setImgData({
          base64: e.target.result.split(",")[1],
          mime: "image/jpeg",
        });
        setScanning(false);
        setProgress(0);
        setProgressMsg("");
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Processing failed:", err);
      setError("Could not process this image. Try taking a new photo.");
      setScanning(false);
    }
  };

  const handleScan = async () => {
    if (!imgData.base64) return;
    if (!apiKey.trim()) {
      setShowKeyInput(true);
      return;
    }

    setScanning(true);
    setError("");
    const startTime = Date.now();

    try {
      //Step 1: OCR
      setProgress(8);
      setProgressMsg("Reading prescription...");
      setProgressSub("OCRanalyzing image");

      const ocrResult = await runGeminiOCR(
        imgData.base64,
        imgData.mime,
        apiKey.trim(),
      );
      const names = ocrResult.medicines || [];

      if (names.length === 0) {
        setError(
          ocrResult.notes || "No medicines detected. Try a clearer image.",
        );
        setScanning(false);
        return;
      }

      setProgress(25);
      setProgressMsg(
        `Detected ${names.length} medicine${names.length > 1 ? "s" : ""}`,
      );
      setProgressSub("Searching Medi-Quick database...");

      // Step 2: Get user country for price localization
      const country = await getUserCountry();

      // Step 3: Process each medicine
      const stepSize = 65 / names.length;
      const detectedMedicines = [];
      let autoCreatedCount = 0;

      for (const name of names) {
        setProgressMsg(`Processing: ${name}`);

        // Search in Medi-Quick DB
        const matches = await searchMedicine(name);
        let medicine = matches[0] || null;
        let enriched = null;
        let wasCreated = false;

        if (!medicine) {
          // Not in DB — enrich from web + auto-create
          setProgressSub(
            `"${name}" not found · Searching web (${country} prices)...`,
          );

          enriched = await runGeminiEnrich(name, apiKey.trim(), country);

          if (enriched?.found) {
            setProgressSub(
              `Found! Creating "${enriched.genericName}" in database...`,
            );

            // Try to create via backend
            medicine = await autoCreateMedicine(name, apiKey.trim(), country);

            if (medicine) {
              wasCreated = true;
              autoCreatedCount++;
              // Re-fetch if there's a matching DB entry now
              const freshMatches = await searchMedicine(
                enriched.genericName || name,
              );
              if (freshMatches[0]) medicine = freshMatches[0];
            }
          }
        } else {
          setProgressSub(`Found in database ✓`);
        }

        // Fetch shop entries
        const entries = medicine ? await getMedicineEntries(medicine._id) : [];

        detectedMedicines.push({
          detectedName: name,
          medicineId: medicine?._id || null,
          medicineGenericName:
            medicine?.genericName || enriched?.genericName || name,
          medicine,
          entries,
          enrichedInfo: enriched, // web-fetched info for display
          wasAutoCreated: wasCreated,
          shopEntries: entries.map((e) => ({
            shop: e.shop?._id,
            shopName: e.shop?.name || "",
            shopAddress: e.shop?.address || "",
            coordinates: e.shop?.location?.coordinates
              ? {
                  lng: e.shop.location.coordinates[0],
                  lat: e.shop.location.coordinates[1],
                }
              : { lat: 0, lng: 0 },
            price: e.price,
            isAvailable: e.isAvailable,
            brandName: e.brandName || "",
          })),
        });

        setProgress((p) => Math.min(90, p + stepSize));
      }

      // Step 4: Save prescription to DB
      setProgress(93);
      setProgressMsg("Saving scan...");
      setProgressSub(
        `${autoCreatedCount > 0 ? `${autoCreatedCount} new medicine${autoCreatedCount > 1 ? "s" : ""} added · ` : ""}Saving to database`,
      );

      const { data: saved } = await api.post("/prescriptions", {
        imageBase64: imgData.base64,
        geminiRaw: JSON.stringify(ocrResult),
        confidence: ocrResult.confidence,
        geminiNotes: ocrResult.notes || "",
        detectedMedicines,
        scanDurationMs: Date.now() - startTime,
      });

      setProgress(100);
      setProgressMsg("Done!");
      setProgressSub(
        `${detectedMedicines.filter((m) => m.medicine).length} medicines found · Opening results`,
      );

      setTimeout(() => {
        setOpen(false);
        reset();
        navigate(`/prescription/${saved.data._id}`, {
          state: {
            prescriptionId: saved.data._id,
            detectedMedicines,
            confidence: ocrResult.confidence,
            geminiNotes: ocrResult.notes || "",
            imagePreview: preview,
            country,
            autoCreatedCount,
          },
        });
      }, 600);
    } catch (err) {
      setError(err.message || "Scan failed. try again.");
      setScanning(false);
    }
  };

  // Floating button
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        title="Scan Prescription"
        className="fixed bottom-24 right-4 sm:right-6 z-[7000]
                 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white
                 rounded-2xl shadow-xl shadow-emerald-500/25
                 flex items-center justify-center
                 transition-all hover:scale-110 active:scale-95"
      >
        <ScanLine size={22} />
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full
                       border-2 border-slate-950 flex items-center justify-center"
        >
          <Camera size={9} className="text-slate-900" />
        </span>
      </button>
    );

  // Modal
  return (
    <div
      className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(2,6,23,0.90)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full sm:max-w-md bg-slate-950 border border-slate-800
                      rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center"
            >
              <ScanLine size={15} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">
                Prescription Scanner
              </h2>
              <p className="text-slate-600 text-xs">
                {scanning ? progressMsg : "Scan a prescription"}
              </p>
            </div>
          </div>
          {!scanning && (
            <button
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <X
                size={15}
                className="group-hover:rotate-90 transition-transform duration-150"
              />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Scanning progress */}
          {scanning && (
            <div className="flex flex-col items-center py-10 gap-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
                <div
                  className="absolute inset-0 rounded-full border-2
                                border-t-emerald-400 border-r-emerald-400/30
                                border-b-transparent border-l-transparent animate-spin"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={22} className="text-emerald-400" />
                </div>
              </div>

              <div className="text-center space-y-1.5 w-full max-w-xs">
                <p className="text-white font-semibold text-sm">
                  {progressMsg}
                </p>
                {progressSub && (
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {progressSub}
                  </p>
                )}
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400
                                  rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-slate-700 text-[10px] mt-1 px-0.5">
                  <span>OCR</span>
                  <span>Web Search</span>
                  <span>DB</span>
                  <span>Save</span>
                </div>
                <p className="text-slate-700 text-xs">{progress}%</p>
              </div>
            </div>
          )}

          {/* Upload UI */}
          {!scanning && (
            <>
              {/* {(showKeyInput || !apiKey) && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Key size={12} className="text-amber-400" />
                    <p className="text-amber-400 text-xs font-semibold">Gemini API Key</p>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Free at{" "}
                    <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                      className="text-sky-400 underline">aistudio.google.com</a>
                    {" "}→ Get API Key · No billing.
                  </p>
                  <input type="password" placeholder="AIzaSy..."
                    value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                               text-white text-xs placeholder-slate-600
                               focus:outline-none focus:ring-1 focus:ring-amber-500/50" />
                  <p className="text-slate-700 text-xs">
                    Or set <code className="text-slate-500">VITE_GEMINI_API_KEY</code> in .env
                  </p>
                </div>
              )} */}

              {/* Smart features callout */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: "🔍", label: "OCR Scan", sub: "Reads prescriptions" },
                  {
                    icon: "🌐",
                    label: "Web Search",
                    sub: "Auto-finds medicine info",
                  },
                  {
                    icon: "💊",
                    label: "Auto-Create",
                    sub: "Adds missing medicines",
                  },
                ].map(({ icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 p-2.5
                                              bg-slate-900/50 border border-slate-800 rounded-xl text-center"
                  >
                    <span className="text-lg">{icon}</span>
                    <p className="text-slate-200 text-xs font-medium">
                      {label}
                    </p>
                    <p className="text-slate-600 text-[10px]">{sub}</p>
                  </div>
                ))}
              </div>

              {!preview ? (
                <>
                  <label
                    className="flex flex-col items-center justify-center gap-3 h-48
                                     rounded-2xl border-2 border-dashed border-slate-700
                                     hover:border-emerald-500/40 cursor-pointer transition-colors
                                     bg-slate-900/40 group"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20
                                    flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors"
                    >
                      <Upload size={20} className="text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-200 text-sm font-medium">
                        Upload prescription
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        JPG · PNG · WEBP
                      </p>
                    </div>
                    // For the Upload label input
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                    // For the Camera input
                    <input
                      ref={cameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                  </label>

                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5
                               bg-slate-800 hover:bg-slate-700 border border-slate-700
                               text-slate-300 hover:text-white text-sm rounded-xl transition-colors"
                  >
                    <Camera size={15} /> Take Photo
                  </button>
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                    <img
                      src={preview}
                      alt="prescription"
                      className="w-full max-h-60 object-contain bg-slate-900"
                    />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80
                                 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X size={13} />
                    </button>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div
                        className="absolute left-0 right-0 h-px bg-gradient-to-r
                                      from-transparent via-emerald-400 to-transparent opacity-70"
                        style={{
                          animation: "scanPass 2.5s ease-in-out infinite",
                        }}
                      />
                    </div>
                    <style>{`@keyframes scanPass{0%{top:0%;opacity:0}8%{opacity:.8}92%{opacity:.8}100%{top:100%;opacity:0}}`}</style>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl">
                      <AlertTriangle
                        size={13}
                        className="text-rose-400 shrink-0 mt-0.5"
                      />
                      <p className="text-rose-300 text-xs leading-relaxed">
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <Eye size={11} className="text-emerald-400 shrink-0" />
                    <p className="text-slate-500 text-xs">
                      Medicines not in Medi-Quick will be auto-searched on the
                      web and added
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!scanning && preview && (
          <div className="px-5 py-4 border-t border-slate-800 shrink-0">
            <button
              onClick={handleScan}
              disabled={!imgData.base64}
              className="w-full flex items-center justify-center gap-2 py-3
                         bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800
                         disabled:text-slate-600 text-white font-semibold text-sm
                         rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Sparkles size={16} />
              Smart Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionScanner;
