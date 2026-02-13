import Stock from "../models/stock.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";

import { resolveAlertState } from "../utils/alertState.js";
import { getOutletManagersEmails } from "../services/outletManagers.service.js";
import { sendStockAlertEmail } from "../utils/emailAlert.js";

export const processAlerts = async ({ outlet, tenant, requirementList }) => {
  try {
    const alertItems = [];

    for (const req of requirementList) {
      const stock = await Stock.findOne({
        "outlet.outletId": outlet.outletId,
        "masterIngredient.ingredientMasterId":
          req.ingredientMasterId,
      }).lean();

      if (!stock) continue;

      const ingredient = await IngredientMaster.findById(
        req.ingredientMasterId
      ).lean();

      if (!ingredient) continue;

      const { lowInBase, criticalInBase } =
        ingredient.threshold;

      const newState = resolveAlertState({
        currentStockInBase: stock.currentStockInBase,
        lowInBase,
        criticalInBase,
      });

      if (stock.alertState === newState) continue;

      alertItems.push({
        ingredientName:
          stock.masterIngredient
            .ingredientMasterName,
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

    await Stock.bulkWrite(
      alertItems.map((item) => ({
        updateOne: {
          filter: {
            _id: item.stockId,
            alertState: item.prevAlert,
          },
          update: {
            $set: { alertState: item.alertState },
          },
        },
      }))
    );

    const emails = await getOutletManagersEmails(
      tenant.tenantId,
      outlet.outletId
    );

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
