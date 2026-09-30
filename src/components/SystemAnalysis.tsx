import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Activity, Plus, Trash2, Play } from 'lucide-react';

// Custom Node Components representing control system blocks
import {
  CustomInputNode,
  CustomOutputNode,
  IntegratorNode,
  SummingNode,
  GainNode,
} from './systems/CustomNodes';
import { MathView } from './common/MathView';
import { deriveTransferFunction } from '../utils/systemSolver';
import type { SolverResult } from '../utils/systemSolver';
import styles from './SystemAnalysis.module.css';

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
const defaultMarker = { type: MarkerType.ArrowClosed, color: 'var(--sky-blue)' };

/**
 * * Initial Workspace Canvas Nodes
 * Defines a default second-order closed-loop feedback control system layout.
 */
const initialNodes: Node[] = [
  { id: 'u_in', type: 'input', data: { label: 'u(t)' }, position: { x: 50, y: 130 }, deletable: false },
  { id: 'sum_1', type: 'summing', data: {}, position: { x: 180, y: 125 } },
  { id: 'int_2', type: 'integrator', data: {}, position: { x: 300, y: 120 } },
  { id: 'int_1', type: 'integrator', data: {}, position: { x: 450, y: 120 } },
  { id: 'y_out', type: 'output', data: { label: 'y(t)' }, position: { x: 600, y: 130 }, deletable: false },
];

/**
 * * Initial Signal Flow Edges
 * Connects input u(t) -> summing node -> integrators -> output y(t), with negative feedback.
 */
const initialEdges: Edge[] = [
  { id: 'e1', source: 'u_in', target: 'sum_1', targetHandle: 'in-plus', animated: true, markerEnd: defaultMarker },
  { id: 'e2', source: 'sum_1', target: 'int_2', targetHandle: 'in-left', markerEnd: defaultMarker },
  { id: 'e3', source: 'int_2', target: 'int_1', targetHandle: 'in-left', markerEnd: defaultMarker },
  { id: 'e4', source: 'int_1', target: 'y_out', targetHandle: 'in', animated: true, markerEnd: defaultMarker },
  // Negative feedback loop from y(t) bottom handle to Summing Node minus handle
  { id: 'e5', source: 'y_out', sourceHandle: 'out-feedback', target: 'sum_1', targetHandle: 'in-minus', markerEnd: defaultMarker },
];

/**
 * * SystemAnalysis Component
 * Interactive block diagram canvas for building control systems.
 * Evaluates continuous signal flows and derives symbolic transfer functions H(s).
 * 
 * @returns The workspace grid, controls panel, and LaTeX math output.
 */
const SystemAnalysis: React.FC = () => {

  // ==========================================
  // 1. STATE & HOOKS
  // ==========================================

  // * Manage interactive React Flow node and edge positions & states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // * Active Gain parameter (K) applied when adding new gain blocks
  const [gainValue, setGainValue] = useState<number>(2);

  // * Mathematical derivation state produced by systemSolver engine
  const [solverOutput, setSolverOutput] = useState<SolverResult>({
    latexEquation: 'H(s) = \\dots',
    stepByStep: [],
  });

  // ==========================================
  // 2. MATHEMATICAL SOLVER RE-EVALUATION
  // ==========================================

  /**
   * Runs the calculation on demand when the Play button is clicked.
   */
  const runSolver = () => {
    const res = deriveTransferFunction(nodes, edges);
    setSolverOutput(res);
  };

  // ==========================================
  // 3. CANVAS EVENT HANDLERS
  // ==========================================

  /**
   * Callback fired when connecting two handles on the React Flow canvas.
   */
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--sky-blue)' },
          },
          eds
        )
      ),
    [setEdges]
  );

  /**
   * Dynamically appends a new block node onto the active workspace canvas.
   * 
   * @param type - Target block type ('integrator' | 'summing' | 'gain')
   */
  const addBlock = (type: 'integrator' | 'summing' | 'gain') => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      // Slight random offset positioning to prevent overlapping existing blocks
      position: { x: 250 + Math.random() * 80, y: 150 + Math.random() * 40 },
      data: type === 'gain' ? { gain: gainValue, label: `K = ${gainValue}` } : {},
    };
    setNodes((nds) => nds.concat(newNode));
  };

  /**
   * Resets the canvas by removing all intermediate blocks while keeping u(t) and y(t) boundary nodes.
   */
  const clearCanvas = () => {
    setNodes((nds) => nds.filter((n) => n.id === 'u_in' || n.id === 'y_out'));
    setEdges([]);
  };

  // ==========================================
  // 4. WORKSPACE RENDER TREE
  // ==========================================

  return (
    <div className="home-container" style={{ padding: '24px' }}>
      
      {/* --- HEADER: Module Identifier --- */}
      <div className="status-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div className="status-header-title">
          <Activity size={20} style={{ color: 'var(--sky-blue)' }} />
          <span>Interactive System Canvas & Transfer Function Analysis</span>
        </div>
        <span className="version-badge">LTI Engine v1.0.2</span>
      </div>

      {/* --- MAIN GRID LAYOUT: Canvas + Control Panel --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        
        {/* LEFT COLUMN: React Flow Diagram & Solver Derivation Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Interactive Canvas Wrapper */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Toolbar Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label" style={{ margin: 0 }}>Block Canvas</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="secondary-btn" onClick={() => addBlock('integrator')}>
                  <Plus size={12} style={{ marginRight: '4px' }} /> Integrator (1/s)
                </button>
                <button className="secondary-btn" onClick={() => addBlock('gain')}>
                  <Plus size={12} style={{ marginRight: '4px' }} /> Gain Block
                </button>
                <button className="secondary-btn" onClick={() => addBlock('summing')}>
                  <Plus size={12} style={{ marginRight: '4px' }} /> Summing Node (Σ)
                </button>
                <button className="secondary-btn" onClick={clearCanvas} style={{ color: '#ef4444' }}>
                  <Trash2 size={12} style={{ marginRight: '4px' }} /> Clear Blocks
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
                // ! Prevents self-loop connection errors on the same block
                isValidConnection={(conn) => conn.source !== conn.target}
                fitView
              >
                <Background color="#334155" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          </div>

          {/* Card 2: Derived Transfer Function & Math Derivation Steps */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label" style={{ margin: 0 }}>State-Space & Transfer Function Derivation</span>
              
              {/* Play Button for Transfer Function Computation */}
              <button
                className="secondary-btn"
                onClick={runSolver}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'var(--sky-blue)',
                  color: 'var(--sky-blue)',
                }}
              >
                <Play size={12} fill="currentColor" /> Play
              </button>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Step-by-Step LaTeX Render List */}
              {solverOutput.stepByStep.map((step, idx) => (
                <div key={idx} className="metric-box" style={{ padding: '12px', textAlign: 'left' }}>
                  <MathView math={step} displayMode />
                </div>
              ))}

              {/* Final Derived Equation Box */}
              <div style={{ padding: '16px', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <span className="metric-label" style={{ color: 'var(--sky-blue)', fontWeight: 700 }}>DERIVED TRANSFER FUNCTION</span>
                <div style={{ marginTop: '8px' }}>
                  <MathView math={solverOutput.latexEquation} displayMode />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Parameters & Config Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <span className="section-label">Block Parameters</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label className="metric-label">Gain Parameter (K): {gainValue}</label>
                {/* Slider control for gain variable adjustments */}
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={gainValue}
                  onChange={(e) => setGainValue(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--sky-blue)' }}
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