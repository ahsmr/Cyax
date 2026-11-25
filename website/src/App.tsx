import { useState, useEffect } from "react";
import {
  Activity,
  Code2,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  GitBranch,
  Layers,
  Mail,
  Waves,
  Zap,
} from "lucide-react";

// Import KaTeX stylesheet (prevents duplicated raw math text & missing fraction bars)
import "katex/dist/katex.min.css";
// Import your actual Cyax app directly from the root src/ folder
import CyaxApp from "../../src/App";
// Import your root app styles
import "../../src/index.css";
import "../../src/App.css";

import rootPkg from "../../package.json";

// Update these constants with your release link and personal contact details
const WINDOWS_EXE_URL = `https://github.com/ahsmr/Cyax/releases/latest/download/Cyax.Setup.${rootPkg.version}.exe`;
const GITHUB_REPO_URL = "https://github.com/ahsmr/Cyax";
const GITHUB_PROFILE_URL = "https://github.com/ahsmr";
const CONTACT_EMAIL = "ahsmr.dev@gmail.com";

export function App() {
  const [showSimulator, setShowSimulator] = useState(
    () => window.location.hash === "#app",
  );

  // Sync simulator state with browser URL hash (#app) so browser Back button works
  const openSimulator = () => {
    window.history.pushState({ simulator: true }, "", "#app");
    setShowSimulator(true);
  };

  const closeSimulator = () => {
    if (window.location.hash === "#app") {
      window.history.pushState(
        { simulator: false },
        "",
        window.location.pathname,
      );
    }
    setShowSimulator(false);
  };

  useEffect(() => {
    const handlePopState = () => {
      setShowSimulator(window.location.hash === "#app");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Unlock page scrolling on the landing page and lock it when the simulator is open
  useEffect(() => {
    document.documentElement.style.overflowY = showSimulator
      ? "hidden"
      : "auto";
    document.body.style.overflowY = showSimulator ? "hidden" : "auto";
    document.body.style.height = showSimulator ? "100vh" : "auto";

    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.overflowY = showSimulator ? "hidden" : "auto";
      rootEl.style.height = showSimulator ? "100vh" : "auto";
    }
  }, [showSimulator]);

  // Render your exact Cyax simulator fullscreen when launched
  if (showSimulator) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          inset: 0,
          zIndex: 1000,
        }}
      >
        <button
          type="button"
          onClick={closeSimulator}
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            zIndex: 99999,
            background: "#0f172a",
            color: "#38bdf8",
            border: "1px solid #38bdf8",
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
          }}
        >
          ← Back to Website
        </button>
        <CyaxApp />
      </div>
    );
  }

  return (
    <div className="cyax-landing">
      {/* ==========================================
1. NAVIGATION BAR
         ========================================== */}
      <header className="navbar">
        <div className="nav-inner">
          <div className="nav-status">
            <span className="nav-status-dot" />
            <span>{rootPkg.version} • LTI Symbolic Engine</span>
          </div>

          <nav className="nav-links">
            <a href="#features">Engines</a>
            <a href="#quickstart">Quick Start</a>
            <a href="#about">About</a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <button
              type="button"
              onClick={openSimulator}
              className="nav-cta-btn"
            >
              Open Online App →
            </button>
          </nav>
        </div>
      </header>

      {/* ==========================================
2. HERO SECTION
         ========================================== */}
      <section className="hero">
        <div className="container">
          <div style={{ marginBottom: "24px" }}>
            <img
              src="/logo_square_transparent.png"
              alt="Cyax Logo"
              style={{
                width: "160px",
                height: "160px",
                objectFit: "contain",
                display: "inline-block",
              }}
            />
          </div>

          <div className="badge">
            <Zap size={13} />
            <span>Continuous-Time Control Systems Simulator</span>
          </div>

          <h1>
            Model Block Diagrams.
            <br />
            Derive Symbolic Transfer Functions.
          </h1>

          <p>
            Cyax is a lightweight simulator and symbolic solver for
            continuous-time LTI control systems. Use it directly in your browser
            or download the offline Windows desktop app.
          </p>

          <div className="cta-group">
            <button
              type="button"
              onClick={openSimulator}
              className="btn-primary"
              style={{ border: "none", cursor: "pointer", fontSize: "16px" }}
            >
              <ExternalLink size={18} />
              Launch Online Simulator
            </button>

            <a href={WINDOWS_EXE_URL} className="btn-secondary">
              <Download size={18} />
              Download for Windows (.exe)
            </a>

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              <Code2 size={18} />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ==========================================
3. CORE ENGINES SHOWCASE
         ========================================== */}
      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">Built for Control Engineering</h2>
          <p className="section-subtitle">
            Step-by-step symbolic verification and interactive visualization
            with KaTeX rendering.
          </p>

          <div className="grid-3">
            <div className="card">
              <div className="icon-box">
                <Layers size={20} />
              </div>
              <h3>Interactive Block Canvas</h3>
              <p>
                Connect integrators (1/s), gain blocks, and summing junctions
                with negative feedback loops on a drag-and-drop canvas.
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Cpu size={20} />
              </div>
              <h3>State-Space & Symbolic H(s)</h3>
              <p>
                Automatically constructs (A, B, C, D) matrices, checks
                controllability and observability, and reduces H(s) via
                Euclidean GCD.
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Activity size={20} />
              </div>
              <h3>Bode Frequency Plotter</h3>
              <p>
                Sweep logarithmic frequencies to plot magnitude (dB) and
                unwrapped phase with animated sweeps and gain/phase margins.
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Compass size={20} />
              </div>
              <h3>Nyquist Locus Diagram</h3>
              <p>
                Map complex frequency trajectories in the Cartesian plane and
                inspect encirclements around the (-1, j0) critical point.
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Waves size={20} />
              </div>
              <h3>Analytic Impulse Response h(t)</h3>
              <p>
                Compute closed-form inverse Laplace transforms into Dirac
                impulses, real exponentials, and damped harmonic terms.
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <GitBranch size={20} />
              </div>
              <h3>Standalone Poly Sandbox</h3>
              <p>
                Bypass block diagrams and enter raw numerator and denominator
                polynomials directly to inspect frequency and time responses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
4. QUICK START GUIDE
         ========================================== */}
      <section id="quickstart" className="section">
        <div className="container">
          <h2 className="section-title">How to Get Started</h2>
          <p className="section-subtitle">
            Run immediately in your browser or install the offline desktop app.
          </p>

          <div className="steps-grid">
            <div className="card">
              <span className="step-num">STEP 01</span>
              <h3>Launch Online or Install</h3>
              <p>
                Click <strong>Launch Online Simulator</strong> above to run Cyax
                directly in your browser, or download{" "}
                <code>Cyax-Setup-0.6.0.exe</code> for offline Windows use.
              </p>
            </div>

            <div className="card">
              <span className="step-num">STEP 02</span>
              <h3>Build or Enter Polynomials</h3>
              <p>
                Click <strong>Initialize New System</strong> to wire a block
                diagram, or open a standalone engine and enter ascending arrays
                like <code>[2, 4, 0, 0.5]</code> for <code>2 + 4s + 0.5s³</code>
                .
              </p>
            </div>

            <div className="card">
              <span className="step-num">STEP 03</span>
              <h3>Verify Step-by-Step</h3>
              <p>
                Inspect extracted (A, B, C, D) matrices, pole-zero
                cancellations, ODE forms, and interactive Bode/Nyquist plots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
5. ABOUT THE AUTHOR & PROJECT
         ========================================== */}
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">About Cyax & Creator</h2>
          <p className="section-subtitle">
            Built to bridge handwritten control theory derivations with
            interactive verification.
          </p>

          <div
            className="card"
            style={{
              maxWidth: "780px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                  Amir Hossein Saber Moghaddam Ranjbar — Creator & Lead
                  Developer
                </h3>
                <span
                  style={{
                    color: "var(--sky-blue)",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Engineering Student • Leuven, Belgium
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Cyax%20Control%20Systems%20Simulator`}
                  className="btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                >
                  <Mail size={16} />
                  {CONTACT_EMAIL}
                </a>

                <a
                  href={GITHUB_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                >
                  <Code2 size={16} />
                  @ahsmr
                </a>
              </div>
            </div>

            <p>
              Cyax was created to help engineering students verify
              continuous-time state-space realizations, symbolic transfer
              function reductions, and frequency-domain plots without wrestling
              with heavy toolbox setups or black-box numerical outputs.
            </p>

            <p>
              Every algebraic step—from extracting (A, B, C, D) matrices out of
              block diagram topologies to computing Euclidean polynomial GCDs
              and closed-form inverse Laplace transforms—is implemented from
              scratch in TypeScript and verified with automated Vitest suites.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
6. FOOTER
         ========================================== */}
      <footer className="footer">
        <div className="container">
          <p>
            © {new Date().getFullYear()} ahsmr — Cyax Control Systems Simulator
            - Released under the MIT License •{" "}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--sky-blue)" }}
            >
              ahsmr/Cyax
            </a>{" "}
            •{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Cyax%20Control%20Systems%20Simulator`}
              style={{ color: "var(--sky-blue)" }}
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p style={{ fontSize: "0.8rem", marginTop: "8px", opacity: 0.75 }}>
            Independent open-source educational project. Not affiliated with,
            endorsed by, or connected to any other company, university, or
            entity bearing a similar name.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
