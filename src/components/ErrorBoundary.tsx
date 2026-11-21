import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'حدث خطأ غير متوقع',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#FFF9FA] text-[#0F172A] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white rounded-[24px] border border-slate-200 p-6 text-center space-y-4 shadow-sm">
            <h1 className="font-display text-xl font-black">عذراً، حدث خطأ مؤقت</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              تقدر تعيد تحميل الصفحة وهتشتغل معاك فوراً.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#0F172A] text-white font-display font-bold text-sm"
            >
              إعادة تحميل TOP1
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
