import { ModuleReportPage } from "@/app/(dashboard)/reports/_lib/module-page";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function KitchenReportPage({ searchParams }: PageProps) {
  return <ModuleReportPage kind="kitchen" searchParams={searchParams} />;
}
