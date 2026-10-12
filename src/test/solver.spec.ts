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
