import {
  withTenantContext,
  withSuperAdminContext,
  validateTenantOwnership,
  MissingTenantContextError,
  TenantIsolationViolationError,
  getCurrentTenantContext,
  isSuperAdminContext,
  prisma,
} from "@handloom/database";

describe("Multi-Tenant Database Foundation & Isolation", () => {
  const tenantA = "tenant-uuid-aaaa-1111";
  const tenantB = "tenant-uuid-bbbb-2222";

  describe("Application-Level Tenant Ownership Validation", () => {
    it("should permit access when record tenantId matches active tenant", () => {
      const record = {
        id: "rec-1",
        tenantId: tenantA,
        name: "Mulberry Silk Yarn Lot #101",
      };

      const validated = validateTenantOwnership(record, tenantA, "YarnLot");
      expect(validated).toBe(record);
      expect(validated.tenantId).toBe(tenantA);
    });

    it("should throw TenantIsolationViolationError on cross-tenant access attempt", () => {
      const recordOfTenantB = {
        id: "rec-2",
        tenantId: tenantB,
        name: "Private Mill Ledger #99",
      };

      expect(() => {
        validateTenantOwnership(recordOfTenantB, tenantA, "LedgerRecord");
      }).toThrow(TenantIsolationViolationError);

      expect(() => {
        validateTenantOwnership(recordOfTenantB, tenantA, "LedgerRecord");
      }).toThrow(/Cross-tenant access rejected/);
    });

    it("should throw TenantIsolationViolationError if record is null or undefined", () => {
      expect(() => {
        validateTenantOwnership(null, tenantA, "CustomerOrder");
      }).toThrow(TenantIsolationViolationError);

      expect(() => {
        validateTenantOwnership(undefined, tenantA, "CustomerOrder");
      }).toThrow(/not found/);
    });
  });

  describe("withTenantContext Execution & Parameterized Scoping", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should reject missing or empty tenantId with MissingTenantContextError before invoking DB", async () => {
      await expect(withTenantContext("", async () => "data")).rejects.toThrow(
        MissingTenantContextError,
      );
      await expect(
        withTenantContext("   ", async () => "data"),
      ).rejects.toThrow(MissingTenantContextError);
      await expect(
        withTenantContext(null as unknown as string, async () => "data"),
      ).rejects.toThrow(MissingTenantContextError);
    });

    it("should execute transaction and set transaction-local app.current_tenant_id", async () => {
      const executeRawSpy = jest.fn().mockResolvedValue(1);
      const mockTx = {
        $executeRaw: executeRawSpy,
      };

      const transactionSpy = jest
        .spyOn(prisma, "$transaction")
        .mockImplementation(async (callback: any) => {
          return callback(mockTx);
        });

      const result = await withTenantContext(tenantA, async (tx) => {
        return "operation-result";
      });

      expect(result).toBe("operation-result");
      expect(transactionSpy).toHaveBeenCalled();
      expect(executeRawSpy).toHaveBeenCalled();
    });

    it("should execute withSuperAdminContext and set app.is_super_admin", async () => {
      const executeRawSpy = jest.fn().mockResolvedValue(1);
      const mockTx = {
        $executeRaw: executeRawSpy,
      };

      jest
        .spyOn(prisma, "$transaction")
        .mockImplementation(async (callback: any) => {
          return callback(mockTx);
        });

      const result = await withSuperAdminContext(async (tx) => {
        return "super-admin-result";
      });

      expect(result).toBe("super-admin-result");
      expect(executeRawSpy).toHaveBeenCalled();
    });

    it("should isolate context across consecutive tenant executions", async () => {
      const contextsLogged: string[] = [];
      const mockTx = {
        $executeRaw: jest
          .fn()
          .mockImplementation((strings: any, val: string) => {
            contextsLogged.push(val);
            return Promise.resolve(1);
          }),
      };

      jest
        .spyOn(prisma, "$transaction")
        .mockImplementation(async (callback: any) => {
          return callback(mockTx);
        });

      // Execute operation for Tenant A
      await withTenantContext(tenantA, async () => "opA");
      // Execute operation for Tenant B
      await withTenantContext(tenantB, async () => "opB");

      expect(contextsLogged).toEqual([tenantA, tenantB]);
      expect(contextsLogged[0]).not.toBe(contextsLogged[1]);
    });

    it("should propagate errors and guarantee rollback when operation throws inside transaction", async () => {
      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
      };

      jest
        .spyOn(prisma, "$transaction")
        .mockImplementation(async (callback: any) => {
          return callback(mockTx);
        });

      await expect(
        withTenantContext(tenantA, async () => {
          throw new Error(
            "Simulated database write conflict during cut-piece entry",
          );
        }),
      ).rejects.toThrow(
        "Simulated database write conflict during cut-piece entry",
      );
    });
  });

  describe("Context Inspection Helpers", () => {
    it("getCurrentTenantContext should return active tenantId or null", async () => {
      const mockTxWithContext = {
        $queryRaw: jest
          .fn()
          .mockResolvedValue([{ current_tenant_id: tenantA }]),
      };
      const context = await getCurrentTenantContext(mockTxWithContext as any);
      expect(context).toBe(tenantA);

      const mockTxWithoutContext = {
        $queryRaw: jest.fn().mockResolvedValue([{ current_tenant_id: null }]),
      };
      const nullContext = await getCurrentTenantContext(
        mockTxWithoutContext as any,
      );
      expect(nullContext).toBeNull();
    });

    it("isSuperAdminContext should return true when is_super_admin is active", async () => {
      const mockTxSuperAdmin = {
        $queryRaw: jest.fn().mockResolvedValue([{ is_super_admin: "true" }]),
      };
      expect(await isSuperAdminContext(mockTxSuperAdmin as any)).toBe(true);

      const mockTxRegular = {
        $queryRaw: jest.fn().mockResolvedValue([{ is_super_admin: null }]),
      };
      expect(await isSuperAdminContext(mockTxRegular as any)).toBe(false);
    });
  });
});
