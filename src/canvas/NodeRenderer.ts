import { PositionedNode, NodeState, CameraState, ThemeColors } from "../types/node";

export class NodeRenderer {
  private pulsePhase = 0;

  updatePulse() {
    this.pulsePhase = Date.now() / 400;
  }

  drawNode(ctx: CanvasRenderingContext2D, node: PositionedNode, camera: CameraState, theme: ThemeColors, hovered: boolean = false) {
    const w = 120, h = 28, r = 6;
    const x = node.x, y = node.y + (node._floatOffset || 0);

    // State-based style
    const style = this.getNodeStyle(node, theme);
    const enterScale = node._enterScale !== undefined ? node._enterScale : 1;
    const finalScale = enterScale * (style.scaleBoost || 1);

    ctx.save();

    // Pulse glow (learning)
    if (style.glow && !style.scaleBoost) {
      const pulse = 0.4 + 0.6 * Math.sin(this.pulsePhase);
      ctx.shadowBlur = 6 + pulse * 8;
      ctx.shadowColor = style.glow.replace(")", "," + (0.2 + pulse * 0.25).toFixed(2) + ")");
    }

    // Focused glow
    if (style.scaleBoost) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = "rgba(167,139,250,0.35)";
    }

    // Transform
    ctx.translate(x, y);
    ctx.scale(finalScale, finalScale);
    ctx.translate(-x, -y);

    // Background
    this.roundRect(ctx, x - w / 2, y - h / 2, w, h, r);
    ctx.fillStyle = style.fill;
    ctx.fill();
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hover highlight
    if (hovered) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(148,163,184,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    // Text (no transform offset)
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(finalScale, finalScale);
    ctx.translate(-x, -y);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '12px "Inter","PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = style.text;
    ctx.fillText((node.icon || "●") + " " + node.name, x, y + 1);

    ctx.restore();
  }

  getNodeStyle(node: PositionedNode, theme: ThemeColors): {
    fill: string; stroke: string; text: string; glow: string; scaleBoost: number;
  } {
    switch (node.state) {
      case NodeState.Focused:
        return { fill: "rgba(46,16,101,0.55)", stroke: "rgba(167,139,250,0.35)", text: "#e2e8f0", glow: "#a78bfa", scaleBoost: 1.06 };
      case NodeState.Mastered:
        return { fill: "rgba(6,78,59,0.45)", stroke: "rgba(52,211,153,0.3)", text: "#6ee7b7", glow: "", scaleBoost: 1 };
      case NodeState.Learning:
        return { fill: "rgba(30,58,95,0.5)", stroke: "rgba(96,165,250,0.3)", text: "#bfdbfe", glow: "#60a5fa", scaleBoost: 1 };
      case NodeState.Recommended:
        return { fill: "rgba(28,25,23,0.45)", stroke: "rgba(251,191,36,0.3)", text: "#fde68a", glow: "#fbbf24", scaleBoost: 1 };
      case NodeState.Locked:
        return { fill: "rgba(15,23,42,0.35)", stroke: "#1e293b", text: "#475569", glow: "", scaleBoost: 1 };
      default:
        return { fill: "rgba(15,23,42,0.5)", stroke: "#334155", text: "#64748b", glow: "", scaleBoost: 1 };
    }
  }

  hitTest(node: PositionedNode, mx: number, my: number, camera: CameraState, cw: number, ch: number): boolean {
    const hw = 60, hh = 14;
    const floatY = node.y + (node._floatOffset || 0);
    const s = this.worldToScreen(node.x, floatY, camera, cw, ch);
    return mx >= s.x - hw && mx <= s.x + hw &&
           my >= s.y - hh && my <= s.y + hh;
  }

  worldToScreen(wx: number, wy: number, cam: CameraState, cw: number, ch: number) {
    return {
      x: (wx - cam.x) * cam.zoom + cw / 2,
      y: (wy - cam.y) * cam.zoom + ch / 2,
    };
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
