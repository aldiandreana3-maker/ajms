import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Bill validation
export const CreateBillSchema = z.object({
  unit_id: z.string().uuid(),
  unit_number: z.string().min(1).max(20),
  penghuni_id: z.string().uuid().nullable().optional(),
  quarter_start: z.string().regex(dateRegex, "Invalid date format"),
  quarter_end: z.string().regex(dateRegex, "Invalid date format"),
  quarter_label: z.string().min(1).max(50),
  sc_monthly: z.number().min(0).max(1000000000),
  sf_monthly: z.number().min(0).max(1000000000),
  due_date: z.string().regex(dateRegex, "Invalid date format"),
  notes: z.string().max(1000).optional(),
  is_auto_generated: z.boolean().optional(),
});

export const PayBillSchema = z.object({
  paymentId: z.string().uuid(),
  paid_amount: z.number().positive("Amount must be positive").max(1000000000),
});

// Foreign guest validation
export const CreateForeignGuestSchema = z.object({
  unit_id: z.string().uuid().optional(),
  full_name: z.string().min(1, "Name required").max(200),
  birth_place: z.string().min(1).max(200),
  birth_date: z.string().regex(dateRegex),
  gender: z.enum(["pria", "wanita"]),
  nationality: z.string().min(1).max(100),
  passport_number: z.string().min(5).max(20),
  passport_expiry: z.string().regex(dateRegex),
  passport_photo_url: z.string().url().max(2000).optional(),
  check_in_date: z.string().regex(dateRegex),
  check_out_date: z.string().regex(dateRegex),
  unit_number: z.string().max(20).optional(),
  penghuni_name: z.string().max(200).optional(),
}).refine(
  data => new Date(data.check_out_date) > new Date(data.check_in_date),
  { message: "Check-out must be after check-in", path: ["check_out_date"] }
);

// Role management validation
const APP_ROLES = [
  "master_dev", "super_admin", "admin", "staff", "agent", "penghuni",
  "staff_tro", "staff_finance", "staff_hrd_ga", "staff_engineering",
  "staff_outsourcing_cleaning", "staff_outsourcing_security", "staff_outsourcing_parkir",
] as const;

export const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(APP_ROLES),
});

// Keluhan validation
export const CreateKeluhanSchema = z.object({
  penghuni_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  subject: z.string().min(1).max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  photo_url: z.string().url().max(2000).optional(),
  penghuni_name: z.string().max(200).optional(),
  unit_number: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
});
