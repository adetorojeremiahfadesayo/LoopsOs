# LoopOS Deployment Notes

LoopOS can run in three modes:

- Demo fallback: no Cognee server required. The app still demonstrates permissions, audit, loop improvement, and run notes with deterministic local behavior.
- Local Cognee: LoopOS proxies to a Cognee REST server on your machine.
- Cognee Cloud: LoopOS proxies to Cognee Cloud with an API key.

## Quick Demo

```powershell
npm install
Copy-Item .env.example .env
npm run dev:full
```

Run those commands from the project root. Open `http://127.0.0.1:5173`. If Cognee is not running, the Dashboard and Demo page will show `demo-fallback`.

## Local Cognee

Cognee's docs show the REST API server on `http://localhost:8000` and a Docker quick start using `cognee/cognee:main`.

1. Add your model key to `.env` for the Cognee container:

```powershell
Add-Content .env 'LLM_API_KEY="your-openai-or-provider-key"'
```

2. Start Cognee:

```powershell
docker run --env-file ./.env -p 8000:8000 --rm -it cognee/cognee:main
```

3. Keep LoopOS configured for local Cognee:

```dotenv
COGNEE_BASE_URL=http://127.0.0.1:8000
COGNEE_AUTH_MODE=none
```

If your Cognee server requires authentication, switch to:

```dotenv
COGNEE_AUTH_MODE=bearer
COGNEE_API_KEY=your-local-token
```

4. Start LoopOS:

```powershell
npm run dev:full
```

## Cognee Cloud

1. Create a Cognee Cloud API key.
2. Update `.env`:

```dotenv
COGNEE_BASE_URL=https://api.cognee.ai
COGNEE_AUTH_MODE=api-key
COGNEE_API_KEY=your-cognee-cloud-api-key
```

3. Start LoopOS:

```powershell
npm run dev:full
```

## Cognee API Expectations

LoopOS probes `/health` and `/api/v1/datasets` before reporting live mode. In live mode, ingestion uses the current Cognee REST flow:

- `POST /api/v1/add`
- `POST /api/v1/cognify`
- `POST /api/v1/search`

If `/api/v1/add` is unavailable but `/api/v1/remember` exists, the bridge uses `remember` as a compatibility fallback. If `/api/v1/datasets` returns `404`, LoopOS reports `api-mismatch`; if it returns `401` or `403`, LoopOS reports `auth-needed`.

## Production Shape

The Vite frontend is static, but live Cognee and Qwen access need the Node API bridge so secrets are not placed in the browser. In production, the Node server serves both `/api/*` routes and the built `dist/` frontend.

```powershell
npm run build
npm start
```

For Railway:

```text
Build command: npm run build
Start command: npm start
```

Railway provides `PORT`; the server listens on `0.0.0.0:$PORT`.

## References

- Cognee REST server guide: https://docs.cognee.ai/guides/deploy-rest-api-server
- Cognee API reference: https://docs.cognee.ai/api-reference/introduction
- Cognee Cloud guide: https://docs.cognee.ai/how-to-guides/cognee-cloud
