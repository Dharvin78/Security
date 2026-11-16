import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const keyPath = process.env.DATA_ENCRYPTION_KEY_PATH ??
  join(homedir(), '.config/juice-shop/keys/data-encryption.key')

const key = Buffer.from(readFileSync(keyPath, 'utf8').trim(), 'hex')

if (key.length !== 32) {
  throw new Error('Data encryption key must be 32 bytes')
}

export function encryptData (plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])

  const tag = cipher.getAuthTag()

  return `enc:v1:${Buffer.concat([iv, tag, encrypted]).toString('base64')}`
}

export function decryptData (value: string): string {
  if (!value.startsWith('enc:v1:')) {
    throw new Error('Expected encrypted data')
  }

  const payload = Buffer.from(value.slice(7), 'base64')

  if (payload.length < 28) {
    throw new Error('Invalid encrypted payload')
  }

  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const encrypted = payload.subarray(28)

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8')
}
