import type { ThemePreset } from '@/store/config/types'

// These presets ship with the application so an updater preserving a host's
// config.json cannot hide a newly introduced built-in theme.
export const bundledThemePresets: ThemePreset[] = [
  {
    name: 'Metexon',
    color: '#2196F3',
    isDark: true,
    logo: {
      src: 'logo_metexon.svg',
      dark: '#1D1D1F',
      light: '#FFFFFF'
    }
  }
]
