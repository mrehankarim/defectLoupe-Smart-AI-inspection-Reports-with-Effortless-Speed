export interface ThemePalette {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  border: string;
  borderSubtle: string;
  borderHighlight: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
  secondary: string;
  cyan: string;
  warning: string;
  danger: string;
  purple: string;
  inputBg: string;
  inputBorder: string;
}

export const darkColors: ThemePalette = {
  canvas: "#07090e",
  surface: "#0f172a",
  surfaceElevated: "#1e293b",
  surfaceGlass: "rgba(15, 23, 42, 0.85)",
  border: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.04)",
  borderHighlight: "rgba(255, 255, 255, 0.16)",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",
  accent: "#10b981",
  accentHover: "#059669",
  accentGlow: "rgba(16, 185, 129, 0.18)",
  secondary: "#6366f1",
  cyan: "#06b6d4",
  warning: "#f59e0b",
  danger: "#f43f5e",
  purple: "#a855f7",
  inputBg: "rgba(255, 255, 255, 0.04)",
  inputBorder: "rgba(255, 255, 255, 0.10)",
};

export const lightColors: ThemePalette = {
  canvas: "#f1f5f9",
  surface: "#ffffff",
  surfaceElevated: "#f8fafc",
  surfaceGlass: "rgba(255, 255, 255, 0.85)",
  border: "#cbd5e1",
  borderSubtle: "#e2e8f0",
  borderHighlight: "#94a3b8",
  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",
  accent: "#10b981",
  accentHover: "#059669",
  accentGlow: "rgba(16, 185, 129, 0.12)",
  secondary: "#6366f1",
  cyan: "#0284c7",
  warning: "#d97706",
  danger: "#e11d48",
  purple: "#9333ea",
  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string }
> = {
  draft: {
    label: "Draft",
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.35)",
    text: "#94a3b8",
  },
  scheduled: {
    label: "Scheduled",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#fbbf24",
  },
  in_progress: {
    label: "In Progress",
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.4)",
    text: "#818cf8",
  },
  completed: {
    label: "Completed",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.4)",
    text: "#34d399",
  },
  report_generated: {
    label: "Report Ready",
    bg: "rgba(168, 85, 247, 0.15)",
    border: "rgba(168, 85, 247, 0.4)",
    text: "#c084fc",
  },
  archived: {
    label: "Archived",
    bg: "rgba(71, 85, 105, 0.15)",
    border: "rgba(71, 85, 105, 0.3)",
    text: "#64748b",
  },
  cancelled: {
    label: "Cancelled",
    bg: "rgba(244, 63, 94, 0.15)",
    border: "rgba(244, 63, 94, 0.4)",
    text: "#fb7185",
  },
};

export const SEVERITY_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string }
> = {
  critical: {
    label: "Critical",
    bg: "rgba(244, 63, 94, 0.2)",
    border: "rgba(244, 63, 94, 0.5)",
    text: "#f43f5e",
  },
  high: {
    label: "High",
    bg: "rgba(249, 115, 22, 0.2)",
    border: "rgba(249, 115, 22, 0.5)",
    text: "#fb923c",
  },
  medium: {
    label: "Medium",
    bg: "rgba(245, 158, 11, 0.2)",
    border: "rgba(245, 158, 11, 0.5)",
    text: "#fbb024",
  },
  low: {
    label: "Low",
    bg: "rgba(16, 185, 129, 0.2)",
    border: "rgba(16, 185, 129, 0.5)",
    text: "#34d399",
  },
};
