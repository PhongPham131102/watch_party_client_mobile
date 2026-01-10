import { z } from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(50, "Mật khẩu mới không được vượt quá 50 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Mật khẩu mới không được trùng với mật khẩu cũ",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const verifyResetCodeSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  code: z
    .string()
    .length(6, "Mã xác nhận phải có 6 chữ số")
    .regex(/^\d+$/, "Mã xác nhận chỉ bao gồm chữ số"),
});

export type VerifyResetCodeFormData = z.infer<typeof verifyResetCodeSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
    code: z.string().length(6, "Mã xác nhận không hợp lệ"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(50, "Mật khẩu mới không được vượt quá 50 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
