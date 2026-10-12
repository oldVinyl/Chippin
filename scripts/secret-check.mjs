import { execFileSync } from 'node:child_process';
const diff = execFileSync('git', ['diff','--cached','--diff-filter=ACM','--unified=0'], { encoding: 'utf8' });
if (/^\+(?:PHONE_(?:ENCRYPTION|HASH)_KEY|MOMO_\w*(?:KEY|USER)|ADMIN_PASSWORD|DEMO_PASSWORD)=[^\s]+/m.test(diff) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(diff)) {
  console.error('Possible secret in staged changes. Remove it before committing.'); process.exit(1);
}
