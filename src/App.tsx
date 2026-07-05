import React, { useReducer, useRef, useEffect, useCallback } from "react";
import { AppContext, appReducer, defaultState } from "./stores/AppStore";
import { NodeStore } from "./stores/NodeStore";
import { Camera } from "./canvas/Camera";
import { NodeRenderer } from "./canvas/NodeRenderer";
import { ThemeEngine } from "./engines/ThemeEngine";
import { SearchEngine } from "./engines/SearchEngine";
import { StatusBar } from "./components/StatusBar";
import { BottomBar } from "./components/BottomBar";
import { NodeState, PositionedNode } from "./types/node";
import techTreeData from "./data/techTree.full.json";
import "./styles/glass.css";

// ---- Particle System (from pod_temp) ----
interface Particle {
  x: number; y: number; size: number; alpha: number;
  layer: "far" | "mid" | "near";
  vx?: number; vy?: number;
  progress?: number; speed?: number; endX?: number; endY?: number;
}

function createParticles(cw: number, ch: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * (cw + 200) - 100,
      y: Math.random() * (ch + 200) - 100,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.5,
      layer: "far",
    });
  }
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: Math.random() * (cw + 200) - 100,
      y: Math.random() * (ch + 200) - 100,
      size: 1.5 + Math.random() * 2,
      alpha: 0.15 + Math.random() * 0.3,
      layer: "mid",
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
    });
  }
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: Math.random() * (cw + 200) - 100,
      y: Math.random() * (ch + 200) - 100,
      size: 1.5 + Math.random() * 1,
      alpha: 0.2 + Math.random() * 0.4,
      layer: "near",
      progress: Math.random(),
      speed: 0.08 + Math.random() * 0.15,
      endX: 0, endY: 0,
    });
  }
  return particles;
}

function updateParticles(particles: Particle[], dt: number, cw: number, ch: number) {
  for (const p of particles) {
    if (p.layer === "near") {
      p.progress! += p.speed! * dt;
      if (p.progress! > 1) {
        p.progress = 0;
        p.x = Math.random() * (cw + 200) - 100;
        p.y = Math.random() * (ch + 200) - 100;
        p.endX = p.x + (Math.random() - 0.5) * 400;
        p.endY = p.y + (Math.random() - 0.5) * 400;
      }
    } else if (p.vx !== undefined) {
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (p.x < -80) p.x = cw + 80;
      if (p.x > cw + 80) p.x = -80;
      if (p.y < -80) p.y = ch + 80;
      if (p.y > ch + 80) p.y = -80;
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  // Far
  ctx.save();
  for (const p of particles) {
    if (p.layer !== "far") continue;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Mid
  ctx.save();
  for (const p of particles) {
    if (p.layer !== "mid") continue;
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(147,197,253,0.25)";
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Near
  ctx.save();
  for (const p of particles) {
    if (p.layer !== "near") continue;
    const cx = p.x + (p.endX! - p.x) * p.progress!;
    const cy = p.y + (p.endY! - p.y) * p.progress!;
    const streamAlpha = 0.3 + 0.5 * Math.sin(p.progress! * Math.PI);
    let dx = p.endX! - p.x;
    let dy = p.endY! - p.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }
    const trail = 20;

    ctx.globalAlpha = streamAlpha;
    ctx.strokeStyle = "rgba(96,165,250,0.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - dx * trail, cy - dy * trail);
    ctx.stroke();

    ctx.fillStyle = "rgba(147,197,253,0.85)";
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- Flow dots (from pod_temp) ----
interface FlowDot {
  fromId: string; toId: string;
  progress: number; speed: number;
}

function createFlowDots(nodes: PositionedNode[]): FlowDot[] {
  const dots: FlowDot[] = [];
  for (const node of nodes) {
    if (!node.parentId) continue;
    for (let j = 0; j < 2; j++) {
      dots.push({
        fromId: node.parentId,
        toId: node.id,
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.4,
      });
    }
  }
  return dots;
}

function updateFlowDots(dots: FlowDot[], dt: number) {
  const seconds = dt / 1000;
  for (const dot of dots) {
    dot.progress += dot.speed * seconds;
    if (dot.progress > 1) dot.progress %= 1;
  }
}

function drawFlowDots(ctx: CanvasRenderingContext2D, dots: FlowDot[], nodeMap: Record<string, PositionedNode>, camera: Camera, cw: number, ch: number) {
  ctx.save();
  for (const dot of dots) {
    const from = nodeMap[dot.fromId];
    const to = nodeMap[dot.toId];
    if (!from || !to) continue;

    const fx = from._enterX ?? from.x;
    const fy = (from._enterY ?? from.y) + (from._floatOffset || 0);
    const tx = to._enterX ?? to.x;
    const ty = (to._enterY ?? to.y) + (to._floatOffset || 0);

    const px = fx + (tx - fx) * dot.progress;
    const py = fy + (ty - fy) * dot.progress;

    const s = camera.worldToScreen(px, py);
    const color = "#60a5fa";

    // Trail
    for (let t = 1; t <= 4; t++) {
      const tp = ((dot.progress - t * 0.04) % 1 + 1) % 1;
      const tpx = fx + (tx - fx) * tp;
      const tpy = fy + (ty - fy) * tp;
      const ts = camera.worldToScreen(tpx, tpy);
      const alpha = (1 - t / 5) * 0.7;
      const radius = Math.max(2 - t * 0.3, 0.5);

      ctx.beginPath();
      ctx.arc(ts.x, ts.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(96,165,250,0.2)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(147,197,253,0.85)";
    ctx.fill();
  }
  ctx.restore();
}

// ---- Bezier helper ----
function bezierPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, t: number) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

// ---- Grid drawing ----
function drawGrid(ctx: CanvasRenderingContext2D, camera: Camera, cw: number, ch: number) {
  const spacing = 40;
  const zoom = camera.state.zoom;
  const cx = camera.state.x, cy = camera.state.y;

  const leftWorld = -cw / 2 / zoom + cx;
  const rightWorld = cw / 2 / zoom + cx;
  const topWorld = -ch / 2 / zoom + cy;
  const bottomWorld = ch / 2 / zoom + cy;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 0.5;

  const firstCol = Math.floor(leftWorld / spacing);
  const lastCol = Math.ceil(rightWorld / spacing);
  for (let n = firstCol; n <= lastCol; n++) {
    const sx = (n * spacing - cx) * zoom + cw / 2;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, ch);
    ctx.stroke();
  }

  const firstRow = Math.floor(topWorld / spacing);
  const lastRow = Math.ceil(bottomWorld / spacing);
  for (let m = firstRow; m <= lastRow; m++) {
    const sy = (m * spacing - cy) * zoom + ch / 2;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(cw, sy);
    ctx.stroke();
  }
  ctx.restore();
}

// ================================================================
//  Main App Component
// ================================================================

const nodeStore = new NodeStore();
const camera = new Camera();
const nodeRenderer = new NodeRenderer();
const themeEngine = new ThemeEngine();

export default function App() {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const camStart = useRef({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [searchResults, setSearchResults] = React.useState<{ nodeId: string; name: string }[]>([]);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<PositionedNode | null>(null);
  const [queueOpen, setQueueOpen] = React.useState(false);
  const [queueItems, setQueueItems] = React.useState<PositionedNode[]>([]);
  const [zoomLevel, setZoomLevel] = React.useState(85);
  const [nodeCount, setNodeCount] = React.useState(0);
  const [unlockCount, setUnlockCount] = React.useState(0);

  const particlesRef = useRef<Particle[]>([]);
  const flowDotsRef = useRef<FlowDot[]>([]);
  const flowPhaseRef = useRef(0);
  const pulsePhaseRef = useRef(0);
  const lastTimeRef = useRef(0);
  const hoveredNodeRef = useRef<string | null>(null);

  // Init
  useEffect(() => {
    nodeStore.load(techTreeData as any);
    console.log('NODES_DEBUG:', JSON.stringify(nodeStore.positioned.slice(0, 10).map(function(n) { return {id: n.id, pid: n.parentId, d: n.depth}; })));
    console.log('CONNECTED_COUNT:', nodeStore.positioned.filter(function(n) { return n.parentId && n.parentId.length > 0; }).length, 'out of', nodeStore.positioned.length);

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      camera.setSize(rect.width, rect.height);
      if (nodeStore.positioned.length > 0) {
        camera.fitToNodes(nodeStore.positioned, 120);
      }
    };
    resize();

    // Init particles
    particlesRef.current = createParticles(canvas.width, canvas.height);
    flowDotsRef.current = createFlowDots(nodeStore.positioned);

    // Mark demo states
    const demoMastered = ["math-discrete", "hw-digital", "sw-ds", "sw-array", "sw-tree", "sys-process", "ai-ml"];
    demoMastered.forEach(id => nodeStore.setState(id, NodeState.Mastered));
    nodeStore.setState("math-logic", NodeState.Learning);
    nodeStore.setState("hw-cpu", NodeState.Learning);

    // Assign float phases
    for (const n of nodeStore.positioned) {
      n._floatPhase = Math.random() * Math.PI * 2;
      n._enterScale = 1;
    }

    setNodeCount(nodeStore.positioned.length);
    setUnlockCount(nodeStore.positioned.filter(n => n.state === NodeState.Mastered).length);

    // Render loop
    const theme = themeEngine.get();
    let rafId: number;

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;
      pulsePhaseRef.current = time / 400;
      flowPhaseRef.current += dt * 0.0006;

      const ctx = canvas.getContext("2d");
      if (!ctx) { rafId = requestAnimationFrame(render); return; }
      const cw = canvas.width, ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);
      // DEBUG: center marker
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(cw/2, ch/2, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('center (' + cw + 'x' + ch + ')', cw/2 + 16, ch/2 + 4);      
      // DEBUG: fix camera at origin with zoom 0.5
      camera.state.x = 0;
      camera.state.y = 0;
      camera.state.zoom = 0.5;


      // 1. Screen-space background
      drawGrid(ctx, camera, cw, ch);
      updateParticles(particlesRef.current, dt / 1000, cw, ch);
      drawParticles(ctx, particlesRef.current);

      // 2. World-space transform
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.scale(camera.state.zoom, camera.state.zoom);
      ctx.translate(-camera.state.x, -camera.state.y);

      // Update floating offsets
      const now = performance.now();
      for (const n of nodeStore.positioned) {
        if (n._floatPhase === undefined) n._floatPhase = Math.random() * Math.PI * 2;
        if (!n._floatPeriod) n._floatPeriod = 2000 + Math.random() * 2000;
        n._floatOffset = Math.sin((now / (n._floatPeriod || 2000)) * Math.PI * 2 + (n._floatPhase || 0)) * 1.5;
      }

      nodeRenderer.updatePulse();
      // DEBUG: node positions
      if (nodeStore.positioned.length > 0 && !window._posLogged) {
        window._posLogged = true;
        console.log('RENDER POS:', JSON.stringify(nodeStore.positioned.slice(0, 3).map(function(n) { return {id: n.id, x: Math.round(n.x), y: Math.round(n.y)}; })));
      }

      // Draw links (bezier with flow dots)
      const nodeMap: Record<string, PositionedNode> = {};
      for (const n of nodeStore.positioned) nodeMap[n.id] = n;

      for (const n of nodeStore.positioned) {
        if (!n.parentId) continue;
        const parent = nodeMap[n.parentId];
        if (!parent) continue;

        const y1 = parent.y + (parent._floatOffset || 0);
        const y2 = n.y + (n._floatOffset || 0);
        const dx = n.x - parent.x;
        const cp1x = parent.x + dx * 0.4, cp2x = n.x - dx * 0.4;

        const isHl = hoveredNodeRef.current && (n.id === hoveredNodeRef.current || parent.id === hoveredNodeRef.current);

        ctx.beginPath();
        ctx.moveTo(parent.x, y1);
        ctx.bezierCurveTo(cp1x, y1, cp2x, y2, n.x, y2);
        ctx.strokeStyle = isHl ? "#60a5fa" : "rgba(51,65,85,0.3)";
        ctx.lineWidth = isHl ? 2 : 1.5;
        ctx.stroke();

        // Flow dots on non-highlighted links
        if (!isHl) {
          const p0 = { x: parent.x, y: y1 };
          const p3 = { x: n.x, y: y2 };
          const p1 = { x: cp1x, y: y1 };
          const p2 = { x: cp2x, y: y2 };
          const numDots = 3;
          const speed = 0.15;
          const offset = flowPhaseRef.current * speed;

          for (let d = 0; d < numDots; d++) {
            const t = ((offset + d / numDots) % 1 + 1) % 1;
            const pt = bezierPoint(p0, p1, p2, p3, t);
            const dotAlpha = 0.5 + 0.5 * Math.sin(t * Math.PI);

            for (let k = 1; k <= 4; k++) {
              const tt = ((t - k * 0.025) % 1 + 1) % 1;
              const tp = bezierPoint(p0, p1, p2, p3, tt);
              const ta = dotAlpha * (1 - k / 5) * 0.6;
              ctx.beginPath();
              ctx.arc(tp.x, tp.y, 2.5 - k * 0.4, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(96,165,250,0.2)";
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(147,197,253,0.25)";
            ctx.fill();
          }
        }
      }

      // Draw nodes
      for (const n of nodeStore.positioned) {
        nodeRenderer.drawNode(ctx, n, camera.state, theme, n.id === hoveredNodeRef.current);
      }

      ctx.restore();

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDetailOpen(false);
        setQueueOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Camera inertia on mouse up
  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Hit test (reverse order for top-most)
    for (let i = nodeStore.positioned.length - 1; i >= 0; i--) {
      const n = nodeStore.positioned[i];
      if (nodeRenderer.hitTest(n, mx, my, camera.state, canvas.width, canvas.height)) {
        // Focus previous node back to visible
        if (state.selectedNodeId) {
          nodeStore.setState(state.selectedNodeId, NodeState.Visible);
        }
        setSelectedNode(n);
        setDetailOpen(true);
        nodeStore.setState(n.id, NodeState.Focused);
        dispatch({ selectedNodeId: n.id, detailOpen: true });
        return;
      }
    }

    // Start drag
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    camStart.current = { x: camera.state.x, y: camera.state.y };
  }, [state.selectedNodeId]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDragging.current) {
      const dx = (e.clientX - dragStart.current.x) / camera.state.zoom;
      const dy = (e.clientY - dragStart.current.y) / camera.state.zoom;
      camera.setPosition(camStart.current.x - dx, camStart.current.y - dy);
    }

    // Hover detection
    let hit: PositionedNode | null = null;
    for (let i = nodeStore.positioned.length - 1; i >= 0; i--) {
      const n = nodeStore.positioned[i];
      if (nodeRenderer.hitTest(n, mx, my, camera.state, canvas.width, canvas.height)) {
        hit = n;
        break;
      }
    }
    hoveredNodeRef.current = hit?.id || null;
    setHoveredId(hit?.id || null);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    camera.zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    setZoomLevel(Math.round(camera.state.zoom * 100));
  }, []);

  // Search handlers
  const handleSearch = useCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const results = nodeStore.search(q);
    setSearchResults(results.slice(0, 10).map(n => ({ nodeId: n.id, name: n.name })));
  }, []);

  const handleSearchSelect = useCallback((id: string) => {
    const n = nodeStore.getNode(id);
    if (n) {
      camera.setPosition(n.x, n.y);
      if (state.selectedNodeId) nodeStore.setState(state.selectedNodeId, NodeState.Visible);
      setSelectedNode(n);
      setDetailOpen(true);
      nodeStore.setState(id, NodeState.Focused);
      dispatch({ selectedNodeId: id, detailOpen: true });
    }
    setSearchOpen(false);
  }, [state.selectedNodeId]);

  // Queue
  const addToQueue = useCallback((node: PositionedNode) => {
    setQueueItems(prev => {
      if (prev.find(q => q.id === node.id)) return prev;
      return [...prev, node];
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueueItems(prev => prev.filter(q => q.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="window">
        <StatusBar
          view={state.view}
          onViewChange={v => dispatch({ view: v })}
          onSearch={() => setSearchOpen(true)}
        />
        <div
          className="canvas-wrap"
          ref={wrapRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} />
        </div>
        <BottomBar
          zoom={camera.state.zoom}
          nodeCount={nodeCount}
          unlockedCount={unlockCount}
          onZoomChange={z => { camera.setZoom(z); setZoomLevel(Math.round(z * 100)); }}
        />

        {/* Detail Overlay */}
        {detailOpen && selectedNode && (
          <div className="detail-overlay active" onClick={() => {
            if (state.selectedNodeId) nodeStore.setState(state.selectedNodeId, NodeState.Visible);
            setDetailOpen(false);
            dispatch({ detailOpen: false, selectedNodeId: null });
          }}>
            <div className="detail-panel" onClick={e => e.stopPropagation()}>
              <button className="detail-close" onClick={() => {
                if (state.selectedNodeId) nodeStore.setState(state.selectedNodeId, NodeState.Visible);
                setDetailOpen(false);
                dispatch({ detailOpen: false, selectedNodeId: null });
              }}>✕</button>
              <div className="detail-icon">{selectedNode.icon || "●"}</div>
              <div className="detail-name">{selectedNode.name}</div>
              <div className="detail-path">{nodeStore.getBreadcrumb(selectedNode.id).join(" → ")}</div>

              <div className="detail-section">描述</div>
              <div className="detail-desc">{selectedNode.desc || "暂无描述"}</div>

              <div className="detail-section">学习资源</div>
              <a className="detail-resource" href="#" onClick={e => e.preventDefault()}>
                <span className="res-type">📄</span> 待补充
              </a>

              <button
                className="detail-btn"
                onClick={() => addToQueue(selectedNode)}
              >
                {queueItems.find(q => q.id === selectedNode.id) ? "✓ 已在队列中" : "+ 加入学习队列"}
              </button>
            </div>
          </div>
        )}

        {/* Search Overlay */}
        {searchOpen && (
          <div className="search-overlay" onClick={() => setSearchOpen(false)}>
            <div className="search-box" onClick={e => e.stopPropagation()}>
              <input
                className="search-input"
                placeholder="搜索节点..."
                autoFocus
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") setSearchOpen(false); }}
              />
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <div className="search-results-empty">输入关键词开始搜索</div>
                ) : (
                  searchResults.map(r => (
                    <div
                      key={r.nodeId}
                      className="search-result-item"
                      onClick={() => handleSearchSelect(r.nodeId)}
                    >
                      <div className="sri-name">{r.name}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Queue Button */}
        <button
          style={{
            position: "fixed", bottom: 48, right: 16, zIndex: 8000,
            width: 40, height: 40, border: "none", borderRadius: 10,
            background: "rgba(96,165,250,0.15)", color: "#60a5fa",
            fontSize: 18, cursor: "pointer", fontFamily: "inherit",
            transition: "all .2s",
          }}
          onClick={() => setQueueOpen(!queueOpen)}
        >
          ☰
        </button>

        {/* Queue Panel */}
        <div className="queue-overlay" onClick={() => setQueueOpen(false)}>
          <div className="queue-panel" onClick={e => e.stopPropagation()}>
            <div className="queue-header">
              <h3>学习队列 <span className="queue-count">({queueItems.length})</span></h3>
              <button className="queue-close" onClick={() => setQueueOpen(false)}>✕</button>
            </div>
            <div className="queue-list">
              {queueItems.length === 0 ? (
                <div className="queue-empty">队列为空，点击节点加入</div>
              ) : (
                queueItems.map(item => (
                  <div key={item.id} className="queue-item">
                    <div className="qi-icon">{item.icon || "●"}</div>
                    <div className="qi-info">
                      <div className="qi-name">{item.name}</div>
                      <div className="qi-detail">{item.depth} 层 · {item.category || "通用"}</div>
                    </div>
                    <button className="qi-action" onClick={() => removeFromQueue(item.id)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
