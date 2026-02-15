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

import { useCreateIngredientsMutation } from "@/redux/apis/brand-admin/ingredientApi"
import { useGetAllUnitsQuery } from "@/redux/apis/brand-admin/baseUnitApi"

import { MultiUnitPicker } from "@/components/MultiUnitPicker"
import { Success } from "@/components/success"
import { Error } from "@/components/error"

export function CreateIngredientModal({ open, onOpenChange }) {

  const [status, setStatus] = React.useState("idle")
  const [message, setMessage] = React.useState("")

  const [createIngredient] = useCreateIngredientsMutation()
  const { data: unitsData, isLoading: unitsLoading } =
    useGetAllUnitsQuery()


  const [form, setForm] = React.useState({
    name: "",
    unitIds: [],

    threshold: {
      low: "",
      critical: "",
      unitId: "",
    },
  })


  const handleThresholdChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      threshold: {
        ...prev.threshold,
        [field]: value,
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

        unitIds: form.unitIds,

        threshold: {
          low: form.threshold.low,
          critical: form.threshold.critical,
          unitId: form.threshold.unitId,
        },
      }).unwrap()


      setStatus("success")
      setMessage("Ingredient created successfully")

      // reset
      setForm({
        name: "",
        unitIds: [],
        threshold: {
          low: "",
          critical: "",
          unitId: "",
        },
      })

    } catch (err) {
      setStatus("error")
      setMessage(
        err?.data?.message || "Failed to create ingredient"
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
        }
        onOpenChange(val)
      }}
    >

      <DialogContent className="sm:max-w-md">

        <DialogHeader>
          <DialogTitle>Create Ingredient</DialogTitle>

          <DialogDescription>
            Add ingredient, allowed units and threshold.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NAME */}
            <Input
              placeholder="Ingredient Name"
              value={form.name}
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  name: e.target.value,
                }))
              }
              required
            />

            <MultiUnitPicker
              units={unitsData?.data || []}
              value={form.unitIds}
              onChange={(arr) =>
                setForm(p => ({
                  ...p,
                  unitIds: arr,

                  // reset threshold unit if removed
                  threshold: {
                    ...p.threshold,
                    unitId: arr.includes(p.threshold.unitId)
                      ? p.threshold.unitId
                      : "",
                  },
                }))
              }
            />

            {form.unitIds.length > 0 && (
              <div className="space-y-2">

                <p className="text-sm font-medium">
                  Threshold Unit
                </p>

                <div className="flex flex-wrap gap-2">

                  {unitsData?.data
                    ?.filter(u =>
                      form.unitIds.includes(u._id)
                    )
                    .map(unit => (

                      <button
                        key={unit._id}
                        type="button"

                        onClick={() =>
                          handleThresholdChange(
                            "unitId",
                            unit._id
                          )
                        }

                        className={`
                          px-3 py-1 rounded border text-sm
                          ${
                            form.threshold.unitId ===
                            unit._id
                              ? "bg-primary text-white"
                              : "bg-background"
                          }
                        `}
                      >
                        {unit.unit}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">

              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Low Threshold"
                value={form.threshold.low}
                onChange={(e) =>
                  handleThresholdChange(
                    "low",
                    e.target.value
                  )
                }
                required
              />

              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Critical Threshold"
                value={form.threshold.critical}
                onChange={(e) =>
                  handleThresholdChange(
                    "critical",
                    e.target.value
                  )
                }
                required
              />

            </div>

            <Button
              type="submit"
              className="w-full"

              disabled={
                status === "loading" ||
                unitsLoading ||
                form.unitIds.length === 0 ||
                !form.threshold.unitId
              }
            >
              {status === "loading"
                ? "Creating..."
                : "Create Ingredient"}
            </Button>

          </form>
        )}

        {status === "success" && (
          <Success onOpenChange={onOpenChange} />
        )}

        {status === "error" && (
          <Error setStatus={setStatus} message={message}/>
        )}

      </DialogContent>
    </Dialog>
  )
}
