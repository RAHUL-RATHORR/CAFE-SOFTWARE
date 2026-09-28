import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/database/connection";
import { RestaurantModel } from "@/models/restaurant/restaurant.model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "All Restaurants - Super Admin",
};

export default async function AdminRestaurantsPage() {
  const session = await auth();
  const user = session?.user as any;

  // Protect this route for super-admin only
  if (!user || user.role !== "super-admin") {
    redirect("/dashboard");
  }

  await connectToDatabase();

  // Fetch all non-deleted restaurants
  const restaurants = await RestaurantModel.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Onboarded Restaurants</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restaurants.filter((r) => r.subscriptionStatus === "active" || r.subscriptionStatus === "trialing").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurants List</CardTitle>
          <CardDescription>
            A complete list of all restaurants using the CAFE SOFTWARE platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Onboarded On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((restaurant: any) => (
                <TableRow key={restaurant._id.toString()}>
                  <TableCell className="font-medium">{restaurant.name}</TableCell>
                  <TableCell>{restaurant.email}</TableCell>
                  <TableCell>{restaurant.city}, {restaurant.country}</TableCell>
                  <TableCell className="capitalize">{restaurant.subscriptionPlan}</TableCell>
                  <TableCell>
                    <Badge variant={restaurant.isActive ? "default" : "destructive"}>
                      {restaurant.isActive ? "Active" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(restaurant.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {restaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No restaurants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
