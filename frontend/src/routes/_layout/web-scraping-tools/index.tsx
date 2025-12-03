import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/web-scraping-tools/')({
  component: WebScrapingToolsIndex,
})

function WebScrapingToolsIndex() {
  return (
    <div className="p-2">
      <h3>Welcome to Web Scraping Tools!</h3>
    </div>
  )
}
