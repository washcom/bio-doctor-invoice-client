import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileEdit, Mail, Printer } from "lucide-react";
import { authHeaders } from "./auth";
import { apiUrl } from "./api";

interface LineItem {
  id: number;
  desc: string;
  qty: number;
  rate: number;
  total: number;
}

const BRAND = {
  page: "#edf8ff",
  card: "#ffffff",
  border: "#cfe6ff",
  accent: "#0ea5e9",
  accentDark: "#0284c7",
  text: "#0f172a",
  muted: "#475569",
  light: "#f8fcff",
  shadow: "0 22px 45px rgba(15, 23, 42, 0.08)",
};

function formatKES(value: number) {
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${suffix}`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

const PRINT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;margin:0;background:#edf8ff;color:#0f172a;}
input,textarea,button{font-family:'DM Sans',sans-serif;}
.print-card{box-shadow:none!important;border-radius:0!important;}
.invoice-table th, .invoice-table td{border-color:#dbeafe!important;}
@media print{.no-print{display:none!important;}}
@page{margin:0.5cm;}
`;

function useIsMobile(bp = 960) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < bp : true);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);
  return mobile;
}

export default function InvoiceApp() {
  const styleInjected = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!styleInjected.current && typeof document !== "undefined") {
      styleInjected.current = true;
      const tag = document.createElement("style");
      tag.textContent = PRINT_STYLE;
      document.head.appendChild(tag);
    }
  }, []);

  const [showPreview, setShowPreview] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState(generateInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(todayISO);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [lpoRef, setLpoRef] = useState("");
  const [projName, setProjName] = useState("");
  const [siteLoc, setSiteLoc] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientDept, setClientDept] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPIN, setClientPIN] = useState("");
  const [bankName, setBankName] = useState("NCBA Bank");
  const [bankAccountName, setBankAccountName] = useState("Biodoctor Solutions Limited");
  const [bankAccountNumber, setBankAccountNumber] = useState("4392270023");
  const [noteText, setNoteText] = useState("");
  const [sigName, setSigName] = useState("");
  const [sigTitle, setSigTitle] = useState("");

  const [vatOn, setVatOn] = useState(true);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "ok" | "err">("idle");
  const [emailError, setEmailError] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    { id: 1, desc: "", qty: 1, rate: 0, total: 0 },
  ]);
  const nextId = useRef(2);

  const addItem = () => {
    setItems((prev) => [...prev, { id: nextId.current++, desc: "", qty: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: "desc" | "qty" | "rate", raw: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item };
        if (field === "desc") {
          next.desc = raw;
        } else if (field === "qty") {
          next.qty = Math.max(0, parseInt(raw, 10) || 0);
        } else {
          next.rate = Math.max(0, parseFloat(raw) || 0);
        }
        next.total = next.qty * next.rate;
        return next;
      })
    );
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const vatAmount = vatOn ? subtotal * 0.16 : 0;
  const total = subtotal + vatAmount;

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNo}</title>
          <style>${PRINT_STYLE}</style>
        </head>
        <body>
          ${previewRef.current.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const handleGenerate = () => {
    if (formDisabled) return;
    setShowPreview(true);
  };
  const handleEdit = () => setShowPreview(false);

  const handleOpenEmail = () => {
    setEmailTo(clientEmail);
    setEmailMsg("Please find your invoice attached.");
    setEmailStatus("idle");
    setEmailError("");
    setEmailOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    setEmailStatus("idle");
    try {
      const payload = {
        invoiceNo,
        invoiceDate,
        paymentTerms,
        lpoRef,
        projName,
        siteLoc,
        items: items.map((item) => ({ desc: item.desc, qty: item.qty, unit: item.rate, total: item.total })),
        subtotal,
        vatOn,
        vatAmt: vatAmount,
        total,
        selectedTerms: [],
        clientCompany: clientName,
        clientDept,
        clientAddr: clientAddress,
        clientPIN,
        noteText: [
          noteText.trim(),
          `Phone: ${clientPhone || "-"}`,
          `Email: ${clientEmail || "-"}`,
        ].filter(Boolean).join("\n"),
        sigName,
        sigTitle,
        bank: {
          account: bankAccountNumber,
          name: bankAccountName,
          bank: bankName,
        },
        recipientEmail: emailTo.trim(),
        message: emailMsg.trim(),
      };
      const res = await fetch(apiUrl("/api/invoices"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const raw = await res.text();
        let msg = `Server error ${res.status}`;
        try { msg = JSON.parse(raw).error || msg; } catch { msg = raw.slice(0, 300) || msg; }
        throw new Error(msg);
      }
      setEmailStatus("ok");
      setTimeout(() => {
        setEmailOpen(false);
        setEmailStatus("idle");
      }, 2200);
    } catch (error) {
      setEmailStatus("err");
      setEmailError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setEmailSending(false);
    }
  };

  const formDisabled = !clientName.trim() || !clientEmail.trim() || items.every((item) => !item.desc.trim());

  const sharedCardStyles: React.CSSProperties = {
    background: BRAND.card,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 24,
    boxShadow: BRAND.shadow,
    padding: 24,
  };

  const formFieldStyles: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: `1px solid ${BRAND.border}`,
    background: BRAND.light,
    padding: "12px 14px",
    fontSize: 14,
    color: BRAND.text,
    outline: "none",
  };

  const previewActionStyles: React.CSSProperties = {
    border: "none",
    borderRadius: 4,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    padding: "12px 20px",
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.page, color: BRAND.text }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 40px" }}>
        {emailOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15, 23, 42, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setEmailOpen(false)}>
            <div style={{ width: "100%", maxWidth: 460, background: BRAND.card, borderRadius: 24, boxShadow: BRAND.shadow, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: BRAND.accent, padding: "22px 24px", color: "#fff" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Send Invoice by Email</div>
              </div>
              <div style={{ padding: 24, display: "grid", gap: 16 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.muted }}>Recipient email</span>
                  <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="client@example.com" style={formFieldStyles} />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.muted }}>Message</span>
                  <textarea value={emailMsg} onChange={(e) => setEmailMsg(e.target.value)} rows={4} style={{ ...formFieldStyles, resize: "vertical", minHeight: 100 }} />
                </label>
                {emailStatus === "ok" && <div style={{ padding: 14, borderRadius: 14, background: "#ecfdf5", color: "#166534", fontWeight: 700 }}>Invoice sent successfully.</div>}
                {emailStatus === "err" && <div style={{ padding: 14, borderRadius: 14, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>Error: {emailError}</div>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setEmailOpen(false)} style={{ padding: "12px 18px", borderRadius: 14, border: `1px solid ${BRAND.border}`, background: BRAND.light, color: BRAND.text, cursor: "pointer", width: isMobile ? "100%" : undefined }}>Cancel</button>
                  <button type="button" onClick={handleSendEmail} disabled={emailSending || !emailTo.trim()} style={{ padding: "12px 18px", borderRadius: 14, border: "none", background: BRAND.accent, color: "#fff", fontWeight: 700, cursor: emailSending || !emailTo.trim() ? "not-allowed" : "pointer", opacity: emailSending || !emailTo.trim() ? 0.65 : 1, width: isMobile ? "100%" : undefined }}>
                    {emailSending ? "Sending…" : "Send email"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPreview ? (
          <div style={{ display: "grid", gap: 18 }}>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)", position: "sticky", top: 0, zIndex: 20 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 600, color: BRAND.text }}>Invoice Generator</h1>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
                <button type="button" onClick={handleEdit} style={{ ...previewActionStyles, background: "#1d4ed8", width: isMobile ? "100%" : undefined, justifyContent: "center" }}>
                  <FileEdit size={18} />
                  Edit Invoice
                </button>
                <button type="button" onClick={handlePrint} style={{ ...previewActionStyles, background: "#c90808", width: isMobile ? "100%" : undefined, justifyContent: "center" }}>
                  <Printer size={18} />
                  Print Invoice
                </button>
                <button type="button" onClick={handleOpenEmail} style={{ ...previewActionStyles, background: "#16a34a", width: isMobile ? "100%" : undefined, justifyContent: "center" }}>
                  <Mail size={18} />
                  Send Email
                </button>
              </div>
            </div>

            <div ref={previewRef} style={{ maxWidth: 790, width: "100%", margin: "0 auto", background: "#fff", boxShadow: "0 8px 22px rgba(15, 23, 42, 0.12)", padding: isMobile ? 20 : 28, overflowWrap: "anywhere" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexDirection: isMobile ? "column" : "row" }}>
                <img src="/biodoctor-logo.png" alt="Biodoctor logo" style={{ width: 92, height: 92, borderRadius: "50%", objectFit: "cover" }} />
                <div style={{ textAlign: isMobile ? "left" : "right", fontSize: 12, lineHeight: 1.45, color: BRAND.text }}>
                  <div style={{ fontWeight: 700 }}>Biodoctor Solutions</div>
                  <div>Kasarani Biashara Centre,</div>
                  <div>2nd Floor, Room C2</div>
                  <div>P.O.Box 68035 00200, Nairobi</div>
                  <div>Office:: 0722 983 598</div>
                  <div>
                    Email: <a href="mailto:info@biodoctorskenyasolutions.co.ke" style={{ color: "#1d4ed8", textDecoration: "none" }}>info@biodoctorskenyasolutions.co.ke</a>
                  </div>
                  <div>
                    Website: <a href="https://www.biodoctorskenyasolutions.co.ke/" target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "none" }}>https://www.biodoctorskenyasolutions.co.ke/</a>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: "#1d4ed8", margin: "28px 0" }} />

              <h2 style={{ margin: "0 0 24px", fontSize: 26, fontWeight: 500, color: BRAND.text, letterSpacing: 0 }}>INVOICE</h2>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 22, fontSize: 12, color: BRAND.text }}>
                <div>
                  <div><strong>Name:</strong> {clientName}</div>
                  {clientDept && <div><strong>Department:</strong> {clientDept}</div>}
                  <div><strong>Phone:</strong> {clientPhone}</div>
                  {clientPIN && <div><strong>PIN:</strong> {clientPIN}</div>}
                </div>
                <div>
                  <div><strong>Email:</strong> {clientEmail}</div>
                  <div><strong>Address:</strong> {clientAddress}</div>
                </div>
              </div>

              {(paymentTerms || projName || siteLoc || lpoRef) && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 22, fontSize: 12, color: BRAND.text }}>
                  {paymentTerms && <div><strong>Payment Terms:</strong><br />{paymentTerms}</div>}
                  {projName && <div><strong>Project:</strong><br />{projName}</div>}
                  {siteLoc && <div><strong>Site Location:</strong><br />{siteLoc}</div>}
                  {lpoRef && <div><strong>LPO Ref:</strong><br />{lpoRef}</div>}
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table className="invoice-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 560, fontSize: 12, color: BRAND.text }}>
                  <thead>
                    <tr style={{ background: "#dbeafe", textAlign: "left" }}>
                      <th style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}` }}>Description</th>
                      <th style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, width: 70, textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, width: 120, textAlign: "right" }}>KES Rate</th>
                      <th style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, width: 120, textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} style={{ background: "#f8fbff" }}>
                        <td style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}` }}>{item.desc || " "}</td>
                        <td style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "center" }}>{item.qty}</td>
                        <td style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right" }}>{formatKES(item.rate).replace("KES ", "KES ")}</td>
                        <td style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right" }}>{formatKES(item.total)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right", fontWeight: 800 }}>SUBTOTAL:</td>
                      <td style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right", fontWeight: 800 }}>{formatKES(subtotal)}</td>
                    </tr>
                    {vatOn && (
                      <tr>
                        <td colSpan={3} style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right", fontWeight: 800 }}>VAT 16%:</td>
                        <td style={{ padding: "11px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right", fontWeight: 800 }}>{formatKES(vatAmount)}</td>
                      </tr>
                    )}
                    <tr style={{ background: "#fff1f2" }}>
                      <td colSpan={3} style={{ padding: "13px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right", fontWeight: 800 }}>TOTAL:</td>
                      <td style={{ padding: "13px 10px", border: `1px solid ${BRAND.border}`, textAlign: "right", fontWeight: 800 }}>{formatKES(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {noteText.trim() && (
                <div style={{ marginTop: 24, fontSize: 11, lineHeight: 1.55, color: BRAND.text }}>
                  <strong>Note:</strong>
                  <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{noteText}</div>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}`, marginTop: 28, padding: "16px 0", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, fontSize: 12, color: BRAND.text }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <img src="/biodoctor-logo.png" alt="Biodoctor signature stamp" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", marginTop: 4 }} />
                  {sigName && <div><strong>Signed by:</strong> {sigName}</div>}
                  {sigTitle && <div><strong>Title:</strong> {sigTitle}</div>}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div><strong>Document Reference:</strong> {invoiceNo}</div>
                  <div><strong>Date:</strong> {invoiceDate}</div>
                </div>
              </div>

              <div style={{ paddingTop: 16, fontSize: 12, color: BRAND.text }}>
                <strong>Account Details:</strong>
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 18 }}>
                  <div><strong>Bank Name:</strong> {bankName}</div>
                  <div><strong>Account Name:</strong> {bankAccountName}</div>
                  <div><strong>Account Number:</strong> {bankAccountNumber}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...sharedCardStyles, borderRadius: 8, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)", padding: isMobile ? 16 : 22 }}>
            <section style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: BRAND.text }}>Client Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Client Name</span>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter client name" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Phone</span>
                  <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+234 XXX XXX XXXX" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Department / Attention</span>
                  <input value={clientDept} onChange={(e) => setClientDept(e.target.value)} placeholder="Department or attention" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Email</span>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Address</span>
                  <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Client address" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Client PIN</span>
                  <input value={clientPIN} onChange={(e) => setClientPIN(e.target.value)} placeholder="Client PIN" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
              </div>
            </section>

            <section style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: BRAND.text }}>Invoice Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Invoice Number</span>
                  <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Date</span>
                  <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Payment Terms</span>
                  <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Due on receipt" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>LPO Reference</span>
                  <input value={lpoRef} onChange={(e) => setLpoRef(e.target.value)} placeholder="LPO reference" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Project Name</span>
                  <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Project name" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Site Location</span>
                  <input value={siteLoc} onChange={(e) => setSiteLoc(e.target.value)} placeholder="Site location" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
              </div>
            </section>

            <section style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: BRAND.text }}>Items</h2>
                <button type="button" onClick={addItem} style={{ border: "none", borderRadius: 3, background: "#1d4ed8", color: "#fff", padding: "9px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Add Item</button>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 80px 100px 110px auto", gap: 8, alignItems: "center" }}>
                    <input value={item.desc} onChange={(e) => updateItem(item.id, "desc", e.target.value)} placeholder="Item description" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                    <input type="number" value={item.qty} min={0} onChange={(e) => updateItem(item.id, "qty", e.target.value)} style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                    <input type="number" value={item.rate || ""} min={0} step={0.01} onChange={(e) => updateItem(item.id, "rate", e.target.value)} style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                    <div style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{formatKES(item.total)}</div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} style={{ border: `1px solid ${BRAND.border}`, background: "#fff", color: "#b91c1c", borderRadius: 3, padding: "8px 10px", cursor: "pointer", fontWeight: 700 }}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 10, display: "grid", justifyContent: "end", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: 11, color: BRAND.muted }}>
                  <input type="checkbox" checked={vatOn} onChange={(e) => setVatOn(e.target.checked)} style={{ width: 13, height: 13, accentColor: BRAND.accent }} />
                  Include 16% VAT
                </label>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 28, fontSize: 12, color: BRAND.text }}>
                  <strong>Subtotal:</strong>
                  <span>{formatKES(subtotal)}</span>
                </div>
                <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 9, display: "flex", justifyContent: "space-between", gap: 28, fontSize: 13, color: BRAND.text }}>
                  <strong>Total:</strong>
                  <strong>{formatKES(total)}</strong>
                </div>
              </div>
            </section>

            <section style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 18, display: "grid", gap: 12, marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: BRAND.text }}>Notes and Signature</h2>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 11, color: BRAND.text }}>Note</span>
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Any additional notes or remarks" rows={4} style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12, resize: "vertical", minHeight: 82 }} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Signature Name</span>
                  <input value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="Signer name" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Signature Title</span>
                  <input value={sigTitle} onChange={(e) => setSigTitle(e.target.value)} placeholder="Signer title" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
              </div>
            </section>

            <section style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 18, display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: BRAND.text }}>Bank Account Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Bank Name</span>
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Account Name</span>
                  <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account name" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, color: BRAND.text }}>Account Number</span>
                  <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Account number" style={{ ...formFieldStyles, borderRadius: 2, background: "#fff", padding: "9px 10px", fontSize: 12 }} />
                </label>
              </div>
            </section>

            <div style={{ marginTop: 22, display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={formDisabled}
                style={{
                  border: "none",
                  borderRadius: 8,
                  background: formDisabled ? BRAND.border : "#c90808",
                  color: formDisabled ? BRAND.muted : "#fff",
                  cursor: formDisabled ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  padding: "13px 22px",
                  minWidth: 160,
                  width: isMobile ? "100%" : undefined,
                }}
              >
                Generate Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
