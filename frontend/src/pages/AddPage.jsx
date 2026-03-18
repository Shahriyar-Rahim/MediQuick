import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import api from "../api/axios";
import {
  Pill, Store, Link2, MapPin, Upload, Loader2,
  CheckCircle, Info, Plus, X,
} from "lucide-react";

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pinIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:#10b981;border:2px solid #fff;transform:rotate(-45deg);
    box-shadow:0 2px 10px rgba(16,185,129,.5)"></div>`,
  iconSize:   [26, 26],
  iconAnchor: [13, 26],
});

// Component that places a pin on map click
const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

const CATEGORIES = [
  "antibiotic","antifungal","antiviral","analgesic","antacid",
  "antidiabetic","antihypertensive","antihistamine","vitamin","supplement","other",
];

const TABS = [
  { id: "medicine", icon: Pill,   label: "Add Medicine" },
  { id: "shop",     icon: Store,  label: "Add Shop"     },
  { id: "entry",    icon: Link2,  label: "Add to Shop"  },
];

// ── Reusable field ────────────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {hint && <span className="text-xs text-slate-600">{hint}</span>}
    </div>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl
      text-white placeholder-slate-600 text-sm
      focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
      disabled:opacity-50 transition-colors ${props.className || ""}`}
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl
      text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500
      focus:border-transparent disabled:opacity-50 transition-colors ${props.className || ""}`}
  >
    {children}
  </select>
);

// ── Add Medicine form ─────────────────────────────────────────────────────────
const AddMedicineForm = ({ prefillId }) => {
  const [form, setForm]         = useState({ genericName: "", category: "other", description: "" });
  const [brands, setBrands]     = useState([""]);
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [submitting, setSub]    = useState(false);
  const [done, setDone]         = useState(null);

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.genericName.trim()) { toast.error("Generic name is required"); return; }
    setSub(true);
    try {
      const { data } = await api.post("/medicines", {
        ...form,
        brandNames: brands.filter((b) => b.trim()),
      });
      const med = data.data;
      // Upload image if chosen
      if (image) {
        const fd = new FormData();
        fd.append("image", image);
        await api.post(`/upload/medicine/${med._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      toast.success("Medicine added!");
      setDone(med);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add medicine");
    } finally {
      setSub(false);
    }
  };

  if (done) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <CheckCircle size={40} className="text-emerald-400" />
      <p className="text-white font-semibold">Medicine added!</p>
      <p className="text-slate-400 text-sm capitalize">{done.genericName}</p>
      <button onClick={() => setDone(null)}
        className="text-emerald-400 hover:text-emerald-300 text-sm underline">
        Add another
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Generic Name" hint="required">
        <Input placeholder="e.g. Paracetamol" value={form.genericName}
          onChange={(e) => setForm((p) => ({ ...p, genericName: e.target.value }))} />
      </Field>

      <Field label="Brand Names" hint="optional — add multiple">
        <div className="space-y-2">
          {brands.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder={`Brand ${i + 1}`} value={b}
                onChange={(e) => {
                  const n = [...brands]; n[i] = e.target.value; setBrands(n);
                }} />
              {brands.length > 1 && (
                <button type="button" onClick={() => setBrands(brands.filter((_, j) => j !== i))}
                  className="p-2.5 bg-slate-800 hover:bg-rose-950/50 border border-slate-700
                             hover:border-rose-500/30 text-slate-500 hover:text-rose-400
                             rounded-xl transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setBrands([...brands, ""])}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs transition-colors">
            <Plus size={12} /> Add brand
          </button>
        </div>
      </Field>

      <Field label="Category">
        <Select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>

      <Field label="Description" hint="optional">
        <textarea value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Brief description..."
          rows={3}
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl
            text-white placeholder-slate-600 text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
        />
      </Field>

      {/* Image upload */}
      <Field label="Medicine Photo" hint="optional · max 5MB">
        <label className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl
                           border-2 border-dashed border-slate-700 hover:border-emerald-500/50
                           cursor-pointer transition-colors overflow-hidden bg-slate-900">
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Upload size={20} className="text-slate-600" />
              <span className="text-slate-500 text-xs">Click to upload</span>
            </>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImg} />
        </label>
      </Field>

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400
                   disabled:bg-emerald-800 disabled:text-emerald-600 text-white font-semibold rounded-xl
                   transition-colors">
        {submitting ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : "Add Medicine"}
      </button>
    </form>
  );
};

// ── Add Shop form ─────────────────────────────────────────────────────────────
const AddShopForm = () => {
  const [form, setForm]       = useState({ name: "", address: "", contact: "" });
  const [coords, setCoords]   = useState(null); // { lat, lng }
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSub]  = useState(false);
  const [done, setDone]       = useState(null);

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Shop name is required"); return; }
    if (!coords)           { toast.error("Please click on the map to set location"); return; }
    setSub(true);
    try {
      const { data } = await api.post("/shops", { ...form, latitude: coords.lat, longitude: coords.lng });
      const shop = data.data;
      if (image) {
        const fd = new FormData();
        fd.append("image", image);
        await api.post(`/upload/shop/${shop._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      toast.success("Shop added!");
      setDone(shop);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add shop");
    } finally {
      setSub(false);
    }
  };

  if (done) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <CheckCircle size={40} className="text-emerald-400" />
      <p className="text-white font-semibold">Shop added!</p>
      <p className="text-slate-400 text-sm">{done.name}</p>
      <button onClick={() => { setDone(null); setCoords(null); }}
        className="text-emerald-400 hover:text-emerald-300 text-sm underline">
        Add another
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Map picker */}
      <Field label="Shop Location" hint="click on map to drop pin">
        <div className="rounded-xl overflow-hidden border border-slate-700 h-52">
          <MapContainer center={[23.8103, 90.4125]} zoom={13} className="h-full w-full" zoomControl>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OSM' />
            <MapClickHandler onPick={(lat, lng) => setCoords({ lat, lng })} />
            {coords && <Marker position={[coords.lat, coords.lng]} icon={pinIcon} />}
          </MapContainer>
        </div>
        {coords ? (
          <p className="flex items-center gap-1.5 text-emerald-400 text-xs mt-1.5">
            <MapPin size={11} />
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} — pin placed
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-slate-600 text-xs mt-1.5">
            <Info size={11} /> No pin yet — click the map
          </p>
        )}
      </Field>

      <form onSubmit={submit} className="space-y-5">
        <Field label="Shop Name" hint="required">
          <Input placeholder="e.g. City Pharma, Saidpur" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Address" hint="optional">
          <Input placeholder="Street / area" value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        </Field>
        <Field label="Contact" hint="optional">
          <Input placeholder="Phone number" value={form.contact}
            onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} />
        </Field>

        <Field label="Shop Photo" hint="optional · max 5MB">
          <label className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl
                             border-2 border-dashed border-slate-700 hover:border-emerald-500/50
                             cursor-pointer transition-colors overflow-hidden bg-slate-900">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload size={18} className="text-slate-600" />
                <span className="text-slate-500 text-xs">Click to upload</span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImg} />
          </label>
        </Field>

        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400
                     disabled:bg-emerald-800 disabled:text-emerald-600 text-white font-semibold rounded-xl transition-colors">
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : "Add Shop"}
        </button>
      </form>
    </div>
  );
};

// ── Add Entry form ────────────────────────────────────────────────────────────
const AddEntryForm = ({ prefillMedicineId }) => {
  const [medicines, setMedicines]   = useState([]);
  const [shops,     setShops]       = useState([]);
  const [form, setForm]             = useState({
    medicineId: prefillMedicineId || "",
    shopId: "", brandName: "", price: "", isAvailable: true,
  });
  const [medSearch,  setMedSearch]  = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [submitting, setSub]        = useState(false);
  const [done, setDone]             = useState(null);

  useEffect(() => {
    api.get("/medicines?limit=100").then(({ data }) => setMedicines(data.data || [])).catch(() => {});
    api.get("/shops?limit=100").then(({ data }) => setShops(data.data || [])).catch(() => {});
  }, []);

  const filteredMeds  = medicines.filter((m) => m.genericName?.toLowerCase().includes(medSearch.toLowerCase()));
  const filteredShops = shops.filter((s) => s.name?.toLowerCase().includes(shopSearch.toLowerCase()));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.medicineId) { toast.error("Select a medicine"); return; }
    if (!form.shopId)     { toast.error("Select a shop");     return; }
    if (!form.price)      { toast.error("Price is required"); return; }
    setSub(true);
    try {
      await api.post("/entries", { ...form, price: parseFloat(form.price) });
      toast.success("Entry added!");
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add entry");
    } finally {
      setSub(false);
    }
  };

  if (done) return (
    <div className="flex flex-col items-center py-12 gap-4">
      <CheckCircle size={40} className="text-emerald-400" />
      <p className="text-white font-semibold">Entry added!</p>
      <p className="text-slate-400 text-sm">Medicine is now linked to shop with price</p>
      <button onClick={() => { setDone(null); setForm({ medicineId: prefillMedicineId || "", shopId: "", brandName: "", price: "", isAvailable: true }); }}
        className="text-emerald-400 hover:text-emerald-300 text-sm underline">
        Add another
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Medicine picker */}
      <Field label="Medicine" hint="required">
        <Input placeholder="Search medicine..." value={medSearch}
          onChange={(e) => setMedSearch(e.target.value)} className="mb-2" />
        <Select value={form.medicineId}
          onChange={(e) => setForm((p) => ({ ...p, medicineId: e.target.value }))}>
          <option value="">— Select medicine —</option>
          {filteredMeds.map((m) => (
            <option key={m._id} value={m._id}>{m.genericName}</option>
          ))}
        </Select>
      </Field>

      {/* Shop picker */}
      <Field label="Shop" hint="required">
        <Input placeholder="Search shop..." value={shopSearch}
          onChange={(e) => setShopSearch(e.target.value)} className="mb-2" />
        <Select value={form.shopId}
          onChange={(e) => setForm((p) => ({ ...p, shopId: e.target.value }))}>
          <option value="">— Select shop —</option>
          {filteredShops.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand Name" hint="optional">
          <Input placeholder="e.g. Napa" value={form.brandName}
            onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))} />
        </Field>
        <Field label="Price (BDT)" hint="required">
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
        </Field>
      </div>

      {/* Availability toggle */}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
            ${form.isAvailable ? "bg-emerald-500" : "bg-slate-700"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${form.isAvailable ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className="text-slate-300 text-sm">
          {form.isAvailable ? "Currently in stock" : "Out of stock"}
        </span>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400
                   disabled:bg-emerald-800 disabled:text-emerald-600 text-white font-semibold rounded-xl transition-colors">
        {submitting ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : "Add Entry"}
      </button>
    </form>
  );
};

// ── AddPage ───────────────────────────────────────────────────────────────────
const AddPage = () => {
  const [searchParams] = useSearchParams();
  const typeParam      = searchParams.get("type");
  const medicineIdParam = searchParams.get("medicineId");

  const defaultTab = typeParam === "entry" ? "entry"
                   : typeParam === "shop"  ? "shop"
                   : "medicine";

  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white font-bold text-xl">Contribute Data</h1>
          <p className="text-slate-500 text-sm mt-1">
            No account needed — your data goes live immediately
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-emerald-950/30 border border-emerald-500/20
                        rounded-xl mb-6">
          <Info size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-emerald-300/80 text-xs leading-relaxed">
            Anyone can add medicines, shops, and prices. The community votes on price accuracy,
            and admins moderate if needed. All data is live immediately.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${tab === id
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"}`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {tab === "medicine" && <AddMedicineForm />}
          {tab === "shop"     && <AddShopForm />}
          {tab === "entry"    && <AddEntryForm prefillMedicineId={medicineIdParam} />}
        </div>
      </div>
    </div>
  );
};

export default AddPage;
