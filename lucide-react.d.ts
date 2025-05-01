
// This is a dummy declaration file to potentially help with resolving
// module resolution issues during static analysis or build steps,
// especially if hydration errors indirectly relate to module loading.
// It doesn't provide actual types but satisfies the import.

declare module 'lucide-react' {
  import type { FC, SVGProps } from 'react';

  type LucideIcon = FC<SVGProps<SVGSVGElement>>;

  // Add known icons here as needed, or use a generic type
  export const Loader2: LucideIcon;
  export const PanelBottom: LucideIcon;
  export const Save: LucideIcon;
  export const Play: LucideIcon;
  export const Trash2: LucideIcon;
  export const Menu: LucideIcon;
  export const PanelLeftOpen: LucideIcon;
  export const PanelRightOpen: LucideIcon;
  export const File: LucideIcon;
  export const FileText: LucideIcon;
  export const FileType: LucideIcon;
  export const Folder: LucideIcon;
  export const Upload: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Send: LucideIcon;
  export const User: LucideIcon;
  export const Bot: LucideIcon;
  export const Sparkles: LucideIcon;
  export const X: LucideIcon;
  export const ZoomIn: LucideIcon;
  export const ZoomOut: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Code: LucideIcon; // Assuming Code might be used
  export const Check: LucideIcon;
  export const Circle: LucideIcon;

  // Add any other icons used in the project...

  // Fallback for any icon
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultExport: any;
  export default defaultExport;
}
