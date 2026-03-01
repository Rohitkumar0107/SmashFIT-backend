import nodemailer from "nodemailer";
// googleapis is optional — require at runtime only when OAuth2 env is provided

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.trim();


// quick sanity check: Gmail app passwords are 16 chars long
if (
  SMTP_USER?.endsWith("@gmail.com") &&
  SMTP_PASS &&
  SMTP_PASS.length !== 16 &&
  !process.env.GOOGLE_OAUTH_REFRESH_TOKEN
) {
  console.warn(
    "⚠️ It looks like you're using a Gmail account but the SMTP_PASS value",
    "is not 16 characters long. Make sure you've created a Gmail App Password",
    "(requires 2FA) rather than using your normal account password.",
  );
}

const buildTransportOptions = async () => {
  // If OAuth2 env vars are present, prefer OAuth2
  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken && SMTP_USER) {
    try {
      // dynamic import so the package is optional during development
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { google } = require("googleapis");
      const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oAuth2Client.setCredentials({ refresh_token: refreshToken });
      const { token } = await oAuth2Client.getAccessToken();

      return {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          type: "OAuth2",
          user: SMTP_USER,
          accessToken: token,
          clientId,
          clientSecret,
          refreshToken,
        },
        logger: true,
        debug: true,
      } as any;
    } catch (err) {
      console.warn(
        "googleapis not installed — skipping OAuth2 transport setup",
      );
    }
  }

  // Fallback to simple user/pass auth (App Password)
  return {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    logger: true,
    debug: true,
  } as any;
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = buildTransportOptions().then((opts) =>
      nodemailer.createTransport(opts),
    );
  }
  return transporterPromise;
};

/**
 * Verify SMTP connection once at server start
 */
export const verifyEmailConnection = async () => {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    console.log("✅ SMTP ready");
  } catch (error: any) {
    console.error("❌ SMTP connection failed");
    console.error(
      "Code:",
      error.code || "-",
      "ResponseCode:",
      error.responseCode || "-",
    );
    console.error(error?.response || error?.message || error);

    // common misconfiguration help
    if (error.code === "EAUTH") {
      console.warn(
        "→ authentication failed. Ensure SMTP_USER is correct and/or",
        "SMTP_PASS is a valid Gmail App Password (not your normal login),",
        "or configure OAuth2 credentials via GOOGLE_OAUTH_* env vars.",
      );
      if (
        SMTP_PASS &&
        SMTP_PASS.length !== 16 &&
        SMTP_USER?.endsWith("@gmail.com")
      ) {
        console.warn(
          "   (Gmail app passwords are 16 characters long; if yours is",
          "different you probably used the wrong password.)",
        );
      }
    }
  }
};

/**
 * Send email function
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  try {
    if (!SMTP_USER) {
      throw new Error("SMTP_USER is not set in environment");
    }

    const transporter = await getTransporter();

    const mailOptions = {
      from: `"SmashFIT Security" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || `<div style="font-family:sans-serif">${text}</div>`,
    };

    const info = await transporter.sendMail(mailOptions as any);

    console.log("📧 Email sent:", info.messageId || info.messageId);
    return true;
  } catch (error: any) {
    console.error("❌ Email send error:");
    console.error(
      "Code:",
      error.code || "-",
      "ResponseCode:",
      error.responseCode || "-",
    );
    console.error(error?.response || error?.message || error);

    if (error.code === "EAUTH") {
      console.warn(
        "→ authentication failed when sending message. Verify that",
        "SMTP_PASS is an active Gmail App Password, 2FA is enabled,",
        "or switch to OAuth2 using GOOGLE_OAUTH_* variables.",
      );
    }

    throw new Error("Failed to send email");
  }
};
