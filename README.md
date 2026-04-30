# Hubble

Hubble is an AI-assisted product scoping app built with Next.js.  
It helps teams turn rough ideas into structured scope outputs through guided chat, reusable templates, and downloadable documents.

## What It Does

- AI chat for discovery and scope intake
- Template-based project kickstarts (multiple industries)
- Product spec generator from chat transcript
- Export to TXT and PPT
- File attachments in chat (images, PDF, text, audio)
- Google login/signup via Supabase Auth

## Tech Stack

- Next.js 14 (App Router)
- TypeScript + React
- Tailwind CSS
- Supabase (auth + server/client session handling)
- Gemini API (chat + product-spec generation)

## Project Structure

- `src/app/page.tsx` - landing page
- `src/app/dashboard/page.tsx` - main workspace shell
- `src/components/dashboard/dashboard-workspace.tsx` - chat UI, uploads, spec editor, exports
- `src/app/templates/page.tsx` - template gallery
- `src/lib/scope-templates.ts` - template data source
- `src/app/api/chat/route.ts` - AI chat endpoint
- `src/app/api/product/generate/route.ts` - product spec generation endpoint
- `src/app/api/health/route.ts` - health check endpoint

## Requirements

- Node.js 18+ (recommended: Node 20)
- npm
- Supabase project
- Gemini API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI
GEMINI_API_KEY=...
# optional fallback aliases:
# GOOGLE_AI_API_KEY=...
# GOOGLE_CLOUD_PROJECT_NUMBER=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite-preview,gemini-3-flash-preview
```

4. Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint project

## API Endpoints

- `GET /api/health` - basic health response
- `POST /api/chat` - AI scope chat
- `POST /api/product/generate` - generate structured product spec JSON
- `POST /api/scopes/generate` - scope generation endpoint

## Notes

- If AI calls fail, verify `GEMINI_API_KEY` and model names first.
- If auth fails, verify Supabase URL/keys and callback setup.
- Uploaded files are sent with the chat request; keep file sizes reasonable for best performance.

