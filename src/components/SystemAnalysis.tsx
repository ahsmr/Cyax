import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import type { Connection, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Activity, Plus, Trash2, Play } from "lucide-react";

// Custom Node Components representing control system blocks
import {
  CustomInputNode,
  CustomOutputNode,
  IntegratorNode,
  SummingNode,
  GainNode,
} from "./systems/CustomNodes";
import { MathView } from "./common/MathView";
import { deriveTransferFunction } from "../utils/systemSolver";
import type { SolverResult } from "../utils/systemSolver";
import BodePlot from "./BodePlot";
import styles from "./SystemAnalysis.module.css";

/**
 * * Node Type Registry
 * Maps custom React Flow node identifiers to their respective React render components.
 */
const nodeTypes = {
  input: CustomInputNode,
  output: CustomOutputNode,
  integrator: IntegratorNode,
  summing: SummingNode,
  gain: GainNode,
};

// Default arrow style configuration for signal connections
const defaultMarker = {
  type: MarkerType.ArrowClosed,
  color: "var(--sky-blue)",
};

/**
 * * Initial Workspace Canvas Nodes
 * Configured for System 2: 3rd-Order Multi-Loop Control System with Direct Feedthrough
 * H(s) = (0.5s^3 + 4s + 2) / (s^3 + s^2 + 4s + 2)
 */
const initialNodes: Node[] = [
  {
    id: "u_in",
    type: "input",
    data: { label: "u(t)" },
    position: { x: 50, y: 180 },
    deletable: false,
  },

  // State 3 Subsystem (x3)
  { id: "sum_x3", type: "summing", data: {}, position: { x: 180, y: 180 } },
  { id: "int_x3", type: "integrator", data: {}, position: { x: 300, y: 180 } },

  // Forward gains from x3 to x2
  {
    id: "gain_x3_direct",
    type: "gain",
    data: { gain: 2, label: "K = 2" },
    position: { x: 440, y: 180 },
  },
  {
    id: "gain_x3_deriv",
    type: "gain",
    data: { gain: 4, label: "K = 4" },
    position: { x: 300, y: 280 },
  },

  // State 2 Subsystem (x2)
  { id: "sum_x2", type: "summing", data: {}, position: { x: 580, y: 180 } },
  { id: "int_x2", type: "integrator", data: {}, position: { x: 700, y: 180 } },

  // Local feedback on x2 (-1 * x1)
  { id: "sum_x1", type: "summing", data: {}, position: { x: 820, y: 180 } },
  { id: "int_x1", type: "integrator", data: {}, position: { x: 940, y: 180 } },

  // Feedthrough path
  {
    id: "gain_d",
    type: "gain",
    data: { gain: 0.5, label: "D = 0.5" },
    position: { x: 580, y: 50 },
  },

  // Output junction
  { id: "sum_y", type: "summing", data: {}, position: { x: 1080, y: 180 } },
  {
    id: "y_out",
    type: "output",
    data: { label: "y(t)" },
    position: { x: 1200, y: 180 },
    deletable: false,
  },
];

/**
 * * Initial Signal Flow Edges
 * Connects input u(t), multi-loop state integrators, feedthrough path, and output y(t).
 */
const initialEdges: Edge[] = [
  { id: "e1", source: "u_in", target: "sum_x3", markerEnd: defaultMarker },
  {
    id: "e2",
    source: "sum_y",
    target: "sum_x3",
    targetHandle: "in-minus",
    markerEnd: defaultMarker,
  },
  { id: "e3", source: "sum_x3", target: "int_x3", markerEnd: defaultMarker },

  {
    id: "e4",
    source: "int_x3",
    target: "gain_x3_direct",
    markerEnd: defaultMarker,
  },
  {
    id: "e5",
    source: "gain_x3_direct",
    target: "sum_x2",
    markerEnd: defaultMarker,
  },

  {
    id: "e6",
    source: "sum_x3",
    target: "gain_x3_deriv",
    markerEnd: defaultMarker,
  },
  {
    id: "e7",
    source: "gain_x3_deriv",
    target: "sum_x2",
    markerEnd: defaultMarker,
  },

  { id: "e8", source: "sum_x2", target: "int_x2", markerEnd: defaultMarker },
  { id: "e9", source: "int_x2", target: "sum_x1", markerEnd: defaultMarker },

  {
    id: "e10",
    source: "sum_y",
    target: "sum_x1",
    targetHandle: "in-minus",
    markerEnd: defaultMarker,
  },
  { id: "e11", source: "sum_x1", target: "int_x1", markerEnd: defaultMarker },

  { id: "e12", source: "u_in", target: "gain_d", markerEnd: defaultMarker },
  { id: "e13", source: "gain_d", target: "sum_y", markerEnd: defaultMarker },

  { id: "e14", source: "int_x1", target: "sum_y", markerEnd: defaultMarker },
  { id: "e15", source: "sum_y", target: "y_out", markerEnd: defaultMarker },
];

/**
 * * SystemAnalysis Component
 * Interactive block diagram canvas for building control systems.
 * Evaluates continuous signal flows, derives symbolic transfer functions H(s),
 * and delegates frequency response visualization to <BodePlot />.
 */
const SystemAnalysis: React.FC = () => {
  // ==========================================
  // 1. STATE & HOOKS
  // ==========================================

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [gainValue, setGainValue] = useState<number>(2);

  const [solverOutput, setSolverOutput] = useState<SolverResult>({
    denominator: null,
    numerator: null,
    latexEquation: "H(s) = \\dots",
    stepByStep: [],
  });

  // ==========================================
  // 2. MATHEMATICAL SOLVER COMPUTATION
  // ==========================================

  const runSolver = () => {
    const res = deriveTransferFunction(nodes, edges);
    setSolverOutput(res);
  };

  // ==========================================
  // 3. CANVAS EVENT HANDLERS
  // ==========================================

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--sky-blue)",
            },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const addBlock = (type: "integrator" | "summing" | "gain") => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: 250 + Math.random() * 80, y: 150 + Math.random() * 40 },
      data:
        type === "gain" ? { gain: gainValue, label: `K = ${gainValue}` } : {},
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const clearCanvas = () => {
    setNodes((nds) => nds.filter((n) => n.id === "u_in" || n.id === "y_out"));
    setEdges([]);
    setSolverOutput({
      denominator: null,
      numerator: null,
      latexEquation: "H(s) = \\dots",
      stepByStep: [],
    });
  };

  // ==========================================
  // 4. WORKSPACE RENDER TREE
  // ==========================================

  return (
    <div className="home-container" style={{ padding: "24px" }}>
      {/* --- HEADER: Module Identifier --- */}
      <div
        className="status-header"
        style={{
          marginBottom: "20px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
        }}
      >
        <div className="status-header-title">
          <Activity size={20} style={{ color: "var(--sky-blue)" }} />
          <span>Interactive System Canvas & Transfer Function Analysis</span>
        </div>
        <span className="version-badge">LTI Engine v1.0.2</span>
      </div>

      {/* --- MAIN GRID LAYOUT: Canvas + Control Panel --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "20px",
        }}
      >
        {/* LEFT COLUMN: React Flow Diagram, Derivation Output & Bode Diagram */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Interactive Canvas Wrapper */}
          <div
            className="card"
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Toolbar Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="section-label" style={{ margin: 0 }}>
                Block Canvas
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="secondary-btn"
                  onClick={() => addBlock("integrator")}
                >
                  <Plus size={12} style={{ marginRight: "4px" }} /> Integrator
                  (1/s)
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => addBlock("gain")}
                >
                  <Plus size={12} style={{ marginRight: "4px" }} /> Gain Block
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => addBlock("summing")}
                >
                  <Plus size={12} style={{ marginRight: "4px" }} /> Summing Node
                  (Σ)
                </button>
                <button
                  className="secondary-btn"
                  onClick={clearCanvas}
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 size={12} style={{ marginRight: "4px" }} /> Clear
                  Blocks
                </button>
              </div>
            </div>

            {/* React Flow Graph Engine */}
            <div className={styles.canvasWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={(conn) => conn.source !== conn.target}
                fitView
              >
                <Background color="#334155" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          </div>

          {/* Card 2: Derived Transfer Function & Math Derivation Steps */}
          <div className="card" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="section-label" style={{ margin: 0 }}>
                State-Space & Transfer Function Derivation
              </span>

              {/* Play Button for Transfer Function Computation */}
              <button
                className="secondary-btn"
                onClick={runSolver}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderColor: "var(--sky-blue)",
                  color: "var(--sky-blue)",
                }}
              >
                <Play size={12} fill="currentColor" /> Play
              </button>
            </div>

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Step-by-Step LaTeX Render List */}
              {solverOutput.stepByStep.map((step, idx) => (
                <div
                  key={idx}
                  className="metric-box"
                  style={{ padding: "12px", textAlign: "left" }}
                >
                  <MathView math={step} displayMode />
                </div>
              ))}

              {/* Final Derived Equation Box */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(56, 189, 248, 0.08)",
                  borderRadius: "8px",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                <span
                  className="metric-label"
                  style={{ color: "var(--sky-blue)", fontWeight: 700 }}
                >
                  DERIVED TRANSFER FUNCTION
                </span>
                <div style={{ marginTop: "8px" }}>
                  <MathView math={solverOutput.latexEquation} displayMode />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Reusable Standalone Bode Plot Component */}
          <BodePlot
            title={<MathView math={solverOutput.latexEquation} />}
            numerator={solverOutput.numerator}
            denominator={solverOutput.denominator}
          />
        </div>

        {/* RIGHT COLUMN: Parameters & Config Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <span className="section-label">Block Parameters</span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <div>
                <label className="metric-label">
                  Gain Parameter (K): {gainValue}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={gainValue}
                  onChange={(e) => setGainValue(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--sky-blue)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalysis;
