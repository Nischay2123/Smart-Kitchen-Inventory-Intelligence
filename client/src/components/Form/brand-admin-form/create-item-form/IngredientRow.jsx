import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"

const IngredientRow = ({
    row,
    index,
    availableIngredients,
    units,
    totalRows,
    onIngredientChange,
    onQuantityChange,
    onUnitChange,
    onRemove,
}) => {
    return (
        <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
                <Select
                    value={row.ingredientId}
                    onValueChange={(val) => onIngredientChange(index, val)}
                >
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableIngredients.map((ing) => (
                            <SelectItem key={ing._id} value={ing._id}>
                                {ing.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="col-span-3">
                <Input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="any"
                    required
                    className="h-9 text-sm"
                    value={row.quantity}
                    onChange={(e) => onQuantityChange(index, e.target.value)}
                />
            </div>

            <div className="col-span-3">
                {row.ingredientId ? (
                    <Select
                        value={row.unitId}
                        onValueChange={(val) => onUnitChange(index, val)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map((u) => (
                                <SelectItem key={u.unitId} value={u.unitId}>
                                    {u.unitName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Badge
                        variant="secondary"
                        className="text-xs px-2 py-1 w-full justify-center"
                    >
                        Select ingredient
                    </Badge>
                )}
            </div>

            <div className="col-span-1 flex justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => onRemove(index)}
                    disabled={totalRows === 1}
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        </div>
    )
}

export default IngredientRow
