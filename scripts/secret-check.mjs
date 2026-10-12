import { execFileSync } from 'node:child_process';
let diff;
try {
  diff = execFileSync(
    'git',
    ['diff', '--cached', '--diff-filter=ACM', '--unified=0'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
} catch {
  console.error(
    'Could not scan staged changes. Check Git and the size of staged text artifacts.',
  );
  process.exit(1);
}
if (
  /^\+(?:PHONE_(?:ENCRYPTION|HASH)_KEY|MOMO_\w*(?:KEY|USER)|ADMIN_PASSWORD|DEMO_PASSWORD)=[^\s]+/m.test(
    diff,
  ) ||
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(diff)
) {
  console.error(
    'Possible secret in staged changes. Remove it before committing.',
  );
  process.exit(1);
}
