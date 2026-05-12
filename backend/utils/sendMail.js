const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

await transporter.sendMail({
  from: "admin@briskolive.com",
  to,
  cc,
  subject,
  html,
});

module.exports = sendMail;