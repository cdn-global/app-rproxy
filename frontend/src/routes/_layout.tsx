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
    <div className="flex min-h-screen w-full flex-col">
      <div className="grid flex-1 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="sticky top-0 h-screen">
          <SideNav />
        </div>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto">
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