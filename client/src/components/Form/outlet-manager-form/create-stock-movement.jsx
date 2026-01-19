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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, XCircle } from "lucide-react"

import { useCreateStockMovementMutation } from "@/redux/apis/outlet-manager/stockMovementApi"

export function CreateStockMovementForm({
  open,
  onOpenChange,
  ingredient,        // from parent row
}) {
  const [createStockMovement] = useCreateStockMovementMutation();

  const [ingredientMasterId, setIngredientMasterId] = React.useState("");
  const [delta, setDelta] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [purchasePrice, setPurchasePrice] = React.useState("");

  const [status, setStatus] = React.useState("idle");
  const [message, setMessage] = React.useState("");

  // 👇 Unit directly from parent
  const unitName = ingredient?.unit ?? "";
  const ingredientName = ingredient?.ingredientName ?? "";

  /* Prefill when modal opens */
  React.useEffect(() => {
    if (ingredient) {
      setIngredientMasterId(ingredient.ingredientMasterId);
    }
  }, [ingredient]);

  const resetForm = () => {
    setDelta("");
    setReason("");
    setPurchasePrice("");
    setStatus("idle");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");
    setMessage("");

    try {
      await createStockMovement({
        ingredientMasterId,
        quantity: Number(delta),
        reason,
        purchasePrice:
          reason === "PURCHASE" ? Number(purchasePrice) : undefined,
      }).unwrap();

      setStatus("success");
      setMessage("Stock movement created successfully");
    } catch (err) {
      setStatus("error");
      setMessage(
        err?.data?.message || "Failed to create stock movement"
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Stock Movement</DialogTitle>
          <DialogDescription>
            Adjust stock for selected ingredient
          </DialogDescription>
        </DialogHeader>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ✅ READ ONLY INGREDIENT */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Ingredient
              </label>

              <div className="px-3 py-2 border rounded bg-muted">
                {ingredientName || "—"}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Quantity"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                required
                disabled={status === "loading"}
              />

              {unitName && (
                <span className="text-sm text-muted-foreground">
                  {unitName}
                </span>
              )}
            </div>

            {/* Reason */}
            <Select
              value={reason}
              onValueChange={setReason}
              disabled={status === "loading"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select movement type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="PURCHASE">
                  Purchase
                </SelectItem>

                <SelectItem value="POSITIVE_ADJUSTMENT">
                  Positive Adjustment
                </SelectItem>

                <SelectItem value="NEGATIVE_ADJUSTMENT">
                  Negative Adjustment
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Purchase Price */}
            {reason === "PURCHASE" && (
              <Input
                type="number"
                placeholder="Purchase price"
                value={purchasePrice}
                onChange={(e) =>
                  setPurchasePrice(e.target.value)
                }
                required
                disabled={status === "loading"}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading"
                ? "Saving..."
                : "Create Stock Movement"}
            </Button>
          </form>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              {message}
            </p>

            <Button
              className="mt-2"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        )}

        {/* ERROR */}
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
  );
}

