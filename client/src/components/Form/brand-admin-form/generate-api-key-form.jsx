import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useGenerateApiKeyMutation } from "@/redux/apis/brand-admin/posApiKeyApi";
import { useGetAllOutletsQuery } from "@/redux/apis/brand-admin/outletApi";

export function GenerateApiKeyModal({ open, onOpenChange }) {
  const [selectedOutlet, setSelectedOutlet] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [generatedKey, setGeneratedKey] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const { data: outletsData, isLoading: outletsLoading } = useGetAllOutletsQuery();
  const [generateApiKey, { isLoading }] = useGenerateApiKeyMutation();

  const resetForm = () => {
    setSelectedOutlet("");
    setDescription("");
    setGeneratedKey("");
    setCopied(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedOutlet) {
      toast.error("Please select an outlet");
      return;
    }

    try {
      const result = await generateApiKey({
        outletId: selectedOutlet,
        description: description || undefined,
      }).unwrap();

      setGeneratedKey(result.data.apiKey);
      toast.success("API Key generated successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to generate API Key");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success("API Key copied to clipboard");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleClose = (val) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate POS API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for external POS systems to submit sales data
          </DialogDescription>
        </DialogHeader>

        {!generatedKey ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Outlet</label>
              <Select
                value={selectedOutlet}
                onValueChange={setSelectedOutlet}
                disabled={outletsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outletsData?.data?.map((outlet) => (
                    <SelectItem key={outlet._id} value={outlet._id}>
                      {outlet.outletName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Main POS system integration"
                className="w-full min-h-20 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                maxLength={200}
              />
              {description && (
                <p className="text-xs text-muted-foreground">
                  {description.length}/200 characters
                </p>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The API key will only be shown once. Make sure to copy and store it securely.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !selectedOutlet}
            >
              {isLoading ? "Generating..." : "Generate API Key"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert variant="success" className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                API Key generated successfully! Copy it now - you won't be able to see it again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {generatedKey}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className={copied ? "bg-green-50 border-green-500" : ""}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Store this key securely. Configure your POS system to send this key in the 
                <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">X-API-Key</code> 
                header with each request.
              </AlertDescription>
            </Alert>

            <Button
              type="button"
              className="w-full"
              onClick={() => handleClose(false)}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
