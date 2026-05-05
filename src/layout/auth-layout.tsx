import { Outlet } from 'react-router-dom';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export default function AuthLayout() {
  const { setTheme, theme } = useTheme();
  const previousThemeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Save current theme before forcing dark
    previousThemeRef.current = theme;
    setTheme('dark');

    return () => {
      // Restore previous theme when leaving login
      if (previousThemeRef.current && previousThemeRef.current !== 'dark') {
        setTheme(previousThemeRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm" style={{ perspective: '1000px' }}>
        <Outlet />
      </div>
    </div>
  );
}
