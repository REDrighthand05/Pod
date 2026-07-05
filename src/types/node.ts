export interface TreeNode {
  id: string;
  name: string;
  icon: string;
  desc: string;
  category: string;
  prerequisites: string[];
  estHours: number;
  resources: TreeNodeResource[];
  tags: string[];
  children: TreeNode[];
  parentId?: string;
  depth?: number;
  index?: number;
}

export interface TreeNodeResource {
  name: string;
  type: string;
}

export interface PositionedNode extends TreeNode {
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string;
  depth: number;
  index: number;
  state: NodeState;
  collapsed: boolean;
  // Pod runtime fields
  _floatOffset: number;
  _enterX: number;
  _enterY: number;
  _floatPhase: number;
  _enterScale: number;
  _selectedTime: number;
  _floatPeriod: number;
  parentIds: string[];
  category: string;
  label: string;
}

export enum NodeState {
  Locked = "locked",
  Visible = "visible",
  Learning = "learning",
  Mastered = "mastered",
  Recommended = "recommended",
  Focused = "focused",
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SearchResult {
  nodeId: string;
  name: string;
  path: string;
  matchField: "name" | "desc" | "id";
}

export interface Skill {
  id: string;
  name: string;
  group: string;
  level: number;
  hoursSpent: number;
  icon: string;
  children: string[];
}

export interface QueueItem {
  skillId: string;
  targetLevel: number;
  priority: "low" | "medium" | "high";
  startedAt?: string;
  notes?: string;
}

export interface AppState {
  view: "tech" | "skill";
  camera: CameraState;
  selectedNodeId: string | null;
  searchQuery: string;
  theme: "dark" | "light" | "neon";
  detailOpen: boolean;
}

export interface ThemeColors {
  bg: string;
  bgRgb: string;
  nodeFill: string;
  nodeStroke: string;
  nodeText: string;
  nodeMastered: string;
  nodeLearning: string;
  nodeFocused: string;
  nodeLocked: string;
  linkColor: string;
  accent: string;
  accentRgb: string;
  text: string;
  textMuted: string;
  panelBg: string;
}
