import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuration Error</h1>
                <p className="text-gray-600">The application failed to initialize</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm font-medium text-red-800 mb-2">Error Message:</p>
              <p className="text-sm text-red-700 font-mono">{this.state.error?.message}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">🔧 How to Fix</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to Railway Dashboard → Your Service → Variables tab</li>
                  <li>Add <code className="bg-gray-100 px-2 py-1 rounded text-sm">VITE_SUPABASE_URL</code></li>
                  <li>Add <code className="bg-gray-100 px-2 py-1 rounded text-sm">VITE_SUPABASE_ANON_KEY</code></li>
                  <li>Go to Deployments tab → Click "Redeploy"</li>
                  <li>Wait ~2 minutes for rebuild</li>
                </ol>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Need help?</p>
                <a 
                  href="https://docs.railway.app/develop/variables" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Railway Environment Variables Documentation →
                </a>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

