// test_did_credits.js
// Standalone check of remaining D-ID credits/minutes for the key in public/api.json.
// Run locally with: node test_did_credits.js
'use strict';

const fs = require('fs');
const path = require('path');

async function main() {
  const apiJsonPath = path.join(__dirname, 'public', 'api.json');
  const { key, url } = JSON.parse(fs.readFileSync(apiJsonPath, 'utf-8'));

  const auth = 'Basic ' + Buffer.from(`${key}:`).toString('base64');
  const response = await fetch(`${url}/credits`, {
    headers: { Authorization: auth },
  });

  if (!response.ok) {
    console.error(`Request failed: ${response.status} ${response.statusText}`);
    console.error(await response.text());
    process.exit(1);
  }

  const data = await response.json();
  console.log(`Remaining: ${data.remaining} / ${data.total} credits`);
  for (const grant of data.credits) {
    console.log(
      `  - ${grant.remaining}/${grant.total} credits, plan "${grant.plan_group}", expires ${grant.expire_at}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
