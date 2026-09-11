import { Types } from "mongoose";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require("archiver");
import { RestaurantModel } from "@/models/restaurant";
import { BranchModel } from "@/models/branch";
import { UserModel } from "@/models/user";
import { OrderModel } from "@/models/order";
import { BillModel, PaymentModel } from "@/models/billing";
import { CategoryModel } from "@/models/category";
import { MenuItemModel } from "@/models/menu-item";
import { IngredientModel, RecipeModel, StockMovementModel } from "@/models/inventory";
import { DailyClosingModel } from "@/models/closing";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { NotificationTemplateModel } from "@/models/notification/template.model";

export class BackupService {
  /**
   * Generates a zip buffer containing structured JSON data for the given restaurant
   */
  static async generateBackupBuffer(restaurantId: string): Promise<Buffer> {
    const rId = new Types.ObjectId(restaurantId);
    const match = { restaurantId: rId, isDeleted: false };
    const allMatch = { restaurantId: rId }; // Include deleted for history consistency if needed

    // Fetch data
    const [
      restaurant,
      branches,
      users,
      tables,
      categories,
      menuItems,
      orders,
      bills,
      payments,
      ingredients,
      recipes,
      stockMovements,
      dailyClosings,
      notificationTemplates
    ] = await Promise.all([
      RestaurantModel.findById(rId).lean(),
      BranchModel.find(allMatch).lean(),
      UserModel.find(match).lean(),
      RestaurantTableModel.find(allMatch).lean(),
      CategoryModel.find(allMatch).lean(),
      MenuItemModel.find(allMatch).lean(),
      OrderModel.find(allMatch).lean(),
      BillModel.find(allMatch).lean(),
      PaymentModel.find(allMatch).lean(),
      IngredientModel.find(allMatch).lean(),
      RecipeModel.find(allMatch).lean(),
      StockMovementModel.find(allMatch).lean(),
      DailyClosingModel.find(allMatch).lean(),
      NotificationTemplateModel.find(allMatch).lean(),
    ]);

    // Sanitize users
    const sanitizedUsers = users.map((u: any) => {
      delete u.password;
      delete u.passwordHash;
      delete u.salt;
      delete u.jwtSecret;
      delete u.tokens;
      return u;
    });

    // Generate metadata
    const metadata = {
      backupVersion: 1,
      applicationVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      restaurantId: restaurantId,
      restaurantName: restaurant?.name || "Unknown",
      modules: [
        "restaurant", "branches", "users", "tables", "menu", "orders", 
        "billing", "payments", "inventory", "daily-closings", "notifications"
      ]
    };

    // Create zip
    return new Promise((resolve, reject) => {
      try {
        const buffers: Buffer[] = [];
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('data', (data: Buffer) => buffers.push(data));
        archive.on('end', () => resolve(Buffer.concat(buffers)));
        archive.on('error', (err: any) => reject(err));

        archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
        if (restaurant) archive.append(JSON.stringify(restaurant, null, 2), { name: 'restaurant.json' });
        archive.append(JSON.stringify(branches, null, 2), { name: 'branches.json' });
        archive.append(JSON.stringify(sanitizedUsers, null, 2), { name: 'users.json' });
        archive.append(JSON.stringify(tables, null, 2), { name: 'tables.json' });
        
        // Menu
        archive.append(JSON.stringify({ categories, menuItems }, null, 2), { name: 'menu.json' });
        
        archive.append(JSON.stringify(orders, null, 2), { name: 'orders.json' });
        archive.append(JSON.stringify(bills, null, 2), { name: 'invoices.json' });
        archive.append(JSON.stringify(payments, null, 2), { name: 'payments.json' });
        
        // Inventory
        archive.append(JSON.stringify({ ingredients, recipes, stockMovements }, null, 2), { name: 'inventory.json' });
        
        archive.append(JSON.stringify(dailyClosings, null, 2), { name: 'daily-closings.json' });
        archive.append(JSON.stringify(notificationTemplates, null, 2), { name: 'notification-templates.json' });

        archive.finalize();
      } catch (err) {
        reject(err);
      }
    });
  }
}
