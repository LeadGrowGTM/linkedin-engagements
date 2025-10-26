import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
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
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

