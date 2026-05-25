import { forwardRef, useEffect, useState } from 'react';

export interface QuotationItem {
  description: string;
  qty: number;
  rate: number;
}

export interface QuotationData {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  items: QuotationItem[];
  quotationNumber: string;
  date: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  termsAndConditions: string[];
  includeVAT: boolean;
}

interface QuotationPreviewProps {
  data: QuotationData;
}

function useIsNarrow(bp = 760) {
  const [narrow, setNarrow] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < bp : true));

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < bp);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);

  return narrow;
}

export const QuotationPreview = forwardRef<HTMLDivElement, QuotationPreviewProps>(
  ({ data }, ref) => {
    const isNarrow = useIsNarrow();

    const calculateSubtotal = () => {
      return data.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    };

    const calculateVAT = () => {
      return data.includeVAT ? calculateSubtotal() * 0.16 : 0;
    };

    const calculateTotal = () => {
      return calculateSubtotal() + calculateVAT();
    };

    const formatCurrency = (amount: number) => {
      return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div ref={ref} style={{ maxWidth: 790, width: '100%', margin: '0 auto', background: '#fff', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.12)', padding: isNarrow ? 20 : 28, color: '#0f172a', overflowWrap: 'anywhere' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexDirection: isNarrow ? 'column' : 'row' }}>
          <img src="/biodoctor-logo.png" alt="Biodoctor logo" style={{ width: 92, height: 92, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ textAlign: isNarrow ? 'left' : 'right', fontSize: 12, lineHeight: 1.45, color: '#0f172a' }}>
            <div style={{ fontWeight: 700 }}>Biodoctor Solutions</div>
            <div>Kasarani Biashara Centre,</div>
            <div>2nd Floor, Room C2</div>
            <div>P.O.Box 68035 00200, Nairobi</div>
            <div>Office:: 0722 983 598</div>
            <div>
              Email: <a href="mailto:info@biodoctorskenyasolutions.co.ke" style={{ color: '#1d4ed8', textDecoration: 'none' }}>info@biodoctorskenyasolutions.co.ke</a>
            </div>
            <div>
              Website: <a href="https://www.biodoctorskenyasolutions.co.ke/" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', textDecoration: 'none' }}>https://www.biodoctorskenyasolutions.co.ke/</a>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: '#1d4ed8', margin: '28px 0' }} />

        <h2 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 500, color: '#0f172a', letterSpacing: 0 }}>QUOTATION</h2>

        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? 12 : 24, marginBottom: 22, fontSize: 12, color: '#0f172a' }}>
          <div>
            <div><strong>Name:</strong> {data.clientName}</div>
            <div><strong>Phone:</strong> {data.clientPhone}</div>
          </div>
          <div>
            <div><strong>Email:</strong> {data.clientEmail}</div>
            <div><strong>Address:</strong> {data.clientAddress}</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560, fontSize: 12, color: '#0f172a', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#dbeafe', textAlign: 'left' }}>
                <th style={{ padding: '11px 10px', border: '1px solid #cfe6ff' }}>Description</th>
                <th style={{ padding: '11px 10px', border: '1px solid #cfe6ff', width: 70, textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '11px 10px', border: '1px solid #cfe6ff', width: 120, textAlign: 'right' }}>KES Rate</th>
                <th style={{ padding: '11px 10px', border: '1px solid #cfe6ff', width: 120, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} style={{ background: '#f8fbff' }}>
                  <td style={{ padding: '11px 10px', border: '1px solid #cfe6ff' }}>{item.description || ' '}</td>
                  <td style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'right' }}>{formatCurrency(item.qty * item.rate)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'right', fontWeight: 800 }}>
                  SUBTOTAL:
                </td>
                <td style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'right', fontWeight: 800 }}>{formatCurrency(calculateSubtotal())}</td>
              </tr>
              {data.includeVAT && (
                <tr>
                  <td colSpan={3} style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'right', fontWeight: 800 }}>
                    VAT 16%:
                  </td>
                  <td style={{ padding: '11px 10px', border: '1px solid #cfe6ff', textAlign: 'right', fontWeight: 800 }}>{formatCurrency(calculateVAT())}</td>
                </tr>
              )}
              <tr style={{ background: '#fff1f2' }}>
                <td colSpan={3} style={{ padding: '13px 10px', border: '1px solid #cfe6ff', textAlign: 'right', fontWeight: 800 }}>
                  TOTAL:
                </td>
                <td style={{ padding: '13px 10px', border: '1px solid #cfe6ff', textAlign: 'right', fontWeight: 800 }}>{formatCurrency(calculateTotal())}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.termsAndConditions.length > 0 && (
          <div style={{ marginTop: 24, fontSize: 11, lineHeight: 1.55, color: '#0f172a' }}>
            <strong>Terms and Conditions:</strong>
            <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
              {data.termsAndConditions.map((term, index) => (
                <div key={index} style={{ whiteSpace: 'pre-wrap' }}>{term}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #cfe6ff', borderBottom: '1px solid #cfe6ff', marginTop: 28, padding: '16px 0', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? 12 : 24, fontSize: 12, color: '#0f172a' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <img src="/biodoctor-logo.png" alt="Biodoctor signature stamp" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginTop: 4 }} />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Document Reference:</strong> {data.quotationNumber}</div>
            <div><strong>Date:</strong> {data.date}</div>
          </div>
        </div>

        <div style={{ paddingTop: 16, fontSize: 12, color: '#0f172a' }}>
          <strong>Account Details:</strong>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr 1fr', gap: 18 }}>
            <div><strong>Bank Name:</strong> {data.bankName}</div>
            <div><strong>Account Name:</strong> {data.accountName}</div>
            <div><strong>Account Number:</strong> {data.accountNumber}</div>
          </div>
        </div>
      </div>
    );
  }
);

QuotationPreview.displayName = 'QuotationPreview';
