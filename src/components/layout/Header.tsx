import { Moon, Sun, Menu } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-16 border-b border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900">
      <div className="flex h-full items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SidebarTrigger>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-navy-900 dark:text-navy-50">
              LinkedIn Engagement Monitor
            </h2>
            <p className="hidden sm:block text-sm text-navy-500 dark:text-navy-400">
              Track and analyze profile engagement in real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}

