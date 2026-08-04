# Identity module

This module is the compatibility-preserving identity boundary.

- Firebase/Google remains the active frontend login provider.
- Supabase bearer verification is the backend token path.
- `X-User-Id` remains available only for the existing non-production development contract.
- Role and permission checks are reusable middleware; assignments are intended to come from the Phase 3 identity tables.
- Session, device, refresh-token, SSO, and password flows are represented as service/repository boundaries but are not activated in this phase.
- Payment, marketplace, and course business logic are outside this module.
