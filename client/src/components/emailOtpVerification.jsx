import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function EmailOtpVerification({
  email,
  setEmail,
  sendOtp,
  verifyOtp,
  extraSendPayload = {},
  onVerified,
}) {
  const [otp, setOtp] = React.useState("");
  const [otpState, setOtpState] = React.useState("idle");
  const [otpError, setOtpError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");

  const [expiresAt, setExpiresAt] = React.useState(null);
  const [timer, setTimer] = React.useState(0);

  React.useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000)
      );
      setTimer(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleSendOtp = async () => {
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setOtpState("sending");
    setOtpError("");

    try {
      await sendOtp({ email, ...extraSendPayload }).unwrap();
      setOtpState("sent");
      setExpiresAt(Date.now() + 1.5 * 60 * 1000);
    } catch (err) {
      setOtpState("idle");
      setOtpError(err?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setOtpState("verifying");
    setOtpError("");

    try {
      await verifyOtp({ email, otp }).unwrap();
      setOtpState("verified");
      setExpiresAt(null);
      onVerified();
    } catch (err) {
      setOtpState("sent");
      setOtpError(err?.data?.message || "Invalid OTP");
      setOtp("");
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Enter email"
        value={email}
        disabled={otpState !== "idle"}
        onChange={(e) => {
          const val = e.target.value;
          setEmail(val);

          if (!val) setEmailError("");
          else if (!emailRegex.test(val))
            setEmailError("Please enter a valid email address");
          else setEmailError("");
        }}
        required
      />

      {emailError && (
        <p className="text-xs text-red-500">{emailError}</p>
      )}

      {(otpState === "idle" || otpState === "sent") && (
        <Button
          type="button"
          variant="outline"
          onClick={handleSendOtp}
          disabled={!emailRegex.test(email) || timer > 0}
          className="w-full"
        >
          {timer > 0
            ? `Resend OTP in ${Math.floor(timer / 60)}:${String(
                timer % 60
              ).padStart(2, "0")}`
            : "Send OTP"}
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
            maxLength={6}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
          />
          <Button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6}
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

      {otpError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <XCircle className="h-4 w-4" />
          {otpError}
        </div>
      )}
    </div>
  );
}
