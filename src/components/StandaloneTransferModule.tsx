import React, { useState, useMemo } from "react";
import { Activity, Play } from "lucide-react";
import { MathView } from "./common/MathView";
import { polyToLaTeX } from "../utils/systemSolver";
import type { Poly } from "../utils/systemSolver";
import BodePlot from "./BodePlot";
import NyquistPlot from "./NyquistPlot";
import { inverseLaplace } from "../utils/laplaceEngine";
import type { InverseLaplaceResult } from "../utils/laplaceEngine";

export type ModuleType = "bode" | "nyquist" | "impulse";

export interface StandaloneTransferModuleProps {
  /** Which module to render in the bottom dependent section */
  moduleType: ModuleType;
}

/**
 * Parses a Poly string like "[2, 4, 0, 0.5]" or "2, 4, 0, 0.5" into a number[] (Poly).
 * Index i corresponds to s^i.
 */
function parsePoly(raw: string): Poly | null {
  const trimmed = raw.trim().replace(/^\[|\]$/g, "");
  if (!trimmed) return null;

  const parts = trimmed.split(",").map((s) => s.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) {
    return null;
  }

  return parts.map(Number);
}

const MODULE_TITLES: Record<ModuleType, string> = {
  bode: "Standalone Bode Plotter",
  nyquist: "Standalone Nyquist Diagram",
  impulse: "Standalone Impulse Response h(t)",
};

export const StandaloneTransferModule: React.FC<
  StandaloneTransferModuleProps
> = ({ moduleType }) => {
  // Polynomial inputs in Poly format: [c0, c1, c2, ...] -> c0 + c1*s + c2*s^2 + ...
  const [numStr, setNumStr] = useState<string>("[2, 4, 0, 0.5]");
  const [denStr, setDenStr] = useState<string>("[2, 4, 1, 1]");

  // Impulse response state (used when moduleType === "impulse")
  const [impulseResult, setImpulseResult] =
    useState<InverseLaplaceResult | null>(null);
  const [impulseError, setImpulseError] = useState<string | null>(null);

  const numPoly = useMemo(() => parsePoly(numStr), [numStr]);
  const denPoly = useMemo(() => parsePoly(denStr), [denStr]);

  // Live LaTeX equation string computed via polyToLaTeX
  const latexEquation = useMemo(() => {
    if (!numPoly || !denPoly) {
      return "H(s) = \\text{Invalid Poly Array}";
    }
    if (denPoly.every((c) => c === 0)) {
      return "H(s) = \\text{Denominator cannot be 0}";
    }

    const numLatex = polyToLaTeX(numPoly);
    const denLatex = polyToLaTeX(denPoly);
    const fraction =
      denLatex === "1" ? numLatex : `\\frac{${numLatex}}{${denLatex}}`;

    return `H(s) = ${fraction}`;
  }, [numPoly, denPoly]);

  const runImpulseResponse = () => {
    setImpulseError(null);
    if (!numPoly || !denPoly) {
      setImpulseError("Please enter valid numerator and denominator arrays.");
      setImpulseResult(null);
      return;
    }

    try {
      const res = inverseLaplace(numPoly, denPoly);
      setImpulseResult(res);
    } catch {
      setImpulseError("Failed to compute impulse response.");
      setImpulseResult(null);
    }
  };

  return (
    <div className="home-container" style={{ padding: "24px" }}>
      {/* --- HEADER --- */}
      <div
        className="status-header"
        style={{
          marginBottom: "20px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
        }}
      >
        <div className="status-header-title">
          <Activity size={20} style={{ color: "var(--sky-blue)" }} />
          <span>{MODULE_TITLES[moduleType]}</span>
        </div>
        <span className="version-badge">LTI Engine v1.0.2</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* =========================================================
            TOP SECTION: Transfer Function Input (Left) + LaTeX (Right)
           ========================================================= */}
        <div className="card" style={{ padding: "20px" }}>
          <span
            className="section-label"
            style={{ display: "block", marginBottom: "14px" }}
          >
            Transfer Function Definition — Poly Format [c₀, c₁, c₂, ...]
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              alignItems: "stretch",
            }}
          >
            {/* LEFT: Numerator & Denominator Inputs */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div>
                <label
                  className="metric-label"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Numerator N(s)
                </label>
                <input
                  type="text"
                  value={numStr}
                  onChange={(e) => setNumStr(e.target.value)}
                  placeholder="[2, 4, 0, 0.5]"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${numPoly ? "var(--border-color)" : "#ef4444"}`,
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    color: "#f8fafc",
                    fontFamily: "monospace",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label
                  className="metric-label"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Denominator D(s)
                </label>
                <input
                  type="text"
                  value={denStr}
                  onChange={(e) => setDenStr(e.target.value)}
                  placeholder="[2, 4, 1, 1]"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${denPoly ? "var(--border-color)" : "#ef4444"}`,
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    color: "#f8fafc",
                    fontFamily: "monospace",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {/* RIGHT: Live LaTeX Preview */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                borderRadius: "8px",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <span
                className="metric-label"
                style={{ color: "var(--sky-blue)", fontWeight: 700 }}
              >
                TRANSFER FUNCTION H(s)
              </span>
              <div style={{ marginTop: "8px" }}>
                <MathView math={latexEquation} displayMode />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            BOTTOM SECTION: Dependent Module Component
           ========================================================= */}
        {moduleType === "bode" && (
          <BodePlot
            title={<MathView math={latexEquation} />}
            numerator={numPoly}
            denominator={denPoly}
          />
        )}

        {moduleType === "nyquist" && (
          <NyquistPlot
            title={<MathView math={latexEquation} />}
            numerator={numPoly}
            denominator={denPoly}
          />
        )}

        {moduleType === "impulse" && (
          <div className="card" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="section-label" style={{ margin: 0 }}>
                Impulse Response h(t)
              </span>

              <button
                className="secondary-btn"
                onClick={runImpulseResponse}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderColor: "var(--sky-blue)",
                  color: "var(--sky-blue)",
                }}
              >
                <Play size={12} fill="currentColor" /> Compute Impulse Response
              </button>
            </div>

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {impulseError && (
                <div
                  className="metric-box"
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    color: "#ef4444",
                  }}
                >
                  {impulseError}
                </div>
              )}

              {impulseResult && (
                <div
                  className="metric-box"
                  style={{ padding: "12px", textAlign: "left" }}
                >
                  <MathView math={impulseResult.latexEquation} displayMode />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneTransferModule;
