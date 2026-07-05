import React from "react";
import { PositionedNode } from "../types/node";

interface Props {
  node: PositionedNode | null;
  open: boolean;
  onClose: () => void;
  store: any;
}

export const DetailPanel: React.FC<Props> = ({ node, open, onClose, store }) => {
  if (!node) return null;
  const path = store ? store.getBreadcrumb(node.id).join(" → ") : "";
  return (
    <div className="detail-panel">
      <button className="close-btn" onClick={onClose}>✕</button>
      <div className="node-icon">{node.icon || "●"}</div>
      <div className="node-name">{node.name}</div>
      <div className="node-path">{path}</div>
      <div className="section-title">描述</div>
      <div className="desc">{node.desc || "暂无描述"}</div>
      <div className="section-title">学习资源</div>
      <div className="resource"><span className="r-icon">📃</span> 待补充</div>
      <button className="btn-primary" onClick={() => alert("已添加到学习队列")}>+ 加入学习队列</button>
    </div>
  );
};
