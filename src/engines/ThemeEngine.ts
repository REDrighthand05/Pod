import { ThemeColors } from "../types/node";

export class ThemeEngine {
  private themes: Record<string, ThemeColors> = {
    dark: {
      bg: "#0a0a1a", bgRgb: "10,10,26",
      nodeFill: "rgba(15,23,42,0.85)", nodeStroke: "#334155", nodeText: "#94a3b8",
      nodeMastered: "#34d399", nodeLearning: "#60a5fa", nodeFocused: "#a78bfa", nodeLocked: "#1e293b",
      linkColor: "rgba(51,65,85,0.5)", accent: "#60a5fa", accentRgb: "96,165,250",
      text: "#e2e8f0", textMuted: "#64748b", panelBg: "rgba(15,15,40,0.85)",
    },
    light: {
      bg: "#f8fafc", bgRgb: "248,250,252",
      nodeFill: "rgba(255,255,255,0.9)", nodeStroke: "#cbd5e1", nodeText: "#64748b",
      nodeMastered: "#059669", nodeLearning: "#2563eb", nodeFocused: "#7c3aed", nodeLocked: "#e2e8f0",
      linkColor: "rgba(203,213,225,0.6)", accent: "#2563eb", accentRgb: "37,99,235",
      text: "#0f172a", textMuted: "#94a3b8", panelBg: "rgba(255,255,255,0.85)",
    },
    neon: {
      bg: "#0a0015", bgRgb: "10,0,21",
      nodeFill: "rgba(17,0,34,0.85)", nodeStroke: "#ff00ff", nodeText: "#e0e0e0",
      nodeMastered: "#00ff88", nodeLearning: "#00ffff", nodeFocused: "#ff00ff", nodeLocked: "#1a0030",
      linkColor: "rgba(0,255,255,0.3)", accent: "#ff00ff", accentRgb: "255,0,255",
      text: "#e0e0e0", textMuted: "#888888", panelBg: "rgba(10,0,21,0.9)",
    },
  };

  current = "dark";

  get(): ThemeColors { return this.themes[this.current]; }
  set(name: string) { if (this.themes[name]) this.current = name; }
  getAll() { return Object.keys(this.themes); }
}