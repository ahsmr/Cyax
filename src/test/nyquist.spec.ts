import { describe, it, expect } from "vitest"; // or 'jest'
import { calculateH, generateNyquistData } from "../utils/nyquistEngine"; // Adjust to your file path

describe("Nyquist Math Calculations", () => {
  // Test system: H(s) = (0.5s^3 + 4s + 2) / (s^3 + s^2 + 4s + 2)
  // Expressed in ASCENDING polynomial coefficient order [c0, c1, c2, c3]:
  // Num: 2 + 4s + 0s^2 + 0.5s^3 -> [2, 4, 0, 0.5]
  // Den: 2 + 4s + 1s^2 + 1s^3   -> [2, 4, 1, 1]
  const num = [2, 4, 0, 0.5];
  const den = [2, 4, 1, 1];

  describe("calculateH", () => {
    it("should evaluate DC gain (omega -> 0) correctly", () => {
      // At w -> 0: H(j0) = 2/2 = 1 + 0j
      const res = calculateH(num, den, 0.00001);

      expect(res.real).toBeCloseTo(1, 4);
      expect(res.imag).toBeCloseTo(0, 4);
    });

    it("should evaluate high-frequency limit (omega -> infinity) correctly", () => {
      // As w -> inf: 0.5s^3 / s^3 = 0.5 + 0j
      const res = calculateH(num, den, 100000);

      expect(res.real).toBeCloseTo(0.5, 3);
      expect(res.imag).toBeCloseTo(0, 3);
    });

    it("should evaluate H(j1) correctly", () => {
      // H(j1) = (2 + 3.5j) / (1 + 3j) = 1.25 - 0.25j
      const res = calculateH(num, den, 1);

      expect(res.real).toBeCloseTo(1.25, 4);
      expect(res.imag).toBeCloseTo(-0.25, 4);
    });

    it("should handle division by zero gracefully", () => {
      // H(s) = 1 / s at w = 0 -> Ascending: Num=[1], Den=[0, 1]
      const res = calculateH([1], [0, 1], 0);

      expect(res.real).toBe(0);
      expect(res.imag).toBe(0);
    });
  });

  describe("generateNyquistData", () => {
    it("should generate both negative and positive frequency loci", () => {
      const data = generateNyquistData(num, den, 0.01, 100, 10);

      expect(data.length).toBeGreaterThan(0);
      expect(data[0].frequency).toBeLessThan(0); // Starts at negative wMax
      expect(data[data.length - 1].frequency).toBeGreaterThan(0); // Ends at positive wMax
    });

    it("should guarantee complex conjugate symmetry: Im(-w) = -Im(+w)", () => {
      const data = generateNyquistData(num, den, 0.1, 10, 20);

      const firstPoint = data[0]; // -wMax
      const lastPoint = data[data.length - 1]; // +wMax

      expect(firstPoint.real).toBeCloseTo(lastPoint.real, 5);
      expect(firstPoint.imag).toBeCloseTo(-lastPoint.imag, 5);
      expect(firstPoint.phaseRad).toBeCloseTo(-lastPoint.phaseRad, 5);
    });

    it("should correctly calculate phase and amplitude values", () => {
      // H(s) = 1 / (s + 1) -> Ascending: Num=[1], Den=[1, 1]
      // Sweeping from 0.1 (10^-1) to 10 (10^1) guarantees 1.0 is hit exactly
      const data = generateNyquistData([1], [1, 1], 0.1, 10, 50);

      // Tight tolerance ensures we grab omega = 1.0, not omega = 0.9 or 1.1
      const posPoint = data.find((pt) => Math.abs(pt.frequency - 1) < 1e-5);

      expect(posPoint).toBeDefined();
      if (posPoint) {
        // H(j1) = 1 / (1 + j) = 0.5 - 0.5j
        // Magnitude = 1/sqrt(2) ~ 0.7071, Phase = -45 deg (-pi/4 rad)
        expect(posPoint.real).toBeCloseTo(0.5, 4);
        expect(posPoint.imag).toBeCloseTo(-0.5, 4);
        expect(posPoint.amplitude).toBeCloseTo(Math.SQRT1_2, 4);
        expect(posPoint.phaseDeg).toBeCloseTo(-45, 4);
      }
    });
  });
});
