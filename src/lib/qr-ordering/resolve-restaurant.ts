import {
  connectToDatabase,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { RestaurantModel } from "@/models/restaurant";
import type { PublicRestaurantInfo } from "@/types/qr-ordering";

export async function resolvePublicRestaurant(
  restaurantParam: string
): Promise<PublicRestaurantInfo | null> {
  await connectToDatabase();
  const param = restaurantParam.trim();
  if (!param) return null;

  const filter: Record<string, unknown> = isValidObjectId(param)
    ? notDeletedFilter({ _id: toObjectId(param) })
    : notDeletedFilter({ slug: param.toLowerCase() });

  try {
    await connectToDatabase();
    const doc = await RestaurantModel.findOne(filter).lean();
    if (doc && doc.isActive !== false) {
      return {
        id: String(doc._id),
        name: doc.name ?? "",
        slug: doc.slug ?? "",
        logo: doc.logo ?? "",
        currency: doc.currency ?? "INR",
        timezone: doc.timezone ?? "UTC",
        address: [doc.address, doc.city, doc.state, doc.country]
          .filter(Boolean)
          .join(", "),
        phone: doc.phone ?? "",
      };
    }
  } catch (err) {
    console.warn("[PublicMenu] Database error resolving restaurant, using dev fallback:", err);
  }

  // Development / Demo fallback for custom restaurant URLs (e.g. /menu/royal-cafe)
  if (process.env.NODE_ENV === "development" || process.env.ENABLE_DEMO_LOGIN === "true") {
    const formattedName = param
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      id: "650000000000000000000001",
      name: formattedName,
      slug: param.toLowerCase(),
      logo: "",
      currency: "INR",
      timezone: "Asia/Kolkata",
      address: "MG Road, Connaught Place, New Delhi",
      phone: "+91 9876543210",
    };
  }

  return null;
}
