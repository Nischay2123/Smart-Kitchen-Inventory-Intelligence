export const CSV_SCHEMAS = {
    ingredient: {
        headers: ["Name", "Units", "BaseUnit", "Low", "Critical", "ThresholdUnit"],
        required: ["Name", "Units", "BaseUnit", "Low", "Critical", "ThresholdUnit"],
        validateRow: (row, index) => {
            const errors = [];
            if (!row.Name?.trim()) errors.push(`Row ${index + 1}: Name is required`);
            if (!row.Units?.trim()) errors.push(`Row ${index + 1}: Units is required`);
            if (!row.BaseUnit?.trim()) errors.push(`Row ${index + 1}: BaseUnit is required`);
            if (!row.ThresholdUnit?.trim()) errors.push(`Row ${index + 1}: ThresholdUnit is required`);

            if (row.Low && isNaN(Number(row.Low)))
                errors.push(`Row ${index + 1}: Low must be a number`);
            if (row.Critical && isNaN(Number(row.Critical)))
                errors.push(`Row ${index + 1}: Critical must be a number`);
            return errors;
        }
    },
    "menu-item": {
        headers: ["ItemName", "Price", "IngredientName", "Quantity", "Unit"],
        required: ["ItemName", "Price"],
        validateRow: (row, index) => {
            const errors = [];
            if (!row.ItemName?.trim()) errors.push(`Row ${index + 1}: ItemName is required`);
            if (!row.Price || isNaN(Number(row.Price))) errors.push(`Row ${index + 1}: Price must be a valid number`);

            const hasIngredient = !!row.IngredientName?.trim();
            if (hasIngredient) {
                if (!row.Quantity || isNaN(Number(row.Quantity)) || Number(row.Quantity) <= 0)
                    errors.push(`Row ${index + 1}: Quantity must be a positive number when IngredientName is set`);
                if (!row.Unit?.trim())
                    errors.push(`Row ${index + 1}: Unit is required when IngredientName is set`);
            }
            return errors;
        }
    },

    recipe: {
        headers: ["ItemName", "IngredientName", "Quantity", "Unit"],
        required: ["ItemName", "IngredientName", "Quantity", "Unit"],
        validateRow: (row, index) => {
            const errors = [];
            if (!row.ItemName?.trim()) errors.push(`Row ${index + 1}: ItemName is required`);
            if (!row.IngredientName?.trim()) errors.push(`Row ${index + 1}: IngredientName is required`);
            if (!row.Quantity || isNaN(Number(row.Quantity))) errors.push(`Row ${index + 1}: Quantity must be a valid number`);
            if (!row.Unit?.trim()) errors.push(`Row ${index + 1}: Unit is required`);
            return errors;
        }
    },
    "stock-movement": {
        headers: ["IngredientName", "Quantity", "Unit", "Reason", "Price", "Date"],
        required: ["IngredientName", "Quantity", "Unit", "Reason"],
        validateRow: (row, index) => {
            const errors = [];
            if (!row.IngredientName?.trim()) errors.push(`Row ${index + 1}: IngredientName is required`);
            if (!row.Quantity || isNaN(Number(row.Quantity)) || Number(row.Quantity) <= 0)
                errors.push(`Row ${index + 1}: Quantity must be a valid positive number`);
            if (!row.Unit?.trim()) errors.push(`Row ${index + 1}: Unit is required`);

            const validReasons = ["PURCHASE", "POSITIVE_ADJUSTMENT", "NEGATIVE_ADJUSTMENT", "WASTAGE", "CONSUMPTION"];
            if (!row.Reason || !validReasons.includes(row.Reason.trim()))
                errors.push(`Row ${index + 1}: Invalid Reason. Allowed: ${validReasons.join(", ")}`);

            if (row.Reason === "PURCHASE") {
                if (!row.Price || isNaN(Number(row.Price)) || Number(row.Price) < 0)
                    errors.push(`Row ${index + 1}: Price is required for PURCHASE`);
            }

            return errors;
        }
    }
};

export const validateCsv = (data, type) => {
    const schema = CSV_SCHEMAS[type];
    if (!schema) return ["Invalid CSV Type"];

    const errors = [];
    const headers = Object.keys(data[0] || {});

    const missingHeaders = schema.headers.filter(h => !headers.includes(h) && (schema.required.includes(h) || schema.headers.includes(h)));
    const missingRequired = schema.required.filter(h => !headers.includes(h));

    if (missingRequired.length > 0) {
        return [`Missing required headers: ${missingRequired.join(", ")}`];
    }

    data.forEach((row, index) => {
        const rowErrors = schema.validateRow(row, index);
        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
        }
    });

    if (type === "menu-item" && errors.length === 0) {
        const priceByItem = {};
        data.forEach((row, index) => {
            const itemName = row.ItemName?.trim();
            if (!itemName) return;
            const price = Number(row.Price);
            if (priceByItem[itemName] === undefined) {
                priceByItem[itemName] = { price, firstRow: index + 1 };
            } else if (priceByItem[itemName].price !== price) {
                errors.push(
                    `Row ${index + 1}: Price ${price} for '${itemName}' does not match price ${priceByItem[itemName].price} from Row ${priceByItem[itemName].firstRow}`
                );
            }
        });
    }

    return errors;
};
