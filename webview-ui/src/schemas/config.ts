import { z } from "zod";

/**
 * API configuration schema with validation
 */
export const apiConfigSchema = z.object({
  baseUrl: z
    .string()
    .min(1, "URL is required")
    .url("Invalid URL format")
    .refine(
      (url) => url.startsWith("http"),
      "URL must use HTTP or HTTPS protocol"
    ),
  model: z.string().min(1, "Model name is required"),
  apiKey: z.string().min(1, "API key is required"),
  temperature: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(2, "Must be at most 2"),
  maxTokens: z.coerce
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1"),
});

/**
 * Permissions configuration schema
 */
export const permissionsSchema = z.object({
  allowReadByDefault: z.boolean(),
  allowWriteByDefault: z.boolean(),
  allowExecuteByDefault: z.boolean(),
});

/**
 * Advanced configuration schema
 */
export const advancedSchema = z.object({
  maxLoopCount: z.coerce
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1"),
  contextWindowSize: z.coerce
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1"),
});

/**
 * Complete configuration schema
 */
export const configSchema = z.object({
  api: apiConfigSchema,
  permissions: permissionsSchema,
  advanced: advancedSchema,
});

export type ConfigFormValues = z.infer<typeof configSchema>;
