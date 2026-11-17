import {
  Activity,
  Code2,
  Compass,
  Cpu,
  Download,
  GitBranch,
  Layers,
  Waves,
  Zap,
} from "lucide-react";

// Update this URL to match your GitHub Release asset filename
const WINDOWS_EXE_URL =
  "https://github.com/ahsmr/Cyax/releases/latest/download/Cyax-Setup-0.6.0.exe";
const GITHUB_REPO_URL = "https://github.com/ahsmr/Cyax";

export function App() {
  return (
    <div>
      {/* ==========================================
          1. NAVIGATION BAR
         ========================================== */}
      <header className="navbar">
        <div className="container nav-inner">
          <div className="brand">
            <img
              src="/logo_square_transparent.png"
              alt="Cyax Logo"
              width={28}
              height={28}
            />
            <span>Cyax</span>
          </div>

          <nav className="nav-links">
            <a href="#features">Engines</a>
            <a href="#quickstart">Quick Start</a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a
              href={WINDOWS_EXE_URL}
              style={{ color: "var(--sky-blue)", fontWeight: 600 }}
            >
              Download .exe ↓
            </a>
          </nav>
        </div>
      </header>

      {/* ==========================================
          2. HERO SECTION
         ========================================== */}
      <section className="hero">
        <div className="container">
          <div className="badge">
            <Zap size={13} />
            <span>Offline Desktop Control Systems Simulator</span>
          </div>

          <h1>
            Model Block Diagrams.
            <br />
            Derive Symbolic Transfer Functions.
          </h1>

          <p>
            Cyax is a lightweight, offline desktop simulator and symbolic solver
            for continuous-time LTI control systems. Construct multi-loop block
            diagrams, extract state-space matrices (A, B, C, D), and evaluate
            Bode, Nyquist, and analytic impulse responses without setup
            overhead.
          </p>

          <div className="cta-group">
            <a href={WINDOWS_EXE_URL} className="btn-primary">
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
              View on GitHub
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
            Install once and run completely offline on Windows.
          </p>

          <div className="steps-grid">
            <div className="card">
              <span className="step-num">STEP 01</span>
              <h3>Download & Install</h3>
              <p>
                Download <code>Cyax-Setup-0.6.0.exe</code> from the button above
                and run the installer—no MATLAB toolboxes or external
                dependencies required.
              </p>
            </div>

            <div className="card">
              <span className="step-num">STEP 02</span>
              <h3>Build or Enter Polynomials</h3>
              <p>
                Click <strong>Initialize New System</strong> to wire a block
                diagram, or open a standalone engine and enter ascending arrays
                like <code>[2, 4, 0, 0.5]</code> for <code>2 + 4s + 0.5s³</code>.
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
          5. FOOTER
         ========================================== */}
      <footer className="footer">
        <div className="container">
          <p>
            Cyax Control Systems Simulator — Open Source under MIT License •{" "}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--sky-blue)" }}
            >
              ahsmr/Cyax
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;