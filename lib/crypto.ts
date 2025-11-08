import crypto from 'node:crypto';

// Master key for encrypting admin-provided secrets
// Set this in your environment: APP_MASTER_KEY='your-strong-passphrase-or-32-byte-hex'
const MASTER = process.env.APP_MASTER_KEY;

if (!MASTER) {
  console.warn('⚠️  APP_MASTER_KEY not set. API keys will be stored in plaintext (DEV ONLY).');
}

const ALGO = 'aes-256-gcm';

// Derive a 32-byte key from MASTER
function deriveKey() {
  if (!MASTER) return null;
  const salt = Buffer.from('rockreach-encryption-salt-v1');
  return crypto.pbkdf2Sync(MASTER, salt, 100000, 32, 'sha256');
}

export interface EncryptedData {
  cipher: string;
  iv: string | null;
  tag: string | null;
  ver: number;
}

export function encryptSecret(plaintext: string): EncryptedData {
  if (!MASTER || !plaintext) {
    return {
      cipher: Buffer.from(plaintext || '').toString('base64'),
      iv: null,
      tag: null,
      ver: 0,
    };
  }

  try {
    const key = deriveKey()!;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      cipher: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      ver: 1,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt secret');
  }
}

export function decryptSecret(encrypted: EncryptedData | null): string | null {
  if (!encrypted || !encrypted.cipher) return null;

  // Version 0 = plaintext (dev mode)
  if (encrypted.ver === 0 || !MASTER) {
    try {
      return Buffer.from(encrypted.cipher, 'base64').toString('utf8');
    } catch {
      return encrypted.cipher;
    }
  }

  // Version 1 = encrypted
  try {
    const key = deriveKey()!;
    const iv = Buffer.from(encrypted.iv!, 'base64');
    const tag = Buffer.from(encrypted.tag!, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.cipher, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt secret');
  }
}
