import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendOTPEmail(email, otp, name) {
  const mailOptions = {
    from: `"GTU AI Chatbot" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - OTP Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for registering with GTU AI Chatbot! To complete your registration, please verify your email address.</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            
            <p>Best regards,<br>GTU AI Chatbot Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: `"GTU AI Chatbot" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to GTU AI Chatbot! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 4px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to GTU AI Chatbot! 🎓</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Your account has been successfully verified! We're excited to have you on board.</p>
            
            <h3>What you can do:</h3>
            <div class="feature">
              <strong>📚 Subject-Specific Chat</strong><br>
              Get instant answers from your uploaded course materials
            </div>
            <div class="feature">
              <strong>📄 Access PYQs</strong><br>
              Browse and download previous year question papers
            </div>
            <div class="feature">
              <strong>🧠 Generate Question Papers</strong><br>
              AI-powered question paper generation based on patterns
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/chat" class="cta-button">Start Chatting</a>
            </div>
            
            <p>Best regards,<br>GTU AI Chatbot Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Welcome email failed:', error);
  }
}