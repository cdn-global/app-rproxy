import { Flex, Spinner } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Footer from "../components/Common/Footer"
import TopNav from "../components/Common/TopNav"
import useAuth, { isLoggedIn } from "../hooks/useAuth"

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
    <Flex direction="column" minH="100vh" w="100%">
      <TopNav />
      {isLoading ? (
        <Flex justify="center" align="center" flex="1">
          <Spinner size="xl" color="ui.main" />
        </Flex>
      ) : (
        <Flex
          flex="1"
          direction="column"
          maxW="1200px"
          mx="auto"
          w="100%"
          as="main"
        >
          <Outlet />
        </Flex>
      )}
      <Footer />
    </Flex>
  )
}

export default Layout
