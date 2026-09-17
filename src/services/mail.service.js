import "dotenv/config";
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    return info;
  } catch (error) {
    console.error("=================================");
    console.error("EMAIL SEND FAILED");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Response:", error.response);
    console.error("Response Code:", error.responseCode);
    console.error("=================================");

    throw error;
  }
};

const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("SMTP server is ready.");
  } catch (error) {
    console.error("SMTP CONNECTION FAILED:", error.message);
    throw error;
  }
};

export {
  sendEmail,
  verifyEmailConnection,
};