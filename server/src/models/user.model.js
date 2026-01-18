import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    tenant: {
      _id: false,
      type: {
        tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref:"Tenant",
        },
        tenantName: {
          type: String,
          trim: true,
        },
      },
      default: null,
    },

    outlet: {
      type: {
        outletId: {
          type: mongoose.Schema.Types.ObjectId,
          ref:"Outlet",
        },
        outletName: {
          type: String,
          trim: true,
        },
      },
      default: null,
    },

    userName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "BRAND_ADMIN", "OUTLET_MANAGER"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      role: this.role,
      tenantId: this.tenant?.tenantId ?? null,
      outletId: this.outlet?.outletId ?? null,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};


export default model("User", UserSchema);
