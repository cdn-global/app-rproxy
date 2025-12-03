import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LlmService() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>LLM Service</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            This is the LLM Service page.
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default LlmService
