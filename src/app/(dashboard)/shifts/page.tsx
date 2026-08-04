import { ShiftsListView } from "@/components/shifts";
import { getShifts } from "@/actions/shifts";
import { getEmployeeOptions } from "@/actions/staff";
import { searchShiftSchema } from "@/lib/validators/shift";
import { AuthError } from "@/components/auth/auth-error";
import type { ShiftListResult } from "@/types/shift";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ShiftsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchShiftSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    employeeId: first(params.employeeId) ?? "",
    branchId: first(params.branchId) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchShiftSchema.parse({});

  const [result, employees] = await Promise.all([
    getShifts(queryInput),
    getEmployeeOptions(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: ShiftListResult = {
    items: [],
    meta: {
      page: queryInput.page,
      pageSize: queryInput.pageSize,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  return (
    <ShiftsListView
      result={result.success ? result.data : emptyResult}
      employeeOptions={employees.success ? employees.data : []}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        employeeId: queryInput.employeeId ?? "",
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
