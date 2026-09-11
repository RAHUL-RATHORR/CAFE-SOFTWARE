import { Types } from "mongoose";
import { MessageLogModel } from "@/models/notification/message-log.model";
import { NotificationTemplateModel } from "@/models/notification/template.model";
import { TemplateService } from "./template.service";
import { EmailAdapter } from "./adapters/email.adapter";
import { WhatsAppAdapter } from "./adapters/whatsapp.adapter";
import { SmsAdapter } from "./adapters/sms.adapter";
import { NotificationAdapter } from "./adapters/notification-adapter.interface";
import { connectToDatabase } from "@/lib/database";

export interface DispatchParams {
  eventType: string;
  restaurantId: string | Types.ObjectId;
  branchId?: string | Types.ObjectId | null;
  referenceKey: string; // e.g. "ORDER_CONFIRMED:1045"
  recipient: {
    email?: string | null;
    phone?: string | null; // Including country code preferably
    userId?: string | Types.ObjectId | null; // For internal notifications to check prefs
  };
  variables: Record<string, any>;
  channels?: ("WHATSAPP" | "EMAIL" | "SMS")[]; // Optional override to force specific channels
}

const adapters: Record<string, NotificationAdapter> = {
  EMAIL: new EmailAdapter(),
  WHATSAPP: new WhatsAppAdapter(),
  SMS: new SmsAdapter(),
};

// Sensible defaults if no template is found in DB
const DEFAULT_TEMPLATES: Record<string, Record<string, { subject?: string, body: string }>> = {
  ORDER_RECEIVED: {
    WHATSAPP: { body: "Your order #{{orderNumber}} has been received." },
    EMAIL: { subject: "Order Received - #{{orderNumber}}", body: "Your order #{{orderNumber}} has been received." },
    SMS: { body: "Your order #{{orderNumber}} has been received." }
  },
  ORDER_CONFIRMED: {
    WHATSAPP: { body: "Hello {{customerName}}, your order #{{orderNumber}} has been confirmed. Total: {{totalAmount}}." },
    EMAIL: { subject: "Order Confirmed - #{{orderNumber}}", body: "Hello {{customerName}}, your order #{{orderNumber}} has been confirmed. Total: {{totalAmount}}." },
    SMS: { body: "Your order #{{orderNumber}} has been confirmed." }
  },
  DAILY_CLOSING_COMPLETED: {
    EMAIL: { subject: "Daily Closing Report - {{businessDate}}", body: "Branch: {{branchName}}\nNet Sales: {{netSales}}\nOrders: {{orders}}" },
    WHATSAPP: { body: "Daily Closing Report - {{businessDate}}\nBranch: {{branchName}}\nNet Sales: {{netSales}}\nOrders: {{orders}}" }
  }
};

export class NotificationService {
  /**
   * Dispatch a notification.
   * This method is designed to be fire-and-forget (or awaited if caller prefers).
   * It handles idempotency, template resolution, and provider dispatch.
   */
  static async dispatch(params: DispatchParams): Promise<void> {
    try {
      await connectToDatabase();

      const { eventType, restaurantId, branchId, referenceKey, recipient, variables, channels } = params;

      // 1. Determine which channels to send to based on available contact info
      const targetChannels = new Set<"WHATSAPP" | "EMAIL" | "SMS">();
      
      if (channels && channels.length > 0) {
        channels.forEach(c => targetChannels.add(c));
      } else {
        // Auto-resolve based on provided contact info
        if (recipient.email) targetChannels.add("EMAIL");
        if (recipient.phone) {
          // In a real app we might check user preferences or restaurant settings to see if they prefer WhatsApp over SMS
          targetChannels.add("WHATSAPP"); // Defaulting to WhatsApp if phone is provided
        }
      }

      if (targetChannels.size === 0) {
        console.log(`[NotificationService] No valid contact info or channels for event ${eventType}`);
        return; // Safely skip
      }

      // 2. Load templates for the tenant and event
      // To optimize, we can load all templates for this eventType and restaurantId
      const customTemplates = await NotificationTemplateModel.find({
        restaurantId: new Types.ObjectId(restaurantId.toString()) as any,
        eventType: eventType as any,
        isActive: true,
      }).lean();

      // 3. Process each channel independently
      for (const channel of Array.from(targetChannels)) {
        // Skip if no recipient info for this channel
        if (channel === "EMAIL" && !recipient.email) continue;
        if ((channel === "WHATSAPP" || channel === "SMS") && !recipient.phone) continue;

        const to = channel === "EMAIL" ? recipient.email! : recipient.phone!;
        const channelReferenceKey = `${referenceKey}:${channel}`;

        // 4. Check Idempotency (has this exact message been sent/queued already?)
        const existingLog = await MessageLogModel.findOne({ referenceKey: channelReferenceKey });
        if (existingLog && ["QUEUED", "PROCESSING", "SENT"].includes(existingLog.status)) {
          console.log(`[NotificationService] Skipping duplicate notification: ${channelReferenceKey}`);
          continue;
        }

        // 5. Resolve Template
        let templateContent: { subject?: string, body: string } | null = null;
        let templateId: Types.ObjectId | undefined;

        const customTemplate = customTemplates.find(t => t.channel === channel);
        if (customTemplate) {
          templateContent = { subject: customTemplate.subject, body: customTemplate.body };
          templateId = customTemplate._id as unknown as Types.ObjectId;
        } else if (DEFAULT_TEMPLATES[eventType]?.[channel]) {
          templateContent = DEFAULT_TEMPLATES[eventType][channel];
        }

        if (!templateContent) {
          console.log(`[NotificationService] No template found for ${eventType} on ${channel}`);
          continue;
        }

        // 6. Build Payload
        const renderedSubject = templateContent.subject ? TemplateService.render(templateContent.subject, variables) : "";
        const renderedBody = TemplateService.render(templateContent.body, variables);

        // 7. Create/Update Log as PROCESSING
        let logId: Types.ObjectId;
        if (existingLog) {
           await MessageLogModel.updateOne(
             { _id: existingLog._id as any },
             { $set: { status: "PROCESSING", attempts: existingLog.attempts + 1, lastAttemptAt: new Date() } }
           );
           logId = existingLog._id as unknown as Types.ObjectId;
        } else {
           const newLog = await MessageLogModel.create({
             restaurantId: new Types.ObjectId(restaurantId.toString()) as any,
             branchId: branchId ? new Types.ObjectId(branchId.toString()) as any : null,
             referenceKey: channelReferenceKey,
             channel,
             eventType: eventType as any,
             recipient: to,
             subject: renderedSubject,
             templateId,
             payload: variables,
             status: "PROCESSING",
             attempts: 1,
             lastAttemptAt: new Date()
           });
           logId = newLog._id as unknown as Types.ObjectId;
        }

        // 8. Dispatch via Adapter
        // We do this inline here. In a highly scaled system, we would push to BullMQ instead of awaiting the adapter.
        // For this architecture, we await the adapter. Since this is often called without 'await' from controllers, 
        // it acts like a background task in Vercel/Node.
        const adapter = adapters[channel];
        if (!adapter) {
          await MessageLogModel.updateOne(
            { _id: logId as any }, 
            { $set: { status: "FAILED", failedAt: new Date(), errorMessage: `No adapter found for channel ${channel}` } }
          );
          continue;
        }

        try {
          const result = await adapter.send({
            to,
            subject: renderedSubject,
            body: renderedBody,
            variables
          });

          if (result.success) {
            await MessageLogModel.updateOne(
              { _id: logId as any },
              { $set: { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId, provider: adapter.name } }
            );
          } else {
            await MessageLogModel.updateOne(
              { _id: logId as any },
              { $set: { status: "FAILED", failedAt: new Date(), errorMessage: result.error, errorCode: result.errorCode, provider: adapter.name } }
            );
          }
        } catch (err: any) {
           await MessageLogModel.updateOne(
             { _id: logId as any },
             { $set: { status: "FAILED", failedAt: new Date(), errorMessage: err.message || "Adapter threw an exception", provider: adapter.name } }
           );
        }
      }

    } catch (error) {
      console.error("[NotificationService] Fatal error in dispatch:", error);
      // We don't throw here to ensure business operations (like order creation) are not blocked/rolled back.
    }
  }
}
