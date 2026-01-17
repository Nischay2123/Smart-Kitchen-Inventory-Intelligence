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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { CheckCircle2, XCircle } from "lucide-react"
import { useCreateUnitMutation } from "@/redux/apis/brand-admin/baseUnitApi"

export function CreateUnitModal({ open, onOpenChange }) {
  const [status, setStatus] = React.useState("idle")
  const [message, setMessage] = React.useState("")

  const [createUnit] = useCreateUnitMutation()

  const [form, setForm] = React.useState({
    unit: "",
    baseUnit: "",
    conversionRate: "",
  })

  const unitOptions = [
    { value: "gm", label: "Gram (gm)" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "ml", label: "Milliliter (ml)" },
    { value: "l", label: "Liter (l)" },
    { value: "piece", label: "Piece (pc)" },
  ]

  const baseUnitOptions = [
    { value: "gm", label: "Gram (gm)" },
    { value: "ml", label: "Milliliter (ml)" },
    { value: "piece", label: "Piece (pc)" },
  ]

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setStatus("loading")
    setMessage("")

    try {
      await createUnit({
        unit: form.unit,
        baseUnit: form.baseUnit,
        conversionRate: Number(form.conversionRate),
      }).unwrap()

      setStatus("success")
      setMessage("Unit created successfully")

      setForm({
        unit: "",
        baseUnit: "",
        conversionRate: "",
      })
    } catch (err) {
      console.error(err)
      setStatus("error")
      setMessage(err?.data?.message || "Failed to create unit")
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
          <DialogTitle>Create Unit</DialogTitle>
          <DialogDescription>
            Define a unit and its conversion to a base unit.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Unit */}
            <Select
              value={form.unit}
              onValueChange={(val) =>
                handleChange("unit", val)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((unit) => (
                  <SelectItem
                    key={unit.value}
                    value={unit.value}
                  >
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Base Unit */}
            <Select
              value={form.baseUnit}
              onValueChange={(val) =>
                handleChange("baseUnit", val)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Base Unit" />
              </SelectTrigger>
              <SelectContent>
                {baseUnitOptions.map((unit) => (
                  <SelectItem
                    key={unit.value}
                    value={unit.value}
                  >
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Conversion Rate */}
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="Conversion Rate (e.g. 1000)"
              value={form.conversionRate}
              onChange={(e) =>
                handleChange("conversionRate", e.target.value)
              }
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading"
                ? "Creating..."
                : "Create Unit"}
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
