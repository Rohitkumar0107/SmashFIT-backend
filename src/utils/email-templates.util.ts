export const getRegistrationOtpTemplate = (otp: string, token: string) => {
  const verifyUrl = `${process.env.BACKEND_URL || ""}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "Verify Your Account Registration",
    text: `Your account activation OTP is: ${otp}. It is valid for 10 minutes.

You can also verify by clicking this link: ${verifyUrl}`,
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to SmashFIT!</h2>
                <p>Please use the following OTP to verify your email address and complete registration:</p>
                <h1 style="color: #2196F3; letter-spacing: 5px;">${otp}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p>Alternatively you may <a href="${verifyUrl}">click here to verify</a>.</p>
            </div>
        `,
  };
};

export const getWelcomeEmailTemplate = (fullName: string) => {
  return {
    subject: "Welcome to SmashFIT! Your Account is Ready",
    text: `Hi ${fullName},\n\nYour account has been successfully verified! Welcome to SmashFIT.\n\nEnjoy exploring!`,
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4CAF50;">Registration Successful! 🎉</h2>
                <p>Hello <b>${fullName}</b>,</p>
                <p>Your email has been successfully verified and your account is now fully active.</p>
                <p>Welcome to <b>SmashFIT</b>! Start your fitness journey today.</p>
                <br>
                <p>Best Regards,</p>
                <p><b>The SmashFIT Team</b></p>
            </div>
        `,
  };
};

export const getPasswordResetOtpTemplate = (otp: string) => {
  return {
    subject: "Password Reset OTP",
    text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`,
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Your OTP is:</p>
                <h1 style="color: #FF5722; letter-spacing: 5px;">${otp}</h1>
                <p>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
  };
};
