// utils/sendMail.js
const nodemailer = require("nodemailer");

const sendMail = async ({ to, cc, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to, cc, subject, html,
  });
};

module.exports = sendMail;