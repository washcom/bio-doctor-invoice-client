import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { clearAuthSession, getStoredUser, getToken, setAuthSession, type AuthUser } from "./auth";
import { apiUrl } from "./api";
import Dashboard from "./Dashboard";

type GsapTimeline = {
  fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>, position?: string | number) => GsapTimeline;
  kill: () => void;
};

type Gsap = {
  timeline: (vars?: Record<string, unknown>) => GsapTimeline;
  fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    gsap?: Gsap;
  }
}

const palette = {
  page: "#edf8ff",
  card: "#ffffff",
  border: "#cfe6ff",
  text: "#0f172a",
  muted: "#475569",
  blue: "#1d4ed8",
  blueSoft: "#eaf5ff",
  red: "#dc2626",
};

function loadGsap() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.gsap) return Promise.resolve(window.gsap);

  return new Promise<Gsap | null>((resolve) => {
    const existing = document.getElementById("gsap-cdn") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.gsap ?? null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "gsap-cdn";
    script.src = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js";
    script.async = true;
    script.onload = () => resolve(window.gsap ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function useIsNarrow(bp = 760) {
  const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < bp : true));

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < bp);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);

  return narrow;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: AuthUser) => void }) {
  const isNarrow = useIsNarrow();
  const shellRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const authCardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/auth/bootstrap"))
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.hasUsers) setMode("setup");
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeline: GsapTimeline | null = null;

    loadGsap().then((gsap) => {
      if (cancelled || !gsap) return;
      const formElements = formRef.current?.querySelectorAll("[data-auth-animate]") ?? [];

      timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo(shellRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 })
        .fromTo(brandRef.current, { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 }, 0.05)
        .fromTo(authCardRef.current, { y: 24, scale: 0.985, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.65 }, 0.12)
        .fromTo(formElements, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.42, stagger: 0.055 }, 0.28);
    });

    return () => {
      cancelled = true;
      timeline?.kill();
    };
  }, [isNarrow]);

  useEffect(() => {
    let cancelled = false;

    loadGsap().then((gsap) => {
      if (cancelled || !gsap || !formRef.current) return;
      gsap.fromTo(
        formRef.current.querySelectorAll("[data-auth-animate]"),
        { y: 10, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.34, stagger: 0.04, ease: "power2.out" }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(apiUrl(mode === "setup" ? "/api/auth/setup" : "/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "setup" ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={shellRef} style={{ minHeight: "100vh", background: "radial-gradient(circle at top, rgba(59,130,246,0.16), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef7ff 100%)", display: "grid", placeItems: "center", padding: isNarrow ? 14 : 20, color: palette.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "min(980px, 100%)", display: "grid", gap: isNarrow ? 16 : 24 }}>
        <div ref={brandRef} style={{ display: "grid", gap: 10, justifyItems: "center", textAlign: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: palette.blue, color: "#fff", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, boxShadow: "0 18px 40px rgba(59, 130, 246, 0.28)" }}>B</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>BioDoctor Invoice Portal</div>
            <div style={{ marginTop: 6, color: palette.muted, fontSize: 15, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              A cleaner, faster way to sign in and manage invoices, quotations, and users from one secure dashboard.
            </div>
          </div>
        </div>

        <div ref={authCardRef} style={{ width: "min(460px, 100%)", margin: "0 auto", overflow: "hidden", borderRadius: isNarrow ? 20 : 30, background: "#fff", boxShadow: "0 28px 90px rgba(15, 23, 42, 0.12)" }}>
          <form ref={formRef} onSubmit={handleSubmit} style={{ padding: isNarrow ? 24 : 40, display: "grid", gap: 20, background: palette.card }}>
            <div data-auth-animate style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{mode === "setup" ? "Create administrator" : "Welcome back"}</div>
              <div style={{ color: palette.muted, fontSize: 14 }}>
                {mode === "setup"
                  ? "Complete the first admin account setup to start using BioDoctor."
                  : "Sign in with your administrator credentials to continue."}
              </div>
              {mode === "setup" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, color: palette.muted, fontSize: 13 }}>
                  Already signed up?
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    style={{ border: "none", background: "transparent", color: palette.blue, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 13 }}
                  >
                    Log in
                  </button>
                </div>
              )}
            </div>

            {mode === "setup" && (
              <label data-auth-animate style={labelStyle}>
                Full name
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={checking || submitting} style={fieldStyle} placeholder="Jane Doe" />
              </label>
            )}

            <label data-auth-animate style={labelStyle}>
              Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={checking || submitting} style={fieldStyle} placeholder="admin@biodoctor.com" />
            </label>

            <label data-auth-animate style={labelStyle}>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={checking || submitting} style={fieldStyle} placeholder="••••••••" />
            </label>

            {error && <div data-auth-animate style={{ color: palette.red, fontSize: 13, fontWeight: 700, marginTop: -8 }}>{error}</div>}

            <button
              data-auth-animate
              type="submit"
              disabled={checking || submitting}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 16,
                background: palette.blue,
                color: "#fff",
                padding: "15px 18px",
                fontSize: 15,
                fontWeight: 800,
                cursor: checking || submitting ? "not-allowed" : "pointer",
                opacity: checking || submitting ? 0.7 : 1,
              }}
            >
              {checking ? "Checking..." : submitting ? "Please wait..." : mode === "setup" ? "Create admin account" : "Sign In"}
            </button>

            {mode === "login" && (
              <div data-auth-animate style={{ marginTop: 12, color: palette.muted, fontSize: 13, lineHeight: 1.7 }}>
                If you don’t have an account yet, ask an administrator to create one for you.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: 16,
  background: "#f8fbff",
  padding: "14px 16px",
  fontSize: 15,
  color: palette.text,
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  fontSize: 14,
  fontWeight: 700,
  color: palette.text,
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()));

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }

    let cancelled = false;
    fetch(apiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        clearAuthSession();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingSession) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: palette.page, color: palette.text }}>Loading...</div>;
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(token, nextUser) => {
          setAuthSession(token, nextUser);
          setUser(nextUser);
        }}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => {
        clearAuthSession();
        setUser(null);
      }}
    />
  );
}
