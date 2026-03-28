'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] خطأ:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div
          className="w-full h-dvh flex flex-col items-center justify-center text-center px-6"
          style={{ background: '#050810' }}
        >
          <div className="text-5xl mb-4">⚔️</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#c9a227', fontFamily: 'var(--font-geist-mono)' }}>
            قبضة الجنرال
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-xs">
            حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #c9a227, #e0b830)' }}
          >
            إعادة تحميل
          </button>
          <p className="text-white/20 text-[10px] mt-4 max-w-xs break-all">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
