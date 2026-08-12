# Student Attendance Platform

A secure attendance tracking website built with a Next.js frontend, Express backend, and PostgreSQL database via Prisma.

## Architecture

- Frontend: `frontend/` using Next.js and TypeScript.
- Backend: `backend/` using Express, TypeScript, and strong input validation.
- Database: PostgreSQL with Prisma ORM and parameterized queries.
- Auth: JWT tokens and bcrypt password hashing.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Update `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_API_URL`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
6. Start development servers:
   ```bash
   npm run dev
   ```

## Access from another device

If you want to open the app from a phone or another computer on the same network, make sure the server is listening on `0.0.0.0` and that Windows Firewall allows inbound traffic on port `3000`.

On Windows, you can allow it with:

```powershell
netsh advfirewall firewall add rule name="Attendance App" dir=in action=allow protocol=TCP localport=3000 profile=private
```

Then open the app at your computer's LAN IP, for example:

```text
http://192.168.1.117:3000/
```

## Production Notes

- Use environment variables for all secrets.
- Enable HTTPS in deployment.
- Add logging, monitoring, and rate limiting before production.
- Use a managed PostgreSQL service.
