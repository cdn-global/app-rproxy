import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  const [open, setOpen] = useState(false)

  return (
    <Card className="border border-destructive/20 bg-white/80 shadow-[0_32px_80px_-48px_rgba(220,38,38,0.45)] backdrop-blur-2xl dark:border-destructive/40 dark:bg-slate-900/70 dark:shadow-[0_32px_80px_-48px_rgba(220,38,38,0.55)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-destructive">Delete account</CardTitle>
        <CardDescription>
          Permanently remove your account and all related data from Roaming Proxy Network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Make sure you have exported any data you need before deleting your account.
        </p>
        <Button
          variant="destructive"
          className="rounded-full"
          onClick={() => setOpen(true)}
        >
          Delete account
        </Button>
      </CardContent>
      <DeleteConfirmation open={open} onOpenChange={setOpen} />
    </Card>
  )
}

export default DeleteAccount
