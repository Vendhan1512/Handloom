import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AppConfigService } from "./app-config.service";
import { Environment, LogLevel } from "./env.validation";

describe("AppConfigService", () => {
  let service: AppConfigService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const configValues: Record<string, unknown> = {
      NODE_ENV: Environment.DEVELOPMENT,
      APP_NAME: "Handloom Platform Test",
      PORT: 4000,
      API_PREFIX: "/api/v1",
      CORS_ORIGIN: "http://localhost:3000, http://localhost:3001",
      LOG_LEVEL: LogLevel.DEBUG,
      REQUEST_TIMEOUT_MS: 30000,
      RATE_LIMIT_TTL: 60,
      RATE_LIMIT_LIMIT: 100,
      MAX_FILE_SIZE_BYTES: 10485760,
      ALLOWED_FILE_TYPES: "image/jpeg, image/png",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "test_jwt_secret_32_chars_minimum_length",
      JWT_EXPIRES_IN: "15m",
      REFRESH_TOKEN_SECRET: "test_refresh_secret_32_chars_minimum_len",
      REFRESH_TOKEN_EXPIRES_IN: "7d",
      STORAGE_ENDPOINT: "http://localhost:9000",
      STORAGE_ACCESS_KEY: "test-key",
      STORAGE_SECRET_KEY: "test-secret",
      STORAGE_BUCKET_NAME: "test-bucket",
      STORAGE_REGION: "us-east-1",
      GEMINI_API_KEY: "test-gemini-key",
      AI_MODEL_NAME: "gemini-2.5-flash",
    };

    mockConfigService = {
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Environment flags", () => {
    it("should correctly report development environment", () => {
      expect(service.nodeEnv).toBe(Environment.DEVELOPMENT);
      expect(service.isDevelopment).toBe(true);
      expect(service.isProduction).toBe(false);
      expect(service.isTest).toBe(false);
      expect(service.isStaging).toBe(false);
    });

    it("should correctly report production environment", () => {
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === "NODE_ENV") return Environment.PRODUCTION;
        return null;
      });

      expect(service.nodeEnv).toBe(Environment.PRODUCTION);
      expect(service.isProduction).toBe(true);
      expect(service.isDevelopment).toBe(false);
    });
  });

  describe("Configuration getters", () => {
    it("should return appName, port, and apiPrefix", () => {
      expect(service.appName).toBe("Handloom Platform Test");
      expect(service.port).toBe(4000);
      expect(typeof service.port).toBe("number");
      expect(service.apiPrefix).toBe("/api/v1");
    });

    it("should parse comma-separated CORS origins into an array of trimmed strings", () => {
      const origins = service.corsOrigins;
      expect(Array.isArray(origins)).toBe(true);
      expect(origins).toEqual([
        "http://localhost:3000",
        "http://localhost:3001",
      ]);
    });

    it("should return wildcard string if CORS_ORIGIN is *", () => {
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === "CORS_ORIGIN") return "*";
        return null;
      });

      expect(service.corsOrigins).toBe("*");
    });

    it("should return rate limit and file upload configuration", () => {
      expect(service.rateLimit).toEqual({ ttl: 60, limit: 100 });
      expect(service.fileUpload.maxSizeBytes).toBe(10485760);
      expect(service.fileUpload.allowedTypes).toEqual([
        "image/jpeg",
        "image/png",
      ]);
    });

    it("should return JWT configuration securely", () => {
      expect(service.jwt.secret).toBe(
        "test_jwt_secret_32_chars_minimum_length",
      );
      expect(service.jwt.expiresIn).toBe("15m");
      expect(service.jwt.refreshSecret).toBe(
        "test_refresh_secret_32_chars_minimum_len",
      );
      expect(service.jwt.refreshExpiresIn).toBe("7d");
    });

    it("should return storage and AI configuration placeholders", () => {
      expect(service.storage.endpoint).toBe("http://localhost:9000");
      expect(service.storage.bucketName).toBe("test-bucket");
      expect(service.ai.geminiApiKey).toBe("test-gemini-key");
      expect(service.ai.modelName).toBe("gemini-2.5-flash");
    });
  });

  describe("Sanitized configuration summary", () => {
    it("should omit passwords, secrets, and private keys from sanitized summary", () => {
      const summary = service.getSanitizedConfigSummary();

      expect(summary.appName).toBe("Handloom Platform Test");
      expect(summary.port).toBe(4000);
      expect(summary.databaseConfigured).toBe(true);
      expect(summary.redisConfigured).toBe(true);

      // Verify no secrets or credentials leaked
      const summaryStr = JSON.stringify(summary);
      expect(summaryStr).not.toContain("test_jwt_secret");
      expect(summaryStr).not.toContain("test-secret");
      expect(summaryStr).not.toContain("test-gemini-key");
    });
  });
});
