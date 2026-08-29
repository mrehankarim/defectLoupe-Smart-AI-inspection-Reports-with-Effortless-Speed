---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Inspector
- Definition：A user who performs property inspections. An Inspector can be a solo individual operating independently or a member of an inspection agency (Company). Each Inspector is linked to one User account.
- Aliases：inspector、solo inspector、agency inspector

### Company
- Definition：An inspection agency profile that can own multiple Inspectors and Clients. A Company has an owner (a specific Inspector) who holds exclusive rights to add clients and manage inspectors within the company.
- Aliases：agency、inspection agency

### Client
- Definition：A property owner or home buyer who requested an inspection. Clients belong to either a Company (agency-managed) or are associated directly with a solo Inspector.
- Aliases：client、property owner

### InspectionArea
- Definition：A specific room or section of a property (e.g., Kitchen, Roof, Basement) that is inspected in a defined order during an Inspection.
- Aliases：area、inspection area、room

### AreaObservation
- Definition：A note attached to an InspectionArea or AreaPhoto, which can be typed text or recorded voice audio. Voice observations generate a corresponding Transcription record.
- Aliases：observation、note、voice observation

### Transcription
- Definition：Speech-to-text output generated from a voice AreaObservation, stored as a separate record linked back to the originating observation.
- Aliases：transcription、voice transcription、speech-to-text

### Refresh Token Rotation
- Definition：The security mechanism where each call to `/auth/refresh` invalidates the previously issued refresh token and issues a new access/refresh pair. Reuse of an already-used refresh token triggers theft detection and revocation of all sessions.
- Aliases：token rotation、refresh rotation、theft detection

### HTTP-only Secure Cookie
- Definition：The transport mechanism for JWTs: both access and refresh tokens are set as cookies flagged as HTTP-only and Secure so they cannot be accessed by JavaScript and are only sent over HTTPS connections.
- Aliases：secure cookie、http-only cookie、cookie auth
