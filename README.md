# 🏸 SmashIt Backend
### *The Ultimate Badminton SaaS Engine*

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

```bash
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

Role-Based Access Control (RBAC): Normalized many-to-many relationship for scalable user permissions.

Session Security: Advanced Refresh Token rotation using a dedicated database store.

Schema Design: Professional PostgreSQL architecture under the sm namespace.
