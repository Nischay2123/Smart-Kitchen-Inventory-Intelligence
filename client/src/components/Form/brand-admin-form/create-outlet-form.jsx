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
import { useCreateOutletMutation } from "@/redux/apis/brand-admin/outletApi"

export function CreateOutletModal({ open, onOpenChange }) {
  const [status, setStatus] = React.useState("idle") // idle | loading | success | error
  const [message, setMessage] = React.useState("")
  const [createOutlet ] = useCreateOutletMutation()
  const [form, setForm] = React.useState({
    outletName: "",
    address: {
      line: "",
      city: "",
      state: "",
      pincode: "",
    },
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setStatus("loading")
    setMessage("")

    try {
      await createOutlet({outletName:form.outletName, address:form.address})

      setStatus("success")
      setMessage("Outlet payload logged successfully")

      setForm({
        outletName: "",
        address: {
          line: "",
          city: "",
          state: "",
          pincode: "",
        },
      })
    } catch (err) {
      console.error(err)
      setStatus("error")
      setMessage("Something went wrong")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setStatus("idle")
          setMessage("")
        }
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Outlet</DialogTitle>
          <DialogDescription>
            Enter outlet and address details.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Outlet Name"
              value={form.outletName}
              onChange={(e) =>
                handleChange("outletName", e.target.value)
              }
              required
            />

            <Input
              placeholder="Address Line"
              value={form.address.line}
              onChange={(e) =>
                handleAddressChange("line", e.target.value)
              }
              required
            />

            <Input
              placeholder="City"
              value={form.address.city}
              onChange={(e) =>
                handleAddressChange("city", e.target.value)
              }
              required
            />

            <Input
              placeholder="State"
              value={form.address.state}
              onChange={(e) =>
                handleAddressChange("state", e.target.value)
              }
              required
            />

            <Input
              placeholder="Pincode"
              value={form.address.pincode}
              onChange={(e) =>
                handleAddressChange("pincode", e.target.value)
              }
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting..." : "Submit"}
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
