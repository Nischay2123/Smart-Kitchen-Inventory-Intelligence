import * as React from "react"

const EMPTY_INGREDIENT_ROW = {
    ingredientId: "",
    name: "",
    quantity: "",
    unitId: "",
    unitName: "",
}

const useRecipeBuilder = () => {
    const [showRecipe, setShowRecipe] = React.useState(false)
    const [ingredients, setIngredients] = React.useState([
        { ...EMPTY_INGREDIENT_ROW },
    ])
    const [recipeError, setRecipeError] = React.useState("")

    const selectedIngredientIds = ingredients
        .map((r) => r.ingredientId)
        .filter(Boolean)

    const handleToggleRecipe = (val) => {
        setShowRecipe(!!val)
        setRecipeError("")
    }

    const addRow = () => {
        setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT_ROW }])
    }

    const removeRow = (index) => {
        setIngredients((prev) => prev.filter((_, i) => i !== index))
    }

    const handleIngredientChange = (index, ingredientId, ingredientData = []) => {
        const selected = ingredientData.find((ing) => ing._id === ingredientId)
        if (!selected) return
        setIngredients((prev) => {
            const updated = [...prev]
            updated[index] = {
                ingredientId: selected._id,
                name: selected.name,
                quantity: "",
                unitId: "",
                unitName: "",
                units: selected.unit || [],
            }
            return updated
        })
    }

    const handleUnitChange = (index, unitId, ingredientData = []) => {
        setIngredients((prev) => {
            const updated = [...prev]
            const ing = ingredientData.find(
                (i) => i._id === updated[index].ingredientId
            )
            const selectedUnit = ing?.unit?.find((u) => u.unitId === unitId)
            updated[index].unitId = unitId
            updated[index].unitName = selectedUnit?.unitName || ""
            return updated
        })
    }

    const handleQuantityChange = (index, value) => {
        setIngredients((prev) => {
            const updated = [...prev]
            updated[index].quantity = value
            return updated
        })
    }

    const validate = () => {
        if (!showRecipe) return true
        if (ingredients.length === 0) {
            setRecipeError("Add at least one ingredient to the recipe.")
            return false
        }
        const invalid = ingredients.some(
            (r) =>
                !r.ingredientId ||
                !r.quantity ||
                Number(r.quantity) <= 0 ||
                !r.unitId
        )
        if (invalid) {
            setRecipeError(
                "All rows need an ingredient, a positive quantity, and a unit."
            )
            return false
        }
        const hasDuplicate =
            new Set(ingredients.map((r) => r.ingredientId)).size !== ingredients.length
        if (hasDuplicate) {
            setRecipeError("Duplicate ingredients are not allowed.")
            return false
        }
        setRecipeError("")
        return true
    }

    const buildPayload = () => {
        if (!showRecipe || ingredients.length === 0) return null
        return ingredients.map((r) => ({
            ingredientMasterId: r.ingredientId,
            ingredientName: r.name,
            qty: Number(r.quantity),
            unitId: r.unitId,
            unit: r.unitName,
        }))
    }

    const reset = () => {
        setShowRecipe(false)
        setIngredients([{ ...EMPTY_INGREDIENT_ROW }])
        setRecipeError("")
    }

    return {
        showRecipe,
        ingredients,
        recipeError,
        selectedIngredientIds,
        handleToggleRecipe,
        addRow,
        removeRow,
        handleIngredientChange,
        handleUnitChange,
        handleQuantityChange,
        validate,
        buildPayload,
        reset,
    }
}

export default useRecipeBuilder
