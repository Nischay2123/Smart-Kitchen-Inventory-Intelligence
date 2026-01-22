import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve("../../", ".env.worker"),
});



export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



