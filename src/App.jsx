import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import { supabase } from './lib/supabaseClient'

// Pages
import ChatPage from './pages/index'
import TimelinePage from './pages/timeline'
import GraphPage from './pages/graph'
import SettingsPage from './pages/settings'

// Components
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'
import { Toaster } from './components/ui/toaster'

// ✅ Add this import if you use Radix Toast:
import { ToastProvider } from '@radix-ui/react-toast'
// ⚡ OR if you made your own provider in your `toaster` file:
// import { ToastProvider } from './components/ui/toaster'

function App() {
  const { user, loading, setUser, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          clearAuth()
        } else {
          setUser(session?.user || null)
        }
      } catch (error) {
        console.error('Session error:', error)
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, clearAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-background">
          {user && <Navbar />}
          <main className={user ? "pt-16" : ""}>
            <Routes>
              <Route 
                path="/" 
                element={user ? <ChatPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/timeline" 
                element={user ? <TimelinePage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/graph" 
                element={user ? <GraphPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/settings" 
                element={user ? <SettingsPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/login" 
                element={!user ? <LoginPage /> : <Navigate to="/" />} 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </ToastProvider>
  )
}

function LoginPage() {
  const { signInWithGoogle, loading } = useAuthStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Life.AI
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Your Memories, Your Life, Fully Yours
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              A smart, open-source personal memory system
            </div>
            
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner className="h-5 w-5" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to use your own API keys and manage your own data.
              <br />
              Your privacy is our priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
