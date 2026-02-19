import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCreateItemMutation } from "@/redux/apis/brand-admin/itemApi"
import { useGetAllIngredientsInOnceQuery } from "@/redux/apis/brand-admin/ingredientApi"
import { Success } from "@/components/success"
import { Error } from "@/components/error"
import ItemDetailsForm from "./ItemDetailsForm"
import RecipeBuilder from "./RecipeBuilder"
import useRecipeBuilder from "../../../../customHooks/useRecipeBuilder"

export function CreateItemModal({ open, onOpenChange }) {
    const [status, setStatus] = React.useState("idle")
    const [message, setMessage] = React.useState("")
    const [form, setForm] = React.useState({ itemName: "", price: "" })

    const [createItem] = useCreateItemMutation()

    const recipe = useRecipeBuilder()

    const { data: rawIngredients, isLoading: ingredientsLoading } =
        useGetAllIngredientsInOnceQuery(undefined, { skip: !recipe.showRecipe })

    const ingredientOptions = rawIngredients?.data ?? []

    const handleFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!recipe.validate()) return

        setStatus("loading")
        setMessage("")

        const payload = {
            itemName: form.itemName,
            price: Number(form.price),
        }

        const recipeItems = recipe.buildPayload()
        if (recipeItems) payload.recipeItems = recipeItems

        try {
            const result = await createItem([payload]).unwrap()
            setStatus("success")
            setMessage(
                recipe.showRecipe && result.recipeCreated > 0
                    ? "Item and recipe created successfully!"
                    : "Item created successfully!"
            )
            setForm({ itemName: "", price: "" })
            recipe.reset()
        } catch (err) {
            console.error(err)
            setStatus("error")
            setMessage(err?.data?.message || "Failed to create item")
        }
    }

    const handleOpenChange = (val) => {
        if (!val) {
            setStatus("idle")
            setMessage("")
            setForm({ itemName: "", price: "" })
            recipe.reset()
        }
        onOpenChange(val)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={`transition-all duration-300 ${recipe.showRecipe ? "sm:max-w-2xl" : "sm:max-w-md"
                    }`}
            >
                <DialogHeader>
                    <DialogTitle>Create Menu Item</DialogTitle>
                    <DialogDescription>
                        Add a new menu item. Optionally define its recipe right away.
                    </DialogDescription>
                </DialogHeader>

                {(status === "idle" || status === "loading") && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <ItemDetailsForm
                            form={form}
                            showRecipe={recipe.showRecipe}
                            onFieldChange={handleFieldChange}
                            onToggleRecipe={recipe.handleToggleRecipe}
                        />

                        {recipe.showRecipe && (
                            <RecipeBuilder
                                ingredients={recipe.ingredients}
                                ingredientOptions={ingredientOptions}
                                isLoading={ingredientsLoading}
                                error={recipe.recipeError}
                                selectedIngredientIds={recipe.selectedIngredientIds}
                                onIngredientChange={(index, id) =>
                                    recipe.handleIngredientChange(index, id, ingredientOptions)
                                }
                                onQuantityChange={recipe.handleQuantityChange}
                                onUnitChange={(index, unitId) =>
                                    recipe.handleUnitChange(index, unitId, ingredientOptions)
                                }
                                onAddRow={recipe.addRow}
                                onRemoveRow={recipe.removeRow}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={status === "loading"}
                        >
                            {status === "loading"
                                ? "Creating..."
                                : recipe.showRecipe
                                    ? "Create Item & Recipe"
                                    : "Create Item"}
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
                    <Error message={message} setStatus={setStatus} />
                )}
            </DialogContent>
        </Dialog>
    )
}
