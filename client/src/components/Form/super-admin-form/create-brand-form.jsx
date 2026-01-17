import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle } from "lucide-react"
import { useCreateBrandMutation } from "@/redux/apis/super-admin/brandApi"

export function CreateBrandModal({ open, onOpenChange }) {
  const [name, setName] = React.useState("")
  const [status, setStatus] = React.useState("idle") // idle | loading | success | error
  const [message, setMessage] = React.useState("")

  const [createBrand] = useCreateBrandMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) return

    setStatus("loading")
    setMessage("")

    try {
      await createBrand({ name }).unwrap()

      setStatus("success")
      setMessage("Brand created successfully")
      setName("")
    } catch (err) {
      console.error(err)
      setStatus("error")
      setMessage(
        err?.data?.message || "Failed to create brand"
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setStatus("idle")
          setMessage("")
          setName("")
        }
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Brand</DialogTitle>
          <DialogDescription>
            Enter the brand name and submit the form.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter brand name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "loading"}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Creating..." : "Create"}
            </Button>
          </form>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            <Button
              className="mt-2"
              onClick={() => {
                setStatus("idle")
                onOpenChange(false)
              }}
            >
              Close
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            <Button
              variant="outline"
              onClick={() => setStatus("idle")}
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
