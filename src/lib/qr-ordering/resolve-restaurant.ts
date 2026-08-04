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

  const doc = await RestaurantModel.findOne(filter).lean();
  if (!doc) return null;

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
