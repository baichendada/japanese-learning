import {
  BookOpen,
  Download,
  FileQuestion,
  Focus,
  Maximize2,
  Settings,
  Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ToolbarEntry {
  readonly label: string;
  readonly Icon: LucideIcon;
}

const toolbarEntries: readonly ToolbarEntry[] = [
  { label: '自学', Icon: BookOpen },
  { label: '易混淆', Icon: Focus },
  { label: '错题', Icon: FileQuestion },
  { label: '导出', Icon: Download },
  { label: '导入', Icon: Upload },
  { label: '设置', Icon: Settings },
  { label: '全屏', Icon: Maximize2 },
];

export function TopToolbar() {
  return (
    <nav className="top-toolbar" aria-label="练习工具">
      {toolbarEntries.map(({ label, Icon }) => (
        <button key={label} type="button" className="toolbar-button" aria-label={label} title={label}>
          <Icon size={16} aria-hidden="true" strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
