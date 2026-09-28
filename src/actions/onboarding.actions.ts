"use server";

import { connectToDatabase } from "@/lib/database/connection";
import { RestaurantModel } from "@/models/restaurant/restaurant.model";
import { BranchModel } from "@/models/branch/branch.model";
import { auth } from "@/lib/auth/auth";

export async function submitOnboarding(draft: any) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    // 1. Create the Restaurant
    const newRestaurant = await RestaurantModel.create({
      name: draft.restaurant.name,
      slug: draft.restaurant.slug || draft.restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      email: draft.restaurant.email,
      phone: draft.restaurant.phone,
      address: draft.address.address,
      city: draft.address.city,
      state: draft.address.state,
      country: draft.address.country,
      currency: draft.regional.currency,
      timezone: draft.regional.timezone,
      logo: draft.branding.logo,
      subscriptionPlan: "trial",
      subscriptionStatus: "active",
      isActive: true,
    });

    // 2. Create the default Branch
    await BranchModel.create({
      restaurantId: newRestaurant._id,
      name: "Main Branch",
      isMainBranch: true,
      email: draft.restaurant.email,
      phone: draft.restaurant.phone,
      address: draft.address.address,
      city: draft.address.city,
      state: draft.address.state,
      country: draft.address.country,
      zipCode: draft.address.zipCode,
      timezone: draft.regional.timezone,
      isActive: true,
    });

    return { success: true, restaurantId: newRestaurant._id.toString() };
  } catch (error: any) {
    console.error("Failed to save onboarding data:", error);
    return { success: false, error: error.message || "Failed to save restaurant." };
  }
}
