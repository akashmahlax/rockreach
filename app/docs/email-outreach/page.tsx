import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EmailOutreachGuidePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Email Campaign Guide</h1>
        <p className="text-[#605A57] mt-2">Setup AI-powered email campaigns</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Comprehensive guide for creating effective email outreach campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email campaign documentation in development. Will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>SMTP configuration setup</li>
            <li>Using AI-generated templates</li>
            <li>Personalization strategies</li>
            <li>Tracking responses and analytics</li>
            <li>Email deliverability best practices</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
