/**
 * Payment provider abstraction — no real gateway in this module.
 * Subscription state and payment state stay intentionally separate.
 */

import type { BillingCycle } from "@/types/subscription";

export type PaymentProviderResult<T = unknown> = {
  ok: false;
  code: "provider_not_configured";
  message: string;
  data?: T;
};

export type PaymentProviderCheckoutInput = {
  restaurantId: string;
  planId: string;
  billingCycle: BillingCycle;
  successUrl?: string;
  cancelUrl?: string;
};

export type PaymentProviderSubscriptionInput = {
  restaurantId: string;
  planId: string;
  billingCycle: BillingCycle;
};

export type PaymentProviderChangeInput = {
  providerSubscriptionId: string;
  planId: string;
  billingCycle?: BillingCycle;
};

export type PaymentProviderCancelInput = {
  providerSubscriptionId: string;
  atPeriodEnd?: boolean;
};

export type PaymentProviderWebhookInput = {
  headers: Record<string, string>;
  rawBody: string;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(
    input: PaymentProviderCheckoutInput
  ): Promise<PaymentProviderResult<{ checkoutUrl?: string }>>;
  createSubscription(
    input: PaymentProviderSubscriptionInput
  ): Promise<PaymentProviderResult<{ providerSubscriptionId?: string }>>;
  changeSubscription(
    input: PaymentProviderChangeInput
  ): Promise<PaymentProviderResult>;
  cancelSubscription(
    input: PaymentProviderCancelInput
  ): Promise<PaymentProviderResult>;
  getSubscription(
    providerSubscriptionId: string
  ): Promise<PaymentProviderResult>;
  handleWebhook(
    input: PaymentProviderWebhookInput
  ): Promise<PaymentProviderResult>;
}

function notConfigured<T = unknown>(): PaymentProviderResult<T> {
  return {
    ok: false,
    code: "provider_not_configured",
    message:
      "Payment provider is not configured. Subscription state can be managed locally; no payment was processed.",
  };
}

export const noopPaymentProvider: PaymentProvider = {
  name: "noop",
  async createCheckout() {
    return notConfigured();
  },
  async createSubscription() {
    return notConfigured();
  },
  async changeSubscription() {
    return notConfigured();
  },
  async cancelSubscription() {
    return notConfigured();
  },
  async getSubscription() {
    return notConfigured();
  },
  async handleWebhook() {
    return notConfigured();
  },
};

let activeProvider: PaymentProvider = noopPaymentProvider;

export function getPaymentProvider(): PaymentProvider {
  return activeProvider;
}

/** Test/extension hook — production stays on noop until Razorpay module. */
export function setPaymentProvider(provider: PaymentProvider): void {
  activeProvider = provider;
}
