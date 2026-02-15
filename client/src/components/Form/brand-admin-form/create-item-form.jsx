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
import { useCreateItemMutation } from "@/redux/apis/brand-admin/itemApi"
import { Success } from "@/components/success"
import { Error } from "@/components/error"

export function CreateItemModal({ open, onOpenChange, isUpdate=false }) {
  const [status, setStatus] = React.useState("idle") 
  const [message, setMessage] = React.useState("")

  const [createItem] = useCreateItemMutation()

  const [form, setForm] = React.useState({
    itemName: "",
    price: "",
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

    try {
      await createItem([{
        itemName: form.itemName,
        price: Number(form.price),
      }]).unwrap()

      setStatus("success")
      setMessage("Item created successfully")

      setForm({
        itemName: "",
        price: "",
      })
    } catch (err) {
      console.error(err)
      setStatus("error")
      setMessage(
        err?.data?.message || "Failed to create item"
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
          <DialogTitle>Create Item</DialogTitle>
          <DialogDescription>
            Add a new menu item.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Item Name"
              value={form.itemName}
              onChange={(e) =>
                handleChange("itemName", e.target.value)
              }
              required
            />

            <Input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) =>
                handleChange("price", e.target.value)
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
                : "Create Item"}
            </Button>
          </form>
        )}

        {status === "success" && (
            < Success message={message} onOpenChange={onOpenChange} setStatus={setStatus} />
        )}

        {status === "error" && (
          <Error message={message} setStatus={setStatus} />
        )}
      </DialogContent>
    </Dialog>
  )
}
