import { useState } from "react";
import {
  Mail, Phone, MapPin, Send, Loader2,
  CheckCircle, MessageSquare, Clock,
  Github, ExternalLink,
} from "lucide-react";
import api from "../api/axios";
import { toast } from "react-toastify";

const Label = ({ children, req }) => (
  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">
    {children}{req && <span className="text-red-400 ml-1">*</span>}
  </label>
);

const Input = (props) => (
  <input {...props}
    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
               text-slate-800 text-sm placeholder-slate-400
               focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E40AF]
               transition-all" />
);

const ContactForm = () => {
  const [form,       setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent,       setSent]       = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message)
      return toast.error("Please fill all required fields");
    if (!/\S+@\S+\.\S+/.test(form.email))
      return toast.error("Please enter a valid email");

    setSubmitting(true);
    try {
      // Re-uses the existing feedback endpoint — maps naturally
      await api.post("/feedback", {
        name:    form.name,
        message: `[Contact Form] Subject: ${form.subject || "General"}\n\n${form.message}`,
        rating:  5,
        type:    "general",
        email:   form.email,
      });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) return (
    <div className="flex flex-col items-center text-center py-12 gap-4">
      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200
                      flex items-center justify-center">
        <CheckCircle size={26} className="text-emerald-500" />
      </div>
      <div>
        <p className="text-slate-800 font-bold text-base">Message sent!</p>
        <p className="text-slate-500 text-sm mt-1">
          Thanks for reaching out. We'll get back to you soon.
        </p>
      </div>
      <button
        onClick={() => { setSent(false); setForm({ name:"", email:"", subject:"", message:"" }); }}
        className="text-[#1E40AF] text-sm font-medium hover:text-blue-900 transition-colors">
        Send another message →
      </button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label req>Your Name</Label>
          <Input placeholder="Full name" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <Label req>Email Address</Label>
          <Input type="email" placeholder="you@example.com"
            value={form.email} onChange={set("email")} />
        </div>
      </div>

      <div>
        <Label>Subject</Label>
        <Input placeholder="What's this about?" value={form.subject} onChange={set("subject")} />
      </div>

      <div>
        <Label req>Message</Label>
        <textarea
          rows={5}
          placeholder="Write your message here..."
          value={form.message}
          onChange={set("message")}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl
                     text-slate-800 text-sm placeholder-slate-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E40AF]
                     transition-all"
        />
        <p className="text-slate-400 text-[11px] mt-1 text-right">
          {form.message.length} / 1000
        </p>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-[#1E40AF] hover:bg-blue-900 disabled:bg-blue-300
                   text-white font-semibold text-sm rounded-xl
                   transition-colors shadow-sm shadow-blue-700/15">
        {submitting
          ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
          : <><Send size={15} /> Send Message</>}
      </button>
    </form>
  );
};

const ContactPage = () => {
  const info = [
    {
      icon:  Mail,
      color: "text-[#1E40AF]",
      bg:    "bg-blue-50 border-blue-100",
      label: "Email",
      value: "contact@mediquick.bd",
      href:  "mailto:contact@mediquick.bd",
    },
    {
      icon:  MessageSquare,
      color: "text-emerald-600",
      bg:    "bg-emerald-50 border-emerald-100",
      label: "Feedback",
      value: "Use the feedback form on the home page",
      href:  "/#feedback-section",
    },
    {
      icon:  Clock,
      color: "text-amber-500",
      bg:    "bg-amber-50 border-amber-100",
      label: "Response Time",
      value: "Usually within 24–48 hours",
      href:  null,
    },
    {
      icon:  MapPin,
      color: "text-rose-500",
      bg:    "bg-rose-50 border-rose-100",
      label: "Based In",
      value: "Bangladesh Army University of Science & Technology (BAUST)",
      href:  null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFB]">

      {/* Hero */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#1E40AF] flex items-center justify-center
                          shadow-md shadow-blue-700/20 mx-auto mb-4">
            <Mail size={18} className="text-white" />
          </div>
          <h1 className="text-slate-800 text-2xl font-extrabold">Contact Us</h1>
          <p className="text-slate-500 text-sm mt-2">
            Have a question, suggestion, or want to report an issue?
            We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Contact info sidebar */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
              Get in Touch
            </h2>
            {info.map(({ icon: Icon, color, bg, label, value, href }) => (
              <div key={label}
                className={`flex items-start gap-3 p-4 border rounded-2xl bg-white ${bg}`}>
                <div className={`w-8 h-8 rounded-xl border flex items-center
                                 justify-center shrink-0 ${bg}`}>
                  <Icon size={14} className={color} />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide">
                    {label}
                  </p>
                  {href ? (
                    <a href={href}
                      className={`text-xs font-medium mt-0.5 wrap-break-word leading-snug
                                  hover:underline ${color}`}>
                      {value}
                    </a>
                  ) : (
                    <p className="text-slate-700 text-xs font-medium mt-0.5 leading-snug">
                      {value}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Note */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-amber-700 text-xs leading-relaxed">
                <span className="font-semibold">Note:</span> This is a student project
                maintained on a voluntary basis. Response times may vary.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
              Send a Message
            </h2>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <ContactForm />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;