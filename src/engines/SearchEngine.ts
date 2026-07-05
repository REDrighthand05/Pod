import { TreeNode, SearchResult } from "../types/node";

export class SearchEngine {
  private nodes: TreeNode[] = [];
  private index: Map<string, TreeNode[]> = new Map();

  buildIndex(nodes: TreeNode[]) {
    this.nodes = nodes;
    this.index.clear();
    const flat = this.flatten(nodes);
    flat.forEach(n => {
      const terms = this.tokenize(n.name + " " + n.desc + " " + n.id);
      terms.forEach(t => {
        if (!this.index.has(t)) this.index.set(t, []);
        const list = this.index.get(t)!;
        if (!list.find(x => x.id === n.id)) list.push(n);
      });
    });
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) return [];
    const terms = this.tokenize(query);
    const score = new Map<string, { node: TreeNode; score: number }>();

    const flat = this.flatten(this.nodes);
    flat.forEach(n => {
      let s = 0;
      terms.forEach(t => {
        if (n.name.includes(t)) s += 10;
        if (n.desc.includes(t)) s += 3;
        if (n.id.includes(t)) s += 5;
        if (n.name.toLowerCase().includes(t.toLowerCase())) s += 2;
      });
      if (s > 0) score.set(n.id, { node: n, score: s });
    });

    return Array.from(score.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ node }) => ({
        nodeId: node.id,
        name: node.name,
        path: node.id,
        matchField: "name" as const,
      }));
  }

  private flatten(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    nodes.forEach(n => { result.push(n); result.push(...this.flatten(n.children)); });
    return result;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().split(/[\s,，、_\-/]+/).filter(Boolean);
  }
}