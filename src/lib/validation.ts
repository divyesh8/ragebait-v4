import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
    dob: z.string().refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    const dob = new Date(data.dob);
    const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 13;
  }, {
    message: "You must be at least 13 years old to join Ragebait",
    path: ["dob"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  bio: z.string().max(280, "Bio must be at most 280 characters").optional().default(""),
  avatarUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), "Avatar URL must start with http:// or https://")
    .optional()
    .default(""),
});

export const groupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Group name must be at least 3 characters")
    .max(60, "Group name must be at most 60 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(280, "Description must be at most 280 characters"),
  topics: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one topic")
    .max(5, "Use at most 5 topics")
    .transform((topics) => Array.from(new Set(topics.map((topic) => topic.trim()).filter(Boolean)))),
  bannerUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), "Banner URL must start with http:// or https://")
    .optional()
    .default(""),
});
