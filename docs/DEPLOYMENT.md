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

Open `http://127.0.0.1:5173`. If Cognee is not running, the Dashboard and Demo page will show `demo-fallback`.

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

## Production Shape

The Vite frontend is static, but live Cognee access needs the Node API bridge so secrets are not placed in the browser. For a hosted demo:

```powershell
npm run build
npm run dev:api
```

Deploy `dist/` as the frontend and deploy `server/index.js` as the backend. Route `/api/*` from the frontend domain to the backend.

## References

- Cognee REST server guide: https://docs.cognee.ai/guides/deploy-rest-api-server
- Cognee API reference: https://docs.cognee.ai/api-reference/introduction
- Cognee Cloud guide: https://docs.cognee.ai/how-to-guides/cognee-cloud
