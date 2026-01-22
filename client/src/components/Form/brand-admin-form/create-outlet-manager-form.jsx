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

import { useCreateOutletManagerMutation } from "@/redux/apis/brand-admin/outletApi"
import { Success } from "@/components/success"
import { Error } from "@/components/error"

export function CreateOutletManagerModal({ open, onOpenChange,id }) {
  const [userName, setUserName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [status, setStatus] = React.useState("idle")
  const [message, setMessage] = React.useState("")

  const [createOutletManager] = useCreateOutletManagerMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    
    try {
      await createOutletManager({
        userName,
        email,
        password,
        outletId:id
      }).unwrap()

      setStatus("success")
      setMessage("Brand Manager created successfully")

      setUserName("")
      setEmail("")
      setPassword("")
    } catch (err) {
      setStatus("error")
      setMessage(
        err?.data?.message || "Failed to create Brand Manager"
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Outlet Manager</DialogTitle>
          <DialogDescription>
            Enter the outlet manager details and submit the form.
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />

            <Input
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          < Success message={message} onOpenChange={onOpenChange} setStatus={setStatus} />
        )}

        {status === "error" && (
          <Error message={message} setStatus={setStatus} />
        )}
      </DialogContent>
    </Dialog>
  )
}
