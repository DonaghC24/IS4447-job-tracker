export const Colors = {
  primary:   '#2563eb',
  success:   '#16a34a',
  warning:   '#d97706',
  danger:    '#dc2626',
  purple:    '#7c3aed',
  cyan:      '#0891b2',

  statusApplied:   '#2563eb',
  statusInterview: '#d97706',
  statusOffer:     '#16a34a',
  statusRejected:  '#dc2626',
} as const;

export type AppColors = {
  background:        string;
  surface:           string;
  surfaceAlt:        string;
  text:              string;
  textSecondary:     string;
  textMuted:         string;
  textDisabled:      string;
  border:            string;
  borderLight:       string;
  chipBg:            string;
  inputBg:           string;
  deleteChipBg:      string;
  deleteChipText:    string;
  errorBannerBg:     string;
  errorBannerBorder: string;
};

export const lightColors: AppColors = {
  background:        '#f3f4f6',
  surface:           '#ffffff',
  surfaceAlt:        '#f9fafb',
  text:              '#1a1a2e',
  textSecondary:     '#555555',
  textMuted:         '#888888',
  textDisabled:      '#aaaaaa',
  border:            '#e5e7eb',
  borderLight:       '#cccccc',
  chipBg:            '#f5f5f5',
  inputBg:           '#ffffff',
  deleteChipBg:      '#fee2e2',
  deleteChipText:    '#dc2626',
  errorBannerBg:     '#fef2f2',
  errorBannerBorder: '#fecaca',
};

export const darkColors: AppColors = {
  background:        '#0f172a',
  surface:           '#1e293b',
  surfaceAlt:        '#1e293b',
  text:              '#f1f5f9',
  textSecondary:     '#94a3b8',
  textMuted:         '#64748b',
  textDisabled:      '#475569',
  border:            '#334155',
  borderLight:       '#475569',
  chipBg:            '#334155',
  inputBg:           '#1e293b',
  deleteChipBg:      '#450a0a',
  deleteChipText:    '#fca5a5',
  errorBannerBg:     '#450a0a',
  errorBannerBorder: '#991b1b',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  pill: 20,
} as const;
