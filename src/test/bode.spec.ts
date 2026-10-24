import { describe, it, expect } from "vitest";
import {
  calculateAmp,
  calculateArg,
  generateBodeData,
  drawBodePlot,
  type BodeDrawOptions,
} from "../utils/bodeEngine";
import type {Poly } from "../utils/systemSolver";

describe("bodeEngine", () => {
  /**
   * Tests for calculateAmp(num, den, omega)
   * Formula: Magnitude (dB) = 20 * log10(|N(j*omega)| / |D(j*omega)|)
   */
  describe("calculateAmp", () => {
    it("computes 0 dB at DC (omega = 0) for H(s) = 1 / (s + 1)", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1]; // s + 1
      const amp = calculateAmp(num, den, 0);

      // |H(0)| = 1/1 = 1 => 20*log10(1) = 0 dB
      expect(amp).toBeCloseTo(0, 5);
    });

    it("computes approximately -3.01 dB at the corner frequency (omega = 1) for H(s) = 1 / (s + 1)", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const amp = calculateAmp(num, den, 1);

      // |H(j1)| = 1 / sqrt(1^2 + 1^2) = 1 / sqrt(2) => 20*log10(1/sqrt(2)) ≈ -3.0103 dB
      expect(amp).toBeCloseTo(-3.0103, 3);
    });

    it("handles high resonant peaks safely without returning NaN or crashing near poles on the imaginary axis", () => {
      const num: Poly = [1];
      const den: Poly = [1, 0, 1]; // s^2 + 1 (pole at omega = 1)
      const amp = calculateAmp(num, den, 1);

      // Should evaluate to a very large positive dB value rather than -200 dB or NaN/Infinity
      expect(Number.isFinite(amp)).toBe(true);
      expect(amp).toBeGreaterThan(100);
    });
  });

  /**
   * Tests for calculateArg(num, den, omega)
   * Formula: Phase (deg) = arg(N(j*omega)) - arg(D(j*omega))
   */
  describe("calculateArg", () => {
    it("computes 0 deg phase shift at low frequencies for a low-pass filter H(s) = 1 / (s + 1)", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const phase = calculateArg(num, den, 1e-6);

      // As omega -> 0, phase -> 0 deg
      expect(phase).toBeCloseTo(0, 3);
    });

    it("computes -45 deg phase shift at the corner frequency (omega = 1) for H(s) = 1 / (s + 1)", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const phase = calculateArg(num, den, 1);

      // H(j1) = 1 / (1 + j) => phase = 0 - atan2(1, 1) = -45 deg
      expect(phase).toBeCloseTo(-45, 4);
    });

    it("computes -90 deg phase shift at high frequencies for a 1st order system", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const phase = calculateArg(num, den, 1e6);

      // As omega -> infinity, phase -> -90 deg
      expect(phase).toBeCloseTo(-90, 2);
    });
  });

  /**
   * Tests for generateBodeData(num, den, wMin, wMax, pointsPerDecade)
   */
  describe("generateBodeData", () => {
    it("generates the expected number of sample points across frequency decades", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const wMin = 0.01; // 10^-2
      const wMax = 100;  // 10^2 -> 4 decades total
      const pointsPerDecade = 50;

      const data = generateBodeData(num, den, wMin, wMax, pointsPerDecade);

      // 4 decades * 50 points/decade = 200 intervals -> 201 points including boundaries
      expect(data.length).toBe(201);
      expect(data[0].frequency).toBeCloseTo(wMin, 5);
      expect(data[data.length - 1].frequency).toBeCloseTo(wMax, 5);
    });

    it("populates BodePoint structure with correct fields and conversions", () => {
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const data = generateBodeData(num, den, 1, 10, 10);
      const point = data[0];

      expect(point).toHaveProperty("frequency");
      expect(point).toHaveProperty("frequencyHz");
      expect(point).toHaveProperty("magnitudeDb");
      expect(point).toHaveProperty("phaseDeg");

      // Verify Hz conversion (omega / 2*pi)
      expect(point.frequencyHz).toBeCloseTo(point.frequency / (2 * Math.PI), 6);
    });

    it("applies phase unwrapping across continuous phase transitions", () => {
      // 2nd order undamped pole s^2 + 1 drops phase abruptly by 180 deg around omega = 1
      const num: Poly = [1];
      const den: Poly = [1, 0, 1];
      const data = generateBodeData(num, den, 0.1, 10, 50);

      const lowFreqPoint = data.find((p) => p.frequency < 0.9)!;
      const highFreqPoint = data.find((p) => p.frequency > 1.1)!;

      // Phase should remain smooth without artificial 360-degree wrapping jumps
      expect(lowFreqPoint.phaseDeg).toBeCloseTo(0, 1);
      expect(highFreqPoint.phaseDeg).toBeCloseTo(-180, 1);
    });
  });

  /**
   * Tests for drawBodePlot(canvas, data, options)
   */
  describe("drawBodePlot", () => {
    // Mock HTML5 Canvas setup for headless test environment
    function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    it("returns early gracefully if data array is empty", () => {
      const canvas = createMockCanvas();
      expect(() => drawBodePlot(canvas, [])).not.toThrow();
    });

    it("renders onto the canvas 2D context without runtime errors", () => {
      const canvas = createMockCanvas();
      const num: Poly = [1];
      const den: Poly = [1, 1];
      const data = generateBodeData(num, den, 0.01, 100, 10);

      const options: BodeDrawOptions = {
        title: "Test Bode Plot",
        strokeColorMag: "#2563eb",
        strokeColorPhase: "#dc2626",
      };

      expect(() => drawBodePlot(canvas, data, options)).not.toThrow();
    });
  });
});