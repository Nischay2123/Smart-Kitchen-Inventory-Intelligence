import { mailer } from "../utils/mailer.js";

export const sendStockAlertEmail = async ({
  to,
  ingredientName,
  currentStock,
  baseUnit,
  alertState,
}) => {
  await mailer.sendMail({
    from: `"Stock Alerts" <${process.env.SMTP_USER}>`,
    to,
    subject: `🚨 ${alertState} Stock Alert – ${ingredientName}`,
    html: `
      <h2>${alertState} Stock Alert</h2>
      <p><strong>${ingredientName}</strong> stock level has changed.</p>

      <table border="1" cellpadding="8">
        <tr>
          <td>Current Stock</td>
          <td>${currentStock} ${baseUnit}</td>
        </tr>
        <tr>
          <td>Alert Level</td>
          <td>${alertState}</td>
        </tr>
      </table>
    `,
  });
};
