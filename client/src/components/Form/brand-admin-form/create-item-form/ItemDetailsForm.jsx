import * as React from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const ItemDetailsForm = ({ form, showRecipe, onFieldChange, onToggleRecipe }) => {
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <Input
                    placeholder="Item Name"
                    value={form.itemName}
                    onChange={(e) => onFieldChange("itemName", e.target.value)}
                    required
                />
                <Input
                    placeholder="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => onFieldChange("price", e.target.value)}
                    required
                />
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/40">
                <Checkbox
                    id="recipe-toggle"
                    checked={showRecipe}
                    onCheckedChange={onToggleRecipe}
                />
                <Label
                    htmlFor="recipe-toggle"
                    className="cursor-pointer text-sm font-medium leading-none"
                >
                    Also create a recipe for this item
                </Label>
            </div>
        </div>
    )
}

export default ItemDetailsForm
