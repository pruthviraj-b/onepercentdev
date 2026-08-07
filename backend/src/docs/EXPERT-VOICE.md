# Expert voice mode

The reader can request `/api/ai/explain-lesson` before speech generation. This turns source notes into a spoken teaching script: it introduces the core idea, explains terminology, adds grounded examples, preserves technical constraints, and calls out mistakes without inventing facts. The generated script is then sent to the neural TTS provider.

If no Gemini or Grok key is configured, the reader falls back to the original notes rather than blocking playback.
