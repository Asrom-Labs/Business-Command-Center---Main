import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  // ─── i18n LIMITATION ──────────────────────────────────────────────────────
  // This is a class component. React hooks (useTranslation) cannot be used
  // in class components, so the strings below are hardcoded English.
  // This is a known LOW-priority open issue.
  // To fix properly: convert to a functional component using an error boundary
  // HOC (e.g., react-error-boundary package) — deferred to a future session.
  // DO NOT attempt to add useTranslation here without that architectural change.
  // ─────────────────────────────────────────────────────────────────────────
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            Please refresh the page. If the problem persists, contact support.
          </p>
          <button
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
