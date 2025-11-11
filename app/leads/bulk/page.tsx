import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function BulkUploadPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Bulk Lead Upload</h1>
        <p className="text-[#605A57] mt-2">Upload companies + roles for bulk lead enrichment</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Upload a CSV of companies with desired roles/designations, and we&apos;ll automatically find and enrich leads for you in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature is currently under development. Soon you&apos;ll be able to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Upload CSV files with company names</li>
            <li>Manually enter company lists</li>
            <li>Select target roles/designations (CEO, CTO, Marketing Manager, etc.)</li>
            <li>Batch process lead enrichment</li>
            <li>Export results to CSV/Excel</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
