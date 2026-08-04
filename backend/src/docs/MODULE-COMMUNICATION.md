# Module Communication

HTTP requests enter middleware, then route composition, then a domain controller. Controllers should call services; services should call repositories or provider adapters; repositories should own persistence details. Shared errors flow to the global error boundary.

Payments and marketplace are structural module boundaries only in this phase. No payment or marketplace behavior is implemented.
