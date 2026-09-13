import { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Plus, X, Check, MessageCircle, Send, Clock, Search,
  LayoutGrid, Table2, Trash2, ExternalLink, Phone, Mail,
  StickyNote, ChevronDown, Upload, Download
} from "lucide-react";

const STAGES = [
  "Not Contacted",
  "Engaged",
  "Responded",
  "In Conversation",
  "Pilot Offered",
  "Won",
  "Lost",
];

const STAGE_COLOR = {
  "Not Contacted": "#5B6675",
  "Engaged": "#C77D3B",
  "Responded": "#3E8FBF",
  "In Conversation": "#3E8FBF",
  "Pilot Offered": "#D9A441",
  "Won": "#4C9A6A",
  "Lost": "#C1554A",
};

const NICHES = [
  { id: "plumbing", label: "Plumbing" },
  { id: "dentists", label: "Dentists" },
];

const PLUMBING_SEED = [
  { username: "jplumbing947", fullName: "Js One Stop Plumbing", city: "", followers: 17545, phone: "+13237899641", email: "jplumbing947@gmail.com", profileLink: "https://www.instagram.com/jplumbing947/" },
  { username: "repipe_champions", fullName: "Repipe Champions Plumbing and Rooter", city: "San Jose, California", followers: 406, phone: "+18884235215", email: "", profileLink: "https://www.instagram.com/repipe_champions/" },
  { username: "socal1plumbing", fullName: "So-Cal 1 Plumbing & Rooter", city: "", followers: 1294, phone: "+17146105942", email: "", profileLink: "https://www.instagram.com/socal1plumbing/" },
  { username: "visionplumbingheatingcooling", fullName: "Vision Plumbing Heating Cooling", city: "", followers: 4708, phone: "+12504709552", email: "", profileLink: "https://www.instagram.com/visionplumbingheatingcooling/" },
  { username: "totalplumbingtx", fullName: "Total Plumbing Service Inc", city: "", followers: 7660, phone: "+19726814434", email: "", profileLink: "https://www.instagram.com/totalplumbingtx/" },
  { username: "535plumbingllc", fullName: "535 Plumbing LLC", city: "Honolulu, Hawaii", followers: 1650, phone: "+18089796487", email: "", profileLink: "https://www.instagram.com/535plumbingllc/" },
  { username: "biloplumbing198", fullName: "Bilo Plumbing & Heating", city: "Ipswich, Massachusetts", followers: 851, phone: "+19783561566", email: "", profileLink: "https://www.instagram.com/biloplumbing198/" },
  { username: "drain.force.plumbing", fullName: "Drain Force Plumbing", city: "", followers: 4456, phone: "+13109012120", email: "", profileLink: "https://www.instagram.com/drain.force.plumbing/" },
  { username: "kingrooterandplumbing", fullName: "King Rooter Plumbing", city: "Denver, Colorado", followers: 240, phone: "+17208154466", email: "", profileLink: "https://www.instagram.com/kingrooterandplumbing/" },
  { username: "americaneagleplumbing", fullName: "American Eagle Plumbing", city: "Hutto, Texas", followers: 772, phone: "+15126268661", email: "", profileLink: "https://www.instagram.com/americaneagleplumbing/" },
  { username: "dr.wplumber", fullName: "Dr. W Plumber | Repairs & Installs", city: "Miami, Florida", followers: 2622, phone: "+17862628653", email: "", profileLink: "https://www.instagram.com/dr.wplumber/" },
  { username: "colosoplumbing", fullName: "Coloso Plumbing", city: "Cartersville, Georgia", followers: 1505, phone: "+16788009562", email: "", profileLink: "https://www.instagram.com/colosoplumbing/" },
];

function seedFor(nicheId) {
  const base = nicheId === "plumbing" ? PLUMBING_SEED : [];
  return base.map((c, i) => ({
    id: nicheId + "-seed-" + i,
    ...c,
    commented: false,
    dmed: false,
    stage: "Not Contacted",
    reminderDate: "",
    notes: [],
    createdAt: Date.now(),
  }));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function normKey(k) {
  return String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(row, candidates) {
  const map = {};
  Object.keys(row).forEach((k) => (map[normKey(k)] = row[k]));
  for (const c of candidates) {
    const v = map[normKey(c)];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
}

function rowsToContacts(rows) {
  return rows.map((row) => ({
    id: uid(),
    username: String(pick(row, ["username", "handle", "Username"]) || "").replace(/^@/, ""),
    fullName: String(pick(row, ["fullname", "full name", "name", "businessname"]) || ""),
    city: String(pick(row, ["city", "location"]) || ""),
    followers: Number(pick(row, ["followerscount", "followers", "follower count"])) || 0,
    phone: String(pick(row, ["contactphone", "phone", "phonenumber"]) || ""),
    email: String(pick(row, ["publicemail", "email"]) || ""),
    profileLink: String(pick(row, ["profilelink", "externalurl", "website", "link"]) || ""),
    commented: /^(true|yes|1)$/i.test(String(pick(row, ["commented"]) || "")),
    dmed: /^(true|yes|1)$/i.test(String(pick(row, ["dmed"]) || "")),
    stage: STAGES.includes(pick(row, ["stage"])) ? pick(row, ["stage"]) : "Not Contacted",
    reminderDate: String(pick(row, ["reminderdate", "reminder"]) || ""),
    notes: (() => {
      const raw = pick(row, ["notes"]);
      if (!raw) return [];
      return String(raw).split("||").map((s) => s.trim()).filter(Boolean).map((s) => ({ id: uid(), text: s, date: todayStr() }));
    })(),
    createdAt: Date.now(),
  }));
}

function contactsToRows(contacts) {
  return contacts.map((c) => ({
    "Username": c.username,
    "Full name": c.fullName,
    "City": c.city,
    "Followers": c.followers,
    "Phone": c.phone,
    "Email": c.email,
    "Profile link": c.profileLink,
    "Stage": c.stage,
    "Commented": c.commented ? "TRUE" : "FALSE",
    "DMed": c.dmed ? "TRUE" : "FALSE",
    "Reminder date": c.reminderDate,
    "Notes": c.notes.map((n) => `${n.date}: ${n.text}`).join(" || "),
  }));
}

export default function OutreachCRM() {
  const [niche, setNiche] = useState("plumbing");
  const [contacts, setContacts] = useState([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [importMsg, setImportMsg] = useState("");
  const saveTimer = useRef(null);
  const fileInputRef = useRef(null);

  const storageKey = `${niche}-crm-contacts`;

  useEffect(() => {
    setReady(false);
    (async () => {
      try {
        const res = await window.storage.get(storageKey, false);
        const data = res && res.value ? JSON.parse(res.value) : null;
        setContacts(data && data.length ? data : seedFor(niche));
      } catch (e) {
        setContacts(seedFor(niche));
      }
      setReady(true);
    })();
  }, [niche]);

  useEffect(() => {
    if (!ready) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(storageKey, JSON.stringify(contacts), false);
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [contacts, ready, storageKey]);

  const updateContact = (id, patch) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addNote = (id, text) => {
    if (!text.trim()) return;
    setContacts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, notes: [{ id: uid(), text: text.trim(), date: todayStr() }, ...c.notes] }
          : c
      )
    );
  };

  const deleteContact = (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setActiveId(null);
  };

  const addContact = (data) => {
    const c = {
      id: uid(),
      username: data.username || "",
      fullName: data.fullName || "",
      city: data.city || "",
      followers: Number(data.followers) || 0,
      phone: data.phone || "",
      email: data.email || "",
      profileLink: data.profileLink || "",
      commented: false,
      dmed: false,
      stage: "Not Contacted",
      reminderDate: "",
      notes: [],
      createdAt: Date.now(),
    };
    setContacts((prev) => [c, ...prev]);
    setShowAdd(false);
  };

  const handleImport = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const imported = rowsToContacts(rows);
        setContacts((prev) => [...imported, ...prev]);
        setImportMsg(`Imported ${imported.length} rows into ${niche}.`);
        setTimeout(() => setImportMsg(""), 4000);
      } catch (err) {
        setImportMsg("Could not read that file. Use a .csv or .xlsx export.");
        setTimeout(() => setImportMsg(""), 4000);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const rows = contactsToRows(contacts);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, niche);
    XLSX.writeFile(wb, `${niche}-pipeline-${todayStr()}.xlsx`);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const active = contacts.find((c) => c.id === activeId) || null;

  const dueCount = contacts.filter(
    (c) => c.reminderDate && c.reminderDate <= todayStr() && c.stage !== "Won" && c.stage !== "Lost"
  ).length;

  const colors = {
    page: "#10161F",
    card: "#1A222D",
    cardHover: "#212B38",
    elevated: "#232E3D",
    border: "#2B3644",
    text: "#E9ECF1",
    textSecondary: "#93A0B2",
    textMuted: "#5F6C7D",
    accent: "#C77D3B",
    accentSoft: "#3A2A1C",
  };

  return (
    <div style={{ background: colors.page, color: colors.text, fontFamily: "'Inter', sans-serif", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Oswald', sans-serif; letter-spacing: 0.02em; text-transform: uppercase; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .crm-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .crm-scrollbar::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 4px; }
        .crm-input { background: ${colors.elevated}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; outline: none; width: 100%; }
        .crm-input:focus { border-color: ${colors.accent}; }
        .crm-btn { background: ${colors.elevated}; border: 1px solid ${colors.border}; color: ${colors.text}; border-radius: 6px; padding: 7px 12px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; }
        .crm-btn:hover { border-color: ${colors.accent}; }
        .crm-btn-accent { background: ${colors.accent}; border: 1px solid ${colors.accent}; color: #1A120A; font-weight: 500; }
        .crm-btn-accent:hover { opacity: 0.9; }
        .crm-checkbox { accent-color: ${colors.accent}; width: 15px; height: 15px; cursor: pointer; }
        .crm-tab { background: transparent; border: 1px solid ${colors.border}; color: ${colors.textSecondary}; border-radius: 6px; padding: 6px 14px; font-size: 13px; cursor: pointer; font-family: inherit; }
        .crm-tab-active { background: ${colors.accentSoft}; border-color: ${colors.accent}; color: ${colors.accent}; }
      `}</style>

      {/* Niche tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {NICHES.map((n) => (
          <button
            key={n.id}
            className={`crm-tab ${niche === n.id ? "crm-tab-active" : ""}`}
            onClick={() => { setNiche(n.id); setSearch(""); setActiveId(null); }}
          >
            {n.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: colors.textSecondary }}>Loading pipeline...</div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 className="font-display" style={{ fontSize: "22px", margin: 0, fontWeight: 600 }}>
                {NICHES.find((n) => n.id === niche).label} pipeline
              </h1>
              <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "4px 0 0" }}>
                {contacts.length} prospects tracked
                {dueCount > 0 && (
                  <span style={{ color: "#D9A441", marginLeft: "10px" }}>
                    <Clock size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: "4px" }} />
                    {dueCount} reminder{dueCount > 1 ? "s" : ""} due
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: colors.textMuted, marginRight: "4px" }}>
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}
              </span>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} />
              <button className="crm-btn" onClick={() => fileInputRef.current.click()}>
                <Upload size={14} /> Import
              </button>
              <button className="crm-btn" onClick={handleExport}>
                <Download size={14} /> Export
              </button>
              <button className="crm-btn" onClick={() => setView(view === "board" ? "table" : "board")}>
                {view === "board" ? <Table2 size={14} /> : <LayoutGrid size={14} />}
                {view === "board" ? "Table view" : "Board view"}
              </button>
              <button className="crm-btn crm-btn-accent" onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Add prospect
              </button>
            </div>
          </div>

          {importMsg && (
            <div style={{ fontSize: "12px", color: colors.accent, marginBottom: "12px", background: colors.accentSoft, padding: "8px 12px", borderRadius: "6px", display: "inline-block" }}>
              {importMsg}
            </div>
          )}

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "18px", maxWidth: "320px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: colors.textMuted }} />
            <input
              className="crm-input"
              style={{ paddingLeft: "32px" }}
              placeholder="Search name, handle, city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {contacts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textMuted, fontSize: "13px", border: `1px dashed ${colors.border}`, borderRadius: "10px" }}>
              No prospects yet for {NICHES.find((n) => n.id === niche).label.toLowerCase()}.<br />
              Import a scraped list (CSV/XLSX) or add one manually to get started.
            </div>
          ) : view === "board" ? (
            <div className="crm-scrollbar" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "12px" }}>
              {STAGES.map((stage) => {
                const items = filtered.filter((c) => c.stage === stage);
                return (
                  <div key={stage} style={{ minWidth: "230px", flex: "0 0 230px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", padding: "0 2px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: STAGE_COLOR[stage] }} />
                      <span className="font-display" style={{ fontSize: "12px", fontWeight: 600, color: colors.textSecondary }}>{stage}</span>
                      <span style={{ fontSize: "11px", color: colors.textMuted, marginLeft: "auto" }}>{items.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "40px" }}>
                      {items.map((c) => {
                        const overdue = c.reminderDate && c.reminderDate <= todayStr();
                        return (
                          <div
                            key={c.id}
                            onClick={() => setActiveId(c.id)}
                            style={{
                              background: colors.card,
                              border: `1px solid ${overdue ? "#D9A441" : colors.border}`,
                              borderRadius: "8px",
                              padding: "10px 12px",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: "13px", fontWeight: 500 }}>{c.fullName || c.username}</div>
                            <div className="font-mono" style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "2px" }}>@{c.username}</div>
                            {c.city && <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>{c.city}</div>}
                            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                              {c.commented && (
                                <span style={{ fontSize: "10px", background: colors.accentSoft, color: colors.accent, padding: "2px 6px", borderRadius: "4px" }}>
                                  <MessageCircle size={9} style={{ display: "inline", verticalAlign: "-1px" }} /> commented
                                </span>
                              )}
                              {c.dmed && (
                                <span style={{ fontSize: "10px", background: colors.accentSoft, color: colors.accent, padding: "2px 6px", borderRadius: "4px" }}>
                                  <Send size={9} style={{ display: "inline", verticalAlign: "-1px" }} /> dmed
                                </span>
                              )}
                            </div>
                            {overdue && (
                              <div style={{ fontSize: "10px", color: "#D9A441", marginTop: "6px" }}>
                                <Clock size={9} style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }} />
                                reminder due {c.reminderDate}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }} className="crm-scrollbar">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, textAlign: "left" }}>
                    {["Name", "Handle", "Stage", "Commented", "DMed", "Reminder", "Notes"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", color: colors.textMuted, fontWeight: 500, fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      style={{ borderBottom: `1px solid ${colors.border}`, cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.cardHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "9px 10px" }}>{c.fullName || c.username}</td>
                      <td className="font-mono" style={{ padding: "9px 10px", color: colors.textSecondary }}>@{c.username}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: colors.elevated, color: STAGE_COLOR[c.stage] }}>{c.stage}</span>
                      </td>
                      <td style={{ padding: "9px 10px" }}>{c.commented ? <Check size={14} color={colors.accent} /> : "—"}</td>
                      <td style={{ padding: "9px 10px" }}>{c.dmed ? <Check size={14} color={colors.accent} /> : "—"}</td>
                      <td style={{ padding: "9px 10px", color: c.reminderDate && c.reminderDate <= todayStr() ? "#D9A441" : colors.textSecondary }}>{c.reminderDate || "—"}</td>
                      <td style={{ padding: "9px 10px", color: colors.textMuted }}>{c.notes.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {contacts.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: colors.textMuted, fontSize: "13px" }}>
              No prospects match your search.
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 50, overflowY: "auto" }}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "10px", width: "100%", maxWidth: "480px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>{active.fullName || active.username}</div>
                <div className="font-mono" style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>@{active.username}</div>
              </div>
              <button className="crm-btn" style={{ padding: "6px" }} onClick={() => setActiveId(null)}><X size={14} /></button>
            </div>

            <div style={{ display: "flex", gap: "14px", marginTop: "12px", fontSize: "12px", color: colors.textSecondary, flexWrap: "wrap" }}>
              {active.city && <span>{active.city}</span>}
              {active.followers > 0 && <span>{active.followers.toLocaleString()} followers</span>}
              {active.profileLink && (
                <a href={active.profileLink} target="_blank" rel="noreferrer" style={{ color: colors.accent, display: "inline-flex", alignItems: "center", gap: "3px", textDecoration: "none" }}>
                  Profile <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "14px", fontSize: "12px" }}>
              {active.phone && <span style={{ display: "flex", alignItems: "center", gap: "5px", color: colors.textSecondary }}><Phone size={12} /> {active.phone}</span>}
              {active.email && <span style={{ display: "flex", alignItems: "center", gap: "5px", color: colors.textSecondary }}><Mail size={12} /> {active.email}</span>}
            </div>

            <div style={{ marginTop: "18px" }}>
              <label style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase" }}>Stage</label>
              <div style={{ position: "relative", marginTop: "4px" }}>
                <select
                  className="crm-input"
                  style={{ appearance: "none", paddingRight: "28px" }}
                  value={active.stage}
                  onChange={(e) => updateContact(active.id, { stage: e.target.value })}
                >
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: "10px", top: "10px", color: colors.textMuted, pointerEvents: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "18px", marginTop: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" className="crm-checkbox" checked={active.commented} onChange={(e) => updateContact(active.id, { commented: e.target.checked })} />
                Commented
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" className="crm-checkbox" checked={active.dmed} onChange={(e) => updateContact(active.id, { dmed: e.target.checked })} />
                DMed
              </label>
            </div>

            <div style={{ marginTop: "14px" }}>
              <label style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase" }}>Reminder date</label>
              <input
                type="date"
                className="crm-input"
                style={{ marginTop: "4px" }}
                value={active.reminderDate}
                onChange={(e) => updateContact(active.id, { reminderDate: e.target.value })}
              />
            </div>

            <div style={{ marginTop: "18px" }}>
              <label style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                <StickyNote size={11} /> Notes
              </label>
              <NoteForm onSubmit={(text) => addNote(active.id, text)} />
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
                {active.notes.length === 0 && <div style={{ fontSize: "12px", color: colors.textMuted }}>No notes yet.</div>}
                {active.notes.map((n) => (
                  <div key={n.id} style={{ background: colors.elevated, borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "13px" }}>{n.text}</div>
                    <div style={{ fontSize: "10px", color: colors.textMuted, marginTop: "3px" }}>{n.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="crm-btn"
              style={{ marginTop: "20px", color: "#C1554A", borderColor: "#C1554A33" }}
              onClick={() => deleteContact(active.id)}
            >
              <Trash2 size={13} /> Remove prospect
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addContact} colors={colors} />}
    </div>
  );
}

function NoteForm({ onSubmit }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
      <input
        className="crm-input"
        placeholder="Add a note..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit(val);
            setVal("");
          }
        }}
      />
      <button
        className="crm-btn"
        onClick={() => {
          onSubmit(val);
          setVal("");
        }}
      >
        Add
      </button>
    </div>
  );
}

function AddModal({ onClose, onAdd, colors }) {
  const [form, setForm] = useState({ username: "", fullName: "", city: "", followers: "", phone: "", email: "", profileLink: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 60, overflowY: "auto" }}>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "10px", width: "100%", maxWidth: "420px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "15px", fontWeight: 500 }}>Add prospect</div>
          <button className="crm-btn" style={{ padding: "6px" }} onClick={onClose}><X size={14} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input className="crm-input" placeholder="Instagram handle" value={form.username} onChange={set("username")} />
          <input className="crm-input" placeholder="Business / full name" value={form.fullName} onChange={set("fullName")} />
          <input className="crm-input" placeholder="City, State" value={form.city} onChange={set("city")} />
          <input className="crm-input" placeholder="Followers" type="number" value={form.followers} onChange={set("followers")} />
          <input className="crm-input" placeholder="Phone" value={form.phone} onChange={set("phone")} />
          <input className="crm-input" placeholder="Email" value={form.email} onChange={set("email")} />
          <input className="crm-input" placeholder="Profile link" value={form.profileLink} onChange={set("profileLink")} />
        </div>
        <button
          className="crm-btn crm-btn-accent"
          style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
          onClick={() => onAdd(form)}
        >
          <Plus size={14} /> Add to pipeline
        </button>
      </div>
    </div>
  );
}
