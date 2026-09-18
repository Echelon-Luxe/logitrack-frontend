// Liveness and readiness target for the Helm chart, which probes /healthz on
// every service. Without it the pod never reports Ready and liveness restarts
// it on a loop.
//
// force-dynamic so the probe reaches the running server rather than a statically
// rendered response - a cached 200 would report healthy from a dead process.
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ status: 'ok', service: 'logitrack-frontend' });
}
