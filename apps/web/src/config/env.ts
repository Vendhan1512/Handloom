/**
 * Frontend Environment Configuration & Validation
 *
 * Strictly manages public browser-facing configuration variables.
 * Enforces security boundaries ensuring no backend secrets or database
 * credentials leak into client bundles.
 */

export type AppEnvironment = "development" | "test" | "staging" | "production";

export interface FrontendConfig {
  appName: string;
  apiUrl: string;
  appEnv: AppEnvironment;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
  isTest: boolean;
}

const FORBIDDEN_BACKEND_SECRETS = [
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
  "POSTGRES_USER",
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "STORAGE_SECRET_KEY",
  "STORAGE_ACCESS_KEY",
  "GEMINI_API_KEY",
  "REDIS_PASSWORD",
];

export function validateFrontendConfig(
  envSource: Record<string, string | undefined> = process.env,
): FrontendConfig {
  // 1. Audit against leakage of backend secrets into client variables
  for (const forbiddenKey of FORBIDDEN_BACKEND_SECRETS) {
    if (envSource[`NEXT_PUBLIC_${forbiddenKey}`]) {
      throw new Error(
        `CRITICAL SECURITY VIOLATION: Backend credential ${forbiddenKey} must never be exposed via NEXT_PUBLIC_* variable!`,
      );
    }
  }

  // 2. Validate App Environment
  const rawEnv = (
    envSource.NEXT_PUBLIC_APP_ENV ||
    envSource.NODE_ENV ||
    "development"
  ).toLowerCase();

  const validEnvs: AppEnvironment[] = [
    "development",
    "test",
    "staging",
    "production",
  ];

  if (!validEnvs.includes(rawEnv as AppEnvironment)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_APP_ENV "${rawEnv}". Expected one of: ${validEnvs.join(", ")}`,
    );
  }

  const appEnv = rawEnv as AppEnvironment;

  // 3. Application Name
  const appName =
    envSource.NEXT_PUBLIC_APP_NAME || "Handloom Operations Platform";

  // 4. API Base URL validation
  const apiUrl =
    envSource.NEXT_PUBLIC_API_URL ||
    (appEnv === "production"
      ? "https://api.handloom.org/api/v1"
      : "http://localhost:4000/api/v1");

  try {
    const parsedUrl = new URL(apiUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Protocol must be http: or https:");
    }
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_URL "${apiUrl}". Must be a valid absolute HTTP or HTTPS URL.`,
    );
  }

  return {
    appName,
    apiUrl,
    appEnv,
    isProduction: appEnv === "production",
    isDevelopment: appEnv === "development",
    isStaging: appEnv === "staging",
    isTest: appEnv === "test",
  };
}

export const env: FrontendConfig = validateFrontendConfig();
