import React, { useState, useCallback, useRef, useEffect } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LineItem {
  id: number;
  desc: string;
  qty: number;
  unit: number;
  total: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtKES(n: number): string {
  return "KES " + Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function generateInvoiceNumber(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rnd = Math.floor(10000 + Math.random() * 90000);
  return `EK-${dd}-${mm}-${rnd}`;
}
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─────────────────────────────────────────────
// Breakpoint hook
// ─────────────────────────────────────────────
function useIsMobile(bp = 640): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < bp : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const C = {
  bd: "#0f2d6e", bm: "#1a4db5", bl: "#2d6ee0",
  rb: "#c0160f", ow: "#f8f9fc", br: "#dde3f0",
  td: "#0d1b3e", tm: "#4a5778", tl: "#8c9ab5",
  white: "#ffffff", bg: "#eceff8",
};
const gradH   = `linear-gradient(135deg, ${C.bd} 0%, ${C.bm} 45%, ${C.rb} 100%)`;
const gradB   = `linear-gradient(135deg, ${C.bd} 0%, ${C.bm} 50%, ${C.rb} 100%)`;
const gradNum = `linear-gradient(135deg, ${C.bm}, ${C.bd})`;
const shadow  = "0 8px 16px rgba(15,45,110,0.10), 0 24px 56px rgba(15,45,110,0.18), 0 2px 4px rgba(15,45,110,0.08)";
// Brand palette — blue · red · white
const P = { pri: "#1a4db5", drk: "#0f2d6e", red: "#c0160f", txt: "#0d1b3e", muted: "#4a5778", border: "#dde3f0", bg: "#f8f9fc", light: "#e8eefb" };

// ─────────────────────────────────────────────
// Print + responsive styles (injected once)
// ─────────────────────────────────────────────
const PRINT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;margin:0;}

/* ── Responsive overrides ── */
@media(max-width:640px){
  .inv-header-grid { grid-template-columns: 1fr !important; }
  .inv-badge { text-align: left !important; margin-top: 16px; }
  .inv-meta-grid { grid-template-columns: 1fr !important; }
  .inv-bank-grid { grid-template-columns: 1fr 1fr !important; }
  .inv-two-col { grid-template-columns: 1fr !important; }
  .inv-items-head { display: none !important; }
  .inv-item-row { grid-template-columns: 1fr auto !important; gap: 6px !important; padding: 12px !important; }
  .inv-item-desc { grid-column: 1 / -1; font-weight: 600; }
  .inv-item-meta { display: flex !important; gap: 8px; align-items: center; }
  .inv-item-meta label { font-size: 10px; color: #8c9ab5; text-transform: uppercase; letter-spacing: 0.8px; }
  .inv-totals { width: 100% !important; margin-left: 0 !important; }
  .inv-sig-grid { grid-template-columns: 1fr !important; }
  .inv-body { padding: 24px 16px !important; }
  .inv-hband { padding: 24px 16px !important; }
  .inv-footer { flex-direction: column; gap: 6px !important; padding: 14px 16px !important; }
  .inv-topbar { padding: 0 16px !important; }
  .inv-topbar-title { display: none; }
  .inv-stamp { transform: scale(1); }
}

@media print{
  *{
    -webkit-print-color-adjust:exact!important;
    print-color-adjust:exact!important;
    color-adjust:exact!important;
  }
  .no-print{display:none!important;}
  .print-card{box-shadow:none!important;border-radius:0!important;}
  .terms-out{display:block!important;}
  .vat-off-row{display:none!important;}
  input,textarea{border:none!important;background:transparent!important;box-shadow:none!important;outline:none!important;}
  .inv-items-head{display:grid!important;}
  .inv-item-row{grid-template-columns:1fr 70px 130px 130px!important;}
  .inv-item-rmv{display:none!important;}
  @page{margin:0.5cm;}
}
`;

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Section label
// ─────────────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode; extra?: React.ReactNode }> = ({ children, extra }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: C.bm, whiteSpace: "nowrap" }}>
      {children}
    </span>
    <div style={{ flex: 1, minWidth: 20, height: 1, background: `linear-gradient(90deg,${C.bl},transparent)`, opacity: 0.3 }} />
    {extra}
  </div>
);

// ─────────────────────────────────────────────
// Meta tile
// ─────────────────────────────────────────────
const MetaTile: React.FC<{ label: string; value?: string; type?: string; onChange?: (v: string) => void }> = ({ label, value, type = "text", onChange }) => (
  <div style={{ background: C.white, border: `1.5px solid ${C.br}`, borderRadius: 10, padding: "10px 12px", boxShadow: "0 2px 8px rgba(15,45,110,0.07), 0 1px 2px rgba(15,45,110,0.05)" }}>
    <label style={{ fontSize: 10.5, color: C.tl, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>{label}</label>
    <input
      type={type} value={value} onChange={(e) => onChange?.(e.target.value)}
      style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: C.td, fontWeight: 600, background: "transparent", border: "none", outline: "none", width: "100%" }}
    />
  </div>
);

// ─────────────────────────────────────────────
// Info table row
// ─────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean }> = ({
  label, value, onChange, placeholder = "", type = "text", multiline,
}) => (
  <tr>
    <td style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: 0.8, background: C.ow, width: "36%", borderBottom: `1px solid ${C.br}`, whiteSpace: "nowrap", verticalAlign: "top" }}>
      {label}
    </td>
    <td style={{ padding: "6px 12px", borderBottom: `1px solid ${C.br}`, verticalAlign: "top" }}>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={2}
          style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.td, background: "transparent", border: "none", outline: "none", width: "100%", resize: "vertical" }} />
      ) : (
        <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
          style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.td, background: "transparent", border: "none", outline: "none", width: "100%" }} />
      )}
    </td>
  </tr>
);

// ─────────────────────────────────────────────
// Terms clauses
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function BiodoctorInvoice() {
  const styleInjected = useRef(false);
  if (!styleInjected.current && typeof document !== "undefined") {
    styleInjected.current = true;
    const tag = document.createElement("style");
    tag.textContent = PRINT_STYLE;
    document.head.appendChild(tag);
  }

  const isMobile = useIsMobile(640);

  const [invoiceNo, setInvoiceNo]       = useState(generateInvoiceNumber);
  const [invoiceDate, setInvoiceDate]   = useState(todayISO);
  const [paymentTerms, setPaymentTerms] = useState("75% on LPO · 25% on Completion");
  const [lpoRef, setLpoRef]             = useState("");

  const [projName, setProjName] = useState("");
  const [siteLoc, setSiteLoc]   = useState("");

  const [items, setItems] = useState<LineItem[]>([]);
  const nextId = useRef(1);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { id: nextId.current++, desc: "", qty: 1, unit: 0, total: 0 }]);
  }, []);
  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);
  const updateItem = useCallback((id: number, field: "desc" | "qty" | "unit", raw: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const u = { ...it };
        if (field === "desc") u.desc = raw;
        else (u as Record<string, unknown>)[field] = parseFloat(raw) || 0;
        u.total = u.qty * u.unit;
        return u;
      })
    );
  }, []);

  const [vatOn, setVatOn] = useState(false);
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const vatAmt   = vatOn ? subtotal * 0.16 : 0;
  const total    = subtotal + vatAmt;


  const [clientDept,    setClientDept]    = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddr,    setClientAddr]    = useState("");
  const [clientPIN,     setClientPIN]     = useState("");

  const [noteText, setNoteText] = useState("");
  const [sigName, setSigName]   = useState("");
  const [sigTitle, setSigTitle] = useState("");

  // ── Email dialog ──────────────────────────
  const [emailOpen,    setEmailOpen]    = useState(false);
  const [emailTo,      setEmailTo]      = useState("");
  const [emailMsg,     setEmailMsg]     = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus,  setEmailStatus]  = useState<"idle"|"ok"|"err">("idle");
  const [emailError,   setEmailError]   = useState("");
  const [downloading,  setDownloading]  = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // ── Shared PDF capture helper ─────────────
  const captureInvoicePDF = useCallback(async () => {
    const domtoimage         = await import("dom-to-image-more");

    const { default: jsPDF } = await import("jspdf");
    const node = invoiceRef.current!;

    // Save original inline style values then apply overrides.
    // Using a Map so restore is exact even if an error is thrown.
    type StyleMap = Record<string, string>;
    const saved = new Map<HTMLElement, StyleMap>();

    const applyAndSave = (el: HTMLElement, overrides: StyleMap) => {
      const original: StyleMap = {};
      for (const prop of Object.keys(overrides)) {
        original[prop] = el.style.getPropertyValue(prop);
      }
      saved.set(el, original);
      for (const [prop, val] of Object.entries(overrides)) {
        el.style.setProperty(prop, val);
      }
    };

    // 1. Hide every .no-print element
    node.querySelectorAll<HTMLElement>(".no-print").forEach(el =>
      applyAndSave(el, { display: "none" })
    );

    // 2. Strip chrome from all inputs & textareas; hide checkboxes entirely
    node.querySelectorAll<HTMLElement>("input, textarea").forEach(el => {
      const isCheckbox = (el as HTMLInputElement).type === "checkbox";
      applyAndSave(el, isCheckbox
        ? { display: "none" }
        : {
            border:              "none",
            background:          "transparent",
            "box-shadow":        "none",
            outline:             "none",
            padding:             "0",
            appearance:          "none",
            "-webkit-appearance":"none",
          }
      );
    });

    try {
      const srcW = node.scrollWidth;
      const srcH = node.scrollHeight;
      const dataUrl = await domtoimage.default.toJpeg(node, {
        width: srcW, height: srcH, quality: 0.92, bgcolor: "#ffffff",
      });
      const pdfW = 210;
      const pdfH = Math.ceil((srcH * pdfW) / srcW);
      const pdf  = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfW, pdfH] });
      pdf.addImage(dataUrl, "JPEG", 0, 0, pdfW, pdfH);
      return pdf;
    } finally {
      // Restore every element to its original inline styles
      saved.forEach((original, el) => {
        for (const [prop, val] of Object.entries(original)) {
          if (val) {
            el.style.setProperty(prop, val);
          } else {
            el.style.removeProperty(prop);
          }
        }
      });
    }
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const pdf = await captureInvoicePDF();
      pdf.save(`Invoice-${invoiceNo}.pdf`);
    } finally {
      setDownloading(false);
    }
  }, [captureInvoicePDF, invoiceNo]);

  const sendInvoice = useCallback(async () => {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    setEmailStatus("idle");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo, invoiceDate, paymentTerms, lpoRef,
          projName, siteLoc,
          items: items.map(({ desc, qty, unit, total }) => ({ desc, qty, unit, total })),
          subtotal, vatOn, vatAmt, total,
          selectedTerms: [],
          clientCompany, clientDept, clientAddr, clientPIN, noteText,
          sigName, sigTitle,
          recipientEmail: emailTo.trim(),
          message: emailMsg.trim(),
        }),
      });
      if (!res.ok) {
        const raw = await res.text();
        let msg = `Server error ${res.status}`;
        try { msg = JSON.parse(raw).error || msg; } catch { msg = raw.slice(0, 300) || msg; }
        throw new Error(msg);
      }
      setEmailStatus("ok");
      setTimeout(() => { setEmailOpen(false); setEmailStatus("idle"); setEmailTo(""); setEmailMsg(""); }, 2500);
    } catch (e: unknown) {
      setEmailStatus("err");
      setEmailError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setEmailSending(false);
    }
  }, [emailTo, emailMsg, invoiceNo, invoiceDate, paymentTerms, lpoRef, projName, siteLoc, items, subtotal, vatOn, vatAmt, total, clientCompany, clientDept, clientAddr, clientPIN, noteText, sigName, sigTitle]);

  const handlePrint = useCallback(() => window.print(), []);

  // ── Responsive item row ───────────────────
  const renderItemRow = (it: LineItem, idx: number, total_items: number) => {
    if (isMobile) {
      return (
        <div key={it.id} style={{ padding: "12px 16px", borderBottom: idx < total_items - 1 ? `1px solid ${C.br}` : "none", background: idx % 2 === 0 ? C.white : "#fafbff" }}>
          {/* Description full width */}
          <input
            type="text" value={it.desc} placeholder="Description…"
            onChange={(e) => updateItem(it.id, "desc", e.target.value)}
            style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: C.td, fontWeight: 600, background: "transparent", border: "none", outline: "none", width: "100%", marginBottom: 8 }}
          />
          {/* Qty / Unit / Total + remove in a row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9.5, color: C.tl, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Qty</div>
              <input type="number" value={it.qty} min={0}
                onChange={(e) => updateItem(it.id, "qty", e.target.value)}
                style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.td, background: C.ow, border: `1px solid ${C.br}`, borderRadius: 6, padding: "4px 8px", outline: "none", width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: C.tl, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Unit Price</div>
              <input type="number" value={it.unit || ""} placeholder="0.00" min={0} step={0.01}
                onChange={(e) => updateItem(it.id, "unit", e.target.value)}
                style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.td, background: C.ow, border: `1px solid ${C.br}`, borderRadius: 6, padding: "4px 8px", outline: "none", width: "100%" }} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: C.tl, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Total</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.bd, padding: "4px 0" }}>{fmtKES(it.total)}</div>
            </div>
            <button onClick={() => removeItem(it.id)}
              style={{ width: 30, height: 30, borderRadius: 6, background: "#fff0f0", border: "1.5px solid #ffc5c5", color: C.rb, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, alignSelf: "flex-end" }}>
              ✕
            </button>
          </div>
        </div>
      );
    }

    // Desktop row
    return (
      <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 130px 130px 36px", gap: 8, padding: "10px 12px", borderBottom: idx < total_items - 1 ? `1px solid ${C.br}` : "none", alignItems: "center", background: C.white }}>
        <input type="text" value={it.desc} placeholder="Description…" onChange={(e) => updateItem(it.id, "desc", e.target.value)} style={itemInputStyle("left")} />
        <input type="number" value={it.qty} min={0} onChange={(e) => updateItem(it.id, "qty", e.target.value)} style={itemInputStyle("right")} />
        <input type="number" value={it.unit || ""} placeholder="0.00" min={0} step={0.01} onChange={(e) => updateItem(it.id, "unit", e.target.value)} style={itemInputStyle("right")} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.bd, textAlign: "right" }}>{fmtKES(it.total)}</span>
        <button className="no-print" onClick={() => removeItem(it.id)} style={{ width: 28, height: 28, borderRadius: 6, background: "#fff0f0", border: "1.5px solid #ffc5c5", color: C.rb, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✕</button>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, minHeight: "100vh", color: C.td }}>

      {/* ══ TOPBAR ══ */}
      <div className="no-print inv-topbar" style={{ background: gradH, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(15,45,110,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "rgba(255,255,255,.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display',serif", fontSize: 16, color: C.white, border: "1.5px solid rgba(255,255,255,.3)", flexShrink: 0 }}>B</div>
          <span className="inv-topbar-title" style={{ fontSize: 15, fontWeight: 600, color: C.white }}>Biodoctor Solutions Limited — Invoice Generator</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handlePrint} style={btnStyle("white", isMobile)}>🖨{!isMobile && " Print"}</button>
          <button onClick={handleDownload} disabled={downloading} style={{ ...btnStyle("red", isMobile), opacity: downloading ? 0.7 : 1 }}>⬇{!isMobile && (downloading ? " Generating…" : " Download PDF")}</button>
          <button onClick={() => setEmailOpen(true)} style={btnStyle("green", isMobile)}>✉{!isMobile && " Send Email"}</button>
        </div>
      </div>

      {/* ══ EMAIL DIALOG ══ */}
      {emailOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,50,.55)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
             onClick={() => { if (!emailSending) setEmailOpen(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.35)", overflow: "hidden" }}>
            {/* Dialog header */}
            <div style={{ background: `linear-gradient(135deg,${C.bd},${C.bm})`, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: C.white }}>Send Invoice by Email</span>
              <button onClick={() => setEmailOpen(false)} disabled={emailSending} style={{ background: "none", border: "none", color: "rgba(255,255,255,.7)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {/* Dialog body */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.tm, display: "block", marginBottom: 5 }}>Recipient Email *</label>
                <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="client@example.com"
                  style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: C.td, border: `1.5px solid ${C.br}`, borderRadius: 8, padding: "9px 12px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.tm, display: "block", marginBottom: 5 }}>Message (optional)</label>
                <textarea value={emailMsg} onChange={(e) => setEmailMsg(e.target.value)}
                  rows={3} placeholder="Add a personal note…"
                  style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.td, border: `1.5px solid ${C.br}`, borderRadius: 8, padding: "9px 12px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              {emailStatus === "ok" && (
                <div style={{ background: "#eefaf3", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  ✓ Invoice sent successfully!
                </div>
              )}
              {emailStatus === "err" && (
                <div style={{ background: "#fff0f0", border: "1.5px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
                  ✕ {emailError}
                </div>
              )}

              <button onClick={sendInvoice} disabled={emailSending || !emailTo.trim()}
                style={{ padding: "11px 0", borderRadius: 8, border: "none", background: emailSending ? C.br : `linear-gradient(135deg,${C.bd},${C.bm})`, color: emailSending ? C.tl : C.white, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, cursor: emailSending || !emailTo.trim() ? "not-allowed" : "pointer", opacity: !emailTo.trim() ? 0.6 : 1 }}>
                {emailSending ? "Sending…" : "Send Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "16px 12px 48px" : "32px 20px 60px" }}>
        <div ref={invoiceRef} className="print-card" style={{ background: C.white, borderRadius: isMobile ? 12 : 16, boxShadow: shadow, overflow: "hidden" }}>

          {/* ══ HEADER: Logo + Company + Address | INVOICE title ══ */}
          <div style={{ padding: isMobile ? "28px 20px 20px" : "40px 48px 28px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 20, borderBottom: `3px solid ${P.pri}` }}>
            {/* Left: logo + name + address */}
            <div>
              <img src="/biodoctor-logo.png" alt="Biodoctor Logo" style={{ width: 72, height: 72, borderRadius: "50%", display: "block", marginBottom: 12 }} />
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: P.drk, lineHeight: 1.1, fontFamily: "'DM Sans',sans-serif" }}>
                Biodoctor Solutions<span style={{ color: P.red }}>.</span>
              </div>
              <div style={{ fontSize: 11, color: P.muted, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>A Sewer Solution That Stands The Test of Time</div>
            </div>
            {/* Right: INVOICE + editable meta */}
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: isMobile ? 36 : 52, fontWeight: 900, color: P.pri, letterSpacing: -2, lineHeight: 1, fontFamily: "'DM Sans',sans-serif" }}>INVOICE</div>
              <input value={invoiceDate} type="date" onChange={e => setInvoiceDate(e.target.value)} style={{ fontSize: 13, color: P.muted, marginTop: 8, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", display: "block", marginLeft: "auto" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 13, color: P.txt, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>No.</span>
                <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={{ fontSize: 13, color: P.txt, fontWeight: 600, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", textAlign: "right", width: 160 }} />
              </div>
            </div>
          </div>

          {/* ══ TO: CLIENT ══ */}
          <div style={{ padding: isMobile ? "20px 20px 24px" : "24px 48px 32px" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: P.muted, marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>To :</div>
              <input value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Client / Company Name" style={{ display: "block", width: "100%", fontWeight: 700, fontSize: 14, color: P.txt, border: "none", outline: "none", background: "transparent", marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }} />
              <input value={clientDept} onChange={e => setClientDept(e.target.value)} placeholder="Department / Attention" style={{ display: "block", width: "100%", fontSize: 12.5, color: P.muted, border: "none", outline: "none", background: "transparent", marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }} />
              <input value={clientAddr} onChange={e => setClientAddr(e.target.value)} placeholder="P.O Box / Street Address" style={{ display: "block", width: "100%", fontSize: 12.5, color: P.muted, border: "none", outline: "none", background: "transparent", marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }} />
              <input value={clientPIN} onChange={e => setClientPIN(e.target.value)} placeholder="PIN No." style={{ display: "block", width: "100%", fontSize: 12.5, color: P.muted, border: "none", outline: "none", background: "transparent", fontFamily: "'DM Sans',sans-serif" }} />
              {lpoRef && <div style={{ fontSize: 12.5, color: P.muted, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>LPO: {lpoRef}</div>}
            </div>
          </div>

          {/* ══ ITEMS TABLE ══ */}
          <div style={{ padding: isMobile ? "0 20px" : "0 48px" }}>
            {/* Project ref (no-print) */}
            <div className="no-print" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <MetaTile label="Project / Site" value={projName} onChange={setProjName} />
              <MetaTile label="Location" value={siteLoc} onChange={setSiteLoc} />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: P.pri, borderRadius: 6 }}>
                  <th style={{ padding: "13px 16px", textAlign: "left", color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans',sans-serif", borderRadius: "6px 0 0 6px" }}>Items Description</th>
                  <th style={{ padding: "13px 16px", textAlign: "right", color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans',sans-serif", width: 120 }}>Unit Price</th>
                  <th style={{ padding: "13px 12px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans',sans-serif", width: 80 }}>Qnt</th>
                  <th style={{ padding: "13px 16px", textAlign: "right", color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans',sans-serif", width: 120, borderRadius: "0 6px 6px 0" }}>Total</th>
                  <th className="no-print" style={{ width: 36, background: P.pri }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "24px 16px", textAlign: "center", color: P.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif", borderBottom: `1px solid ${P.border}` }}>No items yet — click "+ Add Line Item"</td></tr>
                )}
                {items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: `1px solid ${P.border}` }}>
                    <td style={{ padding: "14px 16px" }}>
                      <input type="text" value={it.desc} placeholder="Item name…" onChange={e => updateItem(it.id, "desc", e.target.value)} style={{ fontWeight: 700, fontSize: 13, color: P.txt, background: "transparent", border: "none", outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif" }} />
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <input type="number" value={it.unit || ""} placeholder="0.00" min={0} step={0.01} onChange={e => updateItem(it.id, "unit", e.target.value)} style={{ fontSize: 13, color: P.txt, background: "transparent", border: "none", outline: "none", width: "100%", textAlign: "right" as const, fontFamily: "'DM Sans',sans-serif" }} />
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      <input type="number" value={it.qty} min={0} onChange={e => updateItem(it.id, "qty", e.target.value)} style={{ fontSize: 13, color: P.txt, background: "transparent", border: "none", outline: "none", width: "100%", textAlign: "center" as const, fontFamily: "'DM Sans',sans-serif" }} />
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, fontSize: 13, color: P.txt, fontFamily: "'DM Sans',sans-serif" }}>
                      {fmtKES(it.total)}
                    </td>
                    <td className="no-print" style={{ padding: "14px 8px", textAlign: "center" }}>
                      <button onClick={() => removeItem(it.id)} style={{ width: 24, height: 24, borderRadius: 4, background: "#fee2e2", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="no-print" onClick={addItem} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 6, background: P.light, border: `1.5px dashed ${P.pri}`, color: P.pri, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>
              + Add Line Item
            </button>
          </div>

          {/* ══ NOTE + TOTALS ══ */}
          <div style={{ padding: isMobile ? "24px 20px" : "28px 48px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32, alignItems: "flex-start" }}>
            {/* Note */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: P.txt, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>Note:</div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Any additional notes or remarks…" rows={4}
                style={{ width: "100%", fontSize: 12.5, color: P.muted, background: "transparent", border: `1px solid ${P.border}`, borderRadius: 6, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" as const }} />
            </div>
            {/* Totals */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${P.border}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                <span style={{ fontWeight: 600, color: P.txt, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Subtotal :</span>
                <span style={{ fontWeight: 700, color: P.pri }}>{fmtKES(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${P.border}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: P.muted }}>
                  <input type="checkbox" checked={vatOn} onChange={e => setVatOn(e.target.checked)} style={{ width: 14, height: 14, accentColor: P.pri, cursor: "pointer" }} />
                  Tax VAT 16% :
                </label>
                <span style={{ fontWeight: 600, color: vatOn ? P.pri : P.muted }}>{vatOn ? fmtKES(vatAmt) : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: P.red, borderRadius: 6, marginTop: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" as const, letterSpacing: 1 }}>Total Due :</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>{fmtKES(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ THANK YOU ══ */}
          <div style={{ padding: isMobile ? "0 20px 20px" : "0 48px 24px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: P.red, fontFamily: "'DM Sans',sans-serif" }}>Thank you for your Business</div>
          </div>

          {/* ══ FOOTER DIVIDER ══ */}
          <div style={{ margin: isMobile ? "0 20px" : "0 48px", borderTop: `1.5px solid ${P.border}` }} />

          {/* ══ FOOTER: 3 columns ══ */}
          <div style={{ padding: isMobile ? "20px" : "20px 48px 32px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: P.txt, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>Questions?</div>
              <div style={{ fontSize: 12, color: P.muted, lineHeight: 2, fontFamily: "'DM Sans',sans-serif" }}>
                <div>Email us : info@biodoctorskenyasolutions.co.ke</div>
                <div>Call us &nbsp;: +254 722 983 598</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: P.txt, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>Payment Info :</div>
              <div style={{ fontSize: 12, color: P.muted, lineHeight: 2, fontFamily: "'DM Sans',sans-serif" }}>
                <div>Account &nbsp;&nbsp;: 4392270023</div>
                <div>A/C Name : Biodoctor Solutions Limited</div>
                <div>Bank &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: NCBA Bank — Thika Road Mall</div>
              </div>
            </div>
          </div>

          {/* ══ SIGNATURE ══ */}
          <div style={{ padding: isMobile ? "0 20px 32px" : "0 48px 40px", borderTop: `1px solid ${P.border}`, paddingTop: 24, marginTop: 4 }}>
            <div className="inv-sig-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: P.muted, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.8, fontFamily: "'DM Sans',sans-serif" }}>Signatory Name</label>
                  <input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Full Name" style={fieldInputStyle()} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: P.muted, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.8, fontFamily: "'DM Sans',sans-serif" }}>Title / Designation</label>
                  <input value={sigTitle} onChange={e => setSigTitle(e.target.value)} placeholder="Director / Sales Manager" style={fieldInputStyle()} />
                </div>
                <div style={{ borderTop: `2px solid ${P.drk}`, paddingTop: 6, marginTop: 40 }}>
                  <span style={{ fontSize: 10, color: P.muted, textTransform: "uppercase" as const, letterSpacing: 1, fontFamily: "'DM Sans',sans-serif" }}>Signature &amp; Date</span>
                </div>
              </div>
              <div className="inv-stamp" style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "center", justifyContent: "center", gap: 8 }}>
                <label style={{ fontSize: 10, color: P.muted, textTransform: "uppercase" as const, letterSpacing: 1, fontFamily: "'DM Sans',sans-serif" }}>Company Stamp / Seal</label>
                <img src="/biodoctor-logo.png" alt="Biodoctor Stamp" style={{ width: 140, height: 140, borderRadius: "50%" }} />
              </div>
            </div>
          </div>

        </div>{/* /card */}
        <p className="no-print" style={{ textAlign: "center", fontSize: 12, color: C.tl, marginTop: 16 }}>
          Fill in the fields above · Tap "Download PDF" to save
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────
function btnStyle(v: "white" | "red" | "green", compact = false): React.CSSProperties {
  const base: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: compact ? "7px 12px" : "8px 18px", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: compact ? 13 : 13.5, fontWeight: 600, cursor: "pointer", border: "none", whiteSpace: "nowrap" };
  if (v === "white")  return { ...base, background: "#fff", color: C.bm, boxShadow: "0 2px 8px rgba(0,0,0,.15)" };
  if (v === "green")  return { ...base, background: "linear-gradient(135deg,#15803d,#16a34a)", color: "#fff", boxShadow: "0 2px 8px rgba(21,128,61,.4)" };
  return { ...base, background: "linear-gradient(135deg,#e02020,#c0160f)", color: "#fff", boxShadow: "0 2px 8px rgba(192,22,15,.4)" };
}
function itemInputStyle(align: "left" | "right"): React.CSSProperties {
  return { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.td, background: "transparent", border: "none", outline: "none", width: "100%", textAlign: align };
}
function fieldInputStyle(): React.CSSProperties {
  return { fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: C.td, background: C.ow, border: `1.5px solid ${C.br}`, borderRadius: 8, padding: "9px 12px", outline: "none", width: "100%" };
}
function totRowStyle(): React.CSSProperties {
  return { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", fontSize: 13.5, borderBottom: `1px solid ${C.br}` };
}
