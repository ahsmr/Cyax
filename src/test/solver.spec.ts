import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { deriveTransferFunction } from '../utils/systemSolver'; // adjust path as needed

describe('deriveTransferFunction Engine', () => { // Add proper and needed test for the systemsolver
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