import axios from 'axios';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

// Use direct HTTP API approach which is more reliable
const BREVO_API_BASE = 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

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
    const emailData = {
      sender: {
        name: params.senderName || 'AetherRun Support',
        email: params.senderEmail || 'support@aetherrun.com'
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent || ''
    };

    console.log('Attempting to send email with Brevo API...');
    console.log('Sender:', emailData.sender);
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);

    const response = await axios.post(`${BREVO_API_BASE}/smtp/email`, emailData, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Email sent successfully:', response.data);
    return true;
  } catch (error: any) {
    console.error('Brevo email error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
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