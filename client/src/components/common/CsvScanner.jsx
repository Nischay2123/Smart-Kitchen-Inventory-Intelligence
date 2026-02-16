import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { validateCsv } from '../../utils/csv.validator';
import { useCreateItemMutation } from '../../redux/apis/brand-admin/itemApi';
import { useCreateIngredientsBulkMutation } from '../../redux/apis/brand-admin/ingredientApi';
import { useCreateBulkStockMovementMutation } from '../../redux/apis/outlet-manager/stockMovementApi';
import { useCreateBulkRecipesMutation } from '../../redux/apis/brand-admin/recipeApi';
import { useAuth } from "@/auth/auth";

const CsvScanner = ({ type, onSuccess = () => { }, outletId }) => {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);
    const [createItems, { isLoading: isCreatingItems }] = useCreateItemMutation();
    const [createIngredients, { isLoading: isCreatingIngredients }] = useCreateIngredientsBulkMutation();
    const [createBulkStockMovement, { isLoading: isCreatingStockMovement }] = useCreateBulkStockMovementMutation();
    const [createBulkRecipes, { isLoading: isCreatingRecipes }] = useCreateBulkRecipesMutation();


    const loading = isUploading || isProcessing || isCreatingItems || isCreatingIngredients || isCreatingStockMovement || isCreatingRecipes;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setErrors([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            worker: true,
            complete: async (results) => {
                const validationErrors = validateCsv(results.data, type);

                if (validationErrors.length > 0) {
                    setErrors(validationErrors);
                    setSuccessMessage("");
                    setDialogOpen(true);
                    setIsUploading(false);
                    e.target.value = null;
                    return;
                }

                if (type === 'stock-movement') {
                    try {
                        const movements = results.data.map(row => ({
                            IngredientName: row.IngredientName,
                            Quantity: row.Quantity,
                            Unit: row.Unit,
                            Reason: row.Reason,
                            Price: row.Price
                        }));

                        const response = await createBulkStockMovement(movements).unwrap();

                        const inserted = response.data.inserted || 0;
                        const failed = response.data.failed || 0;
                        const errorList = response.data.errors || [];

                        if (inserted > 0) {
                            setSuccessMessage(`Successfully processed ${inserted} movements!`);
                        } else {
                            setSuccessMessage("");
                        }

                        setErrors(errorList);
                        setDialogOpen(true);
                        onSuccess();

                    } catch (err) {
                        console.error("Create Stock Movement Error", err);
                        setErrors([err.data?.message || err.message || "Failed to create stock movements"]);
                        setSuccessMessage("");
                        setDialogOpen(true);
                    } finally {
                        setIsUploading(false);
                        e.target.value = null;
                    }
                    return;
                }

                if (type === 'menu-item') {
                    try {
                        const items = results.data.map(row => ({
                            itemName: row.ItemName,
                            price: Number(row.Price)
                        }));

                        const response = await createItems(items).unwrap();

                        const inserted = response.data.inserted || 0;
                        const failed = response.data.failed || 0;
                        const errorList = response.data.errors || [];

                        if (inserted > 0) {
                            setSuccessMessage(`Successfully created ${inserted} items!`);
                        } else {
                            setSuccessMessage("");
                        }

                        setErrors(errorList);
                        setDialogOpen(true);
                        onSuccess();

                    } catch (err) {
                        console.error("Create Items Error", err);
                        setErrors([err.data?.message || err.message || "Failed to create items"]);
                        setSuccessMessage("");
                        setDialogOpen(true);
                    } finally {
                        setIsUploading(false);
                        e.target.value = null;
                    }
                    return;
                }

                if (type === 'ingredient') {
                    try {
                        const ingredients = results.data.map((row, index) => {
                            const unitNames = (row.Units || "").split("$$").map(u => u.trim()).filter(Boolean);

                            return {
                                name: row.Name,
                                unitNames,
                                baseUnit: row.BaseUnit,
                                threshold: {
                                    low: Number(row.Low),
                                    critical: Number(row.Critical),
                                    unitName: row.ThresholdUnit
                                }
                            };
                        });

                        const response = await createIngredients(ingredients).unwrap();

                        const inserted = response.data.inserted || 0;
                        const failed = response.data.failed || 0;
                        const errorList = response.data.errors || [];

                        if (inserted > 0) {
                            setSuccessMessage(`Successfully created ${inserted} ingredients!`);
                        } else {
                            setSuccessMessage("");
                        }

                        setErrors(errorList);
                        setDialogOpen(true);
                        onSuccess();

                    } catch (err) {
                        console.error("Create Ingredients Error", err);
                        setErrors([err.data?.message || err.message || "Failed to create ingredients"]);
                        setSuccessMessage("");
                        setDialogOpen(true);
                    } finally {
                        setIsUploading(false);
                        e.target.value = null;
                    }
                    return;
                }

                if (type === 'recipe') {
                    try {
                        const recipes = results.data.map(row => ({
                            ItemName: row.ItemName,
                            IngredientName: row.IngredientName,
                            Quantity: row.Quantity,
                            Unit: row.Unit
                        }));

                        const response = await createBulkRecipes(recipes).unwrap();

                        const inserted = response.data.insertedCount || 0;
                        const updated = response.data.updatedCount || 0;
                        const failed = response.data.failed || 0;
                        const errorList = response.data.errors || [];
                        const totalProcessed = inserted + updated;

                        if (totalProcessed > 0) {
                            setSuccessMessage(`Successfully processed ${totalProcessed} recipes!`);
                        } else {
                            setSuccessMessage("");
                        }

                        setErrors(errorList);
                        setDialogOpen(true);
                        onSuccess();

                    } catch (err) {
                        console.error("Create Recipes Error", err);
                        setErrors([err.data?.message || err.message || "Failed to create recipes"]);
                        setSuccessMessage("");
                        setDialogOpen(true);
                    } finally {
                        setIsUploading(false);
                        e.target.value = null;
                    }
                    return;
                }

            },
            error: (err) => {
                setErrors(["Failed to parse CSV: " + err.message]);
                setSuccessMessage("");
                setDialogOpen(true);
                setIsUploading(false);
            }
        });
    };

    const handleDownloadTemplate = () => {
        window.open(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000/api/v1'}/csv/template/${type}`, '_blank');
    };

    const handleExport = () => {
        const baseUrl = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000/api/v1'}/csv/export/${type}`;
        const url = outletId ? `${baseUrl}?outletId=${outletId}` : baseUrl;
        window.open(url, '_blank');
    };

    return (
        <div className="flex gap-2 items-center pr-6">
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import CSV
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>

            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} title="Download Template">
                <FileSpreadsheet className="h-4 w-4" />
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={errors.length > 0 && !successMessage ? "text-destructive" : (errors.length > 0 ? "text-orange-500" : "text-green-600")}>
                            {errors.length > 0 && successMessage ? "Import Completed with Errors" : (errors.length > 0 ? "Validation Errors" : "Import Successful")}
                        </DialogTitle>
                        <DialogDescription className="space-y-2">
                            {successMessage && <div className="text-green-600 font-semibold">{successMessage}</div>}
                            {errors.length > 0 && <div>The following items failed to import:</div>}
                        </DialogDescription>
                    </DialogHeader>
                    {errors.length > 0 && (
                        <div className="max-h-[300px] overflow-y-auto bg-muted p-4 rounded text-sm text-destructive">
                            <ul className="list-disc pl-4 space-y-1">
                                {errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CsvScanner;
