import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col sm:min-h-[calc(100vh-4rem)] md:flex-row">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  )
}
