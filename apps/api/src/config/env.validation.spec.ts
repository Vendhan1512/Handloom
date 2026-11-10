import {
  validateEnvironment,
  Environment,
  LogLevel,
  INSECURE_DEFAULT_JWT_SECRETS,
} from "./env.validation";

describe("Environment Validation (env.validation)", () => {
  const validDevConfig = {
    NODE_ENV: "development",
    PORT: "4000",
    API_PREFIX: "/api/v1",
    CORS_ORIGIN: "http://localhost:3000",
    LOG_LEVEL: "debug",
  };

  const validProdConfig = {
    NODE_ENV: "production",
    APP_NAME: "Handloom Enterprise",
    PORT: "8080",
    API_PREFIX: "/api/v1",
    CORS_ORIGIN: "https://handloom.enterprise.com,https://app.handloom.com",
    LOG_LEVEL: "info",
    REQUEST_TIMEOUT_MS: "15000",
    RATE_LIMIT_TTL: "60",
    RATE_LIMIT_LIMIT: "500",
    MAX_FILE_SIZE_BYTES: "20971520",
    ALLOWED_FILE_TYPES: "image/jpeg,image/png,application/pdf",
    DATABASE_URL:
      "postgresql://prod_user:prod_pass@prod-db.internal:5432/handloom_prod",
    REDIS_URL: "redis://prod-redis.internal:6379",
    JWT_SECRET:
      "production_super_secure_random_jwt_secret_32_characters_minimum",
    JWT_EXPIRES_IN: "15m",
    REFRESH_TOKEN_SECRET:
      "production_super_secure_random_refresh_secret_32_chars",
    REFRESH_TOKEN_EXPIRES_IN: "30d",
    STORAGE_ENDPOINT: "https://s3.ap-south-1.amazonaws.com",
    STORAGE_BUCKET_NAME: "handloom-enterprise-docs",
    GEMINI_API_KEY: "test-gemini-api-key",
  };

  describe("Valid configurations", () => {
    it("should validate and supply safe defaults in development mode", () => {
      const result = validateEnvironment(validDevConfig);

      expect(result.NODE_ENV).toBe(Environment.DEVELOPMENT);
      expect(result.PORT).toBe(4000);
      expect(result.API_PREFIX).toBe("/api/v1");
      expect(result.CORS_ORIGIN).toBe("http://localhost:3000");
      expect(result.LOG_LEVEL).toBe(LogLevel.DEBUG);
      expect(result.REQUEST_TIMEOUT_MS).toBe(30000);
      expect(result.RATE_LIMIT_TTL).toBe(60);
      expect(result.RATE_LIMIT_LIMIT).toBe(100);
      expect(result.MAX_FILE_SIZE_BYTES).toBe(10485760);
      expect(result.JWT_SECRET).toBeDefined();
    });

    it("should validate full production configuration", () => {
      const result = validateEnvironment(validProdConfig);

      expect(result.NODE_ENV).toBe(Environment.PRODUCTION);
      expect(result.PORT).toBe(8080);
      expect(result.LOG_LEVEL).toBe(LogLevel.INFO);
      expect(result.DATABASE_URL).toBe(validProdConfig.DATABASE_URL);
      expect(result.JWT_SECRET).toBe(validProdConfig.JWT_SECRET);
      expect(result.RATE_LIMIT_LIMIT).toBe(500);
    });

    it("should validate staging environment with required secrets", () => {
      const stagingConfig = {
        ...validProdConfig,
        NODE_ENV: "staging",
      };
      const result = validateEnvironment(stagingConfig);

      expect(result.NODE_ENV).toBe(Environment.STAGING);
      expect(result.DATABASE_URL).toBeDefined();
    });
  });

  describe("Invalid environment and port validation", () => {
    it("should throw when NODE_ENV is invalid", () => {
      expect(() => {
        validateEnvironment({
          ...validDevConfig,
          NODE_ENV: "sandbox_invalid",
        });
      }).toThrow(
        /NODE_ENV must be one of: development, test, staging, production/,
      );
    });

    it("should throw when PORT is not a number", () => {
      expect(() => {
        validateEnvironment({
          ...validDevConfig,
          PORT: "not-a-number",
        });
      }).toThrow(/PORT must be an integer/);
    });

    it("should throw when PORT is out of valid TCP range (< 1)", () => {
      expect(() => {
        validateEnvironment({
          ...validDevConfig,
          PORT: "0",
        });
      }).toThrow(/PORT must be >= 1/);
    });

    it("should throw when PORT is out of valid TCP range (> 65535)", () => {
      expect(() => {
        validateEnvironment({
          ...validDevConfig,
          PORT: "70000",
        });
      }).toThrow(/PORT must be <= 65535/);
    });

    it("should throw when LOG_LEVEL is invalid", () => {
      expect(() => {
        validateEnvironment({
          ...validDevConfig,
          LOG_LEVEL: "verbose_invalid",
        });
      }).toThrow(
        /LOG_LEVEL must be one of: fatal, error, warn, info, debug, trace/,
      );
    });
  });

  describe("Production & Staging strict requirements", () => {
    it("should throw in production if DATABASE_URL is missing", () => {
      const invalid = { ...validProdConfig };
      delete (invalid as Record<string, unknown>)["DATABASE_URL"];

      expect(() => {
        validateEnvironment(invalid);
      }).toThrow(/DATABASE_URL is mandatory in staging and production/);
    });

    it("should throw in staging if DATABASE_URL is empty string", () => {
      const invalid = {
        ...validProdConfig,
        NODE_ENV: "staging",
        DATABASE_URL: "   ",
      };

      expect(() => {
        validateEnvironment(invalid);
      }).toThrow(/DATABASE_URL is mandatory in staging and production/);
    });

    it("should throw in production if JWT_SECRET is the default placeholder", () => {
      for (const placeholder of INSECURE_DEFAULT_JWT_SECRETS) {
        expect(() => {
          validateEnvironment({
            ...validProdConfig,
            JWT_SECRET: placeholder,
          });
        }).toThrow(
          /JWT_SECRET must be at least 32 characters and cannot use default placeholders/,
        );
      }
    });

    it("should throw in production if JWT_SECRET is shorter than 32 characters", () => {
      expect(() => {
        validateEnvironment({
          ...validProdConfig,
          JWT_SECRET: "short_secret_under_32_chars",
        });
      }).toThrow(/JWT_SECRET must be at least 32 characters/);
    });

    it("should throw in production if REFRESH_TOKEN_SECRET is shorter than 32 characters", () => {
      expect(() => {
        validateEnvironment({
          ...validProdConfig,
          REFRESH_TOKEN_SECRET: "short_refresh_secret",
        });
      }).toThrow(/REFRESH_TOKEN_SECRET must be at least 32 characters/);
    });

    it("should throw in production if CORS_ORIGIN is wildcard (*)", () => {
      expect(() => {
        validateEnvironment({
          ...validProdConfig,
          CORS_ORIGIN: "*",
        });
      }).toThrow(
        /CORS_ORIGIN cannot be wildcard \(\*\) in staging or production/,
      );
    });
  });

  describe("Secret redaction in error messages", () => {
    it("should never expose full database credentials in thrown error message", () => {
      try {
        validateEnvironment({
          NODE_ENV: "production",
          DATABASE_URL:
            "postgresql://super_secret_user:super_secret_password@db:5432/db",
          PORT: "invalid_port", // forces validation error
          JWT_SECRET: "short",
        });
        fail("Should have thrown validation error");
      } catch (err: unknown) {
        const message = (err as Error).message;
        expect(message).not.toContain("super_secret_password");
      }
    });
  });
});
