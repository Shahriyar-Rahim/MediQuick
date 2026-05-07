import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import api from "../api/axios";
import {
  Droplets, UserPlus, Heart, MapPin, Phone, User,
  ChevronDown, Loader2, CheckCircle, AlertTriangle,
  Locate, X, Clock, FileText, Filter,
} from "lucide-react";

//Leaflet setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const donorIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;
    background:#ef4444;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(239,68,68,.5);
    display:flex;align-items:center;justify-content:center;
    font-size:12px;">🩸</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

const FlyTo = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { animate: true, duration: 0.8 });
  }, [coords]);
  return null;
};

//Design tokens (medical-first)
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const bgColor      = (grp) => ({
  "A+":"bg-red-50 text-red-700 border-red-200",
  "A-":"bg-red-50 text-red-600 border-red-200",
  "B+":"bg-blue-50 text-blue-700 border-blue-200",
  "B-":"bg-blue-50 text-blue-600 border-blue-200",
  "AB+":"bg-purple-50 text-purple-700 border-purple-200",
  "AB-":"bg-purple-50 text-purple-600 border-purple-200",
  "O+":"bg-emerald-50 text-emerald-700 border-emerald-200",
  "O-":"bg-emerald-50 text-emerald-600 border-emerald-200",
}[grp] || "bg-slate-100 text-slate-700 border-slate-200");

const urgencyStyle = {
  normal:   "bg-blue-50 text-blue-700 border-blue-200",
  urgent:   "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

//Shared field components
const Label  = ({ children, req }) => (
  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">
    {children}{req && <span className="text-red-400 ml-1">*</span>}
  </label>
);

const Input  = ({ ...props }) => (
  <input {...props}
    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
               text-slate-800 text-sm placeholder-slate-400
               focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
               transition-all" />
);

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select {...props}
      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
                 text-slate-800 text-sm appearance-none cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                 transition-all">
      {children}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2
                                      text-slate-400 pointer-events-none" />
  </div>
);

//GPS Location picker
const LocationPicker = ({ lat, lng, onPick, label = "Your Location" }) => {
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        onPick(c.latitude, c.longitude);
        setLocating(false);
      },
      () => { toast.error("Could not get location"); setLocating(false); }
    );
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm flex items-center gap-2
          ${lat && lng
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <MapPin size={13} className={lat && lng ? "text-emerald-500" : "text-slate-400"} />
          {lat && lng
            ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
            : "No location set"}
        </div>
        <button type="button" onClick={locate} disabled={locating}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700
                     text-white text-xs font-semibold rounded-xl transition-colors
                     disabled:opacity-60 shrink-0">
          {locating
            ? <Loader2 size={13} className="animate-spin" />
            : <Locate size={13} />}
          {locating ? "Locating…" : "Use GPS"}
        </button>
      </div>
    </div>
  );
};

// Donor Form
const DonorForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: "", age: "", phone: "", bloodGroup: "",
    lat: "", lng: "", address: "", lastDonated: "",
  });
  const [file,       setFile]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.phone || !form.bloodGroup)
      return toast.error("Please fill all required fields");
    if (parseInt(form.age) < 18 || parseInt(form.age) > 65)
      return toast.error("Donors must be 18–65 years old");

    setSubmitting(true);
    try {
      await api.post("/blood/donors/register", form);
      toast.success("Registered as donor! Thank you 🩸");
      setForm({ name:"", age:"", phone:"", bloodGroup:"", lat:"", lng:"", address:"", lastDonated:"" });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label req>Full Name</Label>
          <Input placeholder="Your full name" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <Label req>Age</Label>
          <Input type="number" placeholder="18–65" min="18" max="65"
            value={form.age} onChange={set("age")} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label req>Phone Number</Label>
          <Input type="tel" placeholder="01xxxxxxxxx"
            value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <Label req>Blood Group</Label>
          <Select value={form.bloodGroup} onChange={set("bloodGroup")}>
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
      </div>

      <LocationPicker
        lat={form.lat} lng={form.lng}
        onPick={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))}
      />

      <div>
        <Label>Area / Address</Label>
        <Input placeholder="e.g. Mirpur-10, Dhaka"
          value={form.address} onChange={set("address")} />
      </div>

      <div>
        <Label>Last Donated</Label>
        <Input type="date" value={form.lastDonated} onChange={set("lastDonated")} />
      </div>

      <div>
        <Label>Donation Certificate <span className="text-slate-400 normal-case font-normal">(optional)</span></Label>
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200
                        rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
          <FileText size={14} className="text-slate-400 shrink-0" />
          <span className="text-slate-400 text-sm flex-1">
            {file ? file.name : "Upload certificate (PDF/Image)"}
          </span>
          <label className="text-blue-600 text-xs font-semibold cursor-pointer">
            Browse
            <input type="file" accept=".pdf,image/*" className="hidden"
              onChange={(e) => setFile(e.target.files[0])} />
          </label>
        </div>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-red-500 hover:bg-red-600 disabled:bg-red-300
                   text-white font-semibold text-sm rounded-xl
                   transition-colors shadow-sm shadow-red-500/20">
        {submitting
          ? <><Loader2 size={15} className="animate-spin" /> Registering…</>
          : <><UserPlus size={15} /> Register as Donor</>}
      </button>
    </form>
  );
};

//Request Form
const RequestForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    patientName: "", age: "", phone: "", bloodGroup: "", unitsNeeded: "1",
    hospital: "", lat: "", lng: "", address: "", description: "", urgency: "urgent",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.phone || !form.bloodGroup)
      return toast.error("Patient name, phone and blood group are required");

    setSubmitting(true);
    try {
      await api.post("/blood/requests/create", form); 
    toast.success("Blood request posted successfully");
      setForm({
        patientName:"", age:"", phone:"", bloodGroup:"", unitsNeeded:"1",
        hospital:"", lat:"", lng:"", address:"", description:"", urgency:"urgent",
      });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post request");
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label req>Patient Name</Label>
          <Input placeholder="Patient's full name"
            value={form.patientName} onChange={set("patientName")} />
        </div>
        <div>
          <Label>Patient Age</Label>
          <Input type="number" placeholder="Age"
            value={form.age} onChange={set("age")} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label req>Contact Phone</Label>
          <Input type="tel" placeholder="01xxxxxxxxx"
            value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <Label req>Blood Group Needed</Label>
          <Select value={form.bloodGroup} onChange={set("bloodGroup")}>
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Units Needed</Label>
          <Input type="number" min="1" max="10" placeholder="1"
            value={form.unitsNeeded} onChange={set("unitsNeeded")} />
        </div>
        <div>
          <Label>Urgency</Label>
          <Select value={form.urgency} onChange={set("urgency")}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>Hospital / Location Name</Label>
        <Input placeholder="e.g. Dhaka Medical College Hospital"
          value={form.hospital} onChange={set("hospital")} />
      </div>

      <LocationPicker
        lat={form.lat} lng={form.lng}
        label="Patient Location (GPS)"
        onPick={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))}
      />

      <div>
        <Label>Area / Address</Label>
        <Input placeholder="Ward, area, city"
          value={form.address} onChange={set("address")} />
      </div>

      <div>
        <Label>Brief Description</Label>
        <textarea rows={3}
          placeholder="Reason, medical condition, any additional info..."
          value={form.description} onChange={set("description")}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
                     text-slate-800 text-sm placeholder-slate-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                   text-white font-semibold text-sm rounded-xl
                   transition-colors shadow-sm shadow-blue-600/20">
        {submitting
          ? <><Loader2 size={15} className="animate-spin" /> Posting…</>
          : <><Heart size={15} /> Post Blood Request</>}
      </button>
    </form>
  );
};

//Main Page
const BloodPage = () => {
  const [tab,         setTab]         = useState("donors");   // donors | request | map
  const [formTab,     setFormTab]     = useState("donor");    // donor | request
  const [donors,      setDonors]      = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [userPos,     setUserPos]     = useState(null);
  const [flyTo,       setFlyTo]       = useState(null);
  const [filterGroup, setFilterGroup] = useState("");

  const fetchAll = async (lat, lng) => {
    setLoading(true);
    try {
      const params = lat && lng
        ? `?lat=${lat}&lng=${lng}&radius=15000`
        : "?limit=30";
      const gParam = filterGroup ? `&bloodGroup=${filterGroup}` : "";

      const [dRes, rRes, sRes] = await Promise.allSettled([
        api.get(`/blood/all${params}${gParam}`),
        api.get(`/blood/requests${params}${gParam}&status=open`),
        api.get(`/blood/donors/stats${lat && lng ? `?lat=${lat}&lng=${lng}` : ""}`),
      ]);
      if (dRes.status === "fulfilled") setDonors(dRes.value.data?.data || []);
      if (rRes.status === "fulfilled") setRequests(rRes.value.data?.data || []);
      if (sRes.status === "fulfilled") setStats(sRes.value.data?.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => {
        setUserPos([c.latitude, c.longitude]);
        setFlyTo([c.latitude, c.longitude]);
        fetchAll(c.latitude, c.longitude);
      },
      () => toast.error("Could not get location")
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/*Hero banner*/}
      <div className="bg-gradient-to-br from-red-600 via-red-500 to-rose-600
                      text-white px-4 sm:px-6 pt-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Droplets size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Blood Donation</h1>
              <p className="text-red-100 text-sm">Save lives · Connect donors · Bangladesh</p>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: "Donors",  value: stats.total       },
                { label: "Nearby",  value: stats.nearbyCount || "—" },
                { label: "Requests",value: requests.length   },
              ].map(({ label, value }) => (
                <div key={label}
                  className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-red-100 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 pb-12 space-y-5">

        {/*Blood group stats*/}
        {stats?.byGroup?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
              Available Donors by Blood Group
            </p>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((g) => {
                const found = stats.byGroup.find((b) => b._id === g);
                return (
                  <button key={g}
                    onClick={() => setFilterGroup(filterGroup === g ? "" : g)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border
                                text-xs font-bold transition-all
                      ${filterGroup === g
                        ? "ring-2 ring-offset-1 ring-red-400 " + bgColor(g)
                        : bgColor(g)}`}>
                    {g}
                    <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[10px]">
                      {found?.count || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/*Main tabs*/}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {[
              { id: "donors",  label: "Donors",         icon: UserPlus },
              { id: "requests",label: "Requests",        icon: Heart    },
              { id: "map",     label: "Map View",        icon: MapPin   },
              { id: "give",    label: "Register / Post", icon: Droplets },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs
                            font-semibold border-b-2 transition-all
                  ${tab === id
                    ? "border-red-500 text-red-600 bg-red-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Locate me bar */}
          <div className="flex items-center justify-between gap-3 px-5 py-3
                          border-b border-slate-100 bg-slate-50/60">
            <p className="text-slate-500 text-xs">
              {userPos
                ? <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle size={11} /> Location active — showing nearby data
                  </span>
                : "Enable location for nearby results"}
            </p>
            <button onClick={handleLocate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700
                         text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
              <Locate size={12} /> {userPos ? "Update" : "Locate Me"}
            </button>
          </div>

          {/* Filter bar */}
          {(tab === "donors" || tab === "requests") && (
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 flex-wrap">
              <Filter size={12} className="text-slate-400" />
              <span className="text-slate-500 text-xs">Blood group:</span>
              {["", ...BLOOD_GROUPS].map((g) => (
                <button key={g}
                  onClick={() => setFilterGroup(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                    ${filterGroup === g
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {g || "All"}
                </button>
              ))}
            </div>
          )}

          {/*Donors tab*/}
          {tab === "donors" && (
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="text-red-400 animate-spin" />
                </div>
              ) : donors.filter((d) => !filterGroup || d.bloodGroup === filterGroup).length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-center">
                  <Droplets size={28} className="text-slate-300" />
                  <p className="text-slate-500 text-sm font-medium">No donors found</p>
                  <p className="text-slate-400 text-xs">
                    {filterGroup ? `No ${filterGroup} donors nearby` : "Be the first to register!"}
                  </p>
                </div>
              ) : donors
                .filter((d) => !filterGroup || d.bloodGroup === filterGroup)
                .map((donor) => (
                  <div key={donor._id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                                     border font-black text-sm shrink-0 ${bgColor(donor.bloodGroup)}`}>
                      {donor.bloodGroup}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-slate-800 text-sm font-semibold">{donor.name}</p>
                        <span className="text-slate-400 text-xs">· Age {donor.age}</span>
                      </div>
                      {donor.address && (
                        <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                          <MapPin size={9} /> {donor.address}
                        </p>
                      )}
                      {donor.lastDonated && (
                        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                          <Clock size={9} /> Last donated:{" "}
                          {new Date(donor.lastDonated).toLocaleDateString("en-BD")}
                        </p>
                      )}
                    </div>
                    <a href={`tel:${donor.phone}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600
                                 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
                      <Phone size={12} /> Call
                    </a>
                  </div>
                ))
              }
            </div>
          )}

          {/*Requests tab*/}
          {tab === "requests" && (
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="text-red-400 animate-spin" />
                </div>
              ) : requests
                .filter((r) => !filterGroup || r.bloodGroup === filterGroup)
                .length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <Heart size={28} className="text-slate-300" />
                  <p className="text-slate-500 text-sm">No open requests right now</p>
                </div>
              ) : requests
                .filter((r) => !filterGroup || r.bloodGroup === filterGroup)
                .map((req) => (
                  <div key={req._id}
                    className="px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                                       border font-black text-sm shrink-0 ${bgColor(req.bloodGroup)}`}>
                        {req.bloodGroup}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-slate-800 text-sm font-semibold">{req.patientName}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                                           capitalize ${urgencyStyle[req.urgency]}`}>
                            {req.urgency}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {req.unitsNeeded} unit{req.unitsNeeded > 1 ? "s" : ""}
                          </span>
                        </div>
                        {req.hospital && (
                          <p className="text-slate-600 text-xs font-medium">{req.hospital}</p>
                        )}
                        {req.address && (
                          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={9} /> {req.address}
                          </p>
                        )}
                        {req.description && (
                          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
                            {req.description}
                          </p>
                        )}
                        <p className="text-slate-400 text-[10px] mt-1.5">
                          Posted {new Date(req.createdAt).toLocaleString("en-BD")}
                        </p>
                      </div>
                      <a href={`tel:${req.phone}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600
                                   text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
                        <Phone size={12} /> Contact
                      </a>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/*Map tab*/}
          {tab === "map" && (
            <div className="h-[420px]">
              <MapContainer
                center={userPos || [23.8103, 90.4125]} zoom={12}
                className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OSM' />
                {flyTo && <FlyTo coords={flyTo} />}
                {donors.map((d) => {
                  const [lng, lat] = d.location?.coordinates || [0, 0];
                  if (!lat || !lng) return null;
                  return (
                    <Marker key={d._id} position={[lat, lng]} icon={donorIcon}>
                      <Popup>
                        <div className="min-w-[140px] p-0.5">
                          <p className="font-bold text-slate-800">{d.bloodGroup}</p>
                          <p className="text-slate-700 text-sm">{d.name}</p>
                          {d.address && <p className="text-slate-500 text-xs mt-1">{d.address}</p>}
                          <a href={`tel:${d.phone}`}
                            className="mt-2 block w-full py-1.5 bg-red-500 text-white
                                       text-xs font-bold rounded-lg text-center">
                            📞 Call Donor
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* Register / Post tab */}
          {tab === "give" && (
            <div className="p-5">
              {/* Sub-tabs */}
              <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: "donor",   label: "Become a Donor", icon: UserPlus },
                  { id: "request", label: "Request Blood",   icon: Heart   },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setFormTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5
                                rounded-xl text-sm font-semibold transition-all
                      ${formTab === id
                        ? id === "donor"
                          ? "bg-red-500 text-white shadow-sm"
                          : "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {formTab === "donor"
                ? <DonorForm onSuccess={() => { setTab("donors"); fetchAll(...(userPos || [])); }} />
                : <RequestForm onSuccess={() => { setTab("requests"); fetchAll(...(userPos || [])); }} />
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodPage;