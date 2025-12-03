import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LanguageModel() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Language Model</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            This is the language model index page.
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default LanguageModel
