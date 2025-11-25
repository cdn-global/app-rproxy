import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Footer from "../components/Common/Footer"
import TopNav from "../components/Common/TopNav"
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
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={48} />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
