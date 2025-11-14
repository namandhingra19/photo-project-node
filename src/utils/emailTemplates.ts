export const emailTemplates = {
  verification: (email: string, verificationToken: string, role: string) => ({
    subject: 'Verify Your Email - Photo Project App',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .role-badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 Photo Project App</h1>
            <p>Welcome to the photographer's enterprise platform!</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello!</p>
            <p>Thank you for signing up as a <span class="role-badge">${role}</span> on Photo Project App.</p>
            <p>To complete your registration and start using our platform, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&role=${role}" class="button">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&role=${role}
            </p>
            
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Photo Project App. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (email: string, resetToken: string) => ({
    subject: 'Reset Your Password - Photo Project App',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
            <p>Photo Project App Security</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello!</p>
            <p>We received a request to reset your password for your Photo Project App account.</p>
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" class="button">
                Reset Password
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}
            </p>
            
            <p><strong>Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
          </div>
          <div class="footer">
            <p>© 2024 Photo Project App. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcome: (name: string, role: string, tenantName?: string) => ({
    subject: 'Welcome to Photo Project App!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .role-badge { background: #007bff; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Photo Project App!</h1>
            <p>Your photography enterprise platform is ready</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to Photo Project App! Your account has been successfully created as a <span class="role-badge">${role}</span>.</p>
            
            ${tenantName ? `<p>You're now part of <strong>${tenantName}</strong> organization.</p>` : ''}
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
              <h4>📸 ${role === 'ENTERPRISE' ? 'Manage Projects & Albums' : 'View & Download Photos'}</h4>
              <p>${role === 'ENTERPRISE' 
                ? 'Create and manage photography projects, organize albums, and collaborate with clients.' 
                : 'Browse through your assigned projects and download high-quality photos.'}
              </p>
            </div>
            
            <div class="feature">
              <h4>👥 ${role === 'ENTERPRISE' ? 'Invite Team Members' : 'Access Your Photos'}</h4>
              <p>${role === 'ENTERPRISE' 
                ? 'Invite team members and clients to collaborate on your photography projects.' 
                : 'Access all photos from projects you\'ve been invited to.'}
              </p>
            </div>
            
            <div class="feature">
              <h4>🔐 Secure & Private</h4>
              <p>All your photos are stored securely and only accessible to authorized users.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                Go to Dashboard
              </a>
            </div>
            
            <p>If you have any questions or need help getting started, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 Photo Project App. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};




