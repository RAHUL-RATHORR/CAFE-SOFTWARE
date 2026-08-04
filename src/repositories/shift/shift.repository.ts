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
import { serializeShift } from "@/lib/shifts";
import { ShiftModel, type ShiftDocument } from "@/models/shift";
import { EmployeeModel } from "@/models/staff";
import type {
  Shift,
  ShiftListResult,
  ShiftSortField,
  ShiftStatus,
  WeekDay,
} from "@/types/shift";
import type { SearchShiftInput } from "@/lib/validators/shift";

type Filter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

export type ShiftCreateData = {
  restaurantId: string;
  branchId?: string | null;
  employeeId?: string | null;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  workingHours?: number;
  weekDays?: WeekDay[];
  status?: ShiftStatus;
  notes?: string;
  createdBy?: string | null;
};

export type ShiftUpdateData = Partial<
  Omit<ShiftCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

async function resolveEmployeeName(
  employeeId: string | null | undefined
): Promise<string | null> {
  if (!employeeId || !isValidObjectId(employeeId)) return null;
  const employee = await EmployeeModel.findById(employeeId)
    .select({ fullName: 1 })
    .lean()
    .exec();
  return employee?.fullName ?? null;
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchShiftInput
): Filter {
  const filter: Filter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });
  if (input.status && input.status !== "all") filter.status = input.status;
  if (input.employeeId && isValidObjectId(input.employeeId)) {
    filter.employeeId = toObjectId(input.employeeId);
  }
  if (input.branchId && isValidObjectId(input.branchId)) {
    filter.branchId = toObjectId(input.branchId);
  }
  const q = input.q?.trim();
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ shiftName: regex }, { notes: regex }];
  }
  return filter;
}

async function create(data: ShiftCreateData): Promise<Shift> {
  try {
    await connectToDatabase();
    const doc = await ShiftModel.create({
      restaurantId: toObjectId(data.restaurantId),
      branchId: optionalRef(data.branchId),
      employeeId: optionalRef(data.employeeId),
      shiftName: data.shiftName.trim(),
      startTime: data.startTime,
      endTime: data.endTime,
      breakDuration: data.breakDuration ?? 30,
      workingHours: data.workingHours ?? 0,
      weekDays: data.weekDays ?? [],
      status: data.status ?? "scheduled",
      notes: data.notes?.trim() ?? "",
      createdBy: actorObjectId(data.createdBy),
      updatedBy: actorObjectId(data.createdBy),
    });
    const name = await resolveEmployeeName(data.employeeId);
    return serializeShift(doc.toObject() as ShiftDocument, name);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create shift");
  }
}

async function update(
  id: string,
  restaurantId: string,
  data: ShiftUpdateData
): Promise<Shift | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    const $set: Filter = { updatedBy: actorObjectId(data.updatedBy) };
    if (data.branchId !== undefined) $set.branchId = optionalRef(data.branchId);
    if (data.employeeId !== undefined)
      $set.employeeId = optionalRef(data.employeeId);
    if (data.shiftName !== undefined) $set.shiftName = data.shiftName.trim();
    if (data.startTime !== undefined) $set.startTime = data.startTime;
    if (data.endTime !== undefined) $set.endTime = data.endTime;
    if (data.breakDuration !== undefined)
      $set.breakDuration = data.breakDuration;
    if (data.workingHours !== undefined)
      $set.workingHours = data.workingHours;
    if (data.weekDays !== undefined) $set.weekDays = data.weekDays;
    if (data.status !== undefined) $set.status = data.status;
    if (data.notes !== undefined) $set.notes = data.notes.trim();

    const doc = await ShiftModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      { $set },
      { new: true }
    )
      .lean()
      .exec();

    if (!doc) return null;
    const name = await resolveEmployeeName(
      data.employeeId ?? String(doc.employeeId ?? "")
    );
    return serializeShift(doc as ShiftDocument, name);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update shift");
  }
}

async function softDelete(
  id: string,
  restaurantId: string,
  deletedBy?: string | null
): Promise<Shift | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await ShiftModel.findOneAndUpdate(
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
          status: "cancelled",
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    if (!doc) return null;
    const name = await resolveEmployeeName(String(doc.employeeId ?? ""));
    return serializeShift(doc as ShiftDocument, name);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to delete shift");
  }
}

async function findById(
  id: string,
  restaurantId: string
): Promise<Shift | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await ShiftModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();
    if (!doc) return null;
    const name = await resolveEmployeeName(String(doc.employeeId ?? ""));
    return serializeShift(doc as ShiftDocument, name);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load shift");
  }
}

async function findMany(
  restaurantId: string,
  input: SearchShiftInput
): Promise<ShiftListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });
    const filter = buildSearchFilter(restaurantId, input);
    const sortField = (pagination.sortBy as ShiftSortField) || "createdAt";
    const sortOrder: SortOrder = pagination.sortOrder === "asc" ? 1 : -1;
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [items, total] = await Promise.all([
      ShiftModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      ShiftModel.countDocuments(filter),
    ]);

    const employeeIds = [
      ...new Set(
        items
          .map((item) => (item.employeeId ? String(item.employeeId) : null))
          .filter((value): value is string => Boolean(value))
      ),
    ];
    const employees =
      employeeIds.length > 0
        ? await EmployeeModel.find(
            notDeletedFilter({
              _id: { $in: employeeIds.map((id) => toObjectId(id)) },
            }) as Filter
          )
            .select({ fullName: 1 })
            .lean()
            .exec()
        : [];
    const nameMap = new Map(
      employees.map((employee) => [String(employee._id), employee.fullName])
    );

    return {
      items: items.map((doc) =>
        serializeShift(
          doc as ShiftDocument,
          nameMap.get(String(doc.employeeId ?? "")) ?? null
        )
      ),
      meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list shifts");
  }
}

export const shiftRepository = {
  create,
  update,
  softDelete,
  findById,
  findMany,
};
