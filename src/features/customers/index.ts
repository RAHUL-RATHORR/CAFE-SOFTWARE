export {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  getCustomerById,
  getCustomerProfile,
  updateCustomerStatus,
  addCustomerNote,
  getCustomerOptions,
} from "@/actions/customers";

export {
  CustomersListView,
  CustomersView,
  CustomerForm,
  CustomerProfileView,
  CustomerTimeline,
} from "@/components/customers";

export {
  createCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  updateCustomerStatusSchema,
  addCustomerNoteSchema,
  searchCustomerSchema,
  customerAddressSchema,
  customerTagsSchema,
  customerNotesSchema,
} from "@/lib/validators/customer";

export { customerRepository } from "@/repositories/customer";
export { CustomerModel } from "@/models/customer";
export {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_VARIANTS,
  CUSTOMER_GENDER_LABELS,
  CUSTOMER_PREFERRED_ORDER_TYPE_LABELS,
  CUSTOMER_TAG_SUGGESTIONS,
  LOYALTY_TIER_PLACEHOLDERS,
} from "@/config/customers";

export type {
  Customer,
  CustomerStatus,
  CustomerProfile,
  CustomerListResult,
  CustomerActionResult,
} from "@/types/customer";

export {
  CUSTOMER_STATUSES,
  CUSTOMER_GENDERS,
  CUSTOMER_ORDER_TYPES,
} from "@/types/customer";
