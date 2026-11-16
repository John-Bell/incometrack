# Tailwind v4 & Mobile Layout Reference

Use `min-h-dvh`, `env(safe-area-inset-*)`, and `cn()` from `@/lib/utils` for full-screen mobile/PWA layouts:

```tsx
import { cn } from '@/lib/utils';

export const MobileLayout = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  return (
    <div className="flex flex-col min-h-dvh bg-background-light dark:bg-background-dark">
      <header className="fixed top-0 w-full bg-primary text-white pt-[env(safe-area-inset-top)]">
        <div className="h-16 flex items-center px-4">
          App Header
        </div>
      </header>

      <main
        className={cn(
          "flex-1 mt-[calc(4rem+env(safe-area-inset-top))] p-4 transition-all duration-300",
          isSidebarOpen ? "w-3/4" : "w-full"
        )}
      >
        Content goes here
      </main>

      <footer className="w-full bg-slate-800 text-white pb-[env(safe-area-inset-bottom)]">
        <div className="h-16 flex items-center px-4">
          App Footer
        </div>
      </footer>
    </div>
  );
};
```
