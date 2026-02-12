import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react" // This is fine
import ReactDOM from "react-dom/client"
import { OpenAPI } from "./client"
import { ThemeProvider } from "./providers/theme-provider"
import { routeTree } from "./routeTree.gen"
import "./styles/global.css"
import { Toaster } from "./components/ui/toaster"

// In Vite dev mode the dev-server proxy forwards /v2 → localhost:8000,
// so we use "" (same-origin relative paths) to avoid CORS entirely.
// In production builds we hit the real API.
OpenAPI.BASE = import.meta.env.DEV ? "" : "https://api.roamingproxy.com"
OpenAPI.TOKEN = async () => localStorage.getItem("access_token") || ""

console.log("🔧 API Base URL:", OpenAPI.BASE)

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)
