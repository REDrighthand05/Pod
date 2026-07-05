import { CameraState, ViewRect } from "../types/node";

export class Camera {
  state: CameraState = { x: 0, y: 0, zoom: 0.85 };
  private width = 0;
  private height = 0;

  setSize(w: number, h: number) { this.width = w; this.height = h; }

  setPosition(x: number, y: number) { this.state.x = x; this.state.y = y; }
  setZoom(z: number) { this.state.zoom = Math.max(0.2, Math.min(3, z)); }

  panBy(dx: number, dy: number) {
    this.state.x -= dx / this.state.zoom;
    this.state.y -= dy / this.state.zoom;
  }

  zoomAt(factor: number, cx: number, cy: number) {
    const world = this.screenToWorld(cx, cy);
    this.setZoom(this.state.zoom * factor);
    this.state.x = world.x - (cx - this.width / 2) / this.state.zoom;
    this.state.y = world.y - (cy - this.height / 2) / this.state.zoom;
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: (wx - this.state.x) * this.state.zoom + this.width / 2,
      y: (wy - this.state.y) * this.state.zoom + this.height / 2,
    };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.width / 2) / this.state.zoom + this.state.x,
      y: (sy - this.height / 2) / this.state.zoom + this.state.y,
    };
  }

  getVisibleRect(): ViewRect {
    const tl = this.screenToWorld(0, 0);
    const br = this.screenToWorld(this.width, this.height);
    const pad = 200 / this.state.zoom;
    return { x: tl.x - pad, y: tl.y - pad, w: br.x - tl.x + pad * 2, h: br.y - tl.y + pad * 2 };
  }

  fitToNodes(nodes: { x: number; y: number }[], padding = 100) {
    if (nodes.length === 0) return;
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const nodeW = maxX - minX + padding * 2, nodeH = maxY - minY + padding * 2;
    const zoomX = this.width / nodeW, zoomY = this.height / nodeH;
    this.state.zoom = Math.min(zoomX, zoomY, 1.5);
    this.state.x = (minX + maxX) / 2;
    this.state.y = (minY + maxY) / 2;
  }
}