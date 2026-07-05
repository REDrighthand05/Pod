import { PositionedNode, CameraState, ThemeColors } from "../types/node";

export class LinkRenderer {
  drawLinks(ctx: CanvasRenderingContext2D, nodes: PositionedNode[], camera: CameraState, cw: number, ch: number, theme: ThemeColors, hoveredId: string | null) {
    nodes.forEach(n => {
      if (!n.parentId) return;
      const parent = nodes.find(p => p.id === n.parentId);
      if (!parent) return;
      const from = this.w2s(parent.x, parent.y, camera, cw, ch);
      const to = this.w2s(n.x, n.y, camera, cw, ch);
      const cpy = (from.y + to.y) / 2;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(from.x, cpy, to.x, cpy, to.x, to.y);

      const highlight = hoveredId && (n.id === hoveredId || parent.id === hoveredId);
      ctx.strokeStyle = highlight ? theme.accent : theme.linkColor;
      ctx.lineWidth = highlight ? 2 : 1.2;
      ctx.stroke();
    });
  }

  private w2s(wx: number, wy: number, cam: CameraState, cw: number, ch: number) {
    return {
      x: (wx - cam.x) * cam.zoom + cw / 2,
      y: (wy - cam.y) * cam.zoom + ch / 2,
    };
  }
}