import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useUpdatePermissionMutation } from "@/redux/apis/brand-admin/outletApi"
import { toast } from "sonner"

export default function TickModal({
  open,
  setOpen,
  initialPermissions,
  outletManagerId,
}) {
  const [permissions, setPermissions] = useState(initialPermissions || {})
  const [updatePermission, { isLoading }] = useUpdatePermissionMutation()

  useEffect(() => {
    if (initialPermissions) {
      setPermissions(initialPermissions)
    }
  }, [initialPermissions])

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleUpdate = async () => {
    try {
      await updatePermission({
        userId: outletManagerId,
        permissions,
      }).unwrap()

      toast.success("Permissions updated successfully")
      setOpen(false)

    } catch (error) {
      console.error("Permission update failed", error)
      toast.error("Failed to update permissions")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Outlet Manager Permissions</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {Object.entries(permissions).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between border rounded-xl px-4 py-3"
            >
              <span className="font-medium">{key}</span>
              <Checkbox
                checked={value}
                onCheckedChange={() => togglePermission(key)}
              />
            </div>
          ))}

          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
