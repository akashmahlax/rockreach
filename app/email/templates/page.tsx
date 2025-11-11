import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LayoutTemplate } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TemplatesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Email Templates</h1>
        <p className="text-[#605A57] mt-2">AI-generated email templates for outreach</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Library of customizable email templates with AI assistance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Template library is being built. Upcoming features:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Pre-built templates for common scenarios</li>
            <li>AI-powered template generation</li>
            <li>Variable placeholders for personalization</li>
            <li>Template categories and tags</li>
            <li>Performance metrics per template</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
