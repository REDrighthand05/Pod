import { TreeNode, PositionedNode, NodeState } from "../types/node";
import { LayoutEngine } from "../engines/LayoutEngine";

export class NodeStore {
  private layoutEngine = new LayoutEngine();
  positioned: PositionedNode[] = [];
  raw: TreeNode = { id: "root", name: "根", icon: "", desc: "", category: "root", prerequisites: [], estHours: 0, resources: [], tags: [], children: [] };
  private states: Record<string, NodeState> = {};
  private parentMap: Record<string, string> = {};
  private flatMap: Record<string, TreeNode> = {};

  load(tree: TreeNode) {
    this.raw = tree;
    this.parentMap = {};
    this.flatMap = {};
    this.buildIndex(tree, "");
    this.positioned = this.layoutEngine.layout(tree);
  }

  private buildIndex(node: TreeNode, parentId: string) {
    this.flatMap[node.id] = node;
    if (parentId) this.parentMap[node.id] = parentId;
    if (node.children) {
      for (const child of node.children) {
        this.buildIndex(child, node.id);
      }
    }
  }

  getNode(id: string): PositionedNode | undefined {
    return this.positioned.find(n => n.id === id);
  }

  getTreeNode(id: string): TreeNode | undefined {
    return this.flatMap[id];
  }

  getChildren(id: string): PositionedNode[] {
    return this.positioned.filter(n => n.parentId === id);
  }

  getParent(id: string): PositionedNode | undefined {
    const pid = this.parentMap[id];
    return pid ? this.positioned.find(p => p.id === pid) : undefined;
  }

  getParentId(id: string): string | undefined {
    return this.parentMap[id];
  }

  /** 从 root 到该节点的路径（含自身） */
  getBreadcrumb(id: string): string[] {
    const parts: string[] = [];
    let cur: TreeNode | undefined = this.flatMap[id];
    while (cur && cur.id !== "root") {
      parts.unshift(cur.name);
      cur = cur.id ? this.flatMap[this.parentMap[cur.id]] : undefined;
    }
    return parts;
  }

  /** 所有祖先节点（不含自身） */
  getAncestors(id: string): TreeNode[] {
    const result: TreeNode[] = [];
    let pid = this.parentMap[id];
    while (pid) {
      const n = this.flatMap[pid];
      if (n) result.unshift(n);
      pid = this.parentMap[pid];
    }
    return result;
  }

  /** 所有后代节点 */
  getDescendants(id: string, includeSelf = false): TreeNode[] {
    const result: TreeNode[] = [];
    const walk = (node: TreeNode) => {
      if (includeSelf || node.id !== id) result.push(node);
      if (node.children) for (const ch of node.children) walk(ch);
    };
    const start = this.flatMap[id];
    if (start) walk(start);
    return includeSelf ? result : result.filter(n => n.id !== id);
  }

  /** 考虑折叠状态的可见节点 */
  getVisibleNodes(): PositionedNode[] {
    return this.positioned.filter(n => {
      if (!n.parentId || n.parentId === "root") return true;
      let pid = n.parentId;
      while (pid) {
        const p = this.positioned.find(x => x.id === pid);
        if (p && p.collapsed) return false;
        pid = p ? p.parentId : "";
      }
      return true;
    });
  }

  getState(id: string): NodeState {
    return this.states[id] || NodeState.Visible;
  }

  setState(id: string, state: NodeState) {
    this.states[id] = state;
    const n = this.getNode(id);
    if (n) n.state = state;
  }

  toggleCollapse(id: string) {
    const n = this.getNode(id);
    if (n) n.collapsed = !n.collapsed;
  }

  search(query: string): PositionedNode[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return this.positioned.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.desc.toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  /** 获取某个深度的所有节点 */
  getNodesAtDepth(depth: number): PositionedNode[] {
    return this.positioned.filter(n => n.depth === depth);
  }
}
