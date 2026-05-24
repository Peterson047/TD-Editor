import {
  createNode,
  nodeToMermaid,
  mermaidToGraph,
  graphToMermaid,
  getAnchorPoint,
  autoLayout,
  mergeMermaidWithPositions,
  GraphState,
} from "@/lib/graph";

describe("createNode", () => {
  it("creates a node with default dimensions and label", () => {
    const node = createNode("rect", 10, 20);
    expect(node.type).toBe("rect");
    expect(node.x).toBe(10);
    expect(node.y).toBe(20);
    expect(node.width).toBe(140);
    expect(node.height).toBe(50);
    expect(node.text).toBe("Processo");
    expect(node.id).toMatch(/^n_\d+_/);
  });

  it("accepts custom text", () => {
    const node = createNode("diamond", 0, 0, "Custom");
    expect(node.text).toBe("Custom");
    expect(node.width).toBe(80);
    expect(node.height).toBe(80);
  });
});

describe("nodeToMermaid ↔ mermaidToGraph round-trip", () => {
  const cases: Array<{ type: Parameters<typeof createNode>[0]; expectedRegex: RegExp }> = [
    { type: "rect", expectedRegex: /^A\["Hello"\]$/ },
    { type: "rounded", expectedRegex: /^A\("Hello"\)$/ },
    { type: "circle", expectedRegex: /^A\(\("Hello"\)\)$/ },
    { type: "stadium", expectedRegex: /^A\(\["Hello"\]\)$/ },
    { type: "subroutine", expectedRegex: /^A\[\["Hello"\]\]$/ },
    { type: "cylinder", expectedRegex: /^A\[\("Hello"\)\]$/ },
    { type: "diamond", expectedRegex: /^A\{"Hello"\}$/ },
    { type: "hexagon", expectedRegex: /^A\{\{"Hello"\}\}$/ },
    { type: "parallelogram", expectedRegex: /^A\[\/Hello\/\]$/ },
    { type: "trapezoid", expectedRegex: /^A\[\/Hello\\\]$/ },
  ];

  cases.forEach(({ type, expectedRegex }) => {
    it(`round-trips ${type}`, () => {
      const node = createNode(type, 100, 200, "Hello");
      node.id = "A";
      const line = nodeToMermaid(node);
      expect(line).toMatch(expectedRegex);

      const parsed = mermaidToGraph(`graph TD\n  ${line}`);
      const found = parsed.nodes.find((n) => n.id === "A");
      expect(found).toBeDefined();
      expect(found!.text).toBe("Hello");
      expect(found!.type).toBe(type);
    });
  });
});

describe("graphToMermaid", () => {
  it("generates empty graph message when no nodes", () => {
    const result = graphToMermaid({ nodes: [], edges: [] });
    expect(result).toContain("%% Clique na paleta para adicionar nós");
  });

  it("generates nodes and edges", () => {
    const state: GraphState = {
      nodes: [
        { id: "A", type: "rect", text: "Start", x: 0, y: 0, width: 100, height: 50 },
        { id: "B", type: "diamond", text: "Ok?", x: 0, y: 0, width: 80, height: 80 },
      ],
      edges: [{ id: "e1", from: "A", to: "B", label: "yes" }],
    };
    const code = graphToMermaid(state);
    expect(code).toContain('A["Start"]');
    expect(code).toContain('B{"Ok?"}');
    expect(code).toContain("A -->|yes| B");
  });
});

describe("getAnchorPoint", () => {
  it("returns right edge when target is at center", () => {
    const node = createNode("rect", 0, 0, "A");
    node.id = "A";
    const pt = getAnchorPoint(node, node.x + node.width / 2, node.y + node.height / 2);
    expect(pt.x).toBe(node.x + node.width);
    expect(pt.y).toBe(node.y + node.height / 2);
  });

  it("returns top edge when target is directly above", () => {
    const node = createNode("rect", 100, 100, "A");
    const pt = getAnchorPoint(node, 170, 0); // directly above center
    expect(pt.y).toBeCloseTo(100, 0); // top edge
    expect(pt.x).toBeCloseTo(170, 0);
  });

  it("returns bottom edge when target is directly below", () => {
    const node = createNode("rect", 100, 100, "A");
    const pt = getAnchorPoint(node, 170, 300); // directly below center
    expect(pt.y).toBeCloseTo(150, 0); // bottom edge
  });

  it("returns left edge when target is directly to the left", () => {
    const node = createNode("rect", 100, 100, "A");
    const pt = getAnchorPoint(node, 0, 125); // directly left of center
    expect(pt.x).toBeCloseTo(100, 0); // left edge
  });

  it("returns right edge when target is directly to the right", () => {
    const node = createNode("rect", 100, 100, "A");
    const pt = getAnchorPoint(node, 300, 125); // directly right of center
    expect(pt.x).toBeCloseTo(240, 0); // right edge
  });
});

describe("autoLayout", () => {
  it("positions root nodes at level 0", () => {
    const state: GraphState = {
      nodes: [
        { id: "A", type: "rect", text: "A", x: 0, y: 0, width: 100, height: 50 },
        { id: "B", type: "rect", text: "B", x: 0, y: 0, width: 100, height: 50 },
      ],
      edges: [{ id: "e1", from: "A", to: "B" }],
    };
    const laid = autoLayout(state);
    const a = laid.nodes.find((n) => n.id === "A")!;
    const b = laid.nodes.find((n) => n.id === "B")!;
    expect(a.y).toBeLessThan(b.y);
  });

  it("handles disconnected nodes", () => {
    const state: GraphState = {
      nodes: [
        { id: "A", type: "rect", text: "A", x: 0, y: 0, width: 100, height: 50 },
        { id: "B", type: "rect", text: "B", x: 0, y: 0, width: 100, height: 50 },
      ],
      edges: [],
    };
    const laid = autoLayout(state);
    expect(laid.nodes.every((n) => n.y >= 0)).toBe(true);
  });

  it("handles cycles without crashing", () => {
    const state: GraphState = {
      nodes: [
        { id: "A", type: "rect", text: "A", x: 0, y: 0, width: 100, height: 50 },
        { id: "B", type: "rect", text: "B", x: 0, y: 0, width: 100, height: 50 },
      ],
      edges: [
        { id: "e1", from: "A", to: "B" },
        { id: "e2", from: "B", to: "A" },
      ],
    };
    const laid = autoLayout(state);
    expect(laid.nodes.length).toBe(2);
  });
});

describe("mergeMermaidWithPositions", () => {
  it("preserves existing positions for matching ids", () => {
    const existing: GraphState = {
      nodes: [{ id: "A", type: "rect", text: "A", x: 999, y: 888, width: 100, height: 50 }],
      edges: [],
    };
    const code = 'graph TD\n  A["B"]\n  C["D"]';
    const merged = mergeMermaidWithPositions(code, existing);
    const a = merged.nodes.find((n) => n.id === "A")!;
    const c = merged.nodes.find((n) => n.id === "C")!;
    expect(a.x).toBe(999);
    expect(a.y).toBe(888);
    expect(c.x).not.toBe(999); // new node gets default position
  });
});
