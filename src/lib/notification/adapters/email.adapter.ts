import { NotificationAdapter, SendNotificationParams, SendNotificationResult } from "./notification-adapter.interface";

export class EmailAdapter implements NotificationAdapter {
  name = "MockEmailProvider";
  channel = "EMAIL" as const;

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    console.log(`[EMAIL ADAPTER] Sending email to: ${params.to}`);
    console.log(`[EMAIL ADAPTER] Subject: ${params.subject}`);
    // console.log(`[EMAIL ADAPTER] Body: ${params.body}`);

    try {
      // In a real implementation:
      // await sendgrid.send({ to: params.to, from: process.env.EMAIL_FROM, subject: params.subject, html: params.body });
      
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        providerMessageId: `email_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    } catch (error: any) {
      console.error("[EMAIL ADAPTER] Error sending email:", error);
      return {
        success: false,
        error: error.message || "Unknown email error",
      };
    }
  }
}
