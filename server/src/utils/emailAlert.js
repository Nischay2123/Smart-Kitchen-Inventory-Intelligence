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
  // console.log(to,otp,process.env.SMTP_USER);

  await mailer.sendMail({
    from: `"OTP Verification" <${process.env.SMTP_USER}>`,
    to,
    subject: "Set your password - OTP Verification",
    html: `
      <h2>Welcome to the platform</h2>
      <p>Your OTP is: <b>${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};

export const sendMenuItemExportEmail = async ({
  to,
  userName,
  outletName,
  fromDate,
  toDate,
  reportType,
  downloadUrl,
}) => {
  const reportLabel = reportType === "profit" ? "Menu Item Profit Report" : "Menu Engineering Matrix Report";

  await mailer.sendMail({
    from: `"Analytics Reports" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Your ${reportLabel} is Ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">📊 Your Report is Ready!</h2>
        <p>Hi <b>${userName ?? "there"}</b>,</p>
        <p>Outlet: <b>${outletName || "All Outlets"}</b></p>
        <p>Your <b>${reportLabel}</b> for the period <b>${fromDate}</b> to <b>${toDate}</b> has been generated successfully.</p>
        <div style="margin: 24px 0;">
          <a
            href="${downloadUrl}"
            style="
              display: inline-block;
              background: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: bold;
              font-size: 15px;
            "
          >
            ⬇️ Download CSV Report
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">⚠️ This link will expire in <b>7 days</b>. Please download the file before it expires.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated message from Smart Kitchen Inventory. Do not reply to this email.</p>
      </div>
    `,
  });
};
