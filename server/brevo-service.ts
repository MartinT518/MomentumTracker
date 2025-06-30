import * as brevo from '@getbrevo/brevo';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

// Initialize Brevo API instance
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    sendSmtpEmail.textContent = params.textContent || '';
    sendSmtpEmail.sender = {
      name: params.senderName || 'AetherRun Support',
      email: params.senderEmail || 'noreply@aetherrun.com'
    };
    sendSmtpEmail.to = [{ email: params.to }];

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', response.body);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
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
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${formData.name} (${formData.email})</p>
    <p><strong>Subject:</strong> ${formData.subject}</p>
    <p><strong>Message:</strong></p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
      ${formData.message.replace(/\n/g, '<br>')}
    </div>
    <hr>
    <p style="font-size: 12px; color: #666;">
      This message was sent from the AetherRun contact form.
    </p>
  `;

  const textContent = `
New Contact Form Submission

From: ${formData.name} (${formData.email})
Subject: ${formData.subject}

Message:
${formData.message}

---
This message was sent from the AetherRun contact form.
  `;

  return await sendEmail({
    to: 'support@aetherrun.com',
    subject: `Contact Form: ${formData.subject}`,
    htmlContent,
    textContent,
    senderName: formData.name,
    senderEmail: formData.email
  });
}