const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

async function sendVerificationEmail(toEmail, name, code) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER/EMAIL_PASS missing in .env");
  }

  console.log("Sending verification email to:", toEmail);

  const subject = "KaRima Verification Code";
  const text = `Hi ${name || "there"}, your verification code is: ${code}\nThis code expires in 10 minutes.`;

  await transporter.sendMail({
    from: EMAIL_USER,
    to: toEmail,
    subject,
    text
  });
}

module.exports = { sendVerificationEmail };
