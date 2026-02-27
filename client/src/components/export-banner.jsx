import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Banner = ({ label, onExport, isLoading }) => (
  <div
    style={{
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
      border: "1px solid #c7d2fe",
      borderRadius: "12px",
      padding: "28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      alignItems: "flex-start",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "22px" }}>📅</span>
      <h3
        style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: 700,
          color: "#3730a3",
        }}
      >
        Date Range Exceeds 1 Month
      </h3>
    </div>
    <p
      style={{
        margin: 0,
        color: "#4b5563",
        fontSize: "14px",
        lineHeight: "1.6",
      }}
    >
      Displaying <strong>{label}</strong> data for more than 30 days directly
      would be too large to render. Instead, click below to generate a CSV
      report — it will be emailed to you once ready.
    </p>
    <button
      onClick={onExport}
      disabled={isLoading}
      style={{
        marginTop: "4px",
        background: isLoading ? "#a5b4fc" : "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 22px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: isLoading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "background 0.2s",
      }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid #fff",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Requesting…
        </>
      ) : (
        <>📧 Request CSV Export</>
      )}
    </button>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const EmailDialog = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  const handleSubmit = () => {
    if (!email || !confirmEmail) {
      toast.error("Please enter and confirm your email.");
      return;
    }
    if (email !== confirmEmail) {
      toast.error("Emails do not match.");
      return;
    }
    onSubmit(email);
    setEmail("");
    setConfirmEmail("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setEmail("");
          setConfirmEmail("");
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Receive Report via Email</DialogTitle>
          <DialogDescription>
            Please enter the email address where you would like to receive the
            requested CSV report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="export-email">Email</Label>
            <Input
              id="export-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="export-confirm-email">Confirm Email</Label>
            <Input
              id="export-confirm-email"
              type="email"
              placeholder="Confirm your email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Requesting..." : "Send Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const ExportBanner = ({ label, isLoading, onExport }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (email) => {
    onExport(email);
    setDialogOpen(false);
  };

  return (
    <>
      <Banner
        label={label}
        isLoading={isLoading}
        onExport={() => setDialogOpen(true)}
      />
      <EmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
};

export default ExportBanner;
