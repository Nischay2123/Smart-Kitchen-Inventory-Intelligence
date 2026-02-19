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
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [statusText, setStatusText] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);
    const [createItems] = useCreateItemMutation();
    const [createIngredients] = useCreateIngredientsBulkMutation();
    const [createBulkStockMovement] = useCreateBulkStockMovementMutation();
    const [createBulkRecipes] = useCreateBulkRecipesMutation();


    const loading = isUploading || isProcessing;

    const processChunks = async (data, batchSize, processFunction) => {
        setIsProcessing(true);
        setProgress(0);
        setProcessedCount(0);
        const total = data.length;
        setTotalCount(total);

        let successCount = 0;
        let failureCount = 0;
        let allErrors = [];

        const totalBatches = Math.ceil(total / batchSize);

        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, total);
            const chunk = data.slice(start, end);

            setStatusText(`Processing batch ${i + 1} of ${totalBatches}...`);

            try {
                const response = await processFunction(chunk);

                if (response?.data) {
                    successCount += (response.data.inserted || response.data.insertedCount || 0) + (response.data.updatedCount || 0);
                    failureCount += (response.data.failed || 0);
                    if (response.data.errors && Array.isArray(response.data.errors)) {
                        allErrors = [...allErrors, ...response.data.errors];
                    }
                }

            } catch (err) {
                console.error(`Error processing batch ${i + 1}`, err);
                failureCount += chunk.length;
                allErrors.push(err.data?.message || err.message || `Failed batch ${i + 1}`);
            }

            setProcessedCount(end);
            setProgress(Math.round(((i + 1) / totalBatches) * 100));
        }

        setIsProcessing(false);
        return { inserted: successCount, failed: failureCount, errors: allErrors };
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setErrors([]);
        setSuccessMessage("");
        setProgress(0);
        setStatusText("Parsing CSV...");

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

                try {
                    let finalResult = { inserted: 0, failed: 0, errors: [] };

                    if (type === 'stock-movement') {
                        const movements = results.data.map(row => ({
                            IngredientName: row.IngredientName,
                            Quantity: row.Quantity,
                            Unit: row.Unit,
                            Reason: row.Reason,
                            Price: row.Price
                        }));

                        finalResult = await processChunks(movements, 100, async (chunk) => {
                            return await createBulkStockMovement(chunk).unwrap();
                        });
                    }

                    else if (type === 'menu-item') {
                        const itemMap = new Map(); 
                        for (const row of results.data) {
                            const itemName = row.ItemName?.trim();
                            if (!itemName) continue;

                            if (!itemMap.has(itemName)) {
                                itemMap.set(itemName, {
                                    itemName,
                                    price: Number(row.Price),
                                    recipeItems: [],
                                });
                            }

                            if (row.IngredientName?.trim()) {
                                itemMap.get(itemName).recipeItems.push({
                                    ingredientName: row.IngredientName.trim(),
                                    qty: Number(row.Quantity),
                                    unit: row.Unit?.trim(),
                                });
                            }
                        }

                        const items = Array.from(itemMap.values()).map(item => {
                            const payload = { itemName: item.itemName, price: item.price };
                            if (item.recipeItems.length > 0) {
                                payload.recipeItems = item.recipeItems;
                            }
                            return payload;
                        });

                        finalResult = await processChunks(items, 100, async (chunk) => {
                            return await createItems(chunk).unwrap();
                        });
                    }


                    else if (type === 'ingredient') {
                        const ingredients = results.data.map((row) => {
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

                        finalResult = await processChunks(ingredients, 100, async (chunk) => {
                            return await createIngredients(chunk).unwrap();
                        });
                    }

                    else if (type === 'recipe') {
                        const recipes = results.data;
                        const recipesByItem = {};

                        for (const row of recipes) {
                            const itemName = row.ItemName?.trim();
                            if (!itemName) continue;
                            if (!recipesByItem[itemName]) {
                                recipesByItem[itemName] = [];
                            }
                            recipesByItem[itemName].push(row);
                        }

                        const itemNames = Object.keys(recipesByItem);

                        finalResult = await processChunks(itemNames, 50, async (chunkKeys) => {
                            const chunkPayload = {};
                            chunkKeys.forEach(key => {
                                chunkPayload[key] = recipesByItem[key];
                            });

                            return await createBulkRecipes(chunkPayload).unwrap();
                        });
                    }

                    if (finalResult.inserted > 0) {
                        setSuccessMessage(`Successfully processed ${finalResult.inserted} records!`);
                    } else {
                        setSuccessMessage("");
                    }

                    setErrors(finalResult.errors);
                    setDialogOpen(true);
                    onSuccess();

                } catch (err) {
                    console.error("Global Processing Error", err);
                    setErrors([err.message || "An unexpected error occurred during processing."]);
                    setDialogOpen(true);
                } finally {
                    setIsUploading(false);
                    setIsProcessing(false);
                    e.target.value = null; // Reset input
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
        <div className="flex flex-col gap-2 pr-6">
            <div className="flex gap-2 items-center">
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

                <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>

                <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} title="Download Template" disabled={loading}>
                    <FileSpreadsheet className="h-4 w-4" />
                </Button>
            </div>

            {loading && (
                <div className="w-full max-w-sm mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{statusText || "Processing..."}</span>
                        <span>{progress}%</span>c
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={errors.length > 0 && !successMessage ? "text-destructive" : (errors.length > 0 ? "text-orange-500" : "text-green-600")}>
                            {errors.length > 0 && successMessage ? "Import Completed with Errors" : (errors.length > 0 ? "Validation Errors" : "Import Successful")}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2 text-muted-foreground text-sm">
                                {successMessage && (
                                    <div className="text-green-600 font-semibold">
                                        {successMessage}
                                    </div>
                                )}
                                {errors.length > 0 && (
                                    <div>The following items failed to import:</div>
                                )}
                            </div>
                        </DialogDescription>

                    </DialogHeader>
                    {errors.length > 0 && (
                        <div className="max-h-75 overflow-y-auto bg-muted p-4 rounded text-sm text-destructive">
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
