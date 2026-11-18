import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { clearChunkReloadTimestamp, isChunkLoadError } from '@/utils/lazyRetry';

interface AppErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps): void {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AppErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = (): void => {
    clearChunkReloadTimestamp();
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const isChunkError = isChunkLoadError(error);

    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-6 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name={isChunkError ? 'system_update' : 'error'} />
          </div>
          <h1 className="mb-2 text-lg font-bold">
            {isChunkError ? 'App Update Available' : 'Something went wrong'}
          </h1>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            {isChunkError
              ? 'A newer version of the app was deployed. Reload to load the latest screen.'
              : 'An unexpected error occurred while loading this screen.'}
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={this.handleReload}
          >
            <Icon name="refresh" className="text-base" />
            Reload App
          </Button>
        </div>
      </div>
    );
  }
}
