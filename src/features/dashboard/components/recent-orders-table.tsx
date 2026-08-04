import { DataTable, type ColumnDef } from "@/components/tables/data-table";
import { AppCard } from "@/components/cards/app-card";
import { OrderStatusBadge } from "@/components/common/order-status-badge";
import { recentOrders } from "@/features/dashboard/data/dummy-data";
import { formatCurrency } from "@/utils/format";
import type { RecentOrder } from "@/types";

const columns: ColumnDef<RecentOrder>[] = [
  {
    key: "orderNumber",
    header: "Order ID",
    cell: (row) => <span className="font-medium">{row.orderNumber}</span>,
  },
  {
    key: "customer",
    header: "Customer",
    cell: (row) => row.customer,
  },
  {
    key: "table",
    header: "Table",
    cell: (row) => row.table,
  },
  {
    key: "total",
    header: "Amount",
    cell: (row) => formatCurrency(row.total),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <OrderStatusBadge status={row.status} />,
  },
  {
    key: "time",
    header: "Time",
    className: "text-muted-foreground",
    cell: (row) => row.time,
  },
];

export function RecentOrdersTable() {
  return (
    <AppCard
      title="Recent Orders"
      description="Latest activity across the floor"
      contentClassName="pt-0"
      className="shadow-sm"
    >
      <DataTable
        columns={columns}
        data={recentOrders}
        getRowKey={(row) => row.id}
        className="border-0"
      />
    </AppCard>
  );
}
