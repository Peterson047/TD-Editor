export type NodeType =
  | "rect"
  | "rounded"
  | "circle"
  | "stadium"
  | "subroutine"
  | "cylinder"
  | "diamond"
  | "hexagon"
  | "parallelogram"
  | "trapezoid";

export interface GraphNode {
  id: string;
  type: NodeType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HandleSide = "top" | "bottom" | "left" | "right";

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  controlOffset?: { x: number; y: number };
  sourceSide?: HandleSide;
  targetSide?: HandleSide;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_DEFAULTS: Record<NodeType, { width: number; height: number }> = {
  rect: { width: 140, height: 50 },
  rounded: { width: 140, height: 50 },
  circle: { width: 80, height: 80 },
  stadium: { width: 160, height: 50 },
  subroutine: { width: 160, height: 50 },
  cylinder: { width: 140, height: 60 },
  diamond: { width: 80, height: 80 },
  hexagon: { width: 140, height: 60 },
  parallelogram: { width: 160, height: 50 },
  trapezoid: { width: 160, height: 50 },
};

const NODE_LABELS: Record<NodeType, string> = {
  rect: "Processo",
  rounded: "Início/Fim",
  circle: "Conector",
  stadium: "Terminal",
  subroutine: "Sub-rotina",
  cylinder: "Banco",
  diamond: "Decisão",
  hexagon: "Preparação",
  parallelogram: "Entrada/Saída",
  trapezoid: "Manual",
};

export function createNode(type: NodeType, x: number, y: number, text?: string): GraphNode {
  const defaults = NODE_DEFAULTS[type];
  return {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    text: text || NODE_LABELS[type],
    x,
    y,
    width: defaults.width,
    height: defaults.height,
  };
}

export function nodeToMermaid(node: GraphNode): string {
  const t = node.text.replace(/\n/g, "<br/>");
  switch (node.type) {
    case "rect":
      return `${node.id}["${t}"]`;
    case "rounded":
      return `${node.id}("${t}")`;
    case "circle":
      return `${node.id}(("${t}"))`;
    case "stadium":
      return `${node.id}(["${t}"])`;
    case "subroutine":
      return `${node.id}[["${t}"]]`;
    case "cylinder":
      return `${node.id}[("${t}")]`;
    case "diamond":
      return `${node.id}{"${t}"}`;
    case "hexagon":
      return `${node.id}{{"${t}"}}`;
    case "parallelogram":
      return `${node.id}[/${t}/]`;
    case "trapezoid":
      return `${node.id}[/${t}\\]`;
    default:
      return `${node.id}["${t}"]`;
  }
}

export function edgeToMermaid(edge: GraphEdge): string {
  if (edge.label) {
    return `${edge.from} -->|${edge.label}| ${edge.to}`;
  }
  return `${edge.from} --> ${edge.to}`;
}

export function graphToMermaid(state: GraphState): string {
  if (state.nodes.length === 0) return "graph TD\n  %% Clique na paleta para adicionar nós";

  const lines: string[] = ["graph TD"];

  for (const node of state.nodes) {
    lines.push(`  ${nodeToMermaid(node)}`);
  }

  if (state.edges.length > 0) {
    lines.push("");
    for (const edge of state.edges) {
      lines.push(`  ${edgeToMermaid(edge)}`);
    }
  }

  return lines.join("\n");
}

/** Get the absolute canvas position of a specific handle side */
export function getHandlePoint(node: GraphNode, side: HandleSide): { x: number; y: number } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  switch (side) {
    case "top":
      return { x: cx, y: node.y };
    case "bottom":
      return { x: cx, y: node.y + node.height };
    case "left":
      return { x: node.x, y: cy };
    case "right":
      return { x: node.x + node.width, y: cy };
  }
}

/** Calculate the anchor point on the node's border facing the target */
export function getAnchorPoint(node: GraphNode, targetX: number, targetY: number): { x: number; y: number } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;

  // If target is at the center, default to right edge
  if (dx === 0 && dy === 0) {
    return { x: node.x + node.width, y: cy };
  }

  const halfW = node.width / 2;
  const halfH = node.height / 2;

  // Ray from center toward target: (cx + t*dx, cy + t*dy)
  // Find t where the ray intersects the node's actual border shape
  let t: number;

  switch (node.type) {
    case "circle": {
      // Circle: (t*dx)^2 + (t*dy)^2 = r^2  =>  t = r / sqrt(dx^2 + dy^2)
      const r = halfW; // circle is square bounding box
      t = r / Math.sqrt(dx * dx + dy * dy);
      break;
    }

    case "diamond": {
      // Diamond (rhombus): |x|/halfW + |y|/halfH = 1
      // t*|dx|/halfW + t*|dy|/halfH = 1  =>  t = 1 / (|dx|/halfW + |dy|/halfH)
      const div = Math.abs(dx) / halfW + Math.abs(dy) / halfH;
      t = div > 0 ? 1 / div : 0;
      break;
    }

    case "hexagon": {
      // Hexagon clipPath: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)
      // Vertices relative to center:
      //   (-0.25w,-h), (0.25w,-h), (0.5w,0), (0.25w,h), (-0.25w,h), (-0.5w,0)
      // We intersect the ray with each of the 6 edges and take the closest intersection
      const verts = [
        { x: -0.25 * node.width, y: -halfH },
        { x: 0.25 * node.width, y: -halfH },
        { x: halfW, y: 0 },
        { x: 0.25 * node.width, y: halfH },
        { x: -0.25 * node.width, y: halfH },
        { x: -halfW, y: 0 },
      ];
      let bestT = Infinity;
      for (let i = 0; i < verts.length; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % verts.length];
        const edgeDx = v2.x - v1.x;
        const edgeDy = v2.y - v1.y;
        const denom = dx * edgeDy - dy * edgeDx;
        if (Math.abs(denom) < 1e-10) continue;
        const tEdge = (v1.x * edgeDy - v1.y * edgeDx) / denom;
        const s = (v1.x * dy - v1.y * dx) / denom;
        if (tEdge > 0 && s >= -1e-10 && s <= 1 + 1e-10) {
          bestT = Math.min(bestT, tEdge);
        }
      }
      t = bestT !== Infinity ? bestT : Math.min(halfW / (Math.abs(dx) || 1), halfH / (Math.abs(dy) || 1));
      break;
    }

    case "parallelogram": {
      // Parallelogram skewed -12deg: approximate with bounding box is fine
      // For better accuracy, we could transform the ray by inverse skew
      const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
      const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
      t = Math.min(tx, ty);
      break;
    }

    case "trapezoid": {
      // Trapezoid clipPath: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)
      // Top edge: y = -halfH, x from -0.35w to 0.35w
      // Bottom edge: y = halfH, x from -halfW to halfW
      // Right edge: from (0.35w,-halfH) to (halfW,halfH)
      // Left edge: from (-0.35w,-halfH) to (-halfW,halfH)
      const verts = [
        { x: -0.35 * node.width, y: -halfH },
        { x: 0.35 * node.width, y: -halfH },
        { x: halfW, y: halfH },
        { x: -halfW, y: halfH },
      ];
      let bestT = Infinity;
      for (let i = 0; i < verts.length; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % verts.length];
        const edgeDx = v2.x - v1.x;
        const edgeDy = v2.y - v1.y;
        const denom = dx * edgeDy - dy * edgeDx;
        if (Math.abs(denom) < 1e-10) continue;
        const tEdge = (v1.x * edgeDy - v1.y * edgeDx) / denom;
        const s = (v1.x * dy - v1.y * dx) / denom;
        if (tEdge > 0 && s >= -1e-10 && s <= 1 + 1e-10) {
          bestT = Math.min(bestT, tEdge);
        }
      }
      t = bestT !== Infinity ? bestT : Math.min(halfW / (Math.abs(dx) || 1), halfH / (Math.abs(dy) || 1));
      break;
    }

    default: {
      // Rectangle, rounded, stadium, subroutine, cylinder
      // Intersection with bounding box
      const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
      const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
      t = Math.min(tx, ty);
      break;
    }
  }

  return {
    x: cx + t * dx,
    y: cy + t * dy,
  };
}

export function mergeMermaidWithPositions(code: string, existing: GraphState): GraphState {
  const parsed = mermaidToGraph(code);
  const positionMap = new Map(existing.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));

  const mergedNodes = parsed.nodes.map((n) => {
    const pos = positionMap.get(n.id);
    if (pos) {
      return { ...n, x: pos.x, y: pos.y };
    }
    return n;
  });

  return { nodes: mergedNodes, edges: parsed.edges };
}

/** Simple top-down hierarchical auto-layout */
export function autoLayout(state: GraphState): GraphState {
  if (state.nodes.length === 0) return state;

  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  const nodeMap = new Map<string, GraphNode>();

  for (const n of state.nodes) {
    nodeMap.set(n.id, n);
    incoming.set(n.id, new Set());
    outgoing.set(n.id, new Set());
  }

  for (const e of state.edges) {
    outgoing.get(e.from)?.add(e.to);
    incoming.get(e.to)?.add(e.from);
  }

  // Compute levels (longest path from any root)
  const levels = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, inc] of incoming) {
    if (inc.size === 0) {
      levels.set(id, 0);
      queue.push(id);
    }
  }

  // If no roots found (cycle), pick first node as root
  if (queue.length === 0 && state.nodes.length > 0) {
    levels.set(state.nodes[0].id, 0);
    queue.push(state.nodes[0].id);
  }

  // BFS to assign levels
  let qi = 0;
  const processed = new Set<string>();
  while (qi < queue.length) {
    const id = queue[qi++];
    if (processed.has(id)) continue;
    processed.add(id);
    const lvl = levels.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      const current = levels.get(next);
      if (current === undefined || current < lvl + 1) {
        levels.set(next, lvl + 1);
        queue.push(next);
      }
    }
  }

  // Nodes without level (disconnected) get level 0
  for (const n of state.nodes) {
    if (!levels.has(n.id)) levels.set(n.id, 0);
  }

  // Group by level
  const levelGroups = new Map<number, GraphNode[]>();
  for (const n of state.nodes) {
    const lvl = levels.get(n.id) ?? 0;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl)!.push(n);
  }

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  const levelYGap = 100;
  const nodeXGap = 40;

  const positioned = new Map<string, GraphNode>();

  for (const lvl of sortedLevels) {
    const group = levelGroups.get(lvl)!;
    const totalWidth = group.reduce((sum, n) => sum + n.width, 0) + (group.length - 1) * nodeXGap;
    let startX = Math.max(20, 400 - totalWidth / 2);
    const y = 40 + lvl * levelYGap;

    for (const n of group) {
      positioned.set(n.id, { ...n, x: Math.round(startX), y: Math.round(y) });
      startX += n.width + nodeXGap;
    }
  }

  return {
    nodes: state.nodes.map((n) => positioned.get(n.id) ?? n),
    edges: state.edges,
  };
}

function stripQuotes(text: string): string {
  return text.replace(/^["']|["']$/g, "");
}

// Parse inline node definition from a string like A[Text], B{Text}, C((Text)), etc.
function parseInlineNode(str: string): { id: string; text: string; type: NodeType } | null {
  let m: RegExpMatchArray | null;

  // trapezoid: A[/Text\]
  m = str.match(/^(\w+)\[\/(.*?)\\\]$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "trapezoid" };

  // parallelogram: A[/Text/]
  m = str.match(/^(\w+)\[\/(.*?)\/\]$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "parallelogram" };

  // hexagon: A{{Text}}
  m = str.match(/^(\w+)\{\{(.*?)\}\}$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "hexagon" };

  // diamond: A{Text}
  m = str.match(/^(\w+)\{(.*?)\}$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "diamond" };

  // cylinder: A[(Text)]
  m = str.match(/^(\w+)\[\((.*?)\)\]$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "cylinder" };

  // subroutine: A[[Text]]
  m = str.match(/^(\w+)\[\[(.*?)\]\]$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "subroutine" };

  // stadium: A([Text])
  m = str.match(/^(\w+)\(\[(.*?)\]\)$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "stadium" };

  // circle: A((Text))
  m = str.match(/^(\w+)\(\((.*?)\)\)$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "circle" };

  // rounded: A(Text)
  m = str.match(/^(\w+)\((.*?)\)$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "rounded" };

  // rect: A[Text]
  m = str.match(/^(\w+)\[(.*?)\]$/);
  if (m) return { id: m[1], text: stripQuotes(m[2]), type: "rect" };

  // plain id: A
  m = str.match(/^(\w+)$/);
  if (m) return { id: m[1], text: m[1], type: "rect" };

  return null;
}

export function mermaidToGraph(code: string): GraphState {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  function addNode(rawId: string, text: string, type: NodeType) {
    if (nodeIds.has(rawId)) return;
    nodeIds.add(rawId);
    const idx = nodeIds.size;
    const node = createNode(type, 100 + idx * 40, 100 + idx * 30, text);
    node.id = rawId;
    nodes.push(node);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("graph ") || line.startsWith("flowchart ")) continue;

    // Edge with optional inline definitions and label: A[Text] -->|label| B{Text}
    const edgeMatch = line.match(/^(.+?)\s*-->(?:\s*\|([^|]*)\|\s*)?\s*(.+)$/);
    if (edgeMatch) {
      const left = edgeMatch[1].trim();
      const right = edgeMatch[3].trim();
      const label = edgeMatch[2]?.trim();

      const leftNode = parseInlineNode(left);
      const rightNode = parseInlineNode(right);

      if (leftNode && rightNode) {
        addNode(leftNode.id, leftNode.text, leftNode.type);
        addNode(rightNode.id, rightNode.text, rightNode.type);
        edges.push({ id: `e_${i}`, from: leftNode.id, to: rightNode.id, label });
      }
      continue;
    }

    // Standalone node definition
    const parsed = parseInlineNode(line);
    if (parsed) {
      addNode(parsed.id, parsed.text, parsed.type);
    }
  }

  return { nodes, edges };
}
