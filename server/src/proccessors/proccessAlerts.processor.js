import Stock from "../models/stock.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";

import { resolveAlertState } from "../utils/alertState.js";
import { getOutletManagersEmails } from "../services/outletManagers.service.js";
import { sendStockAlertEmail } from "../utils/emailAlert.js";

export const processAlerts = async ({ outlet, tenant, requirementList }) => {
    // console.log(requirementList);
    
  for (const req of requirementList) {
    const stock = await Stock.findOne({
      "outlet.outletId": outlet.outletId,
      "masterIngredient.ingredientMasterId": req.ingredientMasterId,
    });

    if (!stock) continue;

    const ingredient = await IngredientMaster.findById(
      req.ingredientMasterId
    ).lean();

    if (!ingredient) continue;
    // console.log(ingredient);
    
    const { lowInBase, criticalInBase } = ingredient.threshold;

    const newState = resolveAlertState({
      currentStockInBase: stock.currentStockInBase,
      lowInBase,
      criticalInBase,
    });
    console.log(newState);
    
    if (stock.alertState === newState) continue;

    const emails = await getOutletManagersEmails(
      tenant.tenantId,
      outlet.outletId
    );
    // console.log({newState,emails});
    
    if (emails.length > 0) {
      await sendStockAlertEmail({
        to: emails,
        ingredientName: stock.masterIngredient.ingredientMasterName,
        currentStock: stock.currentStockInBase,
        baseUnit: stock.baseUnit,
        alertState: newState,
      });
    }

    await Stock.updateOne(
      { _id: stock._id },
      { $set: { alertState: newState } }
    );
  }
};
