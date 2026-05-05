import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useThemeColorStore } from '@/utils/theme-store';

export function ThemeSync() {
  const themeColor = useThemeColorStore((state) => state.themeColor);

  React.useEffect(() => {
    if (typeof document !== 'undefined' && themeColor) {
      document.documentElement.setAttribute('data-theme', themeColor);
    }
  }, [themeColor]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
