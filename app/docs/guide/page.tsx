import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PlatformGuidePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Platform Guide</h1>
        <p className="text-[#605A57] mt-2">Learn how to use Logician effectively</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Comprehensive documentation on using all Logician features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Documentation is being prepared. This will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Getting started guide</li>
            <li>Lead search best practices</li>
            <li>Bulk upload workflows</li>
            <li>Email campaign strategies</li>
            <li>Tips for maximizing lead quality</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
