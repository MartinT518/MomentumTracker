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
    
    // Use a verified sender domain - try different sender configurations
    sendSmtpEmail.sender = {
      name: 'AetherRun Support',
      email: 'support@replit.app' // Use replit.app domain which is likely verified
    };
    sendSmtpEmail.to = [{ email: params.to }];

    console.log('Attempting to send email with Brevo...');
    console.log('Sender:', sendSmtpEmail.sender);
    console.log('To:', sendSmtpEmail.to);
    console.log('Subject:', sendSmtpEmail.subject);

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', response.body);
    return true;
  } catch (error: any) {
    console.error('Brevo email error details:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
      response: error.response
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

  try {
    const emailSent = await sendEmail({
      to: 'support@aetherrun.com',
      subject: `Contact Form: ${formData.subject}`,
      htmlContent,
      textContent,
      senderName: formData.name,
      senderEmail: formData.email
    });

    if (!emailSent) {
      // Log the contact form submission locally for manual processing
      console.log('='.repeat(80));
      console.log('CONTACT FORM SUBMISSION (Email service unavailable)');
      console.log('='.repeat(80));
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`From: ${formData.name} (${formData.email})`);
      console.log(`Subject: ${formData.subject}`);
      console.log(`Message:`);
      console.log(formData.message);
      console.log('='.repeat(80));
    }

    return emailSent;
  } catch (error: any) {
    // Log the contact form submission locally for manual processing
    console.log('='.repeat(80));
    console.log('CONTACT FORM SUBMISSION (Email service error)');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`From: ${formData.name} (${formData.email})`);
    console.log(`Subject: ${formData.subject}`);
    console.log(`Message:`);
    console.log(formData.message);
    console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('='.repeat(80));
    return false;
  }
}