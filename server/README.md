# EWS Auth Server

This is a minimal Node.js + SQLite server to provide authentication for the Employee Work System demo.

Quick start:

1. Install dependencies

```bash
cd server
npm install
```

2. Start the server

```bash
npm start
```

The server runs on `http://localhost:3000` by default and creates an `ews.sqlite` file in the `server/` folder.

Sample users created on first run:
- admin@example.com / password: admin123 (role: Admin)
- amit@example.com / password: amit123 (role: Employee)

Endpoints:
- POST `/api/login` { email, password } => { token, user }
- GET `/api/profile` (requires `Authorization: Bearer <token>`) => { user }

The frontend `js/auth.js` has been updated to call `/api/login` and will fall back to the previous local demo behavior if the server is not running.
