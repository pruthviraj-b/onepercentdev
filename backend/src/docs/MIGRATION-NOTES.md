# Migration Notes

- The former monolithic backend entrypoint was split into application context, route composition, and domain controllers.
- `backend/index.js` remains as a compatibility loader.
- SQL, scripts, and verification code now live below `backend/src/`.
- Existing route implementations were extracted mechanically to avoid behavior changes.
- Service/repository contracts are available for incremental business-logic extraction in a later phase.
