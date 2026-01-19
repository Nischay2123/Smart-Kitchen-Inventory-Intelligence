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
import { useCreateIngredientsMutation } from "@/redux/apis/brand-admin/ingredientApi"
import { useGetAllUnitsQuery } from "@/redux/apis/brand-admin/baseUnitApi"

export function CreateIngredientModal({ open, onOpenChange }) {
  const [status, setStatus] = React.useState("idle")
  const [message, setMessage] = React.useState("")

  const [createIngredient] = useCreateIngredientsMutation()

  const { data: unitsData, isLoading: unitsLoading } =
    useGetAllUnitsQuery()

  const [form, setForm] = React.useState({
    name: "",
    unit: "",
    threshold: {
      lowInBase: "",
      criticalInBase: "",
    },
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleThresholdChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      threshold: {
        ...prev.threshold,
        [field]: Number(value),
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      await createIngredient({
        name: form.name,
        unitId: form.unit,
        threshold: form.threshold,
      }).unwrap()

      setStatus("success")
      setMessage("Item created successfully")

      setForm({
        name: "",
        unit: "",
        threshold: {
          lowInBase: "",
          criticalInBase: "",
        },
      })
    } catch (err) {
      setStatus("error")
      setMessage(err?.data?.message || "Failed to create item")
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
          <DialogTitle>Create Item</DialogTitle>
          <DialogDescription>
            Add a new item and configure its thresholds.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <Input
              placeholder="Item Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />

            {/* Unit */}
            <Select
              value={form.unit}
              onValueChange={(val) => handleChange("unit", val)}
              required
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    unitsLoading ? "Loading units..." : "Select Unit"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {unitsData?.data?.map((unit) => (
                  <SelectItem key={unit._id} value={unit._id}>
                    {unit.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-3">
              <label>low Threshold:</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Low Threshold"
                value={form.threshold.lowInBase}
                onChange={(e) =>
                  handleThresholdChange("lowInBase", e.target.value)
                }
                required
              />

              <label>Critical Threshold:</label>
              <Input
                type="number"
                min={0}
                step = {0.01}
                placeholder="Critical Threshold"
                value={form.threshold.criticalInBase}
                onChange={(e) =>
                  handleThresholdChange("criticalInBase", e.target.value)
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading" || unitsLoading}
            >
              {status === "loading" ? "Creating..." : "Create Item"}
            </Button>
          </form>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">{message}</p>
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
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" onClick={() => setStatus("idle")}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
