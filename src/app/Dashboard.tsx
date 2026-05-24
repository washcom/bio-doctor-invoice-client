import React, { useEffect, useMemo, useState } from "react";
import InvoiceApp from "./InvoiceApp";
import QuotationApp from "./QuotationApp";
import { authHeaders, type AuthUser } from "./auth";
import { apiUrl } from "./api";

const palette = {
  bg: "#edf8ff",
  paper: "#ffffff",
  gray50: "#f8fafc",
  gray100: "#cfe6ff",
  gray200: "#e2e8f0",
  gray300: "#cbd5e1",
  gray500: "#64748b",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1e293b",
  gray900: "#0f172a",
  blue: "#1d4ed8",
  blueDark: "#1e40af",
  blueSoft: "#eaf5ff",
  green: "#16a34a",
  purple: "#7c3aed",
  orange: "#f97316",
  red: "#dc2626",
  redSoft: "#fee2e2",
};

type NavItem = {
  key: "dashboard" | "invoice" | "quotation" | "users";
  label: string;
  icon: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "invoice", label: "Invoice", icon: "🧾" },
  { key: "quotation", label: "Quotation", icon: "📄" },
  { key: "users", label: "Users", icon: "👤", adminOnly: true },
];

type DashboardStat = {
  label: string;
  value: string;
  meta: string;
  detail: string;
  accent?: string;
};

type RecentDocument = {
  id: string;
  client: string;
  due: string;
  amount: string;
  status: string;
  type: string;
  email?: string;
  address?: string;
  phone?: string;
  reference?: string;
};

type DashboardData = {
  stats: DashboardStat[];
  invoiceRecords: RecentDocument[];
  quotationRecords: RecentDocument[];
};

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  active: boolean;
  lastLoginAt?: string;
  createdAt?: string;
};

const defaultDashboardData: DashboardData = {
  stats: [
    { label: "Total Invoices", value: "0", meta: "Generated this year", detail: "0", accent: palette.blue },
    { label: "Total Quotations", value: "0", meta: "Generated this year", detail: "0", accent: palette.red },
    { label: "Sent Emails", value: "0", meta: "Invoices and quotations", detail: "0 not sent", accent: palette.blueDark },
  ],
  invoiceRecords: [],
  quotationRecords: [],
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: palette.paper,
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 18px 50px rgba(32, 100, 233, 0.08)",
        border: `1px solid ${palette.gray100}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    Paid: { color: palette.blue, bg: palette.blueSoft },
    Pending: { color: palette.red, bg: palette.redSoft },
    Overdue: { color: palette.red, bg: palette.redSoft },
    Sent: { color: palette.blue, bg: palette.blueSoft },
    "Not sent": { color: palette.red, bg: palette.redSoft },
    Active: { color: palette.blue, bg: palette.blueSoft },
    Disabled: { color: palette.red, bg: palette.redSoft },
  };
  const style = config[status] || { color: palette.gray700, bg: palette.gray50 };

  return (
    <span style={{ padding: "8px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: style.color, background: style.bg, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: 11,
  color: palette.gray600,
  textTransform: "uppercase",
  letterSpacing: 1,
  background: palette.blueSoft,
  position: "sticky",
  top: 0,
  zIndex: 2,
};

const tableCellStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderTop: `1px solid ${palette.gray100}`,
  fontSize: 13,
  color: palette.gray700,
  verticalAlign: "middle",
};

function RecordsTable({
  records,
  emptyText,
  loading,
  onView,
  maxHeight = 360,
}: {
  records: RecentDocument[];
  emptyText: string;
  loading?: boolean;
  onView?: (record: RecentDocument) => void;
  maxHeight?: number | string;
}) {
  return (
    <div style={{ overflow: "auto", maxHeight, border: `1px solid ${palette.gray100}`, borderRadius: 18, background: palette.paper }}>
      {loading ? (
        <div style={{ padding: 18, borderRadius: 18, background: palette.gray50, color: palette.gray600, fontSize: 13 }}>
          Loading records...
        </div>
      ) : records.length === 0 ? (
        <div style={{ padding: 18, borderRadius: 18, background: palette.gray50, color: palette.gray600, fontSize: 13 }}>
          {emptyText}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: onView ? 760 : 620 }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Document No.</th>
              <th style={tableHeaderStyle}>Client</th>
              <th style={tableHeaderStyle}>Date</th>
              <th style={tableHeaderStyle}>Amount</th>
              <th style={tableHeaderStyle}>Status</th>
              {onView && <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={`${record.type}-${record.reference || record.id}`}>
                <td style={tableCellStyle}>
                  <div style={{ fontWeight: 800, color: palette.gray900 }}>{record.id}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: palette.gray500 }}>{record.type}</div>
                </td>
                <td style={tableCellStyle}>{record.client}</td>
                <td style={tableCellStyle}>{record.due}</td>
                <td style={{ ...tableCellStyle, fontWeight: 800, color: palette.gray900 }}>{record.amount}</td>
                <td style={tableCellStyle}><StatusPill status={record.status} /></td>
                {onView && (
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => onView(record)}
                      style={{
                        border: `1px solid ${palette.gray100}`,
                        borderRadius: 12,
                        background: palette.paper,
                        color: palette.blue,
                        cursor: "pointer",
                        fontWeight: 800,
                        padding: "10px 14px",
                      }}
                    >
                      View
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RecordsPage({
  title,
  subtitle,
  addLabel,
  records,
  loading,
  error,
  search,
  onSearch,
  onAdd,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  records: RecentDocument[];
  loading: boolean;
  error: string;
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
}) {
  const [selectedRecord, setSelectedRecord] = useState<RecentDocument | null>(null);

  return (
    <div style={{ padding: "28px 32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{title}</div>
          <div style={{ color: palette.gray600, fontSize: 14 }}>{subtitle}</div>
          {error && <div style={{ color: palette.red, fontSize: 13, fontWeight: 700, marginTop: 10 }}>{error}</div>}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search records or clients..."
            style={{
              minWidth: 260,
              borderRadius: 14,
              border: `1px solid ${palette.gray100}`,
              padding: "12px 16px",
              fontSize: 14,
              color: palette.gray900,
              background: palette.paper,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={onAdd}
            style={{
              border: "none",
              borderRadius: 14,
              padding: "12px 18px",
              background: palette.blue,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {addLabel}
          </button>
        </div>
      </div>

      <Card style={{ padding: 24 }}>
        <RecordsTable records={records} emptyText="No records found." loading={loading} onView={setSelectedRecord} maxHeight="calc(100vh - 230px)" />
      </Card>

      {selectedRecord && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.32)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <Card style={{ width: "min(520px, 100%)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.gray900 }}>{selectedRecord.id}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: palette.gray600 }}>{selectedRecord.type} record</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ border: "none", borderRadius: 10, background: palette.blueSoft, color: palette.blue, cursor: "pointer", fontWeight: 800, padding: "8px 12px" }}
              >
                Close
              </button>
            </div>
            <div style={{ display: "grid", gap: 12, fontSize: 14, color: palette.gray700 }}>
              <div><strong>Client:</strong> {selectedRecord.client}</div>
              {selectedRecord.email && <div><strong>Email:</strong> {selectedRecord.email}</div>}
              {selectedRecord.phone && <div><strong>Phone:</strong> {selectedRecord.phone}</div>}
              {selectedRecord.address && <div><strong>Address:</strong> {selectedRecord.address}</div>}
              <div><strong>Date:</strong> {selectedRecord.due}</div>
              <div><strong>Amount:</strong> {selectedRecord.amount}</div>
              <div><strong>Status:</strong> {selectedRecord.status}</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/auth/users"), { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/auth/users"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (target: ManagedUser) => {
    setError("");
    try {
      const res = await fetch(`/api/auth/users/${target.id}`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ active: !target.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user");
    }
  };

  return (
    <div style={{ padding: "28px 32px 40px" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>User management</div>
        <div style={{ color: palette.gray600, fontSize: 14 }}>Create users, assign roles, and disable access when needed.</div>
        {error && <div style={{ color: palette.red, fontSize: 13, fontWeight: 800, marginTop: 10 }}>{error}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
        <Card style={{ padding: 24 }}>
          <form onSubmit={createUser} style={{ display: "grid", gap: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: palette.gray900 }}>Add user</div>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" style={inputStyle} />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" style={inputStyle} />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Temporary password" style={inputStyle} />
            <select value={role} onChange={(event) => setRole(event.target.value === "admin" ? "admin" : "user")} style={inputStyle}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={saving} style={{ border: "none", borderRadius: 14, background: palette.blue, color: "#fff", padding: "12px 16px", fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Creating..." : "Create User"}
            </button>
          </form>
        </Card>

        <Card style={{ padding: 24 }}>
          <RecordsTable
            records={users.map((user) => ({
              id: user.name,
              client: user.email,
              due: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "Never",
              amount: user.role,
              status: user.active ? "Active" : "Disabled",
              type: "User",
              reference: user.id,
            }))}
            emptyText={loading ? "Loading users..." : "No users found."}
            loading={loading}
            maxHeight="calc(100vh - 210px)"
          />
          {!loading && users.length > 0 && (
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {users.map((user) => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: palette.gray50 }}>
                  <span style={{ fontSize: 13, color: palette.gray700 }}>{user.email}</span>
                  <button type="button" onClick={() => toggleUser(user)} style={{ border: "none", borderRadius: 10, padding: "8px 12px", background: user.active ? palette.redSoft : palette.blueSoft, color: user.active ? palette.red : palette.blue, fontWeight: 800, cursor: "pointer" }}>
                    {user.active ? "Disable" : "Enable"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: `1px solid ${palette.gray100}`,
  background: palette.gray50,
  padding: "12px 14px",
  fontSize: 14,
  color: palette.gray900,
  outline: "none",
};

export default function Dashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [invoiceRecords, setInvoiceRecords] = useState<RecentDocument[]>([]);
  const [quotationRecords, setQuotationRecords] = useState<RecentDocument[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError("");
      try {
        const res = await fetch(apiUrl("/api/dashboard/stats"), { headers: authHeaders() });
        if (!res.ok) {
          const raw = await res.text();
          let msg = `Server error ${res.status}`;
          try { msg = JSON.parse(raw).error || msg; } catch { msg = raw.slice(0, 300) || msg; }
          throw new Error(msg);
        }
        const data = await res.json();
        if (!cancelled) {
          setDashboardData({
            stats: data.stats?.length ? data.stats : defaultDashboardData.stats,
            invoiceRecords: Array.isArray(data.invoiceRecords) ? data.invoiceRecords : [],
            quotationRecords: Array.isArray(data.quotationRecords) ? data.quotationRecords : [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(error instanceof Error ? error.message : "Could not load dashboard stats");
          setDashboardData(defaultDashboardData);
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      if (activeNav !== "invoice-records" && activeNav !== "quotation-records") return;

      setRecordsLoading(true);
      setRecordsError("");
      try {
        const isInvoice = activeNav === "invoice-records";
        const res = await fetch(apiUrl(isInvoice ? "/api/invoices" : "/api/quotations"), { headers: authHeaders() });
        if (!res.ok) {
          const raw = await res.text();
          let msg = `Server error ${res.status}`;
          try { msg = JSON.parse(raw).error || msg; } catch { msg = raw.slice(0, 300) || msg; }
          throw new Error(msg);
        }
        const data = await res.json();
        if (!cancelled) {
          const records: RecentDocument[] = Array.isArray(data)
            ? data.map((doc) => {
                const dateValue = doc.createdAt || doc.invoiceDate || doc.date;
                const date = dateValue
                  ? new Date(dateValue).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })
                  : "-";
                if (isInvoice) {
                  return {
                    id: doc.invoiceNo || "Invoice",
                    client: doc.clientCompany || doc.recipientEmail || "Client",
                    due: date,
                    amount: `KES ${Number(doc.total || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`,
                    status: doc.sentAt ? "Sent" : "Not sent",
                    type: "Invoice",
                    email: doc.recipientEmail,
                    address: doc.clientAddr,
                    reference: doc._id,
                  };
                }
                return {
                  id: doc.quotationNumber || "Quotation",
                  client: doc.clientName || doc.recipientEmail || "Client",
                  due: date,
                  amount: `KES ${Number(doc.total || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`,
                  status: doc.sentAt ? "Sent" : "Not sent",
                  type: "Quotation",
                  email: doc.clientEmail || doc.recipientEmail,
                  phone: doc.clientPhone,
                  address: doc.clientAddress,
                  reference: doc._id,
                };
              })
            : [];

          if (isInvoice) setInvoiceRecords(records);
          else setQuotationRecords(records);
        }
      } catch (error) {
        if (!cancelled) {
          setRecordsError(error instanceof Error ? error.message : "Could not load records");
          if (activeNav === "invoice-records") setInvoiceRecords([]);
          else setQuotationRecords([]);
        }
      } finally {
        if (!cancelled) setRecordsLoading(false);
      }
    };

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [activeNav]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dashboardData.invoiceRecords.slice(0, 5);
    return dashboardData.invoiceRecords.filter((invoice) =>
      invoice.id.toLowerCase().includes(query) ||
      invoice.client.toLowerCase().includes(query) ||
      invoice.status.toLowerCase().includes(query) ||
      invoice.type?.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [dashboardData.invoiceRecords, search]);

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dashboardData.quotationRecords.slice(0, 5);
    return dashboardData.quotationRecords.filter((quotation) =>
      quotation.id.toLowerCase().includes(query) ||
      quotation.client.toLowerCase().includes(query) ||
      quotation.status.toLowerCase().includes(query) ||
      quotation.type?.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [dashboardData.quotationRecords, search]);

  const visibleInvoiceRecords = useMemo(() => {
    const query = recordSearch.trim().toLowerCase();
    if (!query) return invoiceRecords;
    return invoiceRecords.filter((invoice) =>
      invoice.id.toLowerCase().includes(query) ||
      invoice.client.toLowerCase().includes(query) ||
      invoice.status.toLowerCase().includes(query) ||
      invoice.email?.toLowerCase().includes(query)
    );
  }, [invoiceRecords, recordSearch]);

  const visibleQuotationRecords = useMemo(() => {
    const query = recordSearch.trim().toLowerCase();
    if (!query) return quotationRecords;
    return quotationRecords.filter((quotation) =>
      quotation.id.toLowerCase().includes(query) ||
      quotation.client.toLowerCase().includes(query) ||
      quotation.status.toLowerCase().includes(query) ||
      quotation.email?.toLowerCase().includes(query) ||
      quotation.phone?.toLowerCase().includes(query)
    );
  }, [quotationRecords, recordSearch]);

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.gray900, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside
          style={{
            width: 260,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
            background: palette.paper,
            borderRight: `1px solid ${palette.gray100}`,
            boxShadow: "8px 0 24px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "32px 20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: palette.blue,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                }}
              >
                i
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: palette.gray900 }}>BioDoctor</div>
                <div style={{ fontSize: 12, color: palette.gray500 }}>BioDoctor Dashboard</div>
              </div>
            </div>
            <nav style={{ display: "grid", gap: 6 }}>
              {navItems.filter((item) => !item.adminOnly || user.role === "admin").map((item) => {
                const isActive =
                  activeNav === item.key ||
                  activeNav === `${item.key}-records` ||
                  activeNav === `${item.key}-create`;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setRecordSearch("");
                      setActiveNav(item.key === "dashboard" || item.key === "users" ? item.key : `${item.key}-records`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 16px",
                      borderRadius: 18,
                      background: isActive ? palette.blueSoft : "transparent",
                      color: isActive ? palette.blue : palette.gray700,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </nav>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 18, background: palette.blueSoft }}>
              <span>👤</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: palette.gray900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</span>
                <span style={{ display: "block", fontSize: 12, color: palette.gray600 }}>{user.role}</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 18, background: palette.gray50 }}>
              <span>💬</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: palette.gray700 }}>Support</span>
            </div>
            <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 18, background: palette.gray50, cursor: "pointer" }}>
              <span>🚪</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: palette.gray700 }}>Logout</span>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, height: "100vh", padding: activeNav === "dashboard" ? "28px 32px 40px" : 0, overflow: "auto" }}>
          {activeNav === "invoice-create" ? (
            <InvoiceApp />
          ) : activeNav === "quotation-create" ? (
            <QuotationApp />
          ) : activeNav === "invoice-records" ? (
            <RecordsPage
              title="Invoice records"
              subtitle="Search, view, and manage saved invoices."
              addLabel="Add Invoice"
              records={visibleInvoiceRecords}
              loading={recordsLoading}
              error={recordsError}
              search={recordSearch}
              onSearch={setRecordSearch}
              onAdd={() => setActiveNav("invoice-create")}
            />
          ) : activeNav === "quotation-records" ? (
            <RecordsPage
              title="Quotation records"
              subtitle="Search, view, and manage saved quotations."
              addLabel="Add Quotation"
              records={visibleQuotationRecords}
              loading={recordsLoading}
              error={recordsError}
              search={recordSearch}
              onSearch={setRecordSearch}
              onAdd={() => setActiveNav("quotation-create")}
            />
          ) : activeNav === "users" && user.role === "admin" ? (
            <UserManagementPage />
          ) : (
            <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Invoice dashboard</div>
              <div style={{ color: palette.gray600, fontSize: 14 }}>Monitor invoices, payments, and cash flow from one place.</div>
              {dashboardError && <div style={{ color: palette.red, fontSize: 13, fontWeight: 700, marginTop: 10 }}>Dashboard stats unavailable: {dashboardError}</div>}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search records or clients..."
                style={{
                  minWidth: 220,
                  borderRadius: 16,
                  border: `1px solid ${palette.gray200}`,
                  padding: "14px 18px",
                  fontSize: 14,
                  color: palette.gray900,
                  background: palette.paper,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setActiveNav("invoice-create")}
                style={{
                  border: "none",
                  borderRadius: 14,
                  padding: "12px 18px",
                  background: palette.blue,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Create Invoice
              </button>
              <button
                type="button"
                onClick={() => setActiveNav("quotation-create")}
                style={{
                  border: `1px solid ${palette.gray200}`,
                  borderRadius: 14,
                  padding: "12px 18px",
                  background: palette.paper,
                  color: palette.blue,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Create Quotation
              </button>
              <div style={{ width: 44, height: 44, borderRadius: 16, background: palette.blue, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>MH</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20, marginBottom: 28 }}>
            {dashboardData.stats.map((item) => (
              <Card
                key={item.label}
                style={{
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 160,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: palette.gray500, textTransform: "uppercase", letterSpacing: 1.2 }}>{item.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: palette.gray900, marginTop: 12 }}>{item.value}</div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: item.accent || palette.blue, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                    {dashboardLoading ? "..." : item.value.slice(0, 1)}
                  </div>
                </div>
                <div style={{ marginTop: 20, fontSize: 13, color: palette.gray600, lineHeight: 1.6 }}>
                  {item.meta}
                  <div style={{ marginTop: 8, fontWeight: 700, color: palette.gray800 }}>{item.detail}</div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20, marginBottom: 28 }}>
            <Card style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: palette.gray900 }}>Invoice records</div>
                  <div style={{ fontSize: 13, color: palette.gray600, marginTop: 6 }}>Saved invoice records from the database.</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: palette.blue }}>{dashboardLoading ? "Loading..." : "Latest saved"}</span>
              </div>

              <RecordsTable records={filteredInvoices} emptyText="No invoice records saved yet." maxHeight={300} />
            </Card>

            <Card style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: palette.gray900 }}>Quotation records</div>
                  <div style={{ fontSize: 13, color: palette.gray600, marginTop: 6 }}>Saved quotation records from the database.</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: palette.blue }}>{dashboardLoading ? "Loading..." : "Latest saved"}</span>
              </div>

              <RecordsTable records={filteredQuotations} emptyText="No quotation records saved yet." maxHeight={300} />
            </Card>
          </div>

            </>
          )}
        </main>
      </div>
    </div>
  );
}
