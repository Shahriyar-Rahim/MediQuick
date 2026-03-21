import axios from "axios";
import Medicine from "../models/medicine.model.js";
import MedicineEntry from "../models/medicineEntry.model.js";

// ── Gemini with Google Search grounding ───────────────────────────────────────
// Searches the web for medicine info and returns structured data
const GEMINI_ENRICH_PROMPT = (medicineName, country = "Bangladesh") => `
Search for complete medical information about the medicine: "${medicineName}"

Return ONLY this exact JSON (no extra text):
{
  "genericName": "the generic/scientific name",
  "brandNames": ["brand1", "brand2"],
  "category": "one of: antibiotic|antifungal|antiviral|analgesic|antacid|antidiabetic|antihypertensive|antihistamine|vitamin|supplement|other",
  "description": "2-3 sentence description of what this medicine is",
  "uses": "what conditions/symptoms it treats",
  "sideEffects": "common side effects",
  "price": {
    "amount": 0,
    "currency": "BDT",
    "unit": "per tablet/strip/bottle",
    "note": "approximate retail price in ${country}"
  },
  "imageSearchQuery": "best search query to find product image",
  "found": true
}

If medicine not found or unclear, return: { "found": false, "reason": "why" }
`;

const runGeminiEnrich = async (medicineName, apiKey, country = "Bangladesh") => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: GEMINI_ENRICH_PROMPT(medicineName, country) }],
        }],
        tools: [{
          google_search: {},   // Google Search grounding — searches real web
        }],
        generationConfig: {
          temperature:      0.1,
          maxOutputTokens:  1024,
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Could not parse enrichment response");

  return JSON.parse(match[0]);
};

// ── Fetch medicine image from Unsplash (free, no key) ─────────────────────────
const fetchMedicineImage = async (query) => {
  try {
    // Use a reliable free medical image source
    const searchQuery = encodeURIComponent(`${query} medicine pill tablet`);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
};

// ── Auto-create medicine in DB ────────────────────────────────────────────────
export const enrichAndCreateMedicine = async (medicineName, apiKey, country = "Bangladesh") => {
  try {
    // 1 — Check if already exists (maybe added between scans)
    const existing = await Medicine.findOne({
      $or: [
        { genericName: { $regex: new RegExp(`^${medicineName}$`, "i") } },
        { brandNames:  { $regex: new RegExp(`^${medicineName}$`, "i") } },
      ],
    });
    if (existing) return { medicine: existing, created: false };

    // 2 — Gemini searches the web for full details
    const info = await runGeminiEnrich(medicineName, apiKey, country);
    if (!info.found) return { medicine: null, created: false, reason: info.reason };

    // 3 — Fetch image
    const imageUrl = await fetchMedicineImage(info.imageSearchQuery || info.genericName);

    // 4 — Normalize category
    const VALID_CATS = [
      "antibiotic","antifungal","antiviral","analgesic","antacid",
      "antidiabetic","antihypertensive","antihistamine","vitamin","supplement","other",
    ];
    const category = VALID_CATS.includes(info.category?.toLowerCase())
      ? info.category.toLowerCase()
      : "other";

    // 5 — Build description
    const description = [
      info.description,
      info.uses ? `Uses: ${info.uses}` : "",
      info.sideEffects ? `Side effects: ${info.sideEffects}` : "",
    ].filter(Boolean).join(" | ");

    // 6 — Create medicine in DB
    const medicine = await Medicine.create({
      genericName: info.genericName?.toLowerCase().trim() || medicineName.toLowerCase(),
      brandNames:  (info.brandNames || []).map((b) => b.trim()).filter(Boolean),
      category,
      description,
      image: imageUrl ? { url: imageUrl, public_id: "auto_fetched" } : undefined,
      addedBy: "auto-scanner",
      isAutoCreated: true,   // flag for admin review
    });

    // 7 — Store price info as metadata (not a shop entry — no shop assigned yet)
    //     Store on medicine as suggestedPrice for display
    if (info.price?.amount > 0) {
      medicine.suggestedPrice = {
        amount:   info.price.amount,
        currency: info.price.currency || "BDT",
        unit:     info.price.unit     || "per unit",
        note:     info.price.note     || "",
        country,
      };
      await medicine.save();
    }

    return { medicine, created: true, info };
  } catch (err) {
    console.error("enrichAndCreateMedicine error:", err.message);
    return { medicine: null, created: false, reason: err.message };
  }
};

// ── Get country from IP (for price localization) ──────────────────────────────
export const getCountryFromIp = async (ip) => {
  try {
    // Free, no key needed
    const res  = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    return data.country_name || "Bangladesh";
  } catch {
    return "Bangladesh";
  }
};
