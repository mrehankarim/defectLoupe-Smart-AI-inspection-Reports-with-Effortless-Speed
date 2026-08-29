---
kind: external_dependency
name: Argon2 password hashing via pwdlib
slug: pwdlib-argon2
category: external_dependency
category_hints:
    - auth_protocol
scope:
    - '**'
---

User passwords are hashed with Argon2 through the `pwdlib[argon2]` library. The hashing layer is encapsulated in `app/utils/password.py` and used by the registration and login flows in `app/services/auth_service.py`.