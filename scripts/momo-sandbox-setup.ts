import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
config({ quiet: true });
async function setup() {
  if (!process.env.MOMO_CALLBACK_URL)
    throw new Error(
      'Set MOMO_CALLBACK_URL to your public API URL plus /callbacks first.',
    );
  let env = readFileSync('.env', 'utf8');
  for (const product of ['COLLECTION', 'DISBURSEMENT']) {
    const key = process.env[`MOMO_${product}_SUBSCRIPTION_KEY`];
    if (!key) throw new Error(`Set MOMO_${product}_SUBSCRIPTION_KEY in .env.`);
    const name = `MOMO_${product}_USER`;
    const user = process.env[name] || randomUUID();
    const headers = {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/json',
      'X-Reference-Id': user,
    };
    const base = 'https://sandbox.momodeveloper.mtn.com';
    if (!process.env[name]) {
      const result = await fetch(`${base}/v1_0/apiuser`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providerCallbackHost: new URL(process.env.MOMO_CALLBACK_URL).hostname,
        }),
      });
      if (result.status !== 201 && result.status !== 409)
        throw new Error(
          `Create ${product} user returned HTTP ${result.status}`,
        );
      env = env.replace(new RegExp(`^${name}=.*$`, 'm'), `${name}=${user}`);
      writeFileSync('.env', env);
    }
    if (!process.env[`MOMO_${product}_API_KEY`]) {
      const result = await fetch(`${base}/v1_0/apiuser/${user}/apikey`, {
        method: 'POST',
        headers,
      });
      if (!result.ok)
        throw new Error(
          `Create ${product} API key returned HTTP ${result.status}`,
        );
      const body = await result.json();
      env = env.replace(
        new RegExp(`^MOMO_${product}_API_KEY=.*$`, 'm'),
        `MOMO_${product}_API_KEY=${body.apiKey}`,
      );
      writeFileSync('.env', env);
    }
    console.log(
      `${product}: user and API key stored in ignored .env. Values are never printed.`,
    );
  }
}
setup().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
