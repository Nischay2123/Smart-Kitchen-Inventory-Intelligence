import Stock from "../models/stock.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";

import { resolveAlertState } from "../utils/alertState.js";
import { getOutletManagersEmails } from "../services/outletManagers.service.js";
import { sendStockAlertEmail } from "../utils/emailAlert.js";

export const processAlerts = async ({ outlet, tenant, requirementList }) => {
  try {
    if (!requirementList || requirementList.length === 0) return;

    const ingredientIds = requirementList.map(r => r.ingredientMasterId);

    const [stockDocs, ingredientDocs] = await Promise.all([
      Stock.find({
        "outlet.outletId": outlet.outletId,
        "masterIngredient.ingredientMasterId": { $in: ingredientIds },
      }).lean(),
      IngredientMaster.find({ _id: { $in: ingredientIds } }).lean(),
    ]);

    if (!stockDocs.length || !ingredientDocs.length) return;

    const stockMap = new Map(stockDocs.map(s => [s.masterIngredient.ingredientMasterId.toString(), s]));
    const ingredientMap = new Map(ingredientDocs.map(i => [i._id.toString(), i]));

    const alertItems = [];

    for (const req of requirementList) {
      const stock = stockMap.get(req.ingredientMasterId.toString());
      const ingredient = ingredientMap.get(req.ingredientMasterId.toString());
      if (!stock || !ingredient) continue;

      const { lowInBase, criticalInBase } = ingredient.threshold;

      const newState = resolveAlertState({
        currentStockInBase: stock.currentStockInBase,
        lowInBase,
        criticalInBase,
      });

      if (stock.alertState === newState) continue;

      alertItems.push({
        ingredientName: stock.masterIngredient.ingredientMasterName,
        currentStock: stock.currentStockInBase,
        baseUnit: stock.baseUnit,
        lowInBase,
        criticalInBase,
        alertState: newState,
        stockId: stock._id,
        prevAlert: stock.alertState,
      });
    }

    if (!alertItems.length) return;

    const bulkResult = await Stock.bulkWrite(
      alertItems.map(item => ({
        updateOne: {
          filter: { _id: item.stockId, alertState: item.prevAlert },
          update: { $set: { alertState: item.alertState } },
        },
      }))
    );

    if (bulkResult.modifiedCount === 0) return;

    const emails = await getOutletManagersEmails(tenant.tenantId, outlet.outletId);
    if (emails.length > 0) {
      await sendStockAlertEmail({
        to: emails,
        outletName: outlet.outletName,
        alerts: alertItems,
      });
    }

  } catch (err) {
    console.error(
      `processAlerts failed tenant=${tenant?.tenantId} outlet=${outlet?.outletId}`,
      err
    );
    throw err;
  }
};