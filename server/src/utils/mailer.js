import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

import config from "./config.js";

export const mailer = nodemailer.createTransport({
  host: config.SMTP.HOST,
  port: config.SMTP.PORT,
  secure: false,
  auth: {
    user: config.SMTP.USER,
    pass: config.SMTP.PASS,
  },
});



