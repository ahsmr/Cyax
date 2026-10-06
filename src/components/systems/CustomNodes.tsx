import React from "react";
import { Handle, Position } from "@xyflow/react";
import { MathView } from "../common/MathView";

const nodeStyle: React.CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "90px",
  color: "var(--text-primary)",
};

const handleStyle: React.CSSProperties = {
  background: "var(--sky-blue)",
  width: 10,
  height: 10,
};

export const CustomInputNode: React.FC<{ data: { label?: string } }> = ({
  data,
}) => (
  <div style={nodeStyle}>
    <MathView math={data.label || "u(t)"} />
    <Handle
      type="source"
      position={Position.Right}
      id="out"
      style={handleStyle}
    />
  </div>
);

export const CustomOutputNode: React.FC<{ data: { label?: string } }> = ({
  data,
}) => (
  <div style={nodeStyle}>
    <Handle
      type="target"
      position={Position.Left}
      id="in"
      style={handleStyle}
    />
    <MathView math={data.label || "y(t)"} />
    <Handle
      type="source"
      position={Position.Bottom}
      id="out-feedback"
      style={{ ...handleStyle, background: "#38bdf8" }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="out"
      style={handleStyle}
    />
  </div>
);

export const IntegratorNode: React.FC = () => (
  <div style={nodeStyle}>
    <Handle
      type="target"
      position={Position.Left}
      id="in-left"
      style={handleStyle}
    />
    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
      Integrator
    </div>
    <MathView math="\int dt" />
    <Handle
      type="source"
      position={Position.Right}
      id="out-right"
      style={handleStyle}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="out-bottom"
      style={handleStyle}
    />
  </div>
);

export const SummingNode: React.FC = () => (
  <div
    style={{
      ...nodeStyle,
      borderRadius: "50%",
      width: 50,
      height: 50,
      minWidth: 50,
      padding: 0,
      position: "relative",
    }}
  >
    <Handle
      type="target"
      position={Position.Left}
      id="in-plus"
      style={handleStyle}
    />
    <Handle
      type="target"
      position={Position.Bottom}
      id="in-minus"
      style={{ ...handleStyle, background: "#ef4444" }}
    />
    <Handle
      type="target"
      position={Position.Top}
      id="in-top"
      style={handleStyle}
    />
    <MathView math="\Sigma" />
    <Handle
      type="source"
      position={Position.Right}
      id="out-right"
      style={handleStyle}
    />
  </div>
);

export const GainNode: React.FC<{
  data: { label?: string; gain?: number };
}> = ({ data }) => (
  <div style={nodeStyle}>
    <Handle
      type="target"
      position={Position.Left}
      id="in-left"
      style={handleStyle}
    />
    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Gain</div>
    <MathView math={data.label || `K = ${data.gain ?? 1}`} />
    <Handle
      type="source"
      position={Position.Right}
      id="out-right"
      style={handleStyle}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="out-bottom"
      style={handleStyle}
    />
  </div>
);
