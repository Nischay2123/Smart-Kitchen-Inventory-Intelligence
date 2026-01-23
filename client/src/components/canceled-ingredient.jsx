import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CancelIngredientsDialog = ({ items ,open, onClose,}) => {
  if (!items?.length) return null;
console.log(items);

  return (
    <Dialog open={open} onOpenChange={onClose} >

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cancelled Ingredient Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-base">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quantity: {item.qty}
                  </p>
                </div>

              </div>

              <div className="space-y-2">
                {item.cancelIngredientDetails.map((ing) => (
                  <div
                    key={ing.ingredientMasterId}
                    className="flex items-center justify-between rounded-md bg-red-50 border border-red-100 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {ing.ingredientMasterName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Required: {ing.requiredQty} | Available:{" "}
                        {ing.availableStock}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-red-600">
                      {ing.issue.replaceAll("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelIngredientsDialog;
