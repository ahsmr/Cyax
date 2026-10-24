import React, { useState, useRef, useEffect } from "react";
import { Play, RefreshCw, BarChart2 } from "lucide-react";
import { generateBodeData, drawBodePlot } from "../utils/bodeEngine";
import type { BodePoint } from "../utils/bodeEngine";
import type { Poly } from "../utils/systemSolver";

/**
 * BodePlotProps
 * Defines the props interface for the BodePlot component.
 * @property numerator      | The numerator polynomial coefficients of the transfer function.  
 * @property denominator    | The denominator polynomial coefficients of the transfer function.
 * @property title          | Optional title for the Bode plot, can be a string or React node.
 * @property wMin           | Minimum frequency (rad/s) for the Bode plot (default: 0.01).
 * @property wMax           | Maximum frequency (rad/s) for the Bode plot (default: 1000).
 * @property pointsPerDecade| Number of points per decade for frequency sweep (default: 50).
 */
export interface BodePlotProps {
  numerator: Poly | null;
  denominator: Poly | null;
  title?: React.ReactNode; // Updated from string to React.ReactNode
  wMin?: number;
  wMax?: number;
  pointsPerDecade?: number;
}

/**
 *  BodePlot Component
 *  Renders a Bode plot for a given transfer function defined by its numerator and denominator polynomials.
 *  Supports optional animation of the frequency sweep and customizable plot title.
 * @param param0 | BodePlotProps - Component properties including transfer function coefficients and plot configuration.
 * @returns      | JSX.Element - The rendered Bode plot component with controls for animation and drawing.
 */
export const BodePlot: React.FC<BodePlotProps> = ({
  numerator,
  denominator,
  title = "Frequency Response (Bode Plot)",
  wMin = 0.01,
  wMax = 1000,
  pointsPerDecade = 50,
}) => {
  const [bodeData, setBodeData] = useState<BodePoint[]>([]);
  const [isAnimated, setIsAnimated] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const runBodeAnalysis = () => {
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

    const points = generateBodeData(
      numerator,
      denominator,
      wMin,
      wMax,
      pointsPerDecade,
    );
    setBodeData(points);
  };

  useEffect(() => {
    if (!canvasRef.current || bodeData.length === 0) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Canvas drawing function receives empty/default string title if title is a React Node
    const canvasTitle = typeof title === "string" ? title : "";

    if (!isAnimated) {
      drawBodePlot(canvasRef.current, bodeData, { title: canvasTitle });
      requestAnimationFrame(() => setIsDrawing(false));
    } else {
      let currentFrame = 1;
      const totalFrames = bodeData.length;

      const animateStep = () => {
        if (!canvasRef.current) return;

        const subset = bodeData.slice(0, currentFrame);
        drawBodePlot(canvasRef.current, subset, { title: canvasTitle });

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
  }, [bodeData, isAnimated, title]);

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
          <BarChart2 size={18} style={{ color: "var(--sky-blue)" }} />
          <div
            className="section-label"
            style={{
              margin: 0,
              color: "var(--sky-blue)", // Or "#ffffff" for crisp white math text
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
            onClick={runBodeAnalysis}
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
            Draw Bode
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

export default BodePlot;
