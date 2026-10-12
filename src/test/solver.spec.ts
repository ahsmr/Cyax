import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { deriveTransferFunction, simplifyRational } from '../utils/systemSolver'; // adjust path as needed

describe('deriveTransferFunction Engine', () => {
  // Helper to create basic node structures
  const createNode = (id: string, type: string, data = {}): Node => ({
    id,
    type,
    position: { x: 0, y: 0 },
    data,
  });

  // Helper to create basic edges
  const createEdge = (
    id: string,
    source: string,
    target: string,
    targetHandle?: string
  ): Edge => ({
    id,
    source,
    target,
    targetHandle,
  });

describe('simplifyRational Engine', () => {
    it('cleans near-zero floating-point noise and truncates trailing zeros', () => {
    const num = [1e-10, 2, 0];
    const den = [1, 3, 1e-11];

    const result = simplifyRational(num, den);

    // Denominator [1, 3] had leadD = 3, so everything was divided by 3
    expect(result.num).toEqual([0, 2 / 3]);
    expect(result.den).toEqual([1 / 3, 1]);
  });

    it('returns zero rational { num: [0], den: [1] } if numerator is zero', () => {
      const num = [0, 0, 0];
      const den = [1, 5, 6];

      const result = simplifyRational(num, den);

      expect(result).toEqual({
        num: [0],
        den: [1],
      });
    });

    it('cancels out common powers of s across numerator and denominator', () => {
      // num: 0 + 2s + 4s^2 (min non-zero index is 1)
      // den: 0 + 0 + 1s^2 (min non-zero index is 2)
      // kCommon = min(1, 2) = 1. Both lose 1 factor of s.
      const num = [0, 2, 4];
      const den = [0, 0, 1];

      const result = simplifyRational(num, den);

      // After slicing 1 element: num becomes [2, 4], den becomes [0, 1]
      expect(result.num).toEqual([2, 4]);
      expect(result.den).toEqual([0, 1]);
    });

    it('normalizes the denominator leading coefficient to 1', () => {
      // num = [2, 4], den = [2, 4] (leading coefficient is 4)
      const num = [2, 4];
      const den = [2, 4];

      const result = simplifyRational(num, den);

      // Dividing all coefficients by leadD (4)
      expect(result.num).toEqual([0.5, 1]);
      expect(result.den).toEqual([0.5, 1]);
    });

    it('handles cleanly formatted arrays and normalizes them', () => {
    const num = [5];
    const den = [1, 2]; // leadD = 2

    const result = simplifyRational(num, den);

    // Everything is divided by leadD (2)
    expect(result).toEqual({
      num: [2.5],
      den: [0.5, 1],
    });
  });
  });


  describe('Topology & Boundary Validation', () => {
    it('returns error string when input or output nodes are missing', () => {
      const nodes: Node[] = [createNode('gain1', 'gain', { gain: 5 })];
      const edges: Edge[] = [];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe('H(s) = \\text{Invalid Topology}');
      expect(result.stepByStep[0]).toContain('Missing input u(t) or output y(t)');
    });

    it('handles direct pass-through connection U(s) -> Y(s)', () => {
      const nodes: Node[] = [
        createNode('u_in', 'input'),
        createNode('y_out', 'output'),
      ];
      const edges: Edge[] = [createEdge('e1', 'u_in', 'y_out')];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe('H(s) = 1');
    });
  });

  describe('Block Diagram Components & Feedback Systems', () => {
    it('solves simple Gain block H(s) = K', () => {
      const nodes: Node[] = [
        createNode('u_in', 'input'),
        createNode('g1', 'gain', { gain: 4 }),
        createNode('y_out', 'output'),
      ];
      const edges: Edge[] = [
        createEdge('e1', 'u_in', 'g1'),
        createEdge('e2', 'g1', 'y_out'),
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe('H(s) = 4');
    });

    it('solves simple Integrator block H(s) = 1/s', () => {
      const nodes: Node[] = [
        createNode('u_in', 'input'),
        createNode('int1', 'integrator'),
        createNode('y_out', 'output'),
      ];
      const edges: Edge[] = [
        createEdge('e1', 'u_in', 'int1'),
        createEdge('e2', 'int1', 'y_out'),
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe('H(s) = \\frac{1}{s}');
    });

    it('solves standard negative feedback loop H(s) = 1 / (s + 1)', () => {
      // Input -> Summing (+) -> Integrator (1/s) -> Output
      //                             |
      //                             +---> Summing (-)
import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { deriveTransferFunction } from "../utils/systemSolver"; // adjust path as needed

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
    it("solves 2-state continuous system H(s) = (s + 1) / (s^2 + 0.75s + 0.125)", () => {
      const nodes: Node[] = [
        createNode("u_in", "input"),

        // State x2 subsystem: x2' = -0.25*x2 + u
        createNode("sum_x2", "summing"),
        createNode("int_x2", "integrator"),
        createNode("gain_a22", "gain", { gain: 0.25 }), // positive feedback magnitude

        // State x1 subsystem: x1' = -0.5*x1 - x2
        createNode("sum_x1", "summing"),
        createNode("int_x1", "integrator"),
        createNode("gain_a11", "gain", { gain: 0.5 }), // positive feedback magnitude
        createNode("gain_a12", "gain", { gain: 1 }), // coupling magnitude

        // Output junction: y = -0.5*x1 + x2
        createNode("gain_c1", "gain", { gain: -0.5 }),
        createNode("gain_c2", "gain", { gain: 1 }),
        createNode("sum_y", "summing"),
        createNode("y_out", "output"),
      ];

      const edges: Edge[] = [
        // u(t) -> sum_x2 -> int_x2 (x2)
        createEdge("e1", "u_in", "sum_x2"),
        createEdge("e2", "sum_x2", "int_x2"),

        // Negative feedback loop for x2: -0.25 * x2
        createEdge("e3", "int_x2", "gain_a22"),
        createEdge("e4", "gain_a22", "sum_x2", "in-minus"), // negative feedback handle

        // x2 -> x1 coupling: -1 * x2 -> sum_x1
        createEdge("e5", "int_x2", "gain_a12"),
        createEdge("e6", "gain_a12", "sum_x1", "in-minus"), // negative coupling

        // x1 state loop: -0.5 * x1
        createEdge("e7", "sum_x1", "int_x1"),
        createEdge("e8", "int_x1", "gain_a11"),
        createEdge("e9", "gain_a11", "sum_x1", "in-minus"), // negative feedback handle

        // Output paths: y(t) = -0.5*x1 + 1*x2
        createEdge("e10", "int_x1", "gain_c1"),
        createEdge("e11", "gain_c1", "sum_y"),
        createEdge("e12", "int_x2", "gain_c2"),
        createEdge("e13", "gain_c2", "sum_y"),
        createEdge("e14", "sum_y", "y_out"),
      ];

      const result = deriveTransferFunction(nodes, edges);

      // Verify polynomial form: (s + 1) / (s^2 + 0.75s + 0.125)
      expect(result.latexEquation).toBe(
        "H(s) = \\frac{s + 1}{s^{2} + 0.75s + 0.125}",
      );
    });
  });
});
