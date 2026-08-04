import { StaffListView } from "@/components/staff";
import { getEmployees, getStaffDashboard } from "@/actions/staff";
import { searchEmployeeSchema } from "@/lib/validators/staff";
import { AuthError } from "@/components/auth/auth-error";
import type { EmployeeListResult, StaffDashboardSummary } from "@/types/staff";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const emptySummary: StaffDashboardSummary = {
  totalEmployees: 0,
  employeesPresent: 0,
  employeesAbsent: 0,
  activeShifts: 0,
  upcomingShifts: 0,
  pendingLeaveRequests: 0,
};

export default async function StaffPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchEmployeeSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    department: first(params.department) ?? "all",
    designation: first(params.designation) ?? "all",
    role: first(params.role) ?? "",
    branchId: first(params.branchId) ?? "",
    joiningFrom: first(params.joiningFrom) ?? "",
    joiningTo: first(params.joiningTo) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchEmployeeSchema.parse({});

  const [result, dashboard] = await Promise.all([
    getEmployees(queryInput),
    getStaffDashboard(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: EmployeeListResult = {
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
    <StaffListView
      result={result.success ? result.data : emptyResult}
      summary={dashboard.success ? dashboard.data : emptySummary}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        department: queryInput.department,
        designation: queryInput.designation,
        role: queryInput.role ?? "",
        joiningFrom: queryInput.joiningFrom ?? "",
        joiningTo: queryInput.joiningTo ?? "",
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
