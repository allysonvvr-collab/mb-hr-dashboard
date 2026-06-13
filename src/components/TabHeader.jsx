import { useState } from 'react';
import { Settings, X } from 'lucide-react';

export function TabHeader({ title, children, settings }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {children}
          {settings && (
            <button
              className="btn-icon"
              onClick={() => setShowSettings(true)}
              title="Tab Settings"
              style={{ width: 34, height: 34 }}
            >
              <Settings size={15} />
            </button>
          )}
        </div>
      </div>

      {showSettings && settings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ {title} Settings</h3>
              <button className="btn-icon" onClick={() => setShowSettings(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              {settings}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
