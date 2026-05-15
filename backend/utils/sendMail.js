const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async ({ to, cc, subject, html }) => {
  try {
    console.log("=================================");
    console.log("📨 SENDING MAIL");
    console.log("TO:", to);
    console.log("CC:", cc);
    console.log("SUBJECT:", subject);
    console.log("=================================");

    const info = await transporter.sendMail({
      from: `"Brisk Olive RMS" <${process.env.EMAIL_USER}>`,
      to,
      cc,
      subject,
      html,
    });

    console.log("✅ MAIL SENT SUCCESSFULLY");
    console.log("ACCEPTED:", info.accepted);
    console.log("REJECTED:", info.rejected);
    console.log("RESPONSE:", info.response);
    console.log("MESSAGE ID:", info.messageId);
    console.log("=================================");

    return info;
  } catch (err) {
    console.error("❌ MAIL SEND FAILED");
    console.error(err);
    console.log("=================================");

    throw err;
  }
};

module.exports = sendMail;