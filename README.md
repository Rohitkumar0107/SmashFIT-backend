# 🏸 SmashIt Backend

### _The Ultimate Badminton SaaS Engine_

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

---

## 🚀 Overview

**SmashIt** is a professional-grade backend built for managing badminton ecosystems. It handles everything from player identities to organization management with high-security standards.

---

## 🛠️ Setup & Run

To get the development environment running:

````bash
# Install dependencies
npm install

# Run server in development mode
npm run dev


Method,Endpoint,Auth,Description
POST,/api/auth/register,Public,New Email/Password registration
POST,/api/auth/login,Public,Standard login & session start
POST,/api/auth/google,Public,Google OAuth token exchange
POST,/api/auth/refresh,Public,Rotate expired Access Tokens

Method,Endpoint,Auth,Description
GET,/api/users/profile,Private,Get profile & assigned roles
PATCH,/api/users/update-role,Private,Upgrade to Player/Organization

src/
 ┣ 📂 config          # DB Connection & Google Client Config
 ┣ 📂 controllers     # Express Route Handlers
 ┣ 📂 middlewares     # JWT Auth & RBAC Checkers
 ┣ 📂 repositories    # Data Access Layer (Postgres SQL)
 ┣ 📂 services        # Core Business Logic (OAuth/JWT)
 ┣ 📂 utils           # Helpers (Bcrypt, Crypto, JWT)
 ┗ 📜 app.ts          # Express Entry Point

🏗️ Technical Highlights
OAuth 2.0 Integration: Full Google login support with automatic account linking.

---

## ✉️ Email / SMTP configuration
This project uses Gmail for outgoing mail via `nodemailer`. Two methods are supported:

1. **App password** (recommended)
   * Enable **2‑Step Verification** on your Gmail account.
   * Visit **Security → App passwords** and create one for "Mail".
   * Copy the 16‑character password into `.env` as `SMTP_PASS`.
   * Example `.env` fragment:
     ```ini
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=you@gmail.com
     SMTP_PASS=abcdefghijklmnop  # 16 chars
     ```

2. **OAuth2** (more secure, no app password required)
   * Create OAuth credentials in the Google Cloud console.
   * Run `npm run gen-oauth-token` (see below) to obtain a refresh token.
   * Add the token and client info to your `.env`:
     ```ini
     GOOGLE_OAUTH_CLIENT_ID=...
     GOOGLE_OAUTH_CLIENT_SECRET=...
     GOOGLE_OAUTH_REFRESH_TOKEN=...
     SMTP_USER=you@gmail.com
     ```

### Helper scripts
* `npm run gen-oauth-token` – interactive CLI that prints a URL and exchanges
  the resulting code for a refresh token.

### Testing
A convenient endpoint is available when the server is running:
````

GET /api/test-email

```
It sends a test message to `SMTP_USER` and returns success or error details.

With a valid app password or OAuth2 token in place the output during startup
should include:
```

SMTP USER: you@gmail.com
Password Length: 16
✅ SMTP ready

```

---

Role-Based Access Control (RBAC): Normalized many-to-many relationship for scalable user permissions.

Session Security: Advanced Refresh Token rotation using a dedicated database store.

Schema Design: Professional PostgreSQL architecture under the sm namespace.
```
