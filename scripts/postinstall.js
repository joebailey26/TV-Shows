#!/usr/bin/env node
/* eslint-disable no-console */
import { existsSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

const file = resolve(process.cwd(), '.dev.vars')

if (existsSync(file)) {
  console.log('.dev.vars already exists, skipping secret generation.')
  process.exit(0)
}

let secret = ''
try {
  secret = execSync('openssl rand -base64 32').toString().trim()
} catch (err) {
  console.warn('OpenSSL not found, using Node crypto as fallback.')
  secret = randomBytes(32).toString('base64')
}

writeFileSync(file, `NUXT_AUTH_JS_SECRET=${secret}\nDB_LOGGING = false\nNUXT_PUBLIC_AUTH_JS_BASE_URL = "http://localhost:3000"`, { flag: 'wx' })
console.log('Secret written to .dev.vars')
