# ═══════════════════════════════════════════════
#  ultratree 引擎+UI 组件全面审计报告
#  日期: 2026-07-05
#  审计范围: 10 个核心文件
# ═══════════════════════════════════════════════

## 审计文件清单

1. src/engines/LayoutEngine.ts
2. src/engines/Animator.ts
3. src/engines/ThemeEngine.ts
4. src/engines/SearchEngine.ts
5. src/components/StatusBar.tsx
6. src/components/BottomBar.tsx
7. src/components/DetailPanel.tsx
8. src/components/SearchBar.tsx
9. src/stores/AppStore.ts
10. src/styles/glass.css

---

## 1) LayoutEngine.ts — BUGS

**P0 — flatten 层级错乱 (行 35-46)**
prerequisites 和 children 在 PositionedNode 中直接引用 TreeNode 的引用。
问题: children 是 TreeNode[], 但 PositionedNode 的 children 字段类型也是 TreeNode[] —— 这会导致 positioned 节点持有的 children 引用指向未展开的原始 tree 子树。如果后续 mutate children，会同时影响原始数据。
修复: PositionedNode.children 应为 string[]（仅存子节点 ID），或者 flatten 时构造全新的 PN children 引用。

**P1 — Sugiyama 布局硬编码宽度 (行 52-65)**
maxWidth = 960, nodeW = 120, nodeGap = 36 全部硬写。窗口 resize 后布局不重新计算，面画布可能空白或节点拥挤。
修复: 将 maxWidth 暴露为构造参数，在 Camera.setSize 或窗口 resize 时重新 layout。

**P1 — applySugiyama 没有考虑 collapsed (行 56-63)**
所有节点都被布局，无论 collapsed 状态。搜索或切换折叠后节点位置不变。
修复: layout 时传入 collapsed 过滤，或每次折叠/展开后重建。

**P2 — 没有 fitToNodes (行 53)**
layout 完成后的返回值没有被自动适配到视口中心。
App.tsx 里需要在 load 完成后调用 camera.fitToNodes()。

**P3 — 冗余 console.log (行 10-12)**
生产代码中不应保留 LAYOUT DEBUG / LAYOUT RANGE 输出。

---

## 2) Animator.ts — BUGS

**P2 — cancelAll 没有重置 Promise 链 (行 23-28)**
如果一个正在执行的 animate() 已经被 await，cancel 后 Promise 永远不会 resolve，调用方会永久挂起。
修复: 改用 AbortController 或存储 resolve 回调在 cancel 时主动 resolve。

**P2 — spring easing 公式有误导性 (行 16)**
1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2) 在 t=0 时值为 0，但导数在 t=0 处不为 0，视觉上有个突兀的初始速度。
修复: 改用标准 spring 模型: damped harmonic oscillator 或 CSS-style cubic-bezier(0.34, 1.56, 0.64, 1)。

**P3 — animate 返回 Promise 但不处理多次 start (行 5)**
如果同一 key 连续调用两次 animate，第一次的 requestAnimationFrame 仍可能在运行，不会有警告。
修复: cancel(key) 在 start 前调用。

---

## 3) ThemeEngine.ts — BUGS

**P2 — theme 切换后已有 Canvas 不会自动重绘 (行 11-36)**
ThemeEngine 只是存值，不触发任何事件或通知。
修复: 加一个 onChange 回调注册，App.tsx 在 theme 变化时重绘 Canvas。

**P3 — neon 主题的 nodeFill 不可读 (行 25)**
gba(17,0,34,0.85) 近乎全黑 + #ff00ff 边框，耦合时文字 (#e0e0e0) 对比度勉强。
修复: 提高 neon 的 nodeFill 亮度到 rgba(40,0,60,0.8)。

**P3 — light 主题的 nodeMastered 太暗 (行 20)**
#059669（深绿）在浅色背景上对比度不足。
修复: 改为 #10b981。

---

## 4) SearchEngine.ts — BUGS

**P1 — search 结果没有 path/breadcrumb (行 25-40)**
SearchResult.path 被设为 node.id 而不是层级路径。
修复: 需要配合 NodeStore.getBreadcrumb() 填充路径。

**P2 — buildIndex 建立的 index 从未被 search 使用 (行 10-20)**
tokenize → index Map 建立后，search 方法完全没用这个 index，而是重新遍历全部节点做字符串 match。
修复: search 应优先使用 index 倒排索引加速；当前实现 O(n*m) 且等于没用索引。

**P2 — matchField 永远返回 "name" (行 41)**
无论实际匹配到 desc/name/id，全部硬编码为 "name"。
修复: 检测实际命中字段。

---

## 5) StatusBar.tsx — BUGS

**P0 — 中文内容为乱码 (行 14-17)**
title="Pod 路 鐭ヨ瘑鍥捐氨", nav-btn 文字="绉戞妧鏍?" 和 "鎶€鑳芥爲" 均为 UTF-8 解码为 Latin-1 或 GBK 的乱码残留。
修复: 重新保存为 UTF-8 without BOM。正确的文字应为:
title="Pod · 科技树"
nav1="科技树"
nav2="技能树"
search-btn 的 unicode 字符 "鈱" 也不是搜索图标，应改为 "⌕" 或直接用 "🔍" emoji。

**P2 — search-btn 没有快捷键提示 (行 18)**
没有 tooltip 或 aria-label。

---

## 6) BottomBar.tsx — BUGS

**P1 — zoom +/- 反向放大/缩小 (行 17-18)**
onZoomChange(zoom * 1.2) 是放大（zoom 值变大），zoom * 0.8 是缩小。但在 Camera.setZoom 中 Math.max(0.2, Math.min(3, z)) 限制了范围，这逻辑本身没错，但 zoom 从 0.85 开始 *1.2 → 1.02 是放大。用户心理模型通常是 + 按钮 zoomIn（值变大），当前实现是符合直觉的。
但问题在于: zoom 值增大 = 画面放大被 Camera 正确处理，但这个 BottomBar 显示的 zoom 值没有与 Camera 的状态完全同步（读取的是 React state zoomLevel 而非 Camera.state.zoom）。

**P2 — 没有重置缩放按钮 (行 13)**
缺少一个"重置到100%"或"fit all"按钮在 zoom-group 中。

---

## 7) DetailPanel.tsx — BUGS

**P2 — store 类型为 any (行 5)**
store: any 削弱了类型安全。应使用 NodeStore 类型。
修复: import NodeStore，store 类型定义为 NodeStore。

**P3 — 资源列表硬编码 (行 18)**
<div className="resource"><span className="r-icon">📃</span> 待补充</div> 永远显示"待补充"。
修复: 遍历 node.resources 渲染实际资源列表。

**P3 — 布局固定宽度 (行 10)**
position: absolute; right: 0; width: 400px 在小屏上溢出。
但 glass.css 已有 @media (max-width: 640px) 的 100% 覆盖，问题不大。

---

## 8) SearchBar.tsx — BUGS

**P1 — 防抖使用 window.setTimeout 而非 React 方式 (行 12)**
debounceRef = useRef<number>(0) 存的是 number（setTimeout id），类型和 useEffect cleanup 不匹配。
修复: 用 useRef<ReturnType<typeof setTimeout>>。

**P2 — 搜索结果没有图标 (行 32)**
每个 search-item 只有 {r.name}，没有 icon/path。
修复: 参照 pod_temp 的 sri-icon + sri-name + sri-path 布局。

**P2 — 键盘导航缺失 (行 26-31)**
按上/下箭头不能遍历结果列表。

---

## 9) AppStore.ts — BUGS

**P2 — reducer 不支持嵌套更新 (行 14)**
{ ...state, ...patch } 对于 camera 对象只做浅合并。
如果 dispatch({ camera: { x: 100 } }) 会导致 zoom 丢失。
修复: camera: { ...state.camera, ...patch.camera }。

**P2 — defaultState.detailOpen 为 false 但 App.tsx 中也有独立状态 (行 6)**
App.tsx 用 React.useState 维护了 detailOpen，与 AppStore 中的 detailOpen 重复。两处状态不同步。
修复: 只保留一处状态源。

**P3 — theme 类型硬编码 (行 7)**
	heme: "dark" | "light" | "neon" 与 ThemeEngine.themes 的 key 不自动关联。

---

## 10) glass.css — BUGS

**P0 — CSS 类名与 pod_temp 未完全对齐 (多处)**
DetailPanel 使用 .detail-panel（页级）但 App.tsx 中部分渲染使用不同结构。
例如 .detail-overlay.active 的 opacity/visibility transition 依赖于 JS 动态加 active class。
但 App.tsx 中用 {detailOpen && (...)} 条件渲染，而不是加 class，导致 CSS transition 永远不生效（每次 unmount/mount）。

**P1 — 重叠的 z-index 系统 (行 144-238)**
.detail-overlay: z-index: 10000
.queue-panel 内部 z-index: 9000
.search-overlay: z-index: 11000
.status-bar-bottom: z-index: 8000
这些值在同一个父容器下没问题，但 .detail-overlay 是 position: fixed，而 .search-overlay 也是 fixed。
如果同时打开搜索 + 详情，会互相遮盖。

**P1 — 部分样式未应用到 Components (行 60-75)**
StatusBar 使用了 .nav-btn 和 .search-btn，但 App.tsx 中对这些按钮的事件绑定方式与 CSS 中的 transition 期望不匹配。

**P2 — 底部状态栏重复 (行 236-247)**
有一个 .status-bar-bottom 的完整定义，但 App.tsx 中没有渲染这个组件 —— 它用的是 BottomBar。
可能是 pod_temp 迁移残留。

**P2 — 媒体查询只覆盖了 640px (行 256-260)**
应该补充 1024px 和 768px 的断点。

---

# 综合评级

| 文件 | 严重度 | 关键问题 |
|------|--------|----------|
| StatusBar.tsx | P0 | 中文乱码 |
| glass.css | P0 | transition 永不生效（条件渲染 vs class 切换） |
| AppStore.ts | P2 | reducer 浅合并导致 camera 数据丢失 |
| LayoutEngine.ts | P0 | children 引用共享 + 宽度硬编码 |
| DetailPanel.tsx | P2 | store 类型 any + 资源硬编码 |
| SearchEngine.ts | P1 | 倒排索引建了没用 |
| Animator.ts | P2 | cancelAll 不 resolve Promise |
| SearchBar.tsx | P1 | 防抖类型错误 |
| ThemeEngine.ts | P2 | 无重绘触发机制 |
| BottomBar.tsx | P2 | 无重置缩放按钮 |

修复优先级:
1. 立刻: StatusBar.tsx 中文乱码 (#1)
2. 立刻: glass.css 条件渲染 vs class 切换 (#2)
3. 立刻: LayoutEngine children 共享引用 (#3)
4. 重要: SearchEngine 倒排索引未使用 (#4)
5. 重要: AppStore reducer 深合并 (#5)
6. 优化: 其余 P2/P3 项
