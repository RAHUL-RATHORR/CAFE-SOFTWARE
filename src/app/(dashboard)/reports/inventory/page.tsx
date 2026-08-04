import { ModuleReportPage } from "@/app/(dashboard)/reports/_lib/module-page";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function InventoryReportPage({ searchParams }: PageProps) {
  return <ModuleReportPage kind="inventory" searchParams={searchParams} />;
}
