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
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

import {
  useCreateBrandManagerMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
} from "@/redux/apis/super-admin/brandApi"

import { Success } from "@/components/success"

export function CreateBrandManagerModal({ open, onOpenChange, id }) {
  const [userName, setUserName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [otp, setOtp] = React.useState("")

  const [status, setStatus] = React.useState("idle") 
  const [message, setMessage] = React.useState("")

  const [otpState, setOtpState] = React.useState("idle") 

  const [createBrandManager] = useCreateBrandManagerMutation()
  const [sendOtp] = useSendOtpMutation()
  const [verifyOtp] = useVerifyOtpMutation()

  const handleSendOtp = async () => {
    setOtpState("sending")
    try {
      await sendOtp({ email }).unwrap()
      setOtpState("sent")
    } catch (err) {
      setOtpState("error")
      setMessage(err?.data?.message || "Failed to send OTP")
    }
  }

  const handleVerifyOtp = async () => {
    setOtpState("verifying")
    try {
      await verifyOtp({ email, otp }).unwrap()
      setOtpState("verified")
    } catch (err) {
      setOtpState("error")
      setMessage(err?.data?.message || "Invalid OTP")
      setOtp("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      await createBrandManager({
        userName,
        email,
        password,
        tenantId: id,
      }).unwrap()

      setStatus("success")
      setMessage("Brand Manager created successfully")

      setUserName("")
      setEmail("")
      setPassword("")
      setOtp("")
      setOtpState("idle")
    } catch (err) {
      setStatus("error")
      setMessage(err?.data?.message || "Failed to create Brand Manager")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Brand Manager</DialogTitle>
          <DialogDescription>
            Verify email before creating brand manager
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

            <div className="space-y-2">
              <Input
                placeholder="Enter email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setOtpState("idle")
                }}
                required
              />

              {otpState === "idle" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendOtp}
                  disabled={!email}
                  className="w-full"
                >
                  Send OTP
                </Button>
              )}

              {otpState === "sending" && (
                <Button disabled className="w-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending OTP...
                </Button>
              )}

              {otpState === "sent" && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />

                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                  >
                    Verify
                  </Button>
                </div>
              )}

              {otpState === "verifying" && (
                <Button disabled className="w-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </Button>
              )}

              {otpState === "verified" && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Email verified successfully
                </div>
              )}
              {otpState === "error" && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </div>
              )}
            </div>

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
              disabled={
                status === "loading" ||
                otpState !== "verified"
              }
            >
              {status === "loading" ? "Creating..." : "Create"}
            </Button>
          </form>
        )}

        {status === "success" && (
          <Success
            message={message}
            onOpenChange={onOpenChange}
            setStatus={setStatus}
          />
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-muted-foreground">{message}</p>

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
