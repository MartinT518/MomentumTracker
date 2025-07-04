import { google } from 'googleapis';

interface EmailParams {
  to: string;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      console.log('Gmail API credentials not configured. Skipping email send.');
      return false;
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // redirect URL
    );

    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // Create Gmail API instance
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email content
    const senderEmail = params.senderEmail || process.env.GMAIL_USER_EMAIL || 'support@aetherrun.com';
    const senderName = params.senderName || 'AetherRun Support';
    
    const emailLines = [
      `From: ${senderName} <${senderEmail}>`,
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      params.htmlContent || params.textContent || ''
    ];

    const email = emailLines.join('\n');
    const base64Email = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Send email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64Email,
      },
    });

    console.log('Gmail email sent successfully:', result.data.id);
    return true;

  } catch (error: any) {
    console.error('Gmail email error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      data: error.response?.data
    });
    return false;
  }
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactFormEmail(formData: ContactFormData): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Subject:</strong> ${formData.subject}</p>
      </div>
      
      <div style="margin: 20px 0;">
        <h3 style="color: #333;">Message:</h3>
        <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; border-radius: 3px;">
          ${formData.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
        <p>This message was sent via the AetherRun contact form.</p>
        <p>Reply directly to this email to respond to ${formData.name}.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: 'support@aetherrun.com',
    subject: `Contact Form: ${formData.subject}`,
    htmlContent,
    textContent: `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

Reply directly to this email to respond to ${formData.name}.
    `,
    senderName: formData.name,
    senderEmail: formData.email
  });
}