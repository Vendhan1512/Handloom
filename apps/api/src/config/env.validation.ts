import "reflect-metadata";
import { plainToInstance, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
  ValidationError,
} from "class-validator";

export enum Environment {
  DEVELOPMENT = "development",
  TEST = "test",
  STAGING = "staging",
  PRODUCTION = "production",
}

export enum LogLevel {
  FATAL = "fatal",
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  TRACE = "trace",
}

export const INSECURE_DEFAULT_JWT_SECRETS = [
  "handloom_default_secret_key_change_in_production_32chars",
  "change_me_to_a_secure_random_secret_in_production",
  "handloom_default_refresh_secret_key_change_in_production_32chars",
  "change_me_to_a_secure_refresh_token_secret",
  "secret",
  "password",
  "change_me",
];

export class EnvironmentVariables {
  @IsEnum(Environment, {
    message: "NODE_ENV must be one of: development, test, staging, production",
  })
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @IsString()
  APP_NAME: string = "Handloom Operations Platform";

  @Type(() => Number)
  @IsInt({ message: "PORT must be an integer" })
  @Min(1, { message: "PORT must be >= 1" })
  @Max(65535, { message: "PORT must be <= 65535" })
  PORT: number = 4000;

  @IsString()
  API_PREFIX: string = "/api/v1";

  @IsString()
  CORS_ORIGIN: string = "http://localhost:3000";

  @IsEnum(LogLevel, {
    message: "LOG_LEVEL must be one of: fatal, error, warn, info, debug, trace",
  })
  LOG_LEVEL: LogLevel = LogLevel.DEBUG;

  @Type(() => Number)
  @IsInt({ message: "REQUEST_TIMEOUT_MS must be an integer" })
  @Min(1000, { message: "REQUEST_TIMEOUT_MS must be at least 1000ms" })
  REQUEST_TIMEOUT_MS: number = 30000;

  @Type(() => Number)
  @IsInt({ message: "RATE_LIMIT_TTL must be an integer" })
  @Min(1, { message: "RATE_LIMIT_TTL must be at least 1 second" })
  RATE_LIMIT_TTL: number = 60;

  @Type(() => Number)
  @IsInt({ message: "RATE_LIMIT_LIMIT must be an integer" })
  @Min(1, { message: "RATE_LIMIT_LIMIT must be at least 1" })
  RATE_LIMIT_LIMIT: number = 100;

  @Type(() => Number)
  @IsInt({ message: "MAX_FILE_SIZE_BYTES must be an integer" })
  @Min(1024, {
    message: "MAX_FILE_SIZE_BYTES must be at least 1024 bytes (1 KB)",
  })
  MAX_FILE_SIZE_BYTES: number = 10485760; // 10 MB

  @IsString()
  ALLOWED_FILE_TYPES: string =
    "image/jpeg,image/png,image/webp,application/pdf";

  // --- Database Configuration ---
  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  POSTGRES_HOST?: string = "localhost";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  POSTGRES_PORT?: number = 5432;

  @IsOptional()
  @IsString()
  POSTGRES_USER?: string;

  @IsOptional()
  @IsString()
  POSTGRES_PASSWORD?: string;

  @IsOptional()
  @IsString()
  POSTGRES_DB?: string;

  // --- Redis Configuration ---
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string = "localhost";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  REDIS_PORT?: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // --- JWT Security Placeholders ---
  @IsString()
  JWT_SECRET: string =
    "handloom_default_secret_key_change_in_production_32chars";

  @IsString()
  JWT_EXPIRES_IN: string = "15m";

  @IsString()
  REFRESH_TOKEN_SECRET: string =
    "handloom_default_refresh_secret_key_change_in_production_32chars";

  @IsString()
  REFRESH_TOKEN_EXPIRES_IN: string = "7d";

  // --- Storage Placeholders ---
  @IsOptional()
  @IsString()
  STORAGE_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  STORAGE_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  STORAGE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STORAGE_BUCKET_NAME?: string = "handloom-documents";

  @IsOptional()
  @IsString()
  STORAGE_REGION?: string = "us-east-1";

  // --- AI Placeholders ---
  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsString()
  AI_MODEL_NAME: string = "gemini-2.5-flash";
}

function formatValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const err of errors) {
    if (err.constraints) {
      messages.push(...Object.values(err.constraints));
    }
    if (err.children && err.children.length > 0) {
      messages.push(...formatValidationErrors(err.children));
    }
  }
  return messages;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  const errorMessages = formatValidationErrors(errors);

  const isStrictEnv =
    validatedConfig.NODE_ENV === Environment.PRODUCTION ||
    validatedConfig.NODE_ENV === Environment.STAGING;

  // Staging & Production strict assertions
  if (isStrictEnv) {
    if (
      !validatedConfig.DATABASE_URL ||
      validatedConfig.DATABASE_URL.trim() === ""
    ) {
      errorMessages.push(
        "DATABASE_URL is mandatory in staging and production environments.",
      );
    }

    if (
      !validatedConfig.JWT_SECRET ||
      validatedConfig.JWT_SECRET.length < 32 ||
      INSECURE_DEFAULT_JWT_SECRETS.includes(validatedConfig.JWT_SECRET)
    ) {
      errorMessages.push(
        "JWT_SECRET must be at least 32 characters and cannot use default placeholders in staging/production.",
      );
    }

    if (
      !validatedConfig.REFRESH_TOKEN_SECRET ||
      validatedConfig.REFRESH_TOKEN_SECRET.length < 32 ||
      INSECURE_DEFAULT_JWT_SECRETS.includes(
        validatedConfig.REFRESH_TOKEN_SECRET,
      )
    ) {
      errorMessages.push(
        "REFRESH_TOKEN_SECRET must be at least 32 characters and cannot use default placeholders in staging/production.",
      );
    }

    if (validatedConfig.CORS_ORIGIN === "*") {
      errorMessages.push(
        "CORS_ORIGIN cannot be wildcard (*) in staging or production environments.",
      );
    }
  }

  if (errorMessages.length > 0) {
    // Redact any potential credentials/keys from error output
    const sanitizedErrors = errorMessages.map((msg) =>
      msg
        .replace(/postgresql:\/\/[^@]+@/, "postgresql://[REDACTED]@")
        .replace(/redis:\/\/[^@]+@/, "redis://[REDACTED]@"),
    );

    throw new Error(
      `\n=======================================================\n` +
        `[Handloom Config] Configuration Validation Failed:\n` +
        sanitizedErrors.map((err) => `  - ${err}`).join("\n") +
        `\n=======================================================\n`,
    );
  }

  return validatedConfig;
}
