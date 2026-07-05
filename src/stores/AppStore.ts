import React from "react";
import { AppState, CameraState } from "../types/node";

export const defaultState: AppState = {
  view: "tech",
  camera: { x: 0, y: 0, zoom: 0.85 },
  selectedNodeId: null,
  searchQuery: "",
  theme: "dark",
  detailOpen: false,
};

export const AppContext = React.createContext<{
  state: AppState;
  dispatch: React.Dispatch<Partial<AppState>>;
}>({ state: defaultState, dispatch: () => {} });

export function appReducer(state: AppState, patch: Partial<AppState>): AppState {
  return { ...state, ...patch };
}