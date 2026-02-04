import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/toast'
import { isConfigured } from './lib/supabase'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Engagers from './pages/Engagers'
import Analytics from './pages/Analytics'
import Profiles from './pages/Profiles'
import Posts from './pages/Posts'
import KeywordSearch from './pages/KeywordSearch'
import Settings from './pages/Settings'
import PostPerformance from './pages/PostPerformance'
import EngagerDetail from './pages/EngagerDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

function SetupRequired() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 mb-4">
            <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.194-.14 1.743" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Required</h1>
          <p className="mt-2 text-gray-600">
            The dashboard needs to be connected to your Supabase database before it can run.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">1. Create your environment file</h2>
            <code className="block bg-gray-900 text-green-400 rounded px-3 py-2 text-sm">
              cp .env.example .env
            </code>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">2. Fill in your credentials</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_URL</code> — Your Supabase project URL</li>
              <li><code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> — Your Supabase anon/public key</li>
              <li><code className="bg-gray-200 px-1 rounded">SUPABASE_SERVICE_KEY</code> — Your Supabase service role key</li>
              <li><code className="bg-gray-200 px-1 rounded">APIFY_TOKEN</code> — Your Apify API token</li>
              <li><code className="bg-gray-200 px-1 rounded">API_KEYS</code> — Any secret string for API auth</li>
            </ul>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">3. Restart the dev server</h2>
            <code className="block bg-gray-900 text-green-400 rounded px-3 py-2 text-sm">
              npm run dev
            </code>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          See README.md for full setup instructions.
        </p>
      </div>
    </div>
  )
}

function App() {
  if (!isConfigured) {
    return <SetupRequired />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="engagers" element={<Engagers />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profiles" element={<Profiles />} />
                <Route path="posts" element={<Posts />} />
                <Route path="keyword-search" element={<KeywordSearch />} />
                <Route path="profiles/:profileUrl/posts" element={<PostPerformance />} />
                <Route path="engagers/:profileUrl" element={<EngagerDetail />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

