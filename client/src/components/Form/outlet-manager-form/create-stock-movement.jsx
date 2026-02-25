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

import { useCreateStockMovementMutation } from "@/redux/apis/outlet-manager/stockMovementApi"
import { ReusableSelect } from "@/components/resuable"
import { Success } from "@/components/success"
import { Error } from "@/components/error"


const STOCK_MOVEMENT_REASONS = [
  {
    value: "PURCHASE",
    label: "Purchase",
  },
  {
    value: "POSITIVE_ADJUSTMENT",
    label: "Positive Adjustment",
  },
  {
    value: "NEGATIVE_ADJUSTMENT",
    label: "Negative Adjustment",
  },
];

export function CreateStockMovementForm({
  open,
  onOpenChange,
  ingredient,
}) {
  const [createStockMovement] = useCreateStockMovementMutation();

  const [ingredientMasterId, setIngredientMasterId] = React.useState("");
  const [delta, setDelta] = React.useState("");
  const [selectedUnitId, setSelectedUnitId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [purchasePrice, setPurchasePrice] = React.useState("");

  const [status, setStatus] = React.useState("idle");
  const [message, setMessage] = React.useState("");

  const ingredientName = ingredient?.ingredientName ?? "";
  const units = ingredient?.unit ?? [];

  React.useEffect(() => {
    if (ingredient) {
      setIngredientMasterId(ingredient.ingredientMasterId);
      setSelectedUnitId("");
    }
  }, [ingredient]);

  const resetForm = () => {
    setDelta("");
    setReason("");
    setPurchasePrice("");
    setSelectedUnitId("");
    setStatus("idle");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUnitId) {
      setStatus("error");
      setMessage("Please select a unit");
      return;
    }

    if (!reason) {
      setStatus("error");
      setMessage("Please select a movement type");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      await createStockMovement({
        ingredientMasterId,
        quantity: Number(delta),
        unitId: selectedUnitId,
        reason,
        purchasePricePerUnit:
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

            {/* Ingredient */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Ingredient
              </label>
              <div className="px-3 py-2 border rounded bg-muted">
                {ingredientName || "—"}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Quantity"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                required
                disabled={status === "loading"}
              />

              <ReusableSelect
                data={units}
                value={selectedUnitId}
                onChange={setSelectedUnitId}
                valueKey="unitId"
                labelKey="unitName"
                placeholder="Unit"
                disabled={status === "loading"}
              />
            </div>

            <ReusableSelect
              data={STOCK_MOVEMENT_REASONS}
              value={reason}
              onChange={setReason}
              valueKey="value"
              labelKey="label"
              placeholder="Select movement type"
              disabled={status === "loading"}
            />

            {reason === "PURCHASE" && (
              <Input
                type="number"
                placeholder="Purchase price per unit"
                value={purchasePrice}
                onChange={(e) =>
                  setPurchasePrice(e.target.value)
                }
                step={0.01}
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

        {/* Success */}
        {status === "success" && (
          <Success onOpenChange={onOpenChange} message={message} resetForm={resetForm} />
        )}

        {/* Error */}
        {status === "error" && (
          <Error setStatus={setStatus} message={message} />
        )}
      </DialogContent>
    </Dialog>
  );
}
