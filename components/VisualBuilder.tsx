"use client";

import { useState, useRef, useCallback } from "react";
import { GraphState, GraphNode, GraphEdge, NodeType, HandleSide, createNode, getAnchorPoint, getHandlePoint } from "@/lib/graph";
import NodePalette from "./NodePalette";

interface VisualBuilderProps {
  state: GraphState;
  onChange: (state: GraphState | ((prev: GraphState) => GraphState)) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  beginBatch: () => void;
  endBatch: () => void;
  commit: () => void;
}

type DragMode = "idle" | "drag-node" | "multi-drag" | "connect" | "select-box";

interface DragState {
  mode: DragMode;
  nodeId?: string;
  sourceSide?: HandleSide;
  offsetX?: number;
  offsetY?: number;
  mouseX?: number;
  mouseY?: number;
  startX?: number;
  startY?: number;
  initialPositions?: Map<string, { x: number; y: number }>;
}

const NODE_STYLES: Record<NodeType, React.CSSProperties> = {
  rect: { borderRadius: 4 },
  rounded: { borderRadius: 24 },
  circle: { borderRadius: "50%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" },
  stadium: { borderRadius: 24 },
  subroutine: { borderRadius: 4, borderStyle: "double", borderWidth: 3 },
  cylinder: { borderRadius: "8px 8px 16px 16px / 8px 8px 24px 24px" },
  diamond: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", borderRadius: 0 },
  hexagon: { borderRadius: 4, clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
  parallelogram: { borderRadius: 4, transform: "skewX(-12deg)" },
  trapezoid: { borderRadius: 4, clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)" },
};

function getNodeCenter(node: GraphNode): { x: number; y: number } {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function isNodeInBox(node: GraphNode, x1: number, y1: number, x2: number, y2: number): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
}

function findNodeAt(state: GraphState, x: number, y: number, excludeId?: string): GraphNode | undefined {
  return state.nodes.find(
    (n) =>
      n.id !== excludeId &&
      x >= n.x && x <= n.x + n.width &&
      y >= n.y && y <= n.y + n.height
  );
}

function getNearestSide(node: GraphNode, x: number, y: number): HandleSide {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  if (Math.abs(dx) * node.height > Math.abs(dy) * node.width) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "bottom" : "top";
}

function getEdgeGeometry(edge: GraphEdge, state: GraphState) {
  const from = state.nodes.find((n) => n.id === edge.from);
  const to = state.nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;

  const a1 = edge.sourceSide
    ? getHandlePoint(from, edge.sourceSide)
    : getAnchorPoint(from, to.x + to.width / 2, to.y + to.height / 2);
  const a2 = edge.targetSide
    ? getHandlePoint(to, edge.targetSide)
    : getAnchorPoint(to, from.x + from.width / 2, from.y + from.height / 2);

  const midX = (a1.x + a2.x) / 2 + (edge.controlOffset?.x || 0);
  const midY = (a1.y + a2.y) / 2 + (edge.controlOffset?.y || 0);
  return {
    a1, a2,
    control: { x: midX, y: midY },
    path: `M ${a1.x} ${a1.y} Q ${midX} ${midY}, ${a2.x} ${a2.y}`,
  };
}

export default function VisualBuilder({
  state,
  onChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  beginBatch,
  endBatch,
  commit,
}: VisualBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState>({ mode: "idle" });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const updateState = useCallback(
    (updater: (prev: GraphState) => GraphState) => {
      onChange(updater);
    },
    [onChange]
  );

  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
  }, []);

  const toggleNodeSelection = useCallback((id: string, multi: boolean) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
    setSelectedEdgeIds(new Set());
  }, []);

  const handleAddNode = useCallback(
    (type: NodeType) => {
      updateState((prev) => {
        const x = 100 + prev.nodes.length * 30;
        const y = 100 + prev.nodes.length * 20;
        const node = createNode(type, x, y);
        return { ...prev, nodes: [...prev.nodes, node] };
      });
      clearSelection();
    },
    [updateState, clearSelection]
  );

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const { x, y } = getCanvasPoint(e);
      e.preventDefault();
      clearSelection();
      setDrag({
        mode: "select-box",
        startX: x,
        startY: y,
        mouseX: x,
        mouseY: y,
      });
    },
    [getCanvasPoint, clearSelection]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const { x, y } = getCanvasPoint(e);
      const isHandle = (e.target as HTMLElement).dataset.handle === "true";

      if (isHandle) {
        const side = ((e.target as HTMLElement).dataset.side as HandleSide) || "right";
        beginBatch();
        setDrag({ mode: "connect", nodeId, sourceSide: side, mouseX: x, mouseY: y });
        return;
      }

      const multi = e.shiftKey || e.ctrlKey || e.metaKey;
      toggleNodeSelection(nodeId, multi);
      const isSelected = selectedNodeIds.has(nodeId);
      const idsToDrag = isSelected && selectedNodeIds.size > 1 ? Array.from(selectedNodeIds) : [nodeId];
      const initialPositions = new Map<string, { x: number; y: number }>();
      for (const id of idsToDrag) {
        const n = state.nodes.find((nn) => nn.id === id);
        if (n) initialPositions.set(id, { x: n.x, y: n.y });
      }
      beginBatch();
      setDrag({
        mode: idsToDrag.length > 1 ? "multi-drag" : "drag-node",
        nodeId,
        offsetX: x,
        offsetY: y,
        initialPositions,
      });
    },
    [getCanvasPoint, selectedNodeIds, state.nodes, toggleNodeSelection, beginBatch]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasPoint(e);
      if (drag.mode === "drag-node" && drag.nodeId) {
        const node = state.nodes.find((n) => n.id === drag.nodeId);
        if (!node || drag.offsetX == null || drag.offsetY == null) return;
        const init = drag.initialPositions?.get(node.id);
        const nx = Math.max(0, x - drag.offsetX + (init?.x ?? node.x));
        const ny = Math.max(0, y - drag.offsetY + (init?.y ?? node.y));
        updateState((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === drag.nodeId ? { ...n, x: nx, y: ny } : n)),
        }));
      } else if (drag.mode === "multi-drag" && drag.initialPositions) {
        const dx = x - (drag.offsetX || 0);
        const dy = y - (drag.offsetY || 0);
        updateState((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => {
            const init = drag.initialPositions?.get(n.id);
            if (!init) return n;
            return { ...n, x: Math.max(0, init.x + dx), y: Math.max(0, init.y + dy) };
          }),
        }));
      } else if (drag.mode === "connect" && drag.nodeId) {
        setDrag((prev) => ({ ...prev, mouseX: x, mouseY: y }));
      } else if (drag.mode === "select-box") {
        setDrag((prev) => ({ ...prev, mouseX: x, mouseY: y }));
      }
    },
    [drag, state, getCanvasPoint, updateState]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasPoint(e);
      if (drag.mode === "connect" && drag.nodeId) {
        const target = findNodeAt(state, x, y, drag.nodeId);
        if (target) {
          const exists = state.edges.some((ed) => ed.from === drag.nodeId && ed.to === target.id);
          if (!exists) {
            const targetSide = getNearestSide(target, x, y);
            updateState((prev) => ({
              ...prev,
              edges: [...prev.edges, {
                id: `e_${Date.now()}`,
                from: drag.nodeId!,
                to: target.id,
                sourceSide: drag.sourceSide,
                targetSide,
              }],
            }));
          }
        }
        endBatch();
        commit();
      } else if (drag.mode === "select-box" && drag.startX != null && drag.startY != null) {
        const ids = new Set<string>();
        for (const node of state.nodes) {
          if (isNodeInBox(node, drag.startX, drag.startY, x, y)) ids.add(node.id);
        }
        if (ids.size > 0) setSelectedNodeIds(ids);
      } else if (drag.mode === "drag-node" || drag.mode === "multi-drag") {
        endBatch();
        commit();
      }
      setDrag({ mode: "idle" });
    },
    [drag, state, getCanvasPoint, updateState, endBatch, commit]
  );

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      const multi = e.shiftKey || e.ctrlKey || e.metaKey;
      setSelectedEdgeIds((prev) => {
        const next = new Set(prev);
        if (multi) {
          if (next.has(edgeId)) next.delete(edgeId);
          else next.add(edgeId);
        } else {
          next.clear();
          next.add(edgeId);
        }
        return next;
      });
      if (!multi) setSelectedNodeIds(new Set());
    },
    []
  );

  const handleDoubleClick = useCallback((nodeId: string) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (node) {
      setEditingText(node.text);
      setEditingNodeId(nodeId);
      setSelectedNodeIds(new Set([nodeId]));
    }
  }, [state.nodes]);

  const finishEdit = useCallback(() => {
    if (editingNodeId) {
      updateState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === editingNodeId ? { ...n, text: editingText || n.text } : n)),
      }));
      setEditingNodeId(null);
      setEditingText("");
    }
  }, [editingNodeId, editingText, updateState]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && drag.mode === "idle") {
        if (selectedNodeIds.size > 0 || selectedEdgeIds.size > 0) {
          e.preventDefault();
          updateState((prev) => ({
            ...prev,
            nodes: prev.nodes.filter((n) => !selectedNodeIds.has(n.id)),
            edges: prev.edges.filter(
              (ed) => !selectedEdgeIds.has(ed.id) && !selectedNodeIds.has(ed.from) && !selectedNodeIds.has(ed.to)
            ),
          }));
          clearSelection();
        }
      }
      if (e.key === "Enter" && editingNodeId) finishEdit();
      if (e.key === "Escape") {
        if (editingNodeId) {
          setEditingNodeId(null);
          setEditingText("");
        } else {
          clearSelection();
        }
      }
    },
    [drag, selectedNodeIds, selectedEdgeIds, updateState, clearSelection, editingNodeId, finishEdit, onUndo, onRedo, canUndo, canRedo]
  );

  const selectionBox =
    drag.mode === "select-box" && drag.startX != null && drag.startY != null && drag.mouseX != null && drag.mouseY != null
      ? {
          x: Math.min(drag.startX, drag.mouseX),
          y: Math.min(drag.startY, drag.mouseY),
          w: Math.abs(drag.mouseX - drag.startX),
          h: Math.abs(drag.mouseY - drag.startY),
        }
      : null;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-primary)" }}>
      <NodePalette onAdd={handleAddNode} />
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          cursor: drag.mode === "select-box" ? "crosshair" : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (drag.mode !== "idle") {
            endBatch();
            setDrag({ mode: "idle" });
          }
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* SVG — lines, labels, temp lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: "none" }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" style={{ fill: "var(--text-muted)" }} />
            </marker>
            <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" style={{ fill: "var(--accent)" }} />
            </marker>
          </defs>

          {state.edges.map((edge) => {
            const geo = getEdgeGeometry(edge, state);
            if (!geo) return null;
            const isSelected = selectedEdgeIds.has(edge.id);
            const isHovered = hoveredEdge === edge.id;

            return (
              <g key={edge.id}>
                <path
                  d={geo.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={22}
                  style={{ cursor: "pointer", pointerEvents: "stroke" }}
                  onMouseEnter={() => setHoveredEdge(edge.id)}
                  onMouseLeave={() => setHoveredEdge((prev) => (prev === edge.id ? null : prev))}
                  onClick={(e) => handleEdgeClick(e as unknown as React.MouseEvent, edge.id)}
                />
                <path
                  d={geo.path}
                  fill="none"
                  stroke={isSelected || isHovered ? "var(--accent)" : "var(--text-muted)"}
                  strokeWidth={isSelected || isHovered ? 2.5 : 2}
                  markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                  opacity={isHovered && !isSelected ? 0.85 : 0.6}
                  style={{ pointerEvents: "none" }}
                />
                {edge.label && (
                  <text
                    x={geo.control.x}
                    y={geo.control.y - 14}
                    textAnchor="middle"
                    fill={isSelected ? "var(--accent)" : "var(--text-secondary)"}
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                    fontWeight={500}
                    style={{ pointerEvents: "none" }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {drag.mode === "connect" && drag.nodeId && drag.mouseX != null && drag.mouseY != null && (
            (() => {
              const from = state.nodes.find((n) => n.id === drag.nodeId);
              if (!from) return null;
              const origin = drag.sourceSide
                ? getHandlePoint(from, drag.sourceSide)
                : getNodeCenter(from);
              return (
                <path
                  d={`M ${origin.x} ${origin.y} L ${drag.mouseX} ${drag.mouseY}`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="6,4"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: "none" }}
                />
              );
            })()
          )}
        </svg>

        {/* Selection box */}
        {selectionBox && (
          <div
            className="absolute border border-dashed rounded-sm"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.w,
              height: selectionBox.h,
              borderColor: "var(--accent)",
              backgroundColor: "var(--accent)",
              opacity: 0.1,
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
        )}

        {/* Nodes */}
        {state.nodes.map((node) => {
          const isSelected = selectedNodeIds.has(node.id);
          const isHovered = hoveredNode === node.id;
          const isEditing = editingNodeId === node.id;
          const isDiamond = node.type === "diamond";

          const nodeBg = isSelected ? "var(--accent)" : isHovered ? "var(--bg-tertiary)" : "var(--bg-secondary)";
          const nodeBorder = `2px solid ${isSelected ? "var(--accent-hover)" : isHovered ? "var(--accent)" : "var(--border)"}`;
          const nodeShadow = isSelected
            ? "0 0 0 3px rgba(59,130,246,0.2), 0 4px 12px rgba(0,0,0,0.15)"
            : isHovered
            ? "0 4px 12px rgba(0,0,0,0.15)"
            : "0 1px 3px rgba(0,0,0,0.08)";

          return (
            <div
              key={node.id}
              className="absolute flex items-center justify-center"
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                zIndex: isHovered || isSelected ? 20 : 10,
                cursor: drag.mode === "idle" ? "grab" : "default",
                ...(!isDiamond ? NODE_STYLES[node.type] : {}),
                backgroundColor: isDiamond ? "transparent" : nodeBg,
                border: isDiamond ? "none" : nodeBorder,
                boxShadow: isDiamond ? "none" : nodeShadow,
                transition: "box-shadow 0.15s, border-color 0.15s, background-color 0.15s",
              }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).tagName === "INPUT") return;
                handleNodeMouseDown(e, node.id);
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode((prev) => (prev === node.id ? null : prev))}
              onDoubleClick={() => handleDoubleClick(node.id)}
            >
              {/* Diamond visual shape — rendered inside the container so handles/text are not clipped */}
              {isDiamond && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "50%",
                    left: "50%",
                    width: "70%",
                    height: "70%",
                    transform: "translate(-50%, -50%) rotate(45deg)",
                    backgroundColor: nodeBg,
                    border: nodeBorder,
                    boxShadow: nodeShadow,
                  }}
                />
              )}

              {isEditing ? (
                <input
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={finishEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEdit();
                    if (e.key === "Escape") {
                      setEditingNodeId(null);
                      setEditingText("");
                    }
                  }}
                  className="w-full text-center text-xs outline-none bg-transparent px-1 relative z-10"
                  style={{ color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}
                />
              ) : (
                <span
                  className="text-xs font-medium text-center px-2 select-none pointer-events-none relative z-10"
                  style={{
                    color: isSelected ? "#ffffff" : "var(--text-primary)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {node.text}
                </span>
              )}

              {!isEditing && (
                <>
                  {["top", "bottom", "left", "right"].map((pos) => (
                    <div
                      key={pos}
                      data-handle="true"
                      data-side={pos}
                      className="absolute w-2.5 h-2.5 rounded-full border cursor-crosshair z-20"
                      style={{
                        backgroundColor: "var(--accent)",
                        borderColor: "rgba(255,255,255,0.5)",
                        opacity: isHovered || isSelected ? 1 : 0,
                        transition: "opacity 0.15s",
                        ...(pos === "top" && { top: -5, left: "50%", transform: "translateX(-50%)" }),
                        ...(pos === "bottom" && { bottom: -5, left: "50%", transform: "translateX(-50%)" }),
                        ...(pos === "left" && { left: -5, top: "50%", transform: "translateY(-50%)" }),
                        ...(pos === "right" && { right: -5, top: "50%", transform: "translateY(-50%)" }),
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleNodeMouseDown(e, node.id);
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })};

        {/* Canvas overlay for box selection */}
        <div className="absolute inset-0" style={{ zIndex: 0 }} onMouseDown={handleCanvasMouseDown} />

        {/* Empty state */}
        {state.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
            <div className="text-center" style={{ color: "var(--text-muted)" }}>
              <div className="text-4xl mb-3 opacity-30">⊞</div>
              <p className="text-sm font-medium">Canvas vazio</p>
              <p className="text-xs mt-1">Clique em um tipo acima para adicionar um nó</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div
          className="absolute bottom-3 right-3 text-[10px] px-2 py-1 rounded-md pointer-events-none"
          style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", zIndex: 40 }}
        >
          Shift+Click multi · Ctrl+Z undo · Delete remove · Click na linha seleciona
        </div>
      </div>
    </div>
  );
}
