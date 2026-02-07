import { mailer } from "../utils/mailer.js";

export const sendStockAlertEmail = async ({
  to,
  outletName,
  alerts,
}) => {
  const rows = alerts
    .map(
      (a) => `
      <tr>
        <td>${a.ingredientName}</td>
        <td>${a.currentStock} ${a.baseUnit}</td>
        <td>${a.lowInBase}</td>
        <td>${a.criticalInBase}</td>
        <td><b>${a.alertState}</b></td>
      </tr>
    `
    )
    .join("");

  await mailer.sendMail({
    from: `"Stock Alerts" <${process.env.SMTP_USER}>`,
    to,
    subject: `🚨 Stock Alert Summary – ${outletName}`,
    html: `
      <h2>🚨 Stock Alert Summary</h2>
      <p>Outlet: <b>${outletName}</b></p>

      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Current Stock</th>
            <th>Low Threshold</th>
            <th>Critical Threshold</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <p style="margin-top:16px;">
        Please take action to avoid stock-out situations.
      </p>
    `,
  });
};


export const sendOTPEmail = async ({
  to,
  otp
}) => {
  console.log(to,otp,process.env.SMTP_USER);
  
  await mailer.sendMail({
    from: `"OTP Verification" <${process.env.SMTP_USER}>`,
    to,
    subject: "Set your password - OTP Verification",
    html:`
      <h2>Welcome to the platform</h2>
      <p>Your OTP is: <b>${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};
