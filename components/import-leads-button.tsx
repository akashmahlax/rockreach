'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export function ImportLeadsButton() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/leads/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult({
        imported: data.imported,
        failed: data.failed,
        errors: data.errors || [],
      });

      if (data.failed === 0) {
        toast.success(`Successfully imported ${data.imported} leads!`);
      } else {
        toast.warning(`Imported ${data.imported} leads. ${data.failed} rows failed.`);
      }
    } catch (error: unknown) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[rgba(55,50,47,0.12)] text-[#37322F] hover:bg-white"
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#37322F]">Import Leads from CSV</DialogTitle>
          <DialogDescription className="text-[#605A57]">
            Upload a CSV file to import leads. The file should include columns like name, email, company, title, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result && !importing && (
            <div className="border-2 border-dashed border-[rgba(55,50,47,0.12)] rounded-lg p-8 text-center hover:border-[rgba(55,50,47,0.24)] transition-colors">
              <Upload className="mx-auto h-12 w-12 text-[#605A57] mb-4" />
              <p className="text-sm text-[#605A57] mb-4">
                Click to select a CSV file or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#37322F] hover:bg-[#37322F]/90 text-white"
              >
                Select CSV File
              </Button>
            </div>
          )}

          {importing && (
            <div className="space-y-4 py-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#37322F]" />
              </div>
              <p className="text-center text-sm text-[#605A57]">
                Processing CSV file...
              </p>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-[#F7F5F3] border border-[rgba(55,50,47,0.12)] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {result.failed === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-[#37322F]">Import Complete</p>
                    <p className="text-sm text-[#605A57]">
                      Successfully imported {result.imported} leads
                      {result.failed > 0 && `, ${result.failed} rows failed`}
                    </p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-[#37322F]">Errors:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200"
                        >
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setResult(null);
                    fileInputRef.current?.click();
                  }}
                  variant="outline"
                  className="flex-1 border-[rgba(55,50,47,0.12)]"
                >
                  Import Another File
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-[#37322F] hover:bg-[#37322F]/90 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
