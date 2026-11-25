import { describe, it, expect } from "vitest";
import {
  inverseLaplace,
  evalPolyComplexATS,
  generateImpulseResponseData,
} from "../utils/laplaceEngine";

describe("laplaceEngine", () => {
  describe("evalPolyComplexATS", () => {
    it("evaluates real and complex inputs accurately", () => {
      // P(s) = 1 + 2s + 3s^2 at s = j -> 1 + 2j - 3 = -2 + 2j
      const res1 = evalPolyComplexATS([1, 2, 3], { re: 0, im: 1 });
      expect(res1.re).toBeCloseTo(-2, 6);
      expect(res1.im).toBeCloseTo(2, 6);

      // P(s) = 1 - s^2 at s = 1 -> 0
      const res2 = evalPolyComplexATS([1, 0, -1], { re: 1, im: 0 });
      expect(res2.re).toBeCloseTo(0, 6);
      expect(res2.im).toBeCloseTo(0, 6);
    });

    it("does not drop very small non-zero coefficients", () => {
      // P(s) = 1e-11 + 2e-11 s at s = 2 -> 5e-11
      const res = evalPolyComplexATS([1e-11, 2e-11], { re: 2, im: 0 });
      expect(res.re).toBeCloseTo(5e-11, 16);
      expect(res.im).toBeCloseTo(0, 16);
    });
  });

  describe("inverseLaplace — Simple Real & Complex Conjugate Poles", () => {
    it("computes first-order exponential decay: 1 / (s + 2) -> e^{-2t}", () => {
      const res = inverseLaplace([1], [2, 1]);
      expect(res.latexEquation).toBe("h(t) = e^{-2t}");
      expect(res.evaluate(-1)).toBe(0);
      expect(res.evaluate(0)).toBeCloseTo(1, 5);
      expect(res.evaluate(1)).toBeCloseTo(Math.exp(-2), 5);
      expect(res.evaluate(2.5)).toBeCloseTo(Math.exp(-5), 5);
    });

    it("computes pure integrator (pole at origin): 3 / s -> 3", () => {
      const res = inverseLaplace([3], [0, 1]);
      expect(res.latexEquation).toBe("h(t) = 3");
      expect(res.evaluate(0)).toBeCloseTo(3, 5);
      expect(res.evaluate(5)).toBeCloseTo(3, 5);
    });

    it("computes distinct real poles with partial fractions: (s + 3) / ((s + 1)(s + 2)) -> 2e^{-t} - e^{-2t}", () => {
      // (s + 1)(s + 2) = 2 + 3s + s^2
      const res = inverseLaplace([3, 1], [2, 3, 1]);
      expect(res.latexEquation).toBe("h(t) = 2e^{-t} - e^{-2t}");

      for (const t of [0, 0.5, 1, 2, 4]) {
        const expected = 2 * Math.exp(-t) - Math.exp(-2 * t);
        expect(res.evaluate(t)).toBeCloseTo(expected, 4);
      }
    });

    it("computes undamped harmonic oscillator: 4 / (s^2 + 4) -> 2sin(2t)", () => {
      const res = inverseLaplace([4], [4, 0, 1]);
      expect(res.latexEquation).toBe("h(t) = 2\\sin(2t)");

      for (const t of [0, 0.25, 0.785, 1.5, 3]) {
        expect(res.evaluate(t)).toBeCloseTo(2 * Math.sin(2 * t), 4);
      }
    });

    it("computes underdamped 2nd-order system: (s + 1) / (s^2 + 2s + 5) -> e^{-t}cos(2t)", () => {
      // (s + 1)^2 + 4 = 5 + 2s + s^2
      const res = inverseLaplace([1, 1], [5, 2, 1]);
      expect(res.latexEquation).toBe("h(t) = e^{-t}(\\cos(2t))");

      for (const t of [0, 0.3, 1.0, 2.2]) {
        expect(res.evaluate(t)).toBeCloseTo(Math.exp(-t) * Math.cos(2 * t), 4);
      }
    });

    it("formats unit sine and negative unit cosine cleanly without 1\\sin or -1\\cos", () => {
      // 2 / (s^2 + 4) -> sin(2t)
      const sinRes = inverseLaplace([2], [4, 0, 1]);
      expect(sinRes.latexEquation).toBe("h(t) = \\sin(2t)");

      // -(s + 1) / (s^2 + 2s + 5) -> -e^{-t}cos(2t)
      const negCosRes = inverseLaplace([-1, -1], [5, 2, 1]);
      expect(negCosRes.latexEquation).toBe("h(t) = e^{-t}(-\\cos(2t))");
    });

    it("computes 3rd-order mixed real + complex conjugate system with direct feedthrough: (0.5s^3 + 4s + 2) / (s^3 + s^2 + 4s + 2)", () => {
      // H(s) = 0.5 + (-0.5s^2 + 2s + 1) / (s^3 + s^2 + 4s + 2)
      const res = inverseLaplace([2, 4, 0, 0.5], [2, 4, 1, 1]);
      expect(res.latexEquation).toContain("0.5\\delta(t)");
      expect(res.latexEquation).not.toContain("+ -");

      // At t = 0+, h(0+) = lim_{s->inf} s * (H(s) - D) = -0.5
      expect(res.evaluate(0)).toBeCloseTo(-0.5, 3);
      // As t -> inf, all poles are in LHP so h(t) -> 0
      expect(Math.abs(res.evaluate(30))).toBeLessThan(1e-3);
    });
  });

  describe("inverseLaplace — Direct Feedthrough & Normalization Edge Cases", () => {
    it("extracts Dirac impulse term for biproper transfer function: (2s + 5) / (s + 1) -> 2delta(t) + 3e^{-t}", () => {
      const res = inverseLaplace([5, 2], [1, 1]);
      expect(res.latexEquation).toBe("h(t) = 2\\delta(t) + 3e^{-t}");
      expect(res.evaluate(0)).toBeCloseTo(3, 5);
      expect(res.evaluate(1)).toBeCloseTo(3 * Math.exp(-1), 5);
    });

    it("formats negative residue after direct feedthrough cleanly: (2s - 1) / (s + 1) -> 2delta(t) - 3e^{-t}", () => {
      const res = inverseLaplace([-1, 2], [1, 1]);
      expect(res.latexEquation).toBe("h(t) = 2\\delta(t) - 3e^{-t}");
      expect(res.evaluate(0)).toBeCloseTo(-3, 5);
    });

    it("handles negative direct feedthrough: (-3s + 1) / (s + 2) -> -3delta(t) + 7e^{-2t}", () => {
      const res = inverseLaplace([1, -3], [2, 1]);
      expect(res.latexEquation).toBe("h(t) = -3\\delta(t) + 7e^{-2t}");
      expect(res.evaluate(0)).toBeCloseTo(7, 5);
    });

    it("handles pure static gain (0th order): 7 / 2 -> 3.5delta(t)", () => {
      const res = inverseLaplace([7], [2]);
      expect(res.latexEquation).toBe("h(t) = 3.5\\delta(t)");
      expect(res.evaluate(0)).toBe(0);
      expect(res.evaluate(5)).toBe(0);
    });

    it("handles non-monic denominators and trailing zero coefficients: [4, 0, 0] / [6, 2, 0, 0] -> 2e^{-3t}", () => {
      // 4 / (2s + 6) = 2 / (s + 3)
      const res = inverseLaplace([4, 0, 0], [6, 2, 0, 0]);
      expect(res.latexEquation).toBe("h(t) = 2e^{-3t}");
      expect(res.evaluate(0)).toBeCloseTo(2, 5);
      expect(res.evaluate(1)).toBeCloseTo(2 * Math.exp(-3), 5);
    });

    it("handles causality strictly: h(t) === 0 for any t < 0", () => {
      const res = inverseLaplace([1], [1, 1]);
      expect(res.evaluate(-0.0001)).toBe(0);
      expect(res.evaluate(-100)).toBe(0);
    });
  });

  describe("inverseLaplace — Repeated Poles (Multiplicity >= 2)", () => {
    it("handles double real pole: (s + 3) / (s + 1)^2 -> (1 + 2t)e^{-t}", () => {
      // (s + 1)^2 = 1 + 2s + s^2; (s+3)/(s+1)^2 = 1/(s+1) + 2/(s+1)^2
      const res = inverseLaplace([3, 1], [1, 2, 1]);
      for (const t of [0, 0.5, 1, 2, 3]) {
        const expected = (1 + 2 * t) * Math.exp(-t);
        expect(res.evaluate(t)).toBeCloseTo(expected, 3);
      }
    });

    it("handles double pole at the origin (double integrator): 1 / s^2 -> t", () => {
      const res = inverseLaplace([1], [0, 0, 1]);
      expect(res.latexEquation).toBe("h(t) = t");
      expect(res.evaluate(0)).toBeCloseTo(0, 5);
      expect(res.evaluate(2.5)).toBeCloseTo(2.5, 5);
    });

    it("handles triple real pole including lower-order terms: (s^2 + 2s + 1) / (s + 1)^3 = 1 / (s + 1) -> e^{-t}", () => {
      // (s + 1)^3 = 1 + 3s + 3s^2 + s^3
      const res = inverseLaplace([1, 2, 1], [1, 3, 3, 1]);
      for (const t of [0, 0.5, 1, 2, 4]) {
        expect(res.evaluate(t)).toBeCloseTo(Math.exp(-t), 3);
      }
    });

    it("handles general triple real pole: 2 / (s + 1)^3 -> t^2 e^{-t}", () => {
      const res = inverseLaplace([2], [1, 3, 3, 1]);
      for (const t of [0, 0.5, 1, 2, 3]) {
        expect(res.evaluate(t)).toBeCloseTo(t * t * Math.exp(-t), 3);
      }
    });

    it("handles 4th-order repeated pole at origin + simple poles: 1 / (s^6 - s^4) -> sinh(t) - t - t^3 / 6", () => {
      // D(s) = -s^4 + s^6 -> [0, 0, 0, 0, -1, 0, 1]
      const res = inverseLaplace([1], [0, 0, 0, 0, -1, 0, 1]);
      for (const t of [0, 0.5, 1, 1.5, 2]) {
        const expected = Math.sinh(t) - t - Math.pow(t, 3) / 6;
        expect(res.evaluate(t)).toBeCloseTo(expected, 2);
      }
    });

    it("handles repeated complex conjugate poles: 2 / (s^2 + 1)^2 -> sin(t) - t cos(t)", () => {
      // (s^2 + 1)^2 = 1 + 2s^2 + s^4
      const res = inverseLaplace([2], [1, 0, 2, 0, 1]);
      for (const t of [0, 0.5, 1, 2, 3]) {
        const expected = Math.sin(t) - t * Math.cos(t);
        expect(res.evaluate(t)).toBeCloseTo(expected, 2);
      }
    });

    it("handles unstable RHP pole accurately: 1 / (s - 2) -> e^{2t}", () => {
      const res = inverseLaplace([1], [-2, 1]);
      expect(res.latexEquation).toBe("h(t) = e^{2t}");
      expect(res.evaluate(1)).toBeCloseTo(Math.exp(2), 4);
      expect(res.evaluate(2)).toBeCloseTo(Math.exp(4), 3);
    });
  });

  describe("inverseLaplace — Higher-Order Systems (Degree >= 4)", () => {
    it("computes 4th-order distinct real poles: 6 / ((s + 1)(s + 2)(s + 3)(s + 4))", () => {
      // (s+1)(s+2)(s+3)(s+4) = 24 + 50s + 35s^2 + 10s^3 + s^4
      // Partial fractions: 1/(s+1) - 3/(s+2) + 3/(s+3) - 1/(s+4)
      const res = inverseLaplace([6], [24, 50, 35, 10, 1]);

      for (const t of [0, 0.5, 1, 2, 3]) {
        const expected =
          Math.exp(-t) -
          3 * Math.exp(-2 * t) +
          3 * Math.exp(-3 * t) -
          Math.exp(-4 * t);
        expect(res.evaluate(t)).toBeCloseTo(expected, 3);
      }
    });

    it("computes 5th-order distinct real poles: 24 / ((s+1)(s+2)(s+3)(s+4)(s+5))", () => {
      // (s+1)(s+2)(s+3)(s+4)(s+5) = 120 + 274s + 225s^2 + 85s^3 + 15s^4 + s^5
      // Partial fractions: 1/(s+1) - 4/(s+2) + 6/(s+3) - 4/(s+4) + 1/(s+5)
      const res = inverseLaplace([24], [120, 274, 225, 85, 15, 1]);

      for (const t of [0, 0.5, 1, 2]) {
        const expected =
          Math.exp(-t) -
          4 * Math.exp(-2 * t) +
          6 * Math.exp(-3 * t) -
          4 * Math.exp(-4 * t) +
          Math.exp(-5 * t);
        expect(res.evaluate(t)).toBeCloseTo(expected, 3);
      }
    });
  });

  describe("inverseLaplace — Error Handling", () => {
    it("throws on zero denominator polynomial", () => {
      expect(() => inverseLaplace([1], [0])).toThrow(
        "Denominator polynomial cannot be zero.",
      );
      expect(() => inverseLaplace([1], [])).toThrow(
        "Denominator polynomial cannot be zero.",
      );
    });

    it("throws on improper transfer functions (deg Num > deg Den)", () => {
      expect(() => inverseLaplace([1, 2, 1], [1, 1])).toThrow(
        "Improper Transfer Function (Degree Num > Den)",
      );
    });

    it("returns 0 for zero numerator polynomial", () => {
      const res = inverseLaplace([0], [1, 2, 1]);
      expect(res.latexEquation).toBe("h(t) = 0");
      expect(res.evaluate(1)).toBe(0);
    });
  });

  describe("generateImpulseResponseData", () => {
    it("generates evenly spaced time-series samples matching h(t)", () => {
      const data = generateImpulseResponseData([1], [2, 1], 4, 40);
      expect(data).toHaveLength(41);
      expect(data[0]).toEqual({ time: 0, response: 1 });
      expect(data[10].time).toBe(1);
      expect(data[10].response).toBeCloseTo(Math.exp(-2), 4);
      expect(data[40].time).toBe(4);
      expect(data[40].response).toBeCloseTo(Math.exp(-8), 4);
    });
  });
});
