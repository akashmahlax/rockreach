import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Inbox } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function InboxPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Email Inbox</h1>
        <p className="text-[#605A57] mt-2">Track lead responses in unified inbox</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Unified inbox for tracking and managing lead responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email inbox feature in development. Will provide:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Spreadsheet view of all lead responses</li>
            <li>Webhook integration for reply tracking</li>
            <li>Response analytics and metrics</li>
            <li>Quick reply functionality</li>
            <li>Lead status updates based on responses</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
