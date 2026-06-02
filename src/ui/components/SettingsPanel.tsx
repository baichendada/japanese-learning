import type { ProgressSettings } from '../../core/progress/model';

interface SettingsPanelProps {
  readonly open: boolean;
  readonly settings: ProgressSettings;
  readonly onClose: () => void;
  readonly onChange: (settings: ProgressSettings) => void;
}

export function SettingsPanel({ open, settings, onClose, onChange }: SettingsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="utility-panel" role="dialog" aria-modal="true" aria-label="练习设置">
      <div className="utility-panel__header">
        <h2>练习设置</h2>
        <button type="button" className="icon-text-button" aria-label="关闭设置" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="utility-panel__body">
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.keySoundEnabled}
            onChange={(event) => onChange({ ...settings, keySoundEnabled: event.target.checked })}
          />
          <span>按键音效</span>
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.kanaSoundEnabled}
            onChange={(event) => onChange({ ...settings, kanaSoundEnabled: event.target.checked })}
          />
          <span>假名发音</span>
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.helperVisible}
            onChange={(event) => onChange({ ...settings, helperVisible: event.target.checked })}
          />
          <span>显示提示区</span>
        </label>
      </div>
    </aside>
  );
}
