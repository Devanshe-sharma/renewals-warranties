const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter once on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ MAIL SERVER CONNECTION FAILED");
    console.error(error);
  } else {
    console.log("✅ MAIL SERVER READY");
  }
});

const sendMail = async ({ to, cc = [], subject, html }) => {
  try {

    if (!to) {
      throw new Error("Recipient email is missing");
    }

    console.log("=================================");
    console.log("📨 SENDING MAIL");
    console.log("TO:", to);
    console.log("CC:", cc);
    console.log("SUBJECT:", subject);
    console.log("=================================");

    const mailOptions = {
      from: `"Brisk Olive RMS" <${process.env.EMAIL_USER}>`,
      to,
      cc: Array.isArray(cc) ? cc.join(",") : cc,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ MAIL SENT SUCCESSFULLY");
    console.log("ACCEPTED:", info.accepted);
    console.log("REJECTED:", info.rejected);
    console.log("RESPONSE:", info.response);
    console.log("MESSAGE ID:", info.messageId);
    console.log("=================================");

    return {
      success: true,
      info,
    };

  } catch (err) {

    console.error("❌ MAIL SEND FAILED");
    console.error(err);
    console.log("=================================");

    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = sendMail;