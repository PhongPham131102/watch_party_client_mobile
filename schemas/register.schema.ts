import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),

    username: z
      .string()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(20, "Tên đăng nhập không được quá 20 ký tự")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới"
      ),

    fullName: z.string().min(1, "Họ và tên không được để trống"),

    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
      .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),

    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
