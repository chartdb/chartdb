export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = Exclude<Theme, 'system'>;
