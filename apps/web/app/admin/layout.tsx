import { AdminGuard } from '@/modules/admin/components/AdminGuard'
import { AdminSidebar } from '@/modules/admin/components/AdminSidebar'
import { AdminHeader } from '@/modules/admin/components/AdminHeader'
import { Toaster } from '@/components/ui/sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  
  return (
    <AdminGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </AdminGuard>
  )
}
