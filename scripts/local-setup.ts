import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
if (existsSync('.env')) { console.log('.env already exists; preserving your keys.'); process.exit(0); }
let env = readFileSync('.env.example', 'utf8');
for (const name of ['PHONE_ENCRYPTION_KEY','PHONE_HASH_KEY']) env = env.replace(`${name}=\n`, `${name}=${randomBytes(32).toString('hex')}\n`);
for (const name of ['ADMIN_PASSWORD','DEMO_PASSWORD']) env = env.replace(`${name}=\n`, `${name}=${randomBytes(15).toString('base64url')}\n`);
writeFileSync('.env', env, { mode: 0o600 });
console.log('Created .env with local keys. Demo passwords are in .env; never commit this file.');
