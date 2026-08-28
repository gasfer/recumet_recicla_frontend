const requiredVariables = ['E2E_BASE_URL', 'E2E_EMAIL', 'E2E_PASSWORD'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length) {
  console.error(`Responsive acceptance requires: ${missingVariables.join(', ')}.`);
  process.exit(1);
}

let baseURL;
try {
  baseURL = new URL(process.env.E2E_BASE_URL);
} catch {
  console.error('E2E_BASE_URL must be a valid absolute URL.');
  process.exit(1);
}

try {
  const response = await fetch(baseURL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    console.error(`Frontend availability check returned HTTP ${response.status}.`);
    process.exit(1);
  }
} catch (error) {
  console.error(`Frontend is not reachable at ${baseURL.origin}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log(`E2E environment is ready at ${baseURL.origin}.`);
