import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EmailSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Email Settings</h1>
        <p className="text-[#605A57] mt-2">Configure SMTP and email accounts</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Configure email sending settings and SMTP credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email settings page under construction. Will allow you to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Configure SMTP server settings</li>
            <li>Add multiple email accounts</li>
            <li>Set default sender information</li>
            <li>Configure reply-to addresses</li>
            <li>Test email connectivity</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
