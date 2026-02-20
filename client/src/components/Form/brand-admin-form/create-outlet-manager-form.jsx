import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XCircle } from "lucide-react";

import {
  useCreateOutletManagerMutation,
  useSendOtpOutletMutation,
  useVerifyOtpOutletMutation,
} from "@/redux/apis/brand-admin/outletApi";

import { Success } from "@/components/success";
import { EmailOtpVerification } from "@/components/emailOtpVerification";
import { isValidPassword } from "@/utils/password";

export function CreateOutletManagerModal({ open, onOpenChange, id }) {
  const [userName, setUserName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState("idle");
  const [message, setMessage] = React.useState("");
  const [isVerified, setIsVerified] = React.useState(false);

  const [createOutletManager] = useCreateOutletManagerMutation();
  const [sendOtp] = useSendOtpOutletMutation();
  const [verifyOtp] = useVerifyOtpOutletMutation();

  const isPasswordValid = React.useMemo(
    () => isValidPassword(password),
    [password]
  );

  const resetForm = () => {
    setUserName("");
    setEmail("");
    setPassword("");
    setStatus("idle");
    setMessage("");
    setIsVerified(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) return;

    setStatus("loading");
    try {
      await createOutletManager({
        userName,
        email,
        password,
      }).unwrap();

      setStatus("success");
      setMessage("Outlet Manager created successfully");
    } catch (err) {
      setStatus("error");
      setMessage(err?.data?.message || "Failed to create Outlet Manager");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetForm();
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Outlet Manager</DialogTitle>
          <DialogDescription>
            Verify email before creating outlet manager
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

            <EmailOtpVerification
              email={email}
              setEmail={setEmail}
              sendOtp={sendOtp}
              verifyOtp={verifyOtp}
              extraSendPayload={{ outletId: id }}
              onVerified={() => setIsVerified(true)}
            />

            <Input
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && !isPasswordValid && (
              <p className="text-xs text-red-500">
                Password must be at least 8 characters and include one letter and one number
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading" || !isVerified || !isPasswordValid}
            >
              {status === "loading" ? "Creating..." : "Create"}
            </Button>
          </form>
        )}

        {status === "success" && (
          <Success
            message={message}
            onOpenChange={onOpenChange}
            resetForm={resetForm}
            setStatus={setStatus}
          />
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
  );
}
