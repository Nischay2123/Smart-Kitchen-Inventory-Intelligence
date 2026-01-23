import mongoose from "mongoose";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken } from "../utils/token.js"
import Outlet from "../models/outlet.model.js";
import Tenant from "../models/tenant.model.js";
import crypto from "crypto";
import { sendOTPEmail } from "../utils/emailAlert.js"

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashOTP = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

export const requestSignupOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;




  const otp = generateOTP();


  const user = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { email } },
    { upsert: true, new: true }
  );

  user.otpHash = hashOTP(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.otpPurpose = "SIGNUP";

  await user.save();

  await sendOTPEmail({
    to: email,
    otp: otp
  });

  res.json({ success: true, message: "OTP sent successfully" });
});

export const verifySignupOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select(
    "+otpHash +otpExpiresAt +otpPurpose"
  );

  if (!user || user.otpPurpose !== "SIGNUP") {
    throw new ApiError(400, "Invalid request");
  }

  if (user.otpExpiresAt < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }

  if (hashOTP(otp) !== user.otpHash) {
    user.otpAttempts++;
    await user.save();
    throw new ApiError(400, "Invalid OTP");
  }

  user.emailVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;

  await user.save();

  res.json({ success: true, message: "Email verified successfully" });
});

export const completeSignup = asyncHandler(async (req, res) => {
  const { email, userName, password, tenantId } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.emailVerified) {
    throw new ApiError(403, "Email not verified");
  }

  if (user.password) {
    throw new ApiError(409, "User already created");
  }

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new ApiError(404, "Tenant not found");

  user.userName = userName;
  user.password = password;
  user.role = "BRAND_ADMIN";
  user.tenant = {
    tenantId: tenant._id,
    tenantName: tenant.name,
  };

  await user.save();

  res.status(201).json({
    success: true,
    message: "User created successfully",
  });
});


export const getAllBrandManagers = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can view Brand Managers"
    );
  }

  const { tenantId } = req.query;

  const filter = {
    role: "BRAND_ADMIN",
  };

  if (tenantId) {
    filter["tenant.tenantId"] = tenantId;
  } else {
    throw new ApiError(400, "TenantId not found")
  }

  const brandManagers = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResoponse(
      200,
      brandManagers,
      "Brand Managers fetched successfully"
    )
  );
});


export const deleteBrandManager = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only SUPER_ADMIN can delete Brand Managers"
    );
  }

  const { managerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(managerId)) {
    throw new ApiError(400, "Invalid managerId");
  }

  const manager = await User.findOne({
    _id: managerId,
    role: "BRAND_ADMIN",
  });

  if (!manager) {
    throw new ApiError(404, "Brand Manager not found");
  }

  await User.deleteOne({ _id: manager._id });

  return res.status(200).json(
    new ApiResoponse(
      200,
      { managerId: manager._id },
      "Brand Manager deleted successfully"
    )
  );
});

// export const createOutletManager = asyncHandler(async (req, res) => {
//   if (req.user.role !== "BRAND_ADMIN") {
//     throw new ApiError(403, "Only BRAND_ADMIN can create an Outlet Manager");
//   }

//   const { userName, email, password, outletId } = req.body;

//   if (!userName || !email || !password || !outletId) {
//     throw new ApiError(
//       400,
//       "userName, email, password and outletId are required"
//     );
//   }

//   const tenantContext = req.user.tenant;

//   if (!tenantContext?.tenantId) {
//     throw new ApiError(400, "User is not associated with any tenant");
//   }

//   const outlet = await Outlet.findOne({
//     _id: outletId,
//     "tenant.tenantId": tenantContext.tenantId,
//   });

//   if (!outlet) {
//     throw new ApiError(
//       404,
//       "Outlet not found or does not belong to your tenant"
//     );
//   }

//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     throw new ApiError(409, "User with this email already exists");
//   }

//   const outletManager = await User.create({
//     userName,
//     email,
//     password,
//     role: "OUTLET_MANAGER",
//     tenant: {
//       tenantId: tenantContext.tenantId,
//       tenantName: tenantContext.tenantName,
//     },
//     outlet: {
//       outletId: outlet._id,
//       outletName: outlet.outletName,
//     },
//   });

//   return res.status(201).json(
//     new ApiResoponse(
//       201,
//       {
//         _id: outletManager._id,
//         userName: outletManager.userName,
//         email: outletManager.email,
//         role: outletManager.role,
//         tenant: outletManager.tenant,
//         outlet: outletManager.outlet,
//         createdAt: outletManager.createdAt,
//       },
//       "Outlet Manager created successfully"
//     )
//   );
// });

export const requestOutletManagerOTP = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create Outlet Manager");
  }

  const { email, outletId } = req.body;

  if (!email || !outletId) {
    throw new ApiError(400, "email and outletId are required");
  }
  console.log(email,outletId);
  
  const tenantContext = req.user.tenant;
  console.log(tenantContext);
  
  const outlet = await Outlet.findOne({
    _id: outletId,
    "tenant.tenantId": tenantContext.tenantId,
  });
  console.log(outlet);
  
  if (!outlet) {
    throw new ApiError(404, "Outlet not found or does not belong to your tenant");
  }

  const otp = generateOTP();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email });
  }
  console.log(user);
  

  user.otpHash = hashOTP(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.otpPurpose = "SIGNUP";
  user.outlet = {
    outletId: outlet._id,
    outletName: outlet.outletName,
  };
  user.tenant=tenantContext


  await user.save();

  await sendOTPEmail({ to: email, otp });

  res.json({
    success: true,
    message: "OTP sent successfully to Outlet Manager email",
  });
});
export const verifyOutletManagerOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select(
    "+otpHash +otpExpiresAt +otpPurpose"
  );
  console.log("generate",user.toObject());

  if (!user || user.otpPurpose !== "SIGNUP") {
    throw new ApiError(400, "Invalid request");
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }

  if (hashOTP(otp) !== user.otpHash) {
    user.otpAttempts++;
    await user.save();
    throw new ApiError(400, "Invalid OTP");
  }

  user.emailVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;

  await user.save();
  

  res.json({ success: true, message: "Email verified successfully" });
});
export const completeOutletManagerSignup = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!email || !userName || !password) {
    throw new ApiError(400, "email, userName and password are required");
  }

  const user = await User.findOne({ email });
  console.log("verified",user.toObject());
  
  if (!user || !user.emailVerified) {
    throw new ApiError(403, "Email not verified");
  }

  if (user.password) {
    throw new ApiError(409, "User already created");
  }

  if (!user.outlet?.outletId) {
    throw new ApiError(400, "Outlet context missing");
  }

  user.userName = userName;
  user.password = password;
  user.role = "OUTLET_MANAGER";
  user.outlet = user.outlet;
  user.tempOutlet = undefined;

  await user.save();
  
  res.status(201).json(
    new ApiResoponse(
      201,
      {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
        outlet: user.outlet,
        createdAt: user.createdAt,
      },
      "Outlet Manager created successfully"
    )
  );
});


export const getAllOutletManagers = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(
      403,
      "Only BRAND_ADMIN can view Outlet Managers"
    );
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const { outletId } = req.query;

  const filter = {
    role: "OUTLET_MANAGER",
    "tenant.tenantId": tenantContext.tenantId,
  };

  if (outletId) {
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      throw new ApiError(400, "Invalid outletId");
    }
    filter["outlet.outletId"] = outletId;
  } else {
    throw new ApiError(400, "OutletId is not present");
  }

  const outletManagers = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });
  
  return res.status(200).json(
    new ApiResoponse(
      200,
      outletManagers,
      "Outlet Managers fetched successfully"
    )
  );
});

export const deleteOutletManager = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(
      403,
      "Only BRAND_ADMIN can delete Outlet Managers"
    );
  }

  const tenantContext = req.user.tenant;
  const { managerId } = req.params;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  if (!mongoose.Types.ObjectId.isValid(managerId)) {
    throw new ApiError(400, "Invalid managerId");
  }

  const manager = await User.findOne({
    _id: managerId,
    role: "OUTLET_MANAGER",
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!manager) {
    throw new ApiError(
      404,
      "Outlet Manager not found or does not belong to your tenant"
    );
  }

  await User.deleteOne({ _id: manager._id });

  return res.status(200).json(
    new ApiResoponse(
      200,
      { managerId: manager._id },
      "Outlet Manager deleted successfully"
    )
  );
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken } = await generateAccessToken(user._id);



  return res.status(200).cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  }).json(
    new ApiResoponse(
      200,
      {
        accessToken,
        user: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          role: user.role,
          tenant: user.tenant,
          outlet: user.outlet,
        },
      },
      "Login successful"
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      null,
      "Logged out successfully"
    )
  );
});


export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResoponse(200,
      req.user,
      "User Fetched Successfully"
    )
  )
})