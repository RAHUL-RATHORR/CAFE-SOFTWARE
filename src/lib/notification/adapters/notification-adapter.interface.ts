export interface SendNotificationParams {
  to: string;
  subject?: string;
  body: string;
  templateId?: string; // If provider requires pre-approved templates
  variables?: Record<string, any>;
}

export interface SendNotificationResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  errorCode?: string;
}

export interface NotificationAdapter {
  name: string;
  channel: "WHATSAPP" | "EMAIL" | "SMS";
  send(params: SendNotificationParams): Promise<SendNotificationResult>;
}
