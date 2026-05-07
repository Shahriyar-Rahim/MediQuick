import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import api from "../api/axios";
import {
  Siren,
  Phone,
  MapPin,
  Locate,
  Loader2,
  CheckCircle,
  ThumbsUp,
  Plus,
  X,
  ChevronDown,
  Building2,
  Clock,
  Wind,
  Activity,
  Filter,
} from "lucide-react";

//Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ambIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50%;
    background:#1E40AF;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(30,64,175,.5);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;">🚑</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const osmIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50%;
    background:#0F52BA;border:2px solid #fff;
    box-shadow:0 2px 6px rgba(15,82,186,.4);
    display:flex;align-items:center;justify-content:center;
    font-size:12px;">🏥</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const FlyTo = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { animate: true, duration: 0.8 });
  }, [coords]);
  return null;
};

//Design components
const Label = ({ children, req }) => (
  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">
    {children}
    {req && <span className="text-red-400 ml-1">*</span>}
  </label>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
               text-slate-800 text-sm placeholder-slate-400
               focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
               transition-all"
  />
);

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
                 text-slate-800 text-sm appearance-none cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                 transition-all"
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-3 top-1/2 -translate-y-1/2
                                      text-slate-400 pointer-events-none"
    />
  </div>
);

const serviceColors = {
  government: "bg-blue-50 text-blue-700 border-blue-200",
  private: "bg-slate-50 text-slate-700 border-slate-200",
  ngo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hospital: "bg-purple-50 text-purple-700 border-purple-200",
  other: "bg-slate-50 text-slate-600 border-slate-200",
};

//Submit Form
const SubmitForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    providerName: "",
    phone: "",
    altPhone: "",
    serviceType: "private",
    lat: "",
    lng: "",
    address: "",
    area: "",
    acAvailable: false,
    icuAvailable: false,
    available24h: false,
    charge: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const tog = (k) => () => setForm((p) => ({ ...p, [k]: !p[k] }));

  const locate = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        setForm((p) => ({ ...p, lat: c.latitude, lng: c.longitude }));
        setLocating(false);
      },
      () => {
        toast.error("Could not get location");
        setLocating(false);
      },
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.providerName || !form.phone)
      return toast.error("Provider name and phone are required");

    // FIX: Check the form state for lat/lng instead of a non-existent userPos
    if (!form.lat || !form.lng) {
      return toast.error("Please click 'Locate Me' or provide coordinates");
    }

    setSubmitting(true);
    try {
      // Construct the payload to match your backend expectations
      const payload = {
        ...form,
        location: {
          lat: form.lat,
          lng: form.lng,
        },
      };

      await api.post("/ambulance/add", payload);
      toast.success("Ambulance data submitted — thank you!");
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label req>Provider / Service Name</Label>
          <Input
            placeholder="e.g. DNCC Ambulance, Medinova"
            value={form.providerName}
            onChange={set("providerName")}
          />
        </div>
        <div>
          <Label req>Phone Number</Label>
          <Input
            type="tel"
            placeholder="01xxxxxxxxx"
            value={form.phone}
            onChange={set("phone")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Alternate Phone</Label>
          <Input
            type="tel"
            placeholder="Optional"
            value={form.altPhone}
            onChange={set("altPhone")}
          />
        </div>
        <div>
          <Label>Service Type</Label>
          <Select value={form.serviceType} onChange={set("serviceType")}>
            <option value="government">Government</option>
            <option value="private">Private</option>
            <option value="ngo">NGO</option>
            <option value="hospital">Hospital</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      {/* GPS */}
      <div>
        <Label>Location (GPS)</Label>
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm flex items-center gap-2
            ${
              form.lat && form.lng
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <MapPin size={13} />
            {form.lat && form.lng
              ? `${parseFloat(form.lat).toFixed(4)}, ${parseFloat(form.lng).toFixed(4)}`
              : "No location set"}
          </div>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700
                       text-white text-xs font-semibold rounded-xl transition-colors shrink-0 disabled:opacity-60"
          >
            {locating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Locate size={13} />
            )}
            GPS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Area</Label>
          <Input
            placeholder="e.g. Mirpur-10, Dhaka"
            value={form.area}
            onChange={set("area")}
          />
        </div>
        <div>
          <Label>Charge / Rate</Label>
          <Input
            placeholder="e.g. 500–1000 BDT"
            value={form.charge}
            onChange={set("charge")}
          />
        </div>
      </div>

      {/* Toggle options */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "available24h", label: "24/7", icon: Clock },
          { key: "acAvailable", label: "A/C", icon: Wind },
          { key: "icuAvailable", label: "ICU Ready", icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={tog(key)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border
                        text-xs font-semibold transition-all
              ${
                form[key]
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div>
        <Label>Notes</Label>
        <textarea
          rows={2}
          placeholder="Any additional info..."
          value={form.notes}
          onChange={set("notes")}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
                     text-slate-800 text-sm placeholder-slate-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300
                   text-white font-semibold text-sm rounded-xl transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Plus size={15} /> Submit Ambulance Data
          </>
        )}
      </button>
    </form>
  );
};

//Ambulance card
const AmbCard = ({ amb, onUpvote }) => {
  const [upvoted, setUpvoted] = useState(false);

  const handleUpvote = async () => {
    if (upvoted) return;
    try {
      await api.patch(`/ambulance/${amb._id}/upvote`);
      setUpvoted(true);
      onUpvote?.();
    } catch {
      /* silent */
    }
  };

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
      <div
        className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100
                      flex items-center justify-center shrink-0 text-xl"
      >
        🚑
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-slate-800 text-sm font-semibold">
            {amb.providerName}
          </p>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize
                             ${serviceColors[amb.serviceType]}`}
          >
            {amb.serviceType}
          </span>
          {amb.isVerified && (
            <CheckCircle
              size={12}
              className="text-emerald-500"
              title="Verified"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-1">
          {amb.area && (
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <MapPin size={9} /> {amb.area}
            </span>
          )}
          {amb.charge && (
            <span className="text-slate-500 text-xs">💰 {amb.charge}</span>
          )}
          {amb.available24h && (
            <span className="text-blue-600 text-xs font-medium">⏰ 24/7</span>
          )}
          {amb.acAvailable && (
            <span className="text-sky-600 text-xs">❄️ A/C</span>
          )}
          {amb.icuAvailable && (
            <span className="text-rose-600 text-xs">🏥 ICU</span>
          )}
        </div>

        {amb.notes && (
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-1">
            {amb.notes}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleUpvote}
            disabled={upvoted}
            className={`flex items-center gap-1 text-xs transition-colors
              ${upvoted ? "text-blue-600" : "text-slate-400 hover:text-blue-500"}`}
          >
            <ThumbsUp size={11} /> {amb.upvotes + (upvoted ? 1 : 0)}
          </button>
          {amb.altPhone && (
            <a
              href={`tel:${amb.altPhone}`}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Alt: {amb.altPhone}
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <a
          href={`tel:${amb.phone}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800
                     text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Phone size={12} /> Call
        </a>
      </div>
    </div>
  );
};

//OSM result card
const OsmCard = ({ item }) => (
  <div
    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors
                  border-l-2 border-blue-200"
  >
    <div
      className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100
                    flex items-center justify-center shrink-0 text-xl"
    >
      {item.type === "ambulance_station" ? "🚑" : "🏥"}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <p className="text-slate-800 text-sm font-semibold truncate">
          {item.name}
        </p>
        <span
          className="text-[10px] text-blue-500 bg-blue-50 border border-blue-200
                         px-2 py-0.5 rounded-full font-medium shrink-0"
        >
          OpenStreetMap
        </span>
      </div>
      {item.address && (
        <p className="text-slate-500 text-xs flex items-center gap-1">
          <MapPin size={9} /> {item.address}
        </p>
      )}
      {item.lat && item.lng && (
        <p className="text-slate-400 text-[10px] mt-0.5">
          {parseFloat(item.lat).toFixed(4)}, {parseFloat(item.lng).toFixed(4)}
        </p>
      )}
    </div>
    {item.phone && (
      <a
        href={`tel:${item.phone}`}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800
                   text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
      >
        <Phone size={12} /> Call
      </a>
    )}
  </div>
);

//Main Page
const AmbulancePage = () => {
  const [tab, setTab] = useState("list");
  const [data, setData] = useState({
    userSubmitted: [],
    osmResults: [],
    total: 0,
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [showOSM, setShowOSM] = useState(true);

  const fetchAll = async (lat, lng) => {
    setLoading(true);
    try {
      const params = lat && lng ? `?lat=${lat}&lng=${lng}` : "?limit=30";
      const tParam = typeFilter ? `&type=${typeFilter}` : "";

      const [ambRes, statRes] = await Promise.allSettled([
        api.get(`/ambulance${params}${tParam}`),
        api.get(
          `/ambulance/stats${lat && lng ? `?lat=${lat}&lng=${lng}` : ""}`,
        ),
      ]);

      if (ambRes.status === "fulfilled") {
        const raw = ambRes.value.data;
        const actualData = raw.data ? raw.data : raw;

        setData({
          userSubmitted:
            actualData.userSubmitted ||
            (Array.isArray(actualData) ? actualData : []),
          osmResults: actualData.osmResults || [],
          total:
            actualData.total ||
            (Array.isArray(actualData) ? actualData.length : 0),
        });
      }

      if (statRes.status === "fulfilled") {
        setStats(statRes.value.data?.data || statRes.value.data || null);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setData({ userSubmitted: [], osmResults: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        setUserPos([c.latitude, c.longitude]);
        setFlyTo([c.latitude, c.longitude]);
        fetchAll(c.latitude, c.longitude);
      },
      () => toast.error("Could not get location"),
    );
  };

  const allItems = [
    ...(data?.userSubmitted || []).filter(
      (a) => !typeFilter || a.serviceType === typeFilter,
    ),
    ...(showOSM ? data?.osmResults || [] : []),
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      {/*Hero*/}
      <div
        className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800
                      text-white px-4 sm:px-6 pt-10 pb-16"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Siren size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Ambulance Finder
              </h1>
              <p className="text-blue-200 text-sm">
                Community data + live GPS search · Bangladesh
              </p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: "Listed", value: stats.total },
                { label: "Nearby", value: stats.nearbyCount || "—" },
                { label: "From Map", value: data.osmResults.length },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center"
                >
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 pb-12 space-y-5">
        {/*Main card*/}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[
              { id: "list", label: "Ambulances", icon: Siren },
              { id: "map", label: "Map", icon: MapPin },
              { id: "add", label: "Add Data", icon: Plus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5
                            text-xs font-semibold border-b-2 transition-all
                  ${
                    tab === id
                      ? "border-blue-600 text-blue-700 bg-blue-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Locate bar */}
          <div
            className="flex items-center justify-between gap-3 px-5 py-3
                          border-b border-slate-100 bg-slate-50/60"
          >
            <p className="text-slate-500 text-xs">
              {userPos ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle size={11} /> Showing nearby ambulances
                </span>
              ) : (
                "Enable GPS to find ambulances near you"
              )}
            </p>
            <button
              onClick={handleLocate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800
                         text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              <Locate size={12} /> {userPos ? "Refresh" : "Locate Me"}
            </button>
          </div>

          {/* Filters — list tab only */}
          {tab === "list" && (
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 flex-wrap">
              <Filter size={12} className="text-slate-400" />
              {["", "government", "private", "ngo", "hospital"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors
                    ${
                      typeFilter === t
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {t || "All"}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setShowOSM((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                    ${
                      showOSM
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {showOSM ? "✓" : ""} OSM Data
                </button>
              </div>
            </div>
          )}

          {/*List tab*/}
          {tab === "list" && (
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="text-blue-400 animate-spin" />
                </div>
              ) : allItems.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-center px-6">
                  <Siren size={28} className="text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">
                    No ambulances listed yet
                  </p>
                  <p className="text-slate-400 text-xs">
                    {userPos
                      ? "No providers found nearby — try increasing search radius"
                      : "Enable location or add data to get started"}
                  </p>
                </div>
              ) : (
                <>
                  {data.userSubmitted
                    .filter((a) => !typeFilter || a.serviceType === typeFilter)
                    .map((amb) => (
                      <AmbCard
                        key={amb._id}
                        amb={amb}
                        onUpvote={() => fetchAll(...(userPos || []))}
                      />
                    ))}

                  {showOSM && data.osmResults.length > 0 && (
                    <>
                      <div className="px-5 py-2.5 bg-blue-50/60 flex items-center gap-2">
                        <span className="text-blue-600 text-xs font-semibold">
                          🗺️ Fetched from OpenStreetMap (
                          {data.osmResults.length} nearby)
                        </span>
                      </div>
                      {data.osmResults.map((item, i) => (
                        <OsmCard key={item.osmId || i} item={item} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/*Map tab*/}
          {tab === "map" && (
            <div className="h-[420px]">
              <MapContainer
                center={userPos || [23.8103, 90.4125]}
                zoom={12}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OSM"
                />
                {flyTo && <FlyTo coords={flyTo} />}

                {/* User-submitted */}
                {data.userSubmitted.map((amb) => {
                  const coords = amb.location?.coordinates;
                  if (!coords || coords.length < 2) return null;

                  const [lng, lat] = coords;
                  return (
                    <Marker key={amb._id} position={[lat, lng]} icon={ambIcon}>
                      <Popup>
                        <div className="min-w-[160px] p-0.5">
                          <p className="font-bold text-slate-800 text-sm">
                            {amb.providerName}
                          </p>
                          <p className="text-slate-500 text-xs capitalize">
                            {amb.serviceType}
                          </p>
                          {amb.area && (
                            <p className="text-slate-500 text-xs">
                              📍 {amb.area}
                            </p>
                          )}
                          {amb.charge && (
                            <p className="text-slate-500 text-xs">
                              💰 {amb.charge}
                            </p>
                          )}
                          <a
                            href={`tel:${amb.phone}`}
                            className="mt-2 block w-full py-1.5 bg-blue-700 text-white
                                       text-xs font-bold rounded-lg text-center"
                          >
                            📞 {amb.phone}
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* OSM results */}
                {showOSM &&
                  data.osmResults.map((item, i) => {
                    if (!item.lat || !item.lng) return null;
                    return (
                      <Marker
                        key={item.osmId || i}
                        position={[item.lat, item.lng]}
                        icon={osmIcon}
                      >
                        <Popup>
                          <div className="min-w-[150px] p-0.5">
                            <p className="font-bold text-slate-800 text-sm">
                              {item.name}
                            </p>
                            <p className="text-blue-500 text-xs">
                              OpenStreetMap
                            </p>
                            {item.address && (
                              <p className="text-slate-500 text-xs mt-0.5">
                                {item.address}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>
          )}

          {/*Add tab*/}
          {tab === "add" && (
            <div className="p-5">
              <div
                className="flex items-start gap-3 mb-5 p-3.5 bg-blue-50 border border-blue-200
                              rounded-xl"
              >
                <Building2
                  size={16}
                  className="text-blue-600 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-blue-800 text-sm font-semibold">
                    Help Your Community
                  </p>
                  <p className="text-blue-600 text-xs mt-0.5 leading-relaxed">
                    Know an ambulance service? Add their number and location so
                    others can find help quickly in emergencies.
                  </p>
                </div>
              </div>
              <SubmitForm
                onSuccess={() => {
                  setTab("list");
                  fetchAll(...(userPos || []));
                }}
              />
            </div>
          )}
        </div>

        {/* Emergency numbers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-3">
            🆘 National Emergency Numbers (Bangladesh)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { name: "National Emergency", number: "999" },
              { name: "Fire Service", number: "102" },
              { name: "Ambulance (DNCC)", number: "01969-000333" },
              { name: "DGHS Hotline", number: "16400" },
              { name: "Poison Control", number: "01716-847900" },
              { name: "COVID Helpline", number: "333" },
            ].map(({ name, number }) => (
              <a
                key={name}
                href={`tel:${number}`}
                className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-blue-50
                           border border-slate-100 hover:border-blue-200 rounded-xl
                           transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-xl bg-blue-100 group-hover:bg-blue-200
                                flex items-center justify-center shrink-0 transition-colors"
                >
                  <Phone size={13} className="text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-700 text-xs font-semibold truncate">
                    {name}
                  </p>
                  <p className="text-blue-700 text-sm font-black">{number}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulancePage;
