import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function BulkUploadGuidePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#37322F] font-serif">Bulk Upload Guide</h1>
        <p className="text-[#605A57] mt-2">Learn to upload companies and extract leads</p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Step-by-step guide for bulk lead enrichment workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bulk upload documentation coming soon. Will cover:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>CSV format requirements</li>
            <li>Selecting target roles effectively</li>
            <li>Batch processing best practices</li>
            <li>Exporting and using enriched data</li>
            <li>Troubleshooting common issues</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
