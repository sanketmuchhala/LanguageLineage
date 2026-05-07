import { useState, useRef, useEffect } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { activateFocusMode } from '../graph/selectors';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }: SearchBoxProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dataset = useGraphStore((s) => s.dataset);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    setShowDropdown(newValue.length > 0);
  };

  const handleNavigate = (langId: string) => {
    const state = useGraphStore.getState();
    const cy = state.cy;
    const lang = state.dataset?.languageMap.get(langId);
    if (!cy || !lang) return;

    setLocalValue('');
    onChange('');
    setShowDropdown(false);

    const node = cy.getElementById(langId);
    if (node.length === 0) return;

    cy.animate({ center: { eles: node }, zoom: 1.5 } as any, { duration: 400 } as any);
    state.setSelectedNode(langId);
    activateFocusMode(cy, langId);

    if (state.filters.layoutMode === 'timeline') {
      state.setTimelineYear(lang.first_release_year);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matches = dataset && localValue.length > 0
    ? dataset.languages
        .filter((l) => l.name.toLowerCase().includes(localValue.toLowerCase()))
        .slice(0, 10)
    : [];

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="search-box"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => localValue.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
      />
      {showDropdown && matches.length > 0 && (
        <div className="search-dropdown">
          {matches.map((lang) => (
            <div
              key={lang.id}
              className="search-result"
              onMouseDown={() => handleNavigate(lang.id)}
            >
              <span className="search-result-name">{lang.name}</span>
              <span className="search-result-year">{lang.first_release_year}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
