import { PositionedNode, TreeNode, NodeState } from "../types/node";

export class LayoutEngine {
  layout(root: TreeNode): PositionedNode[] {
    const flat: PositionedNode[] = [];
    const levelNodes: Record<number, PositionedNode[]> = {};
    this.flatten(root, null, 0, 0, flat, levelNodes);
    this.applySugiyama(flat, levelNodes);
    console.log('LAYOUT DEBUG:', JSON.stringify(flat.slice(0, 3).map(function(n) { return {id: n.id, x: n.x, y: n.y, pid: n.parentId}; })));
    console.log('LAYOUT RANGE:', {minX: Math.min.apply(null, flat.map(function(n){return n.x;})), maxX: Math.max.apply(null, flat.map(function(n){return n.x;})), minY: Math.min.apply(null, flat.map(function(n){return n.y;})), maxY: Math.max.apply(null, flat.map(function(n){return n.y;}))});
    return flat;
  }

  private flatten(
    node: TreeNode, parentId: string | null, depth: number, index: number,
    flat: PositionedNode[], levelNodes: Record<number, PositionedNode[]>
  ) {
    const pn: PositionedNode = {
      id: node.id,
      name: node.name,
      icon: node.icon || "",
      desc: node.desc || "",
      prerequisites: node.prerequisites || [],
      estHours: node.estHours || 0,
      resources: node.resources || [],
      tags: node.tags || [],
      children: node.children || [],
      parentId: parentId || node.parentId || "",
      depth,
      index,
      x: 0, y: 0, width: 120, height: 28,
      state: NodeState.Visible,
      collapsed: false,
      // Pod runtime fields
      _floatOffset: 0, _enterX: 0, _enterY: 0,
      _floatPhase: Math.random() * Math.PI * 2,
      _enterScale: 1, _selectedTime: 0, _floatPeriod: 1,
      parentIds: parentId ? [parentId] : [],
      category: node.category || node.id,
      label: node.name,
    };
    flat.push(pn);
    if (!levelNodes[depth]) levelNodes[depth] = [];
    levelNodes[depth].push(pn);
    if (node.children) {
      node.children.forEach((child, i) => this.flatten(child, node.id, depth + 1, i, flat, levelNodes));
    }
  }

  private applySugiyama(flat: PositionedNode[], levelNodes: Record<number, PositionedNode[]>) {
    const maxWidth = 960;
    const levelGap = 100;
    const nodeW = 120, nodeGap = 36;

    const depths = Object.keys(levelNodes).map(Number).sort((a, b) => a - b);
    for (const d of depths) {
      const nodes = levelNodes[d];
      const totalW = nodes.length * nodeW + (nodes.length - 1) * nodeGap;
      const startX = (maxWidth - totalW) / 2 + 60;
      nodes.forEach((n, i) => {
        n.x = startX + i * (nodeW + nodeGap) + nodeW / 2;
        n.y = d * levelGap + 80;
      });
    }
  }
}
