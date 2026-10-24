# ⚡ Cyax — Interactive Systems Theory & Control Design Simulator

**Cyax** is a web and desktop educational simulator designed to help engineering students and control system practitioners visualize, analyze, and simulate dynamic systems in real time. 

It automatically converts interactive block diagrams into symbolic transfer functions $H(s)$ and linear state-space representations, rendering frequency responses (Bode plots) directly in the browser.

---

## 🚀 Key Features

* **Interactive Block Diagram Editor:** Visually place, connect, and configure feedback loops, summing junctions, and transfer function blocks using XYFlow.
* **Symbolic Solver Engine:** Automatically derives closed-loop transfer functions $H(s)$ and linear state-space representations ($A, B, C, D$) via rational Gaussian elimination.
* **LaTeX Math Rendering:** Formats derived transfer functions in mathematical notation powered by KaTeX.
* **Canvas-Based Bode Plots:** Computes real-time magnitude and phase frequency responses with an animated sweep mode.
* **Controlled Execution Workflow:** Explicit execution triggers to evaluate complex system configurations on demand.

---

## 🛣️ Project Roadmap & Path Goals

> **Note:** Cyax is an active project under ongoing development. Below are the planned milestones and features currently in progress:

- [x] **Core System Solver:** Automated derivation of $H(s)$ and state-space matrices from node graphs.
- [x] **Bode Plot Rendering Engine:** HTML5 Canvas frequency response visualizer with magnitude (dB) and phase (deg) curves.
- [ ] **Differntial/Difference equations:** The ability to find and/or input a diff equation to the system for the further calculations.
- [ ] **Discrete and Continous Analyzing:** Being able to analyse both discrete and continous systems. (For now only the Continous part is implemented)
- [ ] **Controle Design Rendering:** Being able to add/find the suitable Controler/compensator such as PI,PD,Lead etc. and analyzing them. 
- [ ] **Time-Domain Simulation Engine:** Interactive step-response and impulse-response plots with configurable damping ratios ($\zeta$) and natural frequencies ($\omega_n$).
- [ ] **Diagram Export & Import:** Save/load system graphs as JSON (Or other types) configurations and export high-resolution vector/LaTeX schematics.
- [ ] **Discretization and sampeling:** Possiblity to descreticize a system and also applying the DTFT and this types of sampeling techs.

---

## 🛠️ Tech Stack

* **Frontend Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Node Graph Editor:** [XYFlow (React Flow)](https://reactflow.dev/)
* **Math Engine:** [KaTeX](https://katex.org/)
* **Iconography:** [Lucide React](https://lucide.dev/)
* **Styling:** Custom Modular CSS / CSS Modules
* **Unit Testing:** [Vitest](https://vitest.dev/)

---

## 📂 Project Structure

```text
cyax/
├── Docs/                  # Project documentation & reference material
├── src/
│   ├── assets/            # Static media and brand assets
│   ├── components/        # UI components (common elements, canvas, controls, Bode plot)
│   ├── test/              # Unit test suites & Vitest specs
│   ├── utils/             # Core mathematical algorithms & system analysis solvers
│   ├── App.tsx            # Main application workspace layout
│   └── main.tsx           # React mounting entry point
├── package.json           # Dependencies & build scripts
└── vite.config.ts         # Vite bundler & path configurations