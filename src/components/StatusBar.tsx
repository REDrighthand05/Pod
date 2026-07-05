import React from "react";

interface Props {
  view: "tech" | "skill";
  onViewChange: (v: "tech" | "skill") => void;
  onSearch: () => void;
}

export const StatusBar: React.FC<Props> = ({ view, onViewChange, onSearch }) => {
  return (
    <div className="status-bar">
      <div className="logo">Pod</div>
      <div className="title">Pod · 科技树</div>
      <div className="spacer" />
      <button className={"nav-btn" + (view === "tech" ? " active" : "")} onClick={() => onViewChange("tech")}>科技树</button>
      <button className={"nav-btn" + (view === "skill" ? " active" : "")} onClick={() => onViewChange("skill")}>技能树</button>
      <button className="search-btn" title="搜索 (Ctrl+F)" onClick={onSearch}>⌕</button>
    </div>
  );
};
