import { PasswordHasherService } from './password-hasher.service';
import * as bcrypt from 'bcryptjs';

describe('PasswordHasherService', () => {
  let service: PasswordHasherService;

  beforeEach(() => {
    service = new PasswordHasherService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Argon2id hashing', () => {
    it('should hash a password with an $argon2id$ prefix', async () => {
      const password = 'SuperSecretPassword#2026';
      const hash = await service.hash(password);

      expect(hash).toBeDefined();
      expect(hash.startsWith('$argon2id$')).toBe(true);
    });

    it('should generate unique salted hashes for the identical password', async () => {
      const password = 'IdenticalPassword#123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toEqual(hash2);
    });

    it('should verify valid Argon2id password successfully without requiring rehash', async () => {
      const password = 'ValidPassword#2026';
      const hash = await service.hash(password);

      const result = await service.verify(password, hash);
      expect(result.isValid).toBe(true);
      expect(result.needsRehash).toBe(false);
      expect(result.algorithm).toBe('argon2id');
    });

    it('should reject incorrect password for Argon2id hash', async () => {
      const hash = await service.hash('CorrectPassword#2026');

      const result = await service.verify('WrongPassword#2026', hash);
      expect(result.isValid).toBe(false);
      expect(result.needsRehash).toBe(false);
    });
  });

  describe('Legacy Bcrypt Migration', () => {
    it('should verify valid legacy bcrypt hash and flag needsRehash = true', async () => {
      const password = 'LegacyBcryptPassword#2025';
      const bcryptHash = await bcrypt.hash(password, 10);
      expect(bcryptHash.startsWith('$2a$') || bcryptHash.startsWith('$2b$')).toBe(true);

      const result = await service.verify(password, bcryptHash);
      expect(result.isValid).toBe(true);
      expect(result.needsRehash).toBe(true);
      expect(result.algorithm).toBe('bcrypt');
    });

    it('should reject incorrect password for legacy bcrypt hash without flagging needsRehash', async () => {
      const bcryptHash = await bcrypt.hash('CorrectPassword#2025', 10);

      const result = await service.verify('IncorrectPassword#2025', bcryptHash);
      expect(result.isValid).toBe(false);
      expect(result.needsRehash).toBe(false);
      expect(result.algorithm).toBe('bcrypt');
    });
  });

  describe('Edge cases and malformed hashes', () => {
    it('should safely return invalid for unknown hash formats', async () => {
      const result = await service.verify('password', 'plain-text-or-md5-hash');
      expect(result.isValid).toBe(false);
      expect(result.needsRehash).toBe(false);
      expect(result.algorithm).toBe('unknown');
    });

    it('should safely return invalid for empty or non-string hashes', async () => {
      const result = await service.verify('password', '');
      expect(result.isValid).toBe(false);
      expect(result.needsRehash).toBe(false);
    });
  });
});
