import User from "../models/user.model.js";

export const getOutletManagersEmails = async (tenantId, outletId) => {
  const managers = await User.find({
    role: "OUTLET_MANAGER",
    "tenant.tenantId": tenantId,
    "outlet.outletId": outletId,
  }).select("email");
  console.log(managers);
  

  return managers.map(u => u.email);
};
