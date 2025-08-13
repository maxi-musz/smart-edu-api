interface EmailVerificationOTPParams {
  email: string;
  firstName: string;
  otp: string;
}

export const emailVerificationOTPTemplate = ({
  email,
  firstName,
  otp,
}: EmailVerificationOTPParams) => {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email Address</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2d3748;
            }
            
            .message {
                font-size: 16px;
                margin-bottom: 30px;
                color: #4a5568;
                line-height: 1.7;
            }
            
            .otp-container {
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }
            
            .otp-label {
                font-size: 14px;
                color: #718096;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            .otp-code {
                font-size: 32px;
                font-weight: 700;
                color: #2d3748;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                background: white;
                padding: 15px 25px;
                border-radius: 8px;
                border: 2px solid #cbd5e0;
                display: inline-block;
                margin: 10px 0;
            }
            
            .expiry-notice {
                font-size: 14px;
                color: #e53e3e;
                margin-top: 15px;
                font-weight: 500;
            }
            
            .security-notice {
                background-color: #fff5f5;
                border-left: 4px solid #f56565;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .security-notice h3 {
                color: #c53030;
                font-size: 16px;
                margin-bottom: 10px;
            }
            
            .security-notice p {
                color: #742a2a;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .footer {
                background-color: #f7fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer p {
                color: #718096;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
            
            .support-info {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
            }
            
            .support-info p {
                color: #a0aec0;
                font-size: 12px;
                line-height: 1.5;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 4px;
                }
                
                .header {
                    padding: 20px;
                }
                
                .header h1 {
                    font-size: 24px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .otp-code {
                    font-size: 28px;
                    letter-spacing: 6px;
                    padding: 12px 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Email Verification</h1>
                <p>Smart Edu Hub - Secure Your Account</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${firstName}! 👋
                </div>
                
                <div class="message">
                    Thank you for joining Smart Edu Hub! To complete your account setup and ensure the security of your account, please verify your email address using the verification code below.
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="expiry-notice">⏰ This code expires in 10 minutes</div>
                </div>
                
                <div class="message">
                    Please enter this code in the verification field on our website or mobile app to complete your email verification process.
                </div>
                
                <div class="security-notice">
                    <h3>🔒 Security Reminder</h3>
                    <p>
                        • Never share this verification code with anyone<br>
                        • Our team will never ask for this code via phone or email<br>
                        • If you didn't request this verification, please ignore this email
                    </p>
                </div>
                
                <div class="message">
                    Once verified, you'll have full access to all Smart Edu Hub features and can start your educational journey with us!
                </div>
            </div>
            
            <div class="footer">
                <p>Best regards,<br><strong>The Smart Edu Hub Team</strong></p>
                
                <div class="support-info">
                    <p>
                        Need help? Contact our support team at 
                        <a href="mailto:support@smarteduhub.com">support@smarteduhub.com</a><br>
                        Visit us at <a href="https://smarteduhub.com">smarteduhub.com</a>
                    </p>
                    <p style="margin-top: 15px; font-size: 11px; color: #cbd5e0;">
                        © ${currentYear} Smart Edu Hub. All rights reserved.<br>
                        This email was sent to ${email}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
