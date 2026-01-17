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

  const {
    data: unitsData,
    isLoading: unitsLoading,
    isError: unitsError,
  } = useGetAllUnitsQuery()

  const [form, setForm] = React.useState({
    name: "",
    unit: "",
  })

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
    console.log(form);
    
    try {
      await createIngredient({
        name: form.name,
        unitId: form.unit,
      }).unwrap()

      setStatus("success")
      setMessage("Item created successfully")

      setForm({
        name: "",
        unit: "",
      })
    } catch (err) {
      console.error(err)
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
            Add a new item and select its unit.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <Input
              placeholder="Item Name"
              value={form.name}
              onChange={(e) =>
                handleChange("name", e.target.value)
              }
              required
            />

            {/* Unit */}
            <Select
              value={form.unit}
              onValueChange={(val) =>
                handleChange("unit", val)
              }
              required
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    unitsLoading
                      ? "Loading units..."
                      : "Select Unit"
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

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading" || unitsLoading}
            >
              {status === "loading"
                ? "Creating..."
                : "Create Item"}
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
