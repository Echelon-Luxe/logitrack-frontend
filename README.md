# logitrack-frontend

Next.js 16 (App Router) operator, customer and driver interface for LogiTrack.

Part of the [LogiTrack](https://github.com/Echelon-Luxe) platform.

## Pages

| Route | Purpose |
|---|---|
| `/login` | Sign in and registration |
| `/dashboard` | Shipment counts and recent activity |
| `/shipments` | Filterable list |
| `/shipments/new` | Create a shipment |
| `/shipments/[id]` | Detail plus the tracking timeline |
| `/driver` | Availability toggle and assigned deliveries |
| `/admin` | Driver assignment and fleet overview |

## Local development

```bash
npm ci
npm run dev        # http://localhost:3000
npm test
npm run lint
```

Point it at a gateway with `NEXT_PUBLIC_API_URL`. That value is inlined at
**build** time, so changing it requires a rebuild, not a restart.

## Container

Multi-stage to distroless, using Next's `output: 'standalone'` so only the
files actually imported are shipped.

```bash
docker build -t logitrack-frontend:local .
docker run --rm -p 3000:3000 logitrack-frontend:local
```
