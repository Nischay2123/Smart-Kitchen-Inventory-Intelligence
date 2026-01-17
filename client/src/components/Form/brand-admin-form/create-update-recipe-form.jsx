import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

import {
  useGetAllIngredientsQuery,
} from "@/redux/apis/brand-admin/ingredientApi";

import {
  useCreateRecipeMutation,
} from "@/redux/apis/brand-admin/recipeApi";

const CreateRecipeForm = ({
  data = {},
  isUpdate = false,
}) => {
  
  const navigate = useNavigate();
  const { itemId } = useParams();

  const {
    data: ingredientOptions = { data: [] },
    isLoading,
    isError,
  } = useGetAllIngredientsQuery();

  const [createRecipe, { isLoading: isCreating }] =
    useCreateRecipeMutation();

  const [ingredients, setIngredients] = useState([
    { ingredientId: "", name: "", quantity: "", unit: "" },
  ]);

  // ✅ PREFILL LOGIC FOR UPDATE MODE
  useEffect(() => {
    if (isUpdate && data?.recipeItems?.length) {
      const mapped = data.recipeItems.map((item) => ({
        ingredientId: item.ingredientId,
        name: item.ingredientName,
        quantity: item.quantity,
        unit: item.unitName,
      }));

      setIngredients(mapped);
    }
  }, [isUpdate, data]);

  const selectedIngredientIds = ingredients
    .map((ing) => ing.ingredientId)
    .filter(Boolean);

  const getAvailableIngredients = (currentIngredientId) => {
    return ingredientOptions.data.filter(
      (ing) =>
        !selectedIngredientIds.includes(ing._id) ||
        ing._id === currentIngredientId
    );
  };

  const addRow = () => {
    setIngredients((prev) => [
      ...prev,
      { ingredientId: "", name: "", quantity: "", unit: "" },
    ]);
  };

  const removeRow = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, ingredientId) => {
    const selected = ingredientOptions.data.find(
      (ing) => ing._id === ingredientId
    );

    if (!selected) return;

    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ingredientId: selected._id,
        name: selected.name,
        quantity: updated[index].quantity || "",
        unit: selected.unit?.unitName || "",
      };
      return updated;
    });
  };

  const handleQuantityChange = (index, value) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index].quantity = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasDuplicate =
      new Set(ingredients.map((i) => i.ingredientId)).size !==
      ingredients.length;

    if (hasDuplicate) {
      alert("Duplicate ingredients not allowed");
      return;
    }

    const invalid = ingredients.some(
      (i) => !i.ingredientId || !i.quantity
    );

    if (invalid) {
      alert("Please select ingredient and quantity for all rows");
      return;
    }

    try {
      await createRecipe({
        itemId,
        recipeItems: ingredients,
      }).unwrap();

      alert(
        isUpdate
          ? "Recipe Updated Successfully"
          : "Recipe Created Successfully"
      );

      navigate("/recipes");
    } catch (error) {
      console.error(error);
      alert("Error saving recipe");
    }
  };

  return (
    <Card className="max-w-6xl mx-auto mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {isUpdate ? "Update Recipe" : "Create Recipe"}
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={addRow}>
              <Plus size={16} className="mr-2" />
              Add Ingredient
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/ingredients")}
            >
              Create New Ingredient
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">
            Loading ingredients...
          </p>
        )}

        {isError && (
          <p className="text-center text-sm text-red-500">
            Failed to load ingredients
          </p>
        )}

        {!isLoading && !isError && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {ingredients.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-5">
                  <Select
                    value={item.ingredientId}
                    onValueChange={(val) =>
                      handleIngredientChange(index, val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableIngredients(
                        item.ingredientId
                      ).map((ing) => (
                        <SelectItem key={ing._id} value={ing._id}>
                          {ing.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                  />
                </div>

                {/* UNIT BADGE */}
                <div className="sm:col-span-3 flex items-center">
                  {item.unit ? (
                    <Badge variant="primary" className="px-3 py-1 rounded-sm">
                      <span className="text-sm text-muted-foreground">
                        {item.unit}
                      </span>
                    </Badge>
                  ) : (
                    <Badge variant="primary" className="px-3 py-1 rounded-sm">
                      <span className="text-sm text-muted-foreground">
                        Auto from ingredient
                      </span>
                    </Badge>
                  )}
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                className="w-full sm:w-64"
                disabled={isCreating}
              >
                {isCreating
                  ? isUpdate
                    ? "Updating..."
                    : "Creating..."
                  : isUpdate
                  ? "Update Recipe"
                  : "Create Recipe"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateRecipeForm;
