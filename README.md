# CAVERIS Web Dashboard

Next.js frontend for the CAVERIS biometric verification system. All API requests are handled by the .NET backend.

## Architecture

```
Next.js (Port 3000) → .NET API (Port 5000) → PostgreSQL (Supabase)
```

**No Next.js API routes** - All business logic is in the .NET backend.

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# - NEXT_PUBLIC_API_URL: .NET backend URL (default: http://localhost:5000)
# - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Backend Integration

See [BACKEND-INTEGRATION.md](./BACKEND-INTEGRATION.md) for detailed integration guide, including:

- API client usage
- Authentication flow
- Error handling
- TypeScript types
- Testing examples

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── super-admin/       # Super admin dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── api/              # .NET Backend API client
│   │   ├── index.ts      # Main export
│   │   ├── verification-api.ts  # Verification endpoints
│   │   └── auth-api.ts   # Authentication endpoints
│   ├── supabase/         # Supabase client (auth only)
│   │   ├── client.ts     # Browser client
│   │   └── server.ts     # Server client
│   └── utils.ts          # Utilities
```

## API Usage

### Import API Functions

```typescript
import { verifyFace, verifyFingerprint, healthCheck } from "@/lib/api";
```

### Example: Face Verification

```typescript
const result = await verifyFace({
  candidateId: "uuid",
  verifierId: "uuid",
  capturedImageBase64: "data:image/jpeg;base64,...",
  latitude: 28.7041,
  longitude: 77.1025,
  deviceId: "device-123",
});
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Backend API Documentation

- Swagger UI: http://localhost:5000/swagger
- Scalar UI: http://localhost:5000/scalar/v1

## Authentication

This app uses Supabase for authentication. The JWT token is automatically included in all API requests to the .NET backend.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Supabase Auth
- **State**: TanStack Query
- **Backend**: .NET 9 Web API
- **Database**: PostgreSQL (Supabase)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Backend Integration Guide](./BACKEND-INTEGRATION.md)
- [Project Documentation](../Documents/)

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

See [DEPLOYMENT-STEPS.md](./DEPLOYMENT-STEPS.md) for detailed deployment instructions.
