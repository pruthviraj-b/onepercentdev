# Frontend identity architecture

`AuthProvider` remains the compatibility owner of Firebase Google login. `IdentityProvider` composes session, current-user, role, and permission providers without changing the existing login UI.

Hooks and guards are available under `features/authentication/hooks` and `features/authentication/guards`. Organization, subscription, and course-access hooks are architecture boundaries only until their backend contracts are activated.
