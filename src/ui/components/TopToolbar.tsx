import { BookOpen, Download, FileQuestion, Focus, Maximize2, Minimize2, Settings, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ToolbarAction =
  | 'kanaChart'
  | 'confusion'
  | 'mistakes'
  | 'export'
  | 'import'
  | 'settings'
  | 'fullscreen';

interface ToolbarEntry {
  readonly action: ToolbarAction;
  readonly label: string;
  readonly Icon: LucideIcon;
}

const toolbarEntries: readonly ToolbarEntry[] = [
  { action: 'kanaChart', label: '50音', Icon: BookOpen },
  { action: 'confusion', label: '易混淆', Icon: Focus },
  { action: 'mistakes', label: '错题', Icon: FileQuestion },
  { action: 'export', label: '导出', Icon: Download },
  { action: 'import', label: '导入', Icon: Upload },
  { action: 'settings', label: '设置', Icon: Settings },
];

interface TopToolbarProps {
  readonly isFullscreen: boolean;
  readonly onAction: (action: ToolbarAction) => void;
}

export function TopToolbar({ isFullscreen, onAction }: TopToolbarProps) {
  const fullscreenLabel = isFullscreen ? '退出全屏' : '全屏';
  const FullscreenIcon = isFullscreen ? Minimize2 : Maximize2;

  return (
    <nav className="top-toolbar" aria-label="练习工具">
      {toolbarEntries.map(({ action, label, Icon }) => (
        <button
          key={action}
          type="button"
          className="toolbar-button"
          aria-label={label}
          title={label}
          onClick={() => onAction(action)}
        >
          <Icon size={16} aria-hidden="true" strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
      <button
        type="button"
        className={`toolbar-button${isFullscreen ? ' toolbar-button--active' : ''}`}
        aria-label={fullscreenLabel}
        title={fullscreenLabel}
        aria-pressed={isFullscreen}
        onClick={() => onAction('fullscreen')}
      >
        <FullscreenIcon size={16} aria-hidden="true" strokeWidth={2} />
        <span>{fullscreenLabel}</span>
      </button>
    </nav>
  );
}
