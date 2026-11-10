import React, { useState, useRef, useEffect } from "react";
import { Play, RefreshCw, Activity } from "lucide-react";
import { generateNyquistData, drawNyquistPlot } from "../utils/nyquistEngine";
import type { NyquistPoint } from "../utils/nyquistEngine";
import type { Poly } from "../utils/systemSolver";

/**
 * NyquistPlotProps
 * Defines the props interface for the NyquistPlot component.
 * @property numerator     | The numerator polynomial coefficients of the transfer function.
 * @property denominator   | The denominator polynomial coefficients of the transfer function.
 * @property title         | Optional title for the Nyquist plot (string or React node).
 * @property wMin          | Minimum frequency (rad/s) for frequency sweep (default: 0.01).
 * @property wMax          | Maximum frequency (rad/s) for frequency sweep (default: 1000).
 * @property pointsPerDecade| Number of points per decade for frequency sweep (default: 50).
 */
export interface NyquistPlotProps {
  numerator: Poly | null;
  denominator: Poly | null;
  title?: React.ReactNode;
  wMin?: number;
  wMax?: number;
  pointsPerDecade?: number;
}

/**
 * NyquistPlot Component
 * Renders a Nyquist diagram on an HTML5 Canvas element for a given transfer function.
 * Supports sweep animation and customizable UI controls.
 */
export const NyquistPlot: React.FC<NyquistPlotProps> = ({
  numerator,
  denominator,
  title = "Nyquist Diagram",
  wMin = 0.01,
  wMax = 1000,
  pointsPerDecade = 50,
}) => {
  const [nyquistData, setNyquistData] = useState<NyquistPoint[]>([]);
  const [isAnimated, setIsAnimated] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const runNyquistAnalysis = () => {
    if (
      !numerator ||
      !denominator ||
      numerator.length === 0 ||
      denominator.length === 0
    ) {
      alert("Please provide valid numerator and denominator polynomials.");
      return;
    }

    if (isAnimated) {
      setIsDrawing(true);
    }

    const points = generateNyquistData(
      numerator,
      denominator,
      wMin,
      wMax,
      pointsPerDecade,
    );
    setNyquistData(points);
  };

  useEffect(() => {
    if (!canvasRef.current || nyquistData.length === 0) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Canvas drawing function receives empty string if title is a React Node
    const canvasTitle = typeof title === "string" ? title : "";

    if (!isAnimated) {
      drawNyquistPlot(canvasRef.current, nyquistData, { title: canvasTitle });
      requestAnimationFrame(() => setIsDrawing(false));
    } else {
      let currentFrame = 1;
      const totalFrames = nyquistData.length;

      const animateStep = () => {
        if (!canvasRef.current) return;

        const subset = nyquistData.slice(0, currentFrame);
        drawNyquistPlot(canvasRef.current, subset, { title: canvasTitle });

        if (currentFrame < totalFrames) {
          currentFrame++;
          animationRef.current = requestAnimationFrame(animateStep);
        } else {
          setIsDrawing(false);
        }
      };

      animateStep();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nyquistData, isAnimated, title]);

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} style={{ color: "var(--sky-blue)" }} />
          <div
            className="section-label"
            style={{
              margin: 0,
              color: "var(--sky-blue)",
            }}
          >
            {title}
          </div>
        </div>

        {/* Plot Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isAnimated}
              onChange={(e) => setIsAnimated(e.target.checked)}
              style={{ accentColor: "var(--sky-blue)" }}
            />
            Animate Sweep
          </label>

          <button
            className="secondary-btn"
            onClick={runNyquistAnalysis}
            disabled={isDrawing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderColor: "var(--sky-blue)",
              color: "var(--sky-blue)",
            }}
          >
            {isDrawing ? (
              <RefreshCw size={12} className="spin" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            Draw Nyquist
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Container */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "12px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={450}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
    </div>
  );
};

export default NyquistPlot;