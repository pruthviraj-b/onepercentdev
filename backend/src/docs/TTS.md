# Reader voice reader

The reader includes a browser-native voice player by default. It supports pause/resume, stop, approximate ten-second jumps, speed, volume, voice selection, keyboard shortcuts, resumable local position, paragraph highlighting, and automatic progression to the next lesson.

## Neural provider

Set `TTS_PROVIDER=openai` and `OPENAI_API_KEY` on the backend. The browser calls the authenticated `/api/tts/synthesize` endpoint; the secret remains server-side and audio is streamed through the backend. If the provider is unavailable, the reader continues to work with `speechSynthesis`.

## Database

Apply `src/database/migrations/006_tts.sql` to persist listening positions and voice preferences. Local storage remains the offline-first fallback when the API is unavailable.

## Endpoints

- `GET /api/tts/voices` — provider status and neural voice catalog.
- `POST /api/tts/synthesize` — authenticated streaming synthesis endpoint.
- `GET /api/tts/progress?course=:id&part=:number` — read position.
- `PUT /api/tts/progress` — write position.

For production, place a shared object cache (Cloudinary, S3, or an edge cache) in front of `/api/tts/synthesize`; the service currently keeps provider credentials server-side and is intentionally bounded to 50,000 characters per request.
