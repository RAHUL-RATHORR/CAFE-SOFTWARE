import { NotificationAdapter, SendNotificationParams, SendNotificationResult } from "./notification-adapter.interface";

export class WhatsAppAdapter implements NotificationAdapter {
  name = "MockWhatsAppProvider";
  channel = "WHATSAPP" as const;

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    console.log(`[WHATSAPP ADAPTER] Sending WhatsApp to: ${params.to}`);
    // console.log(`[WHATSAPP ADAPTER] Body: ${params.body}`);

    try {
      // In a real implementation:
      // await whatsappProvider.messages.create({ from: process.env.WHATSAPP_SENDER, to: params.to, body: params.body });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        success: true,
        providerMessageId: `wa_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    } catch (error: any) {
      console.error("[WHATSAPP ADAPTER] Error sending message:", error);
      return {
        success: false,
        error: error.message || "Unknown WhatsApp error",
      };
    }
  }
}
