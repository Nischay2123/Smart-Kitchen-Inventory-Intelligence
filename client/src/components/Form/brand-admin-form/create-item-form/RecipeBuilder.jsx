import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Info } from "lucide-react"
import IngredientRow from "./IngredientRow"

const RecipeBuilder = ({
    ingredients,
    ingredientOptions,
    isLoading,
    error,
    selectedIngredientIds,
    onIngredientChange,
    onQuantityChange,
    onUnitChange,
    onAddRow,
    onRemoveRow,
}) => {
    const getAvailableIngredients = (currentIngredientId) =>
        (ingredientOptions || []).filter(
            (ing) =>
                !selectedIngredientIds.includes(ing._id) ||
                ing._id === currentIngredientId
        )

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-background overflow-auto max-h-110">
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                    You can always add or edit the recipe later from the item's detail page.
                </span>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recipe Ingredients</p>
                <Button type="button" variant="outline" size="sm" onClick={onAddRow}>
                    <Plus size={14} className="mr-1" />
                    Add Row
                </Button>
            </div>

            {isLoading && (
                <p className="text-xs text-muted-foreground text-center py-2">
                    Loading ingredients...
                </p>
            )}

            {!isLoading && (
                <div className="space-y-3">
                    {ingredients.map((row, index) => {
                        const matchedIng = (ingredientOptions || []).find(
                            (x) => x._id === row.ingredientId
                        )
                        const units = matchedIng?.unit || []

                        return (
                            <IngredientRow
                                key={index}
                                row={row}
                                index={index}
                                availableIngredients={getAvailableIngredients(row.ingredientId)}
                                units={units}
                                totalRows={ingredients.length}
                                onIngredientChange={onIngredientChange}
                                onQuantityChange={onQuantityChange}
                                onUnitChange={onUnitChange}
                                onRemove={onRemoveRow}
                            />
                        )
                    })}
                </div>
            )}

            {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
            )}
        </div>
    )
}

export default RecipeBuilder
