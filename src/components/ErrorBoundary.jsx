import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4 border border-rose-200">
            <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
            <p className="text-slate-500 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset?.();
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold
                         hover:bg-blue-700 active:scale-95 transition-all"
            >
              Back to Menu
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
