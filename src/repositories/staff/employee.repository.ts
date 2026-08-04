import type { SortOrder } from "mongoose";
import {
  buildPaginationMeta,
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  normalizePagination,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  buildEmployeeCode,
  buildFullName,
  serializeEmployee,
} from "@/lib/staff";
import { EmployeeModel, type EmployeeDocument } from "@/models/staff";
import { AttendanceModel } from "@/models/attendance";
import { LeaveRequestModel } from "@/models/attendance";
import { ShiftModel } from "@/models/shift";
import type {
  Employee,
  EmployeeListResult,
  EmployeeSelectOption,
  EmployeeSortField,
  EmployeeStatus,
  EmploymentType,
  StaffDashboardSummary,
  StaffDepartment,
  StaffDesignation,
} from "@/types/staff";
import type { AppRole } from "@/types/navigation";
import type { SearchEmployeeInput } from "@/lib/validators/staff";

type Filter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type EmployeeCreateData = {
  restaurantId: string;
  branchId?: string | null;
  userId?: string | null;
  employeeCode?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  avatar?: string;
  role?: AppRole;
  department?: StaffDepartment;
  designation?: StaffDesignation;
  employmentType?: EmploymentType;
  joiningDate?: string | null;
  salaryPlaceholder?: number;
  status?: EmployeeStatus;
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  address?: string;
  notes?: string;
  createdBy?: string | null;
};

export type EmployeeUpdateData = Partial<
  Omit<EmployeeCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

function buildSearchFilter(
  restaurantId: string,
  input: SearchEmployeeInput
): Filter {
  const filter: Filter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status && input.status !== "all") filter.status = input.status;
  if (input.department && input.department !== "all") {
    filter.department = input.department;
  }
  if (input.designation && input.designation !== "all") {
    filter.designation = input.designation;
  }
  if (input.role) filter.role = input.role;
  if (input.branchId && isValidObjectId(input.branchId)) {
    filter.branchId = toObjectId(input.branchId);
  }

  const joining: Filter = {};
  if (input.joiningFrom) {
    const from = parseDate(input.joiningFrom);
    if (from) joining.$gte = from;
  }
  if (input.joiningTo) {
    const to = parseDate(input.joiningTo);
    if (to) {
      to.setHours(23, 59, 59, 999);
      joining.$lte = to;
    }
  }
  if (Object.keys(joining).length) filter.joiningDate = joining;

  const q = input.q?.trim();
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { fullName: regex },
      { employeeCode: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  return filter;
}

async function create(data: EmployeeCreateData): Promise<Employee> {
  try {
    await connectToDatabase();
    const code = data.employeeCode?.trim() || buildEmployeeCode();
    const fullName = buildFullName(data.firstName, data.lastName);
    const doc = await EmployeeModel.create({
      restaurantId: toObjectId(data.restaurantId),
      branchId: optionalRef(data.branchId),
      userId: optionalRef(data.userId),
      employeeCode: code,
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() ?? "",
      fullName,
      email: data.email?.trim().toLowerCase() ?? "",
      phone: data.phone.trim(),
      avatar: data.avatar?.trim() ?? "",
      role: data.role ?? "waiter",
      department: data.department ?? "service",
      designation: data.designation ?? "other",
      employmentType: data.employmentType ?? "full-time",
      joiningDate: parseDate(data.joiningDate),
      salaryPlaceholder: data.salaryPlaceholder ?? 0,
      status: data.status ?? "active",
      emergencyContact: {
        name: data.emergencyContact?.name?.trim() ?? "",
        phone: data.emergencyContact?.phone?.trim() ?? "",
        relation: data.emergencyContact?.relation?.trim() ?? "",
      },
      address: data.address?.trim() ?? "",
      notes: data.notes?.trim() ?? "",
      createdBy: actorObjectId(data.createdBy),
      updatedBy: actorObjectId(data.createdBy),
    });
    return serializeEmployee(doc.toObject() as EmployeeDocument);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create employee");
  }
}

async function update(
  id: string,
  restaurantId: string,
  data: EmployeeUpdateData
): Promise<Employee | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    const $set: Filter = { updatedBy: actorObjectId(data.updatedBy) };
    if (data.branchId !== undefined) $set.branchId = optionalRef(data.branchId);
    if (data.userId !== undefined) $set.userId = optionalRef(data.userId);
    if (data.employeeCode !== undefined && data.employeeCode.trim()) {
      $set.employeeCode = data.employeeCode.trim();
    }
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const existing = await EmployeeModel.findById(id).lean().exec();
      if (!existing) return null;
      const firstName = data.firstName?.trim() ?? existing.firstName;
      const lastName =
        data.lastName !== undefined
          ? data.lastName.trim()
          : existing.lastName ?? "";
      $set.firstName = firstName;
      $set.lastName = lastName;
      $set.fullName = buildFullName(firstName, lastName);
    }
    if (data.email !== undefined)
      $set.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) $set.phone = data.phone.trim();
    if (data.avatar !== undefined) $set.avatar = data.avatar.trim();
    if (data.role !== undefined) $set.role = data.role;
    if (data.department !== undefined) $set.department = data.department;
    if (data.designation !== undefined) $set.designation = data.designation;
    if (data.employmentType !== undefined)
      $set.employmentType = data.employmentType;
    if (data.joiningDate !== undefined)
      $set.joiningDate = parseDate(data.joiningDate);
    if (data.salaryPlaceholder !== undefined)
      $set.salaryPlaceholder = data.salaryPlaceholder;
    if (data.status !== undefined) $set.status = data.status;
    if (data.emergencyContact !== undefined) {
      $set.emergencyContact = {
        name: data.emergencyContact.name?.trim() ?? "",
        phone: data.emergencyContact.phone?.trim() ?? "",
        relation: data.emergencyContact.relation?.trim() ?? "",
      };
    }
    if (data.address !== undefined) $set.address = data.address.trim();
    if (data.notes !== undefined) $set.notes = data.notes.trim();

    const doc = await EmployeeModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      { $set },
      { new: true }
    )
      .lean()
      .exec();

    return doc ? serializeEmployee(doc as EmployeeDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update employee");
  }
}

async function softDelete(
  id: string,
  restaurantId: string,
  deletedBy?: string | null
): Promise<Employee | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await EmployeeModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: actorObjectId(deletedBy),
          updatedBy: actorObjectId(deletedBy),
          status: "terminated",
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    return doc ? serializeEmployee(doc as EmployeeDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to delete employee");
  }
}

async function findById(
  id: string,
  restaurantId: string
): Promise<Employee | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await EmployeeModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();
    return doc ? serializeEmployee(doc as EmployeeDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load employee");
  }
}

async function findByPhone(
  phone: string,
  restaurantId: string,
  excludeId?: string
): Promise<Employee | null> {
  try {
    await connectToDatabase();
    const filter: Filter = notDeletedFilter({
      restaurantId: toObjectId(restaurantId),
      phone: phone.trim(),
    });
    if (excludeId && isValidObjectId(excludeId)) {
      filter._id = { $ne: toObjectId(excludeId) };
    }
    const doc = await EmployeeModel.findOne(filter).lean().exec();
    return doc ? serializeEmployee(doc as EmployeeDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to find employee");
  }
}

async function findMany(
  restaurantId: string,
  input: SearchEmployeeInput
): Promise<EmployeeListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });
    const filter = buildSearchFilter(restaurantId, input);
    const sortField = (pagination.sortBy as EmployeeSortField) || "createdAt";
    const sortOrder: SortOrder = pagination.sortOrder === "asc" ? 1 : -1;
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [items, total] = await Promise.all([
      EmployeeModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      EmployeeModel.countDocuments(filter),
    ]);

    return {
      items: items.map((doc) => serializeEmployee(doc as EmployeeDocument)),
      meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list employees");
  }
}

async function listOptions(
  restaurantId: string
): Promise<EmployeeSelectOption[]> {
  try {
    await connectToDatabase();
    const docs = await EmployeeModel.find(
      notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        status: "active",
      }) as Filter
    )
      .sort({ fullName: 1 })
      .select({ fullName: 1, employeeCode: 1, department: 1 })
      .limit(300)
      .lean()
      .exec();

    return docs.map((doc) => ({
      value: String(doc._id),
      label: doc.fullName,
      meta: `${doc.employeeCode} · ${doc.department}`,
    }));
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list employee options");
  }
}

async function getDashboardSummary(
  restaurantId: string
): Promise<StaffDashboardSummary> {
  try {
    await connectToDatabase();
    const base = notDeletedFilter({
      restaurantId: toObjectId(restaurantId),
    });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalEmployees,
      present,
      activeShifts,
      upcomingShifts,
      pendingLeaveRequests,
    ] = await Promise.all([
      EmployeeModel.countDocuments({
        ...base,
        status: { $in: ["active", "on-leave"] },
      } as Filter),
      AttendanceModel.countDocuments({
        ...base,
        date: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["present", "late", "half-day"] },
      } as Filter),
      ShiftModel.countDocuments({
        ...base,
        status: { $in: ["scheduled", "in-progress"] },
      } as Filter),
      ShiftModel.countDocuments({
        ...base,
        status: "scheduled",
      } as Filter),
      LeaveRequestModel.countDocuments({
        ...base,
        status: "pending",
      } as Filter),
    ]);

    const activeStaff = await EmployeeModel.countDocuments({
      ...base,
      status: "active",
    } as Filter);

    return {
      totalEmployees,
      employeesPresent: present,
      employeesAbsent: Math.max(0, activeStaff - present),
      activeShifts,
      upcomingShifts,
      pendingLeaveRequests,
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load staff dashboard");
  }
}

export const employeeRepository = {
  create,
  update,
  softDelete,
  findById,
  findByPhone,
  findMany,
  listOptions,
  getDashboardSummary,
};
