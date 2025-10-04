import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, X, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Profiles', to: '/profiles', icon: Users },
  { name: 'Settings', to: '/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-navy-200 dark:border-navy-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            LeadGrow
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-navy-100 dark:hover:bg-navy-800"
          >
            <X className="h-5 w-5 text-navy-600 dark:text-navy-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400'
                    : 'text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-primary-600 dark:text-primary-500' : ''
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-navy-200 dark:border-navy-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-900 dark:text-navy-100 truncate">
                Admin User
              </p>
              <p className="text-xs text-navy-500 dark:text-navy-400 truncate">
                admin@leadgrow.ai
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

