import React from "react";

interface Props {
  zoom: number;
  nodeCount: number;
  unlockedCount: number;
  onZoomChange: (z: number) => void;
}

export const BottomBar: React.FC<Props> = ({ zoom, nodeCount, unlockedCount, onZoomChange }) => {
  return (
    <div className="bottom-bar">
      <div className="stat">节点: <span>{nodeCount}</span></div>
      <div className="stat">已解锁: <span>{unlockedCount}</span></div>
      <div className="spacer" />
      <div className="zoom-group">
        <button className="zoom-btn" onClick={() => onZoomChange(zoom * 1.2)}>+</button>
        <span className="zoom-val">{Math.round(zoom * 100)}%</span>
        <button className="zoom-btn" onClick={() => onZoomChange(zoom * 0.8)}>−</button>
      </div>
    </div>
  );
};
