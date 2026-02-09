const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"KaRima Restaurant" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your KaRima account",
    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${code}</h1>
      <p>This code expires soon.</p>
    `
  });
};
