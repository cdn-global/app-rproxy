import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Billing() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            This is the billing page.
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default Billing
