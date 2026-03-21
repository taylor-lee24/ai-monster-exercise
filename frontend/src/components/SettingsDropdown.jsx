import { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const themeOptions = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="settings-wrapper" ref={wrapperRef}>
      <button
        className="settings-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="settings-dropdown">
          <h4>Appearance</h4>
          <div className="theme-options">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                className={`theme-option${theme === opt.id ? ' active' : ''}`}
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
              >
                <opt.icon size={18} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
