import type {
  MenuItem,
  MenuItemCustomizationGroup,
} from "@/types/menu-item";
import type { OrderLineCustomization } from "@/types/order";
import type { TaxProfile, TaxSettings } from "@/types/settings";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type GuestCustomizationSelection = {
  groupId: string;
  optionIds: string[];
};

export function unitPriceFromMenuItem(item: MenuItem): number {
  if (item.discountPrice != null && item.discountPrice >= 0) {
    return roundMoney(item.discountPrice);
  }
  return roundMoney(item.price);
}

export function resolveDefaultTaxProfile(
  settings: TaxSettings | null
): TaxProfile | null {
  if (!settings?.profiles?.length) return null;
  return (
    settings.profiles.find((profile) => profile.isDefault) ??
    settings.profiles[0] ??
    null
  );
}

export function validateAndPriceCustomizations(input: {
  groups: MenuItemCustomizationGroup[];
  selections: GuestCustomizationSelection[];
}):
  | { ok: true; rows: OrderLineCustomization[] }
  | { ok: false; message: string } {
  const selectedByGroup = new Map(
    input.selections.map((row) => [row.groupId, row.optionIds])
  );
  const rows: OrderLineCustomization[] = [];

  for (const group of input.groups) {
    const selected = selectedByGroup.get(group.id) ?? [];
    const unique = [...new Set(selected.filter(Boolean))];
    const min = group.required ? Math.max(1, group.min || 1) : group.min || 0;
    const max = Math.max(min, group.max || unique.length || 1);

    if (unique.length < min) {
      return {
        ok: false,
        message: `Select at least ${min} option(s) for ${group.name}.`,
      };
    }
    if (unique.length > max) {
      return {
        ok: false,
        message: `Select at most ${max} option(s) for ${group.name}.`,
      };
    }

    for (const optionId of unique) {
      const option = group.options.find((row) => row.id === optionId);
      if (!option || !option.isAvailable) {
        return {
          ok: false,
          message: `Invalid customization for ${group.name}.`,
        };
      }
      rows.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: roundMoney(option.priceDelta ?? 0),
      });
    }
  }

  for (const selection of input.selections) {
    if (!input.groups.some((group) => group.id === selection.groupId)) {
      return { ok: false, message: "Unknown customization group." };
    }
  }

  return { ok: true, rows };
}

export function computeGuestOrderTotals(input: {
  lines: Array<{
    unitPrice: number;
    quantity: number;
    customizations: OrderLineCustomization[];
    taxRate?: number;
  }>;
  taxSettings: TaxSettings | null;
}) {
  const pricedLines = input.lines.map((line) => {
    const customizationTotal = line.customizations.reduce(
      (sum, row) => sum + Number(row.priceDelta ?? 0),
      0
    );
    const unit = roundMoney(line.unitPrice + customizationTotal);
    const lineSubtotal = roundMoney(unit * line.quantity);
    return {
      unitPrice: unit,
      quantity: line.quantity,
      lineSubtotal,
      taxRate: Number(line.taxRate ?? 0),
      customizations: line.customizations,
    };
  });

  const subtotal = roundMoney(
    pricedLines.reduce((sum, line) => sum + line.lineSubtotal, 0)
  );

  const profile = resolveDefaultTaxProfile(input.taxSettings);
  const serviceChargePercent = Number(profile?.serviceChargePercent ?? 0);
  const gstPercent = Number(profile?.gstPercent ?? 0);
  const serviceCharge = roundMoney((subtotal * serviceChargePercent) / 100);

  const itemTax = roundMoney(
    pricedLines.reduce((sum, line) => {
      if (line.taxRate > 0) {
        return sum + (line.lineSubtotal * line.taxRate) / 100;
      }
      return sum;
    }, 0)
  );

  const settingsTax =
    itemTax > 0 ? 0 : roundMoney((subtotal * gstPercent) / 100);

  const tax = roundMoney(itemTax > 0 ? itemTax : settingsTax);
  const grandTotal = roundMoney(subtotal + tax + serviceCharge);

  return {
    lines: pricedLines,
    subtotal,
    tax,
    serviceCharge,
    grandTotal,
  };
}
