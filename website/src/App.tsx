import {
  Activity,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  GitBranch,
  Layers,
  Waves,
  Zap,
} from "lucide-react";

// Update these two URLs after deploying to Vercel and creating your GitHub Release
const WEB_APP_URL = "https://cyax-app.vercel.app";
const WINDOWS_EXE_URL =
  "https://github.com/ahsmr/Cyax/releases/latest/download/Cyax-Setup-0.2.0.exe";
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
              href={WEB_APP_URL}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--sky-blue)", fontWeight: 600 }}
            >
              Open Web App →
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
            <span>Continuous-Time LTI Control Systems Engine</span>
          </div>

          <h1>
            Model Block Diagrams.
            <br />
            Derive Symbolic Transfer Functions.
          </h1>

          <p>
            Cyax is an interactive control systems simulator and symbolic solver.
            Construct multi-loop block diagrams, extract continuous state-space
            matrices (A, B, C, D), and evaluate Bode, Nyquist, and analytic
            impulse responses in real time.
          </p>

          <div className="cta-group">
            <a
              href={WEB_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <ExternalLink size={18} />
              Launch Live Web App
            </a>

            <a href={WINDOWS_EXE_URL} className="btn-secondary">
              <Download size={18} />
              Download for Windows (.exe)
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
            Pure client-side symbolic and numerical engines with KaTeX math
            rendering.
          </p>

          <div className="grid-3">
            <div className="card">
              <div className="icon-box">
                <Layers size={20} />
              </div>
              <h3>Interactive Block Canvas</h3>
              <p>
                Connect integrators (1/s), gain blocks, and summing junctions
                with negative feedback loops on a drag-and-drop canvas[cite: 6].
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
                Euclidean GCD[cite: 6].
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Activity size={20} />
              </div>
              <h3>Bode Frequency Plotter</h3>
              <p>
                Sweep logarithmic frequencies to plot magnitude (dB) and
                unwrapped phase with animated sweeps and gain/phase margins[cite: 3, 5, 6].
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Compass size={20} />
              </div>
              <h3>Nyquist Locus Diagram</h3>
              <p>
                Map complex frequency trajectories in the Cartesian plane and
                inspect encirclements around the (-1, j0) critical point[cite: 3, 6].
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <Waves size={20} />
              </div>
              <h3>Analytic Impulse Response h(t)</h3>
              <p>
                Compute closed-form inverse Laplace transforms into Dirac
                impulses, real exponentials, and damped harmonic terms[cite: 6].
              </p>
            </div>

            <div className="card">
              <div className="icon-box">
                <GitBranch size={20} />
              </div>
              <h3>Standalone Poly Sandbox</h3>
              <p>
                Bypass block diagrams and enter raw numerator and denominator
                polynomials directly to inspect frequency and time responses[cite: 3, 6].
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
          <h2 className="section-title">How to Use Cyax</h2>
          <p className="section-subtitle">
            Run directly in your browser or install the offline desktop app.
          </p>

          <div className="steps-grid">
            <div className="card">
              <span className="step-num">STEP 01</span>
              <h3>Choose a Workspace</h3>
              <p>
                Click <strong>Initialize New System</strong> to open the visual
                block diagram builder, or pick a standalone Bode, Nyquist, or
                Impulse module[cite: 3].
              </p>
            </div>

            <div className="card">
              <span className="step-num">STEP 02</span>
              <h3>Define System or Polynomials</h3>
              <p>
                Wire blocks on the canvas or enter ascending polynomial arrays
                like <code>[2, 4, 0, 0.5]</code> for{" "}
                <code>2 + 4s + 0.5s³</code> with live KaTeX verification[cite: 3].
              </p>
            </div>

            <div className="card">
              <span className="step-num">STEP 03</span>
              <h3>Solve & Visualize</h3>
              <p>
                Run the symbolic solver to inspect step-by-step derivations,
                stability eigenvalues, and interactive frequency plots[cite: 3, 6].
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
            Cyax Control Systems Simulator — Open Source under Apache-2.0
            License •{" "}
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