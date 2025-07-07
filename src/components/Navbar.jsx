import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { cn } from '../lib/utils'
import { 
  MessageCircle, 
  Clock, 
  Network, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Brain,
  User
} from 'lucide-react'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuthStore()
  const location = useLocation()

  const navItems = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageCircle,
      description: 'Talk with AI and save memories'
    },
    {
      name: 'Timeline',
      href: '/timeline',
      icon: Clock,
      description: 'View your memories chronologically'
    },
    {
      name: 'Graph',
      href: '/graph',
      icon: Network,
      description: 'Explore knowledge connections'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Manage preferences and backups'
    }
  ]

  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
  }

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Life.AI
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="text-sm">
                  <div className="text-gray-900 dark:text-white font-medium">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    {user?.email}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          
          {/* Mobile user section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
            <div className="flex items-center px-5 mb-3">
              <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="px-2">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 w-full px-3 py-2 text-base font-medium text-red-600 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar