# Security & Architecture Fixes Todo

## Critical Issues

- [x] **1. `/api/voice/interact` Security:** The endpoint is public and allows unauthorized access to any tenant by manually specifying `business_id`. Needs authentication/authorization before accessing tenant data.
- [x] **2. `/api/voice/tts` Open Endpoint:** Endpoint is unauthenticated, allowing arbitrary TTS requests. Massive cost/abuse risk.
- [x] **3. Cache Lifecycle Management:** In-memory maps (`ttsCache`, `twilioCallSessions`, `twilioCallStates`, `twilioCallFillers`, `twilioAudioCache`) grow indefinitely. Needs Redis or TTL/LRU maps and cleanup on call end. SmartFillers, Hinweis und Verabschied sollen gecached bleiben, damit dieselben wiederverwendbare audios nicht neugeneriert werden.
- [ ] **4. Booking Race Conditions:** `appointments` checking and insertion is not atomic. Needs PostgreSQL transactions, row/advisory locks, or exclusion constraints.
- [ ] **5. Resource Booking Logic:** Resources set to `in_use` are not automatically released. Needs time-based reservations instead of global status.
- [ ] **6. Secret Exposure:** `GET /api/business-facts` sends `externalApiKey` and `webhookSecret` to the browser. Must be excluded from client responses.
- [ ] **7. Metadata Blob Refactoring:** `business_facts.metadata` mixes public info and secrets. Separate into tables (e.g., `businesses`, `business_settings`, `business_secrets`, etc.).
- [ ] **8. Database Schema Inconsistencies:** `update_db_schema.sql` is out of sync with code (missing `metadata` definition) and contains corruption (NUL bytes `\x00` around line 121). Needs a clean rebuild of the migration.
- [ ] **9. Seed Data Safety:** `seed_auth_users.ts` contains production-unsafe demo credentials. Separate dev/test/prod seeding and block dev seeds in prod.
- [ ] **10. SSRF Risks:** Server fetches user-configured URLs (e.g. `externalApiUrl`, scrapers). Implement URL allowlists, HTTPS only, block private IPs, and set timeouts/size limits.
- [ ] **11. `/api/twilio/call` Abuse Risk:** Endpoint can trigger calls to arbitrary numbers. Requires business ownership check, rate limits, destination restrictions, and audit logs.
- [ ] **12. Prompt Injection:** External knowledge base data is injected directly into prompts. Strictly separate system rules from untrusted knowledge/input to prevent injection.
- [ ] **13. Server-side Permission Enforcement:** Permissions (like `bookAppointments`) only instruct the AI but don't prevent tool execution on the server. Server must not provide the tool definitions if permissions are false.
- [ ] **14. `update_lead` Race Condition:** Fetching the latest lead globally instead of linking via `call_id` causes wrong lead updates during parallel calls. Link `call_id -> lead_id` explicitly.
- [] **15. Remove all Demo credentials and dummy data in the seed_auth_users.ts file**
- [] ** 16. Add call cost calculation for all calls and send it to the database and display in hq **
- [] ** 17. Add proper auth for accounts. 
- [] ** 18. Add SMS integration for callbacks **
- [] ** 19. Add **