import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Environment, EnvironmentVariables, LogLevel } from "./env.validation";

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get<T = unknown>(key: string): T {
    return this.configService.get(
      key as keyof EnvironmentVariables,
    ) as unknown as T;
  }

  get nodeEnv(): Environment {
    return (
      this.configService.get<Environment>("NODE_ENV") || Environment.DEVELOPMENT
    );
  }

  get isProduction(): boolean {
    return this.nodeEnv === Environment.PRODUCTION;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === Environment.DEVELOPMENT;
  }

  get isTest(): boolean {
    return this.nodeEnv === Environment.TEST;
  }

  get isStaging(): boolean {
    return this.nodeEnv === Environment.STAGING;
  }

  get appName(): string {
    return (
      this.configService.get<string>("APP_NAME") ||
      "Handloom Operations Platform"
    );
  }

  get port(): number {
    return Number(this.configService.get<number>("PORT")) || 4000;
  }

  get apiPrefix(): string {
    return this.configService.get<string>("API_PREFIX") || "/api/v1";
  }

  get corsOrigins(): string[] | string {
    const origin = this.configService.get<string>("CORS_ORIGIN");
    if (!origin || origin === "*") {
      return "*";
    }
    return origin
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  get databaseUrl(): string | undefined {
    return this.configService.get<string>("DATABASE_URL");
  }

  get redisUrl(): string | undefined {
    return this.configService.get<string>("REDIS_URL");
  }

  get logLevel(): LogLevel {
    return this.configService.get<LogLevel>("LOG_LEVEL") || LogLevel.DEBUG;
  }

  get requestTimeoutMs(): number {
    return (
      Number(this.configService.get<number>("REQUEST_TIMEOUT_MS")) || 30000
    );
  }

  get rateLimit(): { ttl: number; limit: number } {
    return {
      ttl: Number(this.configService.get<number>("RATE_LIMIT_TTL")) || 60,
      limit: Number(this.configService.get<number>("RATE_LIMIT_LIMIT")) || 100,
    };
  }

  get fileUpload(): { maxSizeBytes: number; allowedTypes: string[] } {
    const rawTypes =
      this.configService.get<string>("ALLOWED_FILE_TYPES") ||
      "image/jpeg,image/png,image/webp,application/pdf";
    return {
      maxSizeBytes:
        Number(this.configService.get<number>("MAX_FILE_SIZE_BYTES")) ||
        10485760,
      allowedTypes: rawTypes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  get jwt(): {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  } {
    return {
      secret:
        this.configService.get<string>("JWT_SECRET") ||
        "handloom_default_secret_key_change_in_production_32chars",
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN") || "15m",
      refreshSecret:
        this.configService.get<string>("REFRESH_TOKEN_SECRET") ||
        "handloom_default_refresh_secret_key_change_in_production_32chars",
      refreshExpiresIn:
        this.configService.get<string>("REFRESH_TOKEN_EXPIRES_IN") || "7d",
    };
  }

  get storage(): {
    endpoint?: string;
    accessKey?: string;
    secretKey?: string;
    bucketName?: string;
    region?: string;
  } {
    return {
      endpoint: this.configService.get<string>("STORAGE_ENDPOINT"),
      accessKey: this.configService.get<string>("STORAGE_ACCESS_KEY"),
      secretKey: this.configService.get<string>("STORAGE_SECRET_KEY"),
      bucketName:
        this.configService.get<string>("STORAGE_BUCKET_NAME") ||
        "handloom-documents",
      region: this.configService.get<string>("STORAGE_REGION") || "us-east-1",
    };
  }

  get ai(): {
    geminiApiKey?: string;
    modelName: string;
  } {
    return {
      geminiApiKey: this.configService.get<string>("GEMINI_API_KEY"),
      modelName:
        this.configService.get<string>("AI_MODEL_NAME") || "gemini-2.5-flash",
    };
  }

  /**
   * Safe, non-sensitive summary of application configuration for logging.
   * Credentials, passwords, and private secrets are completely omitted.
   */
  getSanitizedConfigSummary(): Record<string, unknown> {
    return {
      appName: this.appName,
      nodeEnv: this.nodeEnv,
      port: this.port,
      apiPrefix: this.apiPrefix,
      corsOrigins: this.corsOrigins,
      logLevel: this.logLevel,
      databaseConfigured: Boolean(this.databaseUrl),
      redisConfigured: Boolean(this.redisUrl),
      requestTimeoutMs: this.requestTimeoutMs,
      rateLimit: this.rateLimit,
      maxFileSizeBytes: this.fileUpload.maxSizeBytes,
      storageConfigured: Boolean(this.storage.endpoint),
      aiConfigured: Boolean(this.ai.geminiApiKey),
    };
  }
}
