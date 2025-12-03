import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Footer from "../components/Common/Footer"
import SideNav from "../components/Common/SideNav"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { Spinner } from "@/components/ui/spinner"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const { isLoading } = useAuth()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SideNav />
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size={48} />
            </div>
          ) : (
            <Outlet />
          )}
        </main>

      </div>
            <Footer />  
    </div>
    
  )
}

export default Layout