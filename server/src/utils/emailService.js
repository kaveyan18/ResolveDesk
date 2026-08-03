const nodemailer = require('nodemailer');

/**
 * Creates and returns a nodemailer transporter.
 * Falls back to console log / test mode if SMTP environment variables are missing.
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST ? process.env.EMAIL_HOST.trim() : null;
  const port = process.env.EMAIL_PORT ? process.env.EMAIL_PORT.trim() : 587;
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : null;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Return null if not configured - sendEmail will log gracefully
  return null;
};

/**
 * Helper to get status color badge styling for HTML email
 */
const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Pending':
      return 'background-color: #FEF3C7; color: #92400E; border: 1px solid #FCD34D;';
    case 'Assigned':
      return 'background-color: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD;';
    case 'In Progress':
      return 'background-color: #F3E8FF; color: #6B21A8; border: 1px solid #D8B4FE;';
    case 'Resolved':
      return 'background-color: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7;';
    case 'Closed':
      return 'background-color: #F3F4F6; color: #374151; border: 1px solid #D1D5DB;';
    case 'Rejected':
      return 'background-color: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;';
    default:
      return 'background-color: #E0E7FF; color: #3730A3; border: 1px solid #A5B4FC;';
  }
};

/**
 * Send an email for complaint status updates
 */
const sendComplaintStatusEmail = async ({
  recipientEmail,
  recipientName,
  ticketId,
  title,
  status,
  priority = 'Medium',
  location = 'Campus Location',
  message = '',
  updatedBy = 'ResolveDesk System',
}) => {
  if (!recipientEmail) return;

  const subject = `[ResolveDesk] Status Update: ${ticketId} is now ${status}`;
  const statusStyle = getStatusBadgeStyle(status);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F4F5FA; margin: 0; padding: 20px; color: #12172B; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(18, 23, 43, 0.08); border: 1px solid #E5E7F0; }
        .header { background-color: #12172B; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; color: #98A0BE; text-transform: uppercase; tracking: 1px; }
        .content { padding: 30px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .intro { font-size: 14px; color: #666F8A; line-height: 1.5; margin-bottom: 24px; }
        .status-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
        .status-pill { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${statusStyle} }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .details-table td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
        .details-table td.label { color: #666F8A; font-weight: 600; width: 120px; }
        .details-table td.value { color: #12172B; font-weight: 500; }
        .footer { background-color: #F8FAFC; border-top: 1px solid #E5E7F0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ResolveDesk</h1>
          <p>Campus Complaint Management</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${recipientName || 'User'},</div>
          <div class="intro">The status of your complaint has been updated. Below are the updated details:</div>
          
          <div class="status-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-family: monospace; font-weight: 700; color: #2A4FD1; font-size: 14px;">${ticketId}</span>
              <span class="status-pill">${status}</span>
            </div>
            
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #12172B;">${title}</h3>
            ${message ? `<p style="margin: 0; font-size: 13px; color: #475569;">${message}</p>` : ''}
            
            <table class="details-table">
              <tr>
                <td class="label">Location:</td>
                <td class="value">${location}</td>
              </tr>
              <tr>
                <td class="label">Priority:</td>
                <td class="value">${priority}</td>
              </tr>
              <tr>
                <td class="label">Updated By:</td>
                <td class="value">${updatedBy}</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="footer">
          This is an automated notification from ResolveDesk System.<br>
          Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[EMAIL SERVICE - DEV SIMULATION]
  Recipient: ${recipientEmail} (${recipientName})
  Subject: ${subject}
  Ticket: ${ticketId} | Status: ${status}
  Notice: Configure EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env to send live emails.`);
      return true;
    }

    const fromAddress = process.env.EMAIL_FROM || '"ResolveDesk Support" <noreply@resolvedesk.college.edu>';
    await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[EMAIL SERVICE] Status email sent to ${recipientEmail} for ticket ${ticketId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${recipientEmail}:`, error.message);
    return false;
  }
};

/**
 * Send an email when a technician is assigned to a complaint
 */
const sendAssignmentEmail = async ({
  recipientEmail,
  recipientName,
  ticketId,
  title,
  assignedStaffName,
  role = 'Student',
  priority = 'Medium',
  location = 'Campus Location',
}) => {
  if (!recipientEmail) return;

  const isTechnician = role === 'Technician';
  const subject = isTechnician
    ? `[ResolveDesk] New Complaint Assigned: ${ticketId}`
    : `[ResolveDesk] Technician Assigned to ${ticketId}`;

  const message = isTechnician
    ? `You have been assigned to resolve ticket #${ticketId} (${title}).`
    : `${assignedStaffName} has been assigned to work on your complaint.`;

  return sendComplaintStatusEmail({
    recipientEmail,
    recipientName,
    ticketId,
    title,
    status: 'Assigned',
    priority,
    location,
    message,
    updatedBy: 'Department Head',
  });
};

/**
 * Send an email with a 6-digit OTP code for Password Reset
 */
const sendPasswordResetOTP = async ({ recipientEmail, recipientName, otp }) => {
  if (!recipientEmail || !otp) return false;

  const subject = `[ResolveDesk] Password Reset Code: ${otp}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F4F5FA; margin: 0; padding: 20px; color: #12172B; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(18, 23, 43, 0.08); border: 1px solid #E5E7F0; }
        .header { background-color: #12172B; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 4px 0 0 0; font-size: 12px; color: #98A0BE; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 30px 24px; text-align: center; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; text-align: left; }
        .intro { font-size: 14px; color: #666F8A; line-height: 1.5; margin-bottom: 24px; text-align: left; }
        .otp-box { background-color: #E9EDFC; border: 2px dashed #2A4FD1; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
        .otp-code { font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2A4FD1; margin: 0; }
        .expiry { font-size: 12px; color: #666F8A; margin-top: 8px; }
        .footer { background-color: #F8FAFC; border-top: 1px solid #E5E7F0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ResolveDesk</h1>
          <p>Password Reset Verification</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${recipientName || 'User'},</div>
          <div class="intro">We received a request to reset the password for your ResolveDesk account. Use the 6-digit verification code below:</div>
          
          <div class="otp-box">
            <h2 class="otp-code">${otp}</h2>
            <p class="expiry">This code will expire in 15 minutes.</p>
          </div>
          
          <p style="font-size: 12px; color: #94A3B8; text-align: left; margin-top: 20px;">
            If you did not request a password reset, please ignore this email or contact your campus administrator.
          </p>
        </div>
        <div class="footer">
          This is an automated security verification email from ResolveDesk System.<br>
          Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[EMAIL SERVICE - DEV SIMULATION]
  Password Reset OTP for ${recipientEmail}: ${otp}`);
      return false;
    }

    const fromAddress = process.env.EMAIL_FROM || '"ResolveDesk Support" <noreply@resolvedesk.college.edu>';
    await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[EMAIL SERVICE] Password reset OTP email sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send OTP email to ${recipientEmail}:`, error.message);
    return false;
  }
};

module.exports = {
  sendComplaintStatusEmail,
  sendAssignmentEmail,
  sendPasswordResetOTP,
};
