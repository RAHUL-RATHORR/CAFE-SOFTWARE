import { NotificationAdapter, SendNotificationParams, SendNotificationResult } from "./notification-adapter.interface";

export class SmsAdapter implements NotificationAdapter {
  name = "MockSmsProvider";
  channel = "SMS" as const;

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    console.log(`[SMS ADAPTER] Sending SMS to: ${params.to}`);
    // console.log(`[SMS ADAPTER] Body: ${params.body}`);

    try {
      // In a real implementation:
      // await twilio.messages.create({ from: process.env.SMS_SENDER, to: params.to, body: params.body });
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return {
        success: true,
        providerMessageId: `sms_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    } catch (error: any) {
      console.error("[SMS ADAPTER] Error sending SMS:", error);
      return {
        success: false,
        error: error.message || "Unknown SMS error",
      };
    }
  }
}
