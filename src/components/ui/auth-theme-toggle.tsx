import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ThemeColorToggle } from '@/components/theme-color-toggle';

export function AuthThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-background/40 backdrop-blur-xl border border-border/50 rounded-xl p-1.5 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <div className="w-[1px] h-4 bg-border/50 mx-1" />

      <ThemeColorToggle />
    </div>
  );
}
