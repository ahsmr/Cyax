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
      const nodes: Node[] = [
        createNode('u_in', 'input'),
        createNode('sum1', 'summing'),
        createNode('int1', 'integrator'),
        createNode('y_out', 'output'),
      ];
      const edges: Edge[] = [
        createEdge('e1', 'u_in', 'sum1'),
        createEdge('e2', 'sum1', 'int1'),
        createEdge('e3', 'int1', 'y_out'),
        createEdge('e4', 'y_out', 'sum1', 'in-minus'), // negative feedback
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe('H(s) = \\frac{1}{s + 1}');
    });

    it('solves feedback loop with forward Gain K: H(s) = K / (s + K)', () => {
      const nodes: Node[] = [
        createNode('u_in', 'input'),
        createNode('sum1', 'summing'),
        createNode('g1', 'gain', { gain: 5 }),
        createNode('int1', 'integrator'),
        createNode('y_out', 'output'),
      ];
      const edges: Edge[] = [
        createEdge('e1', 'u_in', 'sum1'),
        createEdge('e2', 'sum1', 'g1'),
        createEdge('e3', 'g1', 'int1'),
        createEdge('e4', 'int1', 'y_out'),
        createEdge('e5', 'y_out', 'sum1', 'in-minus'),
      ];

      const result = deriveTransferFunction(nodes, edges);

      expect(result.latexEquation).toBe('H(s) = \\frac{5}{s + 5}');
    });
  });
});