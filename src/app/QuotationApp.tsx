import { useEffect, useRef, useState } from "react";
import { FileEdit, Mail, Printer } from "lucide-react";
import { QuotationForm } from "./components/QuotationForm";
import { QuotationPreview } from "./components/QuotationPreview";
import { authHeaders } from "./auth";
import { apiErrorMessage, apiUrl } from "./api";
import type { CSSProperties } from "react";
import type { QuotationData } from "./components/QuotationPreview";

const PRINT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;margin:0;background:#edf8ff;color:#0f172a;padding:20px;}
input,textarea,button{font-family:'DM Sans',sans-serif;}
@media print{body{margin:0;padding:0;}.no-print{display:none!important;}}
@page{margin:0.5cm;}
`;

const BRAND = {
  page: "#edf8ff",
  card: "#ffffff",
  border: "#cfe6ff",
  text: "#0f172a",
};

function useIsNarrow(bp = 760) {
  const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < bp : true));

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < bp);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);

  return narrow;
}

export default function QuotationApp({ onSaved }: { onSaved?: () => void }) {
  const isNarrow = useIsNarrow();
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "ok" | "err">("idle");
  const [emailError, setEmailError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerateQuotation = (data: QuotationData) => {
    setQuotationData(data);
    setShowForm(false);
    setEmailStatus("idle");
    setEmailError("");
  };

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotationData?.quotationNumber || ""}</title>
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

  const confirmQuotationSaved = async (quotationNumber: string) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      try {
        const res = await fetch(apiUrl("/api/quotations"), { headers: authHeaders() });
        if (!res.ok) continue;
        const records = await res.json();
        const saved = Array.isArray(records)
          ? records.find((record) => record?.quotationNumber === quotationNumber)
          : null;
        if (saved?.sentAt) return true;
      } catch {
        // Keep the original send error unless verification can prove success.
      }
    }

    return false;
  };

  const handleSendEmail = async () => {
    if (!quotationData) return;

    setEmailSending(true);
    setEmailStatus("idle");
    setEmailError("");
    try {
      const subtotal = quotationData.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
      const vatAmount = quotationData.includeVAT ? subtotal * 0.16 : 0;
      const total = subtotal + vatAmount;
      const payload = {
        ...quotationData,
        items: quotationData.items.map((item) => ({
          ...item,
          total: item.qty * item.rate,
        })),
        subtotal,
        vatAmount,
        total,
        recipientEmail: quotationData.clientEmail,
        message: `Please find quotation ${quotationData.quotationNumber} from Biodoctor Solutions.`,
      };

      const res = await fetch(apiUrl("/api/quotations"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await apiErrorMessage(res));
      }
      onSaved?.();
      setEmailStatus("ok");
    } catch (error) {
      if (error instanceof TypeError && quotationData.quotationNumber) {
        const saved = await confirmQuotationSaved(quotationData.quotationNumber);
        if (saved) {
          onSaved?.();
          setEmailStatus("ok");
          return;
        }
      }
      setEmailStatus("err");
      setEmailError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setEmailSending(false);
    }
  };

  const actionStyles: CSSProperties = {
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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isNarrow ? "16px 14px 28px" : "24px 20px 40px" }}>
        {quotationData && !showForm && (
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)", position: "sticky", top: 0, zIndex: 20, marginBottom: 18 }}>
            <h1 style={{ margin: 0, fontSize: isNarrow ? 22 : 26, fontWeight: 600, color: BRAND.text }}>Quotation Generator</h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isNarrow ? "100%" : "auto" }}>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={{ ...actionStyles, background: "#1d4ed8", width: isNarrow ? "100%" : undefined, justifyContent: "center" }}
              >
                <FileEdit size={18} />
                Edit Quotation
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{ ...actionStyles, background: "#c90808", width: isNarrow ? "100%" : undefined, justifyContent: "center" }}
              >
                <Printer size={18} />
                Print Quotation
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending || !quotationData.clientEmail.trim()}
                style={{
                  ...actionStyles,
                  background: "#16a34a",
                  width: isNarrow ? "100%" : undefined,
                  justifyContent: "center",
                  cursor: emailSending || !quotationData.clientEmail.trim() ? "not-allowed" : "pointer",
                  opacity: emailSending || !quotationData.clientEmail.trim() ? 0.65 : 1,
                }}
              >
                <Mail size={18} />
                {emailSending ? "Sending..." : "Send Email"}
              </button>
            </div>
            {emailStatus === "ok" && <div style={{ width: "100%", color: "#166534", fontSize: 13, fontWeight: 700 }}>Quotation saved and emailed successfully.</div>}
            {emailStatus === "err" && <div style={{ width: "100%", color: "#991b1b", fontSize: 13, fontWeight: 700 }}>Error: {emailError}</div>}
          </div>
        )}

        {showForm && (
          <QuotationForm
            onSubmit={handleGenerateQuotation}
            initialData={quotationData || undefined}
          />
        )}

        {quotationData && !showForm && (
          <QuotationPreview ref={previewRef} data={quotationData} />
        )}
      </div>
    </div>
  );
}
