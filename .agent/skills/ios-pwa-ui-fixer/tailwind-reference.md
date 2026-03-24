# Tailwind v4 & Mobile Reference Patterns

#### ❌ The "Bad" Way: Static Viewports & Messy Classes
This layout will jump in Safari, elements will get cut off by the iPhone notch, and the conditional classes are incredibly hard to read.

```tsx
// Anti-pattern: DO NOT USE
export const MobileLayout = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Notch will cut off this header */}
      <header className="fixed top-0 w-full h-16 bg-blue-500 text-white">
        App Header
      </header>
      
      <main className={isSidebarOpen ? "mt-16 p-4 w-3/4 bg-gray-100 transition-all" : "mt-16 p-4 w-full bg-gray-100 transition-all"}>
        Content goes here
      </main>
    </div>
  );
};
```

#### ✅ The "Good" Way: Dynamic Viewports & Safe Areas
```tsx
// components/MobileLayout.tsx
import { cn } from '@/lib/utils';

export const MobileLayout = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  return (
    // Use min-h-dvh to ensure it fits the dynamic viewport perfectly
    <div className="flex flex-col min-h-dvh bg-white">
      
      {/* pt-[env(safe-area-inset-top)] ensures the header dodges the iOS notch */}
      <header className="fixed top-0 w-full bg-blue-500 text-white pt-[env(safe-area-inset-top)]">
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

      {/* pb-[env(safe-area-inset-bottom)] ensures footers dodge the iOS home indicator bar */}
      <footer className="w-full bg-gray-800 text-white pb-[env(safe-area-inset-bottom)]">
        <div className="h-16 flex items-center px-4">
          App Footer
        </div>
      </footer>
    </div>
  );
};
```
