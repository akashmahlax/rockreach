import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Code } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ApiDocsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">API Integration</h1>
        <p className="text-[#605A57] mt-2">Integrate Logician API in your applications</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Developer documentation for Logician REST API endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            API documentation is in progress. This will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Authentication and API keys</li>
            <li>RESTful endpoint reference</li>
            <li>Request/response examples</li>
            <li>Rate limiting and quotas</li>
            <li>SDK libraries and code samples</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
