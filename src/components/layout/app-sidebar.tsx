import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, FileText, Search, ChevronRight } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

const mainNavigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Posts', to: '/posts', icon: FileText },
  { name: 'Keyword Search', to: '/keyword-search', icon: Search },
]

const bottomNavigation = [
  { name: 'Profiles', to: '/profiles', icon: Users },
  { name: 'Settings', to: '/settings', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()
  const { setOpen, isMobile, state } = useSidebar()

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-navy-200 dark:border-navy-800"
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
    >
      <SidebarHeader className="border-b border-navy-200 dark:border-navy-800 bg-gradient-to-br from-navy-50 to-white dark:from-navy-900 dark:to-navy-950">
        <div className="flex h-16 items-center px-4 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center flex-shrink-0">
              <img 
                src="/lgLM_icon.png" 
                alt="LG Logo" 
                className="h-8 w-8 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent group-data-[collapsible=icon]:hidden">
              LeadGrow
            </h1>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white dark:bg-navy-900 px-2">
        <div className="flex flex-col h-full py-4">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {mainNavigation.map((item) => {
                  const isActive = location.pathname === item.to
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={`
                          relative h-11 transition-all duration-200
                          ${isActive 
                            ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 text-primary-700 dark:text-primary-400 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900 dark:hover:to-primary-800 shadow-sm' 
                            : 'hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-600 dark:text-navy-400'
                          }
                          group-data-[collapsible=icon]:justify-center
                        `}
                      >
                        <NavLink to={item.to} className="flex items-center gap-3 w-full">
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-500' : ''}`} />
                          <span className="font-medium group-data-[collapsible=icon]:hidden">{item.name}</span>
                          {isActive && (
                            <ChevronRight className="ml-auto h-4 w-4 text-primary-600 dark:text-primary-500 group-data-[collapsible=icon]:hidden" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Spacer to push bottom navigation down */}
          <div className="flex-1" />

          {/* Bottom Navigation */}
          <SidebarGroup>
            <SidebarSeparator className="mb-2" />
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {bottomNavigation.map((item) => {
                  const isActive = location.pathname === item.to
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={`
                          relative h-11 transition-all duration-200
                          ${isActive 
                            ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 text-primary-700 dark:text-primary-400 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900 dark:hover:to-primary-800 shadow-sm' 
                            : 'hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-600 dark:text-navy-400'
                          }
                          group-data-[collapsible=icon]:justify-center
                        `}
                      >
                        <NavLink to={item.to} className="flex items-center gap-3 w-full">
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-500' : ''}`} />
                          <span className="font-medium group-data-[collapsible=icon]:hidden">{item.name}</span>
                          {isActive && (
                            <ChevronRight className="ml-auto h-4 w-4 text-primary-600 dark:text-primary-500 group-data-[collapsible=icon]:hidden" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-navy-200 dark:border-navy-800 bg-gradient-to-br from-white to-navy-50 dark:from-navy-950 dark:to-navy-900 p-3">
        <div className={`flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-navy-100 dark:hover:bg-navy-800 ${state === 'collapsed' ? 'justify-center' : ''}`}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">AU</span>
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-navy-900 dark:text-navy-100 truncate">
              Admin User
            </p>
            <p className="text-xs text-navy-500 dark:text-navy-400 truncate">
              automations@gmail.com
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

