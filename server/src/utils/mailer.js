import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve("../../", ".env.worker"),
});



export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: "nischaysharma05@gmail.com",
    pass: "wvcm pvpy yszt ifad",
  },
});



