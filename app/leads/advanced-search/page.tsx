import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdvancedSearchPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Advanced Lead Search</h1>
        <p className="text-[#605A57] mt-2">Search by company + niche + designation</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Advanced search combining company name, industry niche, and target designation for precise lead discovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature is currently under development. Soon you&apos;ll be able to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Search by company name with autocomplete</li>
            <li>Filter by industry niche/category</li>
            <li>Target specific designations and seniority levels</li>
            <li>Save search queries for reuse</li>
            <li>View detailed lead profiles and contact info</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
