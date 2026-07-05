import React, { useState, useRef, useEffect } from "react";

interface Props {
  onSearch: (q: string) => void;
  onClose: () => void;
  results: { nodeId: string; name: string }[];
  onSelect: (id: string) => void;
}

export const SearchBar: React.FC<Props> = ({ onSearch, onClose, results, onSelect }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number>(0);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(function() { onSearch(v); }, 200);
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={function(e) { e.stopPropagation(); }}>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="搜索节点..."
          value={query}
          onChange={function(e: React.ChangeEvent<HTMLInputElement>) { handleChange(e.target.value); }}
          onKeyDown={function(e: React.KeyboardEvent<HTMLInputElement>) { if (e.key === 'Escape') onClose(); }}
        />
        <button className="search-close" onClick={onClose}>✕</button>
        {results.length > 0 && (
          <div className="search-results">
            {results.slice(0, 10).map(r => (
              <div key={r.nodeId} className="search-item" onClick={() => { onSelect(r.nodeId); onClose(); }}>
                {r.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
