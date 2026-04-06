import { AdminGuard } from '@/modules/admin/components/AdminGuard'
import { AdminSidebar } from '@/modules/admin/components/AdminSidebar'
import { AdminHeader } from '@/modules/admin/components/AdminHeader'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from '@/components/ui/sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AdminGuard>
        <div className="admin-panel flex h-screen overflow-hidden bg-[#f7f6f4]">
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </AdminGuard>
    </QueryProvider>
  )
}
