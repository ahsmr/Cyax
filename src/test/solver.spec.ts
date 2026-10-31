import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import {
  deriveTransferFunction,
  factorPolynomial,
  getMatrixRank,
} from "../utils/systemSolver";

const createNode = (id: string, type: string, data = {}): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data,
});

const createEdge = (
  id: string,
  source: string,
  target: string,
  targetHandle?: string,
): Edge => ({
  id,
  source,
  target,
  targetHandle,
});

describe("deriveTransferFunction Engine", () => {
  describe("State-Space Continuous System Transfer Function", () => {
    /**
     * System 0: Initial 2-State Coupled Feedback System
     * State Equations:
     *   x1' = -0.5*x1 - x2
     *   x2' = -0.25*x2 + u
     *   y   = -0.5*x1 + x2
     *
     * Continuous State-Space Matrices:
     *   A = [ -0.5   -1.0 ]
     *       [  0.0  -0.25 ]
     *   B = [ 0 ]
     *       [ 1 ]
     *   C = [ -0.5  1.0 ]
     *   D = [ 0 ]
     *
     * Transfer Function:
     *   H(s) = (s + 1) / (s^2 + 0.75s + 0.125)
     */
    it("solves 2-state continuous system H(s) = (s + 1) / (s^2 + 0.75s + 0.125)", () => {
      const nodes: Node[] = [
        createNode("u_in", "input"),

        // State x2 subsystem: x2' = -0.25*x2 + u
        createNode("sum_x2", "summing"),
        createNode("int_x2", "integrator"),
        createNode("gain_a22", "gain", { gain: 0.25 }),

        // State x1 subsystem: x1' = -0.5*x1 - x2
        createNode("sum_x1", "summing"),
        createNode("int_x1", "integrator"),
        createNode("gain_a11", "gain", { gain: 0.5 }),
        createNode("gain_a12", "gain", { gain: 1 }),

        // Output junction: y = -0.5*x1 + x2
        createNode("gain_c1", "gain", { gain: -0.5 }),
        createNode("gain_c2", "gain", { gain: 1 }),
        createNode("sum_y", "summing"),
        createNode("y_out", "output"),
      ];

      const edges: Edge[] = [
        createEdge("e1", "u_in", "sum_x2"),
        createEdge("e2", "sum_x2", "int_x2"),

        createEdge("e3", "int_x2", "gain_a22"),
        createEdge("e4", "gain_a22", "sum_x2", "in-minus"),

        createEdge("e5", "int_x2", "gain_a12"),
        createEdge("e6", "gain_a12", "sum_x1", "in-minus"),

        createEdge("e7", "sum_x1", "int_x1"),
        createEdge("e8", "int_x1", "gain_a11"),
        createEdge("e9", "gain_a11", "sum_x1", "in-minus"),

        createEdge("e10", "int_x1", "gain_c1"),
        createEdge("e11", "gain_c1", "sum_y"),
        createEdge("e12", "int_x2", "gain_c2"),
        createEdge("e13", "gain_c2", "sum_y"),
        createEdge("e14", "sum_y", "y_out"),
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe(
        "H(s) = \\frac{s + 1}{s^{2} + 0.75s + 0.125}",
      );
    });

    /**
     * System 1: Negative Feedback Loop with Gain, Integrator, and Inner Zero (2nd Order)
     * State Equations:
     *   x1' = -5*x1 + x2 + 2*u
     *   x2' = -x1 + u
     *   y   = x1
     *
     * Continuous State-Space Matrices:
     *   A = [ -5   1 ]
     *       [ -1   0 ]
     *   B = [ 2 ]
     *       [ 1 ]
     *   C = [ 1   0 ]
     *   D = [ 0 ]
     *
     * Transfer Function:
     *   H(s) = (2s + 1) / (s^2 + 5s + 1)
     */
    it("solves 2nd-order multi-loop feedback system H(s) = (2s + 1) / (s^2 + 5s + 1)", () => {
      const nodes: Node[] = [
        createNode("u_in", "input"),

        createNode("sum_in", "summing"),
        createNode("gain_ff", "gain", { gain: 2 }),
        createNode("int_x2", "integrator"),
        createNode("sum_int1", "summing"),
        createNode("int_x1", "integrator"),
        createNode("gain_inner", "gain", { gain: 3 }),
        createNode("y_out", "output"),
      ];

      const edges: Edge[] = [
        createEdge("e1", "u_in", "sum_in"),
        createEdge("e2", "int_x1", "sum_in", "in-minus"),
        createEdge("e3", "sum_in", "int_x2"),
        createEdge("e4", "sum_in", "gain_ff"),
        createEdge("e5", "gain_ff", "sum_int1"),
        createEdge("e6", "int_x2", "sum_int1"),
        createEdge("e7", "int_x1", "gain_inner"),
        createEdge("e8", "gain_inner", "sum_int1", "in-minus"),
        createEdge("e9", "sum_int1", "int_x1"),
        createEdge("e10", "int_x1", "y_out"),
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe(
        "H(s) = \\frac{2s + 1}{s^{2} + 5s + 1}",
      );
    });

    /**
     * System 2: 3rd-Order Multi-Loop Control System with Direct Feedthrough
     * Continuous State-Space Matrices:
     *   A = [ -1   1   0 ]
     *       [ -4   0   3 ]
     *       [ -1   0   0 ]
     *   B = [ -0.5 ]
     *       [  2.0 ]
     *       [  0.5 ]
     *   C = [ 1   0   0 ]
     *   D = [ 0.5 ]
     *
     * Transfer Function:
     *   H(s) = (0.5s^3 + 4s + 2) / (s^3 + s^2 + 4s + 2)
     */
    it("solves 3rd-order system with direct feedthrough H(s) = (0.5s^3 + 4s + 2) / (s^3 + s^2 + 4s + 2)", () => {
      const nodes: Node[] = [
        createNode("u_in", "input"),

        // State 3 Subsystem (x3)
        createNode("sum_x3", "summing"),
        createNode("int_x3", "integrator"),

        // Forward gains from x3 to x2
        createNode("gain_x3_direct", "gain", { gain: 2 }),
        createNode("gain_x3_deriv", "gain", { gain: 4 }),

        // State 2 Subsystem (x2)
        createNode("sum_x2", "summing"),
        createNode("int_x2", "integrator"),

        // Local feedback on x2 (-1 * x1)
        createNode("sum_x1", "summing"),
        createNode("int_x1", "integrator"),

        // Feedthrough path
        createNode("gain_d", "gain", { gain: 0.5 }),

        // Output junction
        createNode("sum_y", "summing"),
        createNode("y_out", "output"),
      ];

      const edges: Edge[] = [
        createEdge("e1", "u_in", "sum_x3"),
        createEdge("e2", "sum_y", "sum_x3", "in-minus"),
        createEdge("e3", "sum_x3", "int_x3"),

        createEdge("e4", "int_x3", "gain_x3_direct"),
        createEdge("e5", "gain_x3_direct", "sum_x2"),

        createEdge("e6", "sum_x3", "gain_x3_deriv"),
        createEdge("e7", "gain_x3_deriv", "sum_x2"),

        createEdge("e8", "sum_x2", "int_x2"),
        createEdge("e9", "int_x2", "sum_x1"),

        createEdge("e10", "sum_y", "sum_x1", "in-minus"),
        createEdge("e11", "sum_x1", "int_x1"),

        createEdge("e12", "u_in", "gain_d"),
        createEdge("e13", "gain_d", "sum_y"),

        createEdge("e14", "int_x1", "sum_y"),
        createEdge("e15", "sum_y", "y_out"),
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe(
        "H(s) = \\frac{0.5s^{3} + 4s + 2}{s^{3} + s^{2} + 4s + 2}",
      );
    });
  });
});
describe("factorPolynomial Engine", () => {
  it("factors degree 1 linear polynomial s - 3", () => {
    // P(s) = s - 3 => [-3, 1]
    const factors = factorPolynomial([-3, 1]);
    expect(factors).toEqual([[-3, 1]]);
  });

  it("factors difference of squares s^2 - 4 into (s - 2)(s + 2)", () => {
    // P(s) = s^2 - 4 => [-4, 0, 1]
    const factors = factorPolynomial([-4, 0, 1]);

    expect(factors.length).toBe(2);
    expect(factors).toContainEqual([-2, 1]);
    expect(factors).toContainEqual([2, 1]);
  });

  it("factors cubic polynomial s^3 - 6s^2 + 11s - 6 into (s - 1)(s - 2)(s - 3)", () => {
    // P(s) = (s - 1)(s - 2)(s - 3) = s^3 - 6s^2 + 11s - 6 => [-6, 11, -6, 1]
    const factors = factorPolynomial([-6, 11, -6, 1]);

    expect(factors.length).toBe(3);
    expect(factors).toContainEqual([-1, 1]);
    expect(factors).toContainEqual([-2, 1]);
    expect(factors).toContainEqual([-3, 1]);
  });

  it("factors polynomial with complex conjugate roots into real irreducible quadratic (s + 1)(s^2 + 2s + 5)", () => {
    // P(s) = (s + 1)(s^2 + 2s + 5) = s^3 + 3s^2 + 7s + 5 => [5, 7, 3, 1]
    const factors = factorPolynomial([5, 7, 3, 1]);

    expect(factors.length).toBe(2);
    expect(factors).toContainEqual([1, 1]); // (s + 1)
    expect(factors).toContainEqual([5, 2, 1]); // (s^2 + 2s + 5)
  });

  it("handles non-monic leading coefficients 2s^2 - 8 => 2(s - 2)(s + 2)", () => {
    // P(s) = 2s^2 - 8 => [-8, 0, 2]
    const factors = factorPolynomial([-8, 0, 2]);

    expect(factors.length).toBe(2);
    // Multiply leading coeff 2 into the first factor: 2*(s - 2) = 2s - 4 => [-4, 2]
    expect(factors).toContainEqual([-4, 2]);
    expect(factors).toContainEqual([2, 1]);
  });
});

describe("getMatrixRank", () => {
  it("handles empty and zero matrices", () => {
    expect(getMatrixRank([])).toBe(0);
    expect(getMatrixRank([[]])).toBe(0);
    expect(
      getMatrixRank([
        [0, 0, 0],
        [0, 0, 0],
      ]),
    ).toBe(0);
  });

  it("calculates full rank square matrices", () => {
    // 3x3 Identity Matrix -> Rank 3
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    expect(getMatrixRank(identity)).toBe(3);

    // 2x2 Invertible Matrix -> Rank 2
    const square2x2 = [
      [2, 1],
      [1, 3],
    ];
    expect(getMatrixRank(square2x2)).toBe(2);
  });

  it("calculates rank-deficient matrices with dependent rows/columns", () => {
    // Row 3 is 2 * Row 1 + Row 2 -> Rank 2
    const dependentRows = [
      [1, 2, 3],
      [4, 5, 6],
      [6, 9, 12],
    ];
    expect(getMatrixRank(dependentRows)).toBe(2);

    // All rows are scalar multiples of [1, 2, 3] -> Rank 1
    const rankOne = [
      [1, 2, 3],
      [2, 4, 6],
      [3, 6, 9],
    ];
    expect(getMatrixRank(rankOne)).toBe(1);
  });

  it("handles rectangular matrices (tall and wide)", () => {
    // 4x2 Tall Matrix (2 linearly independent columns) -> Rank 2
    const tall = [
      [1, 0],
      [0, 1],
      [2, 3],
      [4, 5],
    ];
    expect(getMatrixRank(tall)).toBe(2);

    // 2x4 Wide Matrix (Rank capped by min(m, n) = 2) -> Rank 2
    const wide = [
      [1, 2, 3, 4],
      [0, 1, 0, 1],
    ];
    expect(getMatrixRank(wide)).toBe(2);
  });

  it("handles zero columns/rows interspersed in the matrix", () => {
    // Zero column in the middle -> Rank 2
    const zeroCol = [
      [1, 0, 2],
      [0, 0, 1],
      [3, 0, 0],
    ];
    expect(getMatrixRank(zeroCol)).toBe(2);

    // Zero row at top -> Rank 2
    const zeroRowTop = [
      [0, 0, 0],
      [1, 2, 3],
      [0, 1, 4],
    ];
    expect(getMatrixRank(zeroRowTop)).toBe(2);
  });

  it("correctly filters floating-point noise below threshold", () => {
    // Row 2 is Row 1 + 1e-12 rounding noise -> Rank 1
    const noisyMatrix = [
      [1, 2],
      [1 + 1e-12, 2],
    ];
    expect(getMatrixRank(noisyMatrix, 1e-10)).toBe(1);
  });

  it("does not mutate the original input array", () => {
    const original = [
      [1, 2],
      [3, 4],
    ];
    const copy = JSON.parse(JSON.stringify(original));

    getMatrixRank(original);

    expect(original).toEqual(copy);
  });
});
