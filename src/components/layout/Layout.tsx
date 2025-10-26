import { Outlet } from 'react-router-dom'
import { AppSidebar } from './app-sidebar'
import Header from './Header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

