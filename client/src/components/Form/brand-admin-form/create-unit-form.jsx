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
import { Success } from "@/components/success"
import { Error } from "@/components/error"

export function CreateUnitModal({ open, onOpenChange }) {
  const [status, setStatus] = React.useState("idle")
  const [message, setMessage] = React.useState("")

  const [createUnit] = useCreateUnitMutation()

  const [form, setForm] = React.useState({
    unit: "",
    baseUnit: "",
    conversionRate: "",
  })


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
          setForm({
            unit: "",
            baseUnit: "",
            conversionRate: "",
          })
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
            <Input
              placeholder="Enter Unit (e.g. kg, gm, pc)"
              value={form.unit}
              onChange={(e) =>
                handleChange("unit", e.target.value)
              }
              required
            />

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
          <Success message={message} setStatus={setStatus} onOpenChange={onOpenChange} />
        )}

        {status === "error" && (
          <Error message={message} setStatus={setStatus} />
        )}
      </DialogContent>
    </Dialog>
  )
}
