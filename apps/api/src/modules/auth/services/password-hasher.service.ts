import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';
import { logger } from '@handloom/logger';

export interface PasswordVerificationResult {
  isValid: boolean;
  needsRehash: boolean;
  algorithm: 'argon2id' | 'bcrypt' | 'unknown';
}

@Injectable()
export class PasswordHasherService {
  // OWASP Recommended baseline parameters for Argon2id in interactive logins
  private readonly argon2Options: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,       // 2 iterations
    parallelism: 1,    // 1 lane
  };

  /**
   * Hashes a password using Argon2id with cryptographically secure random salt.
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      ...this.argon2Options,
      raw: false,
    });
  }

  /**
   * Verifies a plaintext password against an existing stored hash.
   * Seamlessly supports both modern Argon2id ($argon2id$) and legacy bcrypt ($2a$, $2b$).
   * Returns whether the password is valid and whether it needs to be migrated/rehashed to Argon2id.
   */
  async verify(password: string, storedHash: string): Promise<PasswordVerificationResult> {
    if (!storedHash || typeof storedHash !== 'string') {
      return { isValid: false, needsRehash: false, algorithm: 'unknown' };
    }

    // 1. Argon2id hash verification
    if (storedHash.startsWith('$argon2id$') || storedHash.startsWith('$argon2i$')) {
      try {
        const isValid = await argon2.verify(storedHash, password);
        return {
          isValid,
          needsRehash: false,
          algorithm: 'argon2id',
        };
      } catch (error) {
        logger.warn({ err: (error as Error).message }, 'Argon2id verification error');
        return { isValid: false, needsRehash: false, algorithm: 'argon2id' };
      }
    }

    // 2. Legacy Bcrypt hash verification
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      try {
        const isValid = await bcrypt.compare(password, storedHash);
        return {
          isValid,
          needsRehash: isValid, // If valid, seamlessly mark for migration to Argon2id
          algorithm: 'bcrypt',
        };
      } catch (error) {
        logger.warn({ err: (error as Error).message }, 'Bcrypt legacy verification error');
        return { isValid: false, needsRehash: false, algorithm: 'bcrypt' };
      }
    }

    logger.warn('Unknown password hash algorithm detected');
    return { isValid: false, needsRehash: false, algorithm: 'unknown' };
  }
}
