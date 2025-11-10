/**
 * Theme configuration for Apple-style glass morphism design
 */
export const theme = {
  dark: {
    bg: 'bg-black',
    gradientBg: 'from-slate-900/20 via-transparent to-cyan-950/20',
    card: 'bg-white/5',
    cardHover: 'hover:bg-white/[0.07]',
    border: 'border-white/10',
    text: 'text-white',
    textHover: 'hover:text-white',
    textSecondary: 'text-slate-400',
    textTertiary: 'text-slate-500',
    sidebar: 'bg-white/5',
    sidebarBorder: 'border-white/10',
    input: 'bg-white/5 border-white/10',
  },
  light: {
    bg: 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300',
    gradientBg: 'from-slate-400/20 via-cyan-500/10 to-blue-500/10',
    card: 'bg-white/40',
    cardHover: 'hover:bg-white/50',
    border: 'border-white/60',
    text: 'text-slate-800',
    textHover: 'hover:text-slate-800',
    textSecondary: 'text-slate-600',
    textTertiary: 'text-slate-500',
    sidebar: 'bg-white/30',
    sidebarBorder: 'border-white/40',
    input: 'bg-white/50 border-white/40',
  },
}

export function getThemeClasses(isDark: boolean) {
  return isDark ? theme.dark : theme.light
}
