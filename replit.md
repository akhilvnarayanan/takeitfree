# TakeItFree - Community Item Sharing App

## Overview

TakeItFree is a mobile-first application that allows users to give away items for free to nearby community members. It follows a Carousell-like marketplace model but exclusively for free items, enabling local reuse and trust-based sharing. Users can post items they want to give away, browse available items, request items, and communicate via in-app chat.

The app is built as an Expo (React Native) application with an Express backend server. Currently, the frontend uses AsyncStorage for local data persistence, with a PostgreSQL database configured via Drizzle ORM on the server side (though not yet fully integrated).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: expo-router v6 with file-based routing and typed routes
- **State Management**: React Context (AuthContext) for authentication state, React Query (@tanstack/react-query) for server state management (configured but not heavily used yet since data is local)
- **Local Data Storage**: AsyncStorage is used as the primary data store on the client side. The `lib/storage.ts` file contains all data models, CRUD operations, and seed data — essentially acting as an in-memory/local database
- **UI**: Custom components using React Native's built-in primitives, Ionicons for icons, Inter font family via expo-google-fonts. No external UI library
- **Key Libraries**: expo-image-picker (photos), expo-location, expo-haptics, react-native-gesture-handler, react-native-reanimated, react-native-keyboard-controller

### App Structure (File-based Routing)

```
app/
├── _layout.tsx          # Root layout with auth guards, providers
├── +not-found.tsx       # 404 screen
├── +native-intent.tsx   # Deep link handling
├── (tabs)/              # Main tab navigation
│   ├── index.tsx        # Home - browse items with search & category filters
│   ├── create.tsx       # Create new item listing
│   ├── chats.tsx        # Conversations list
│   └── profile.tsx      # User profile & their listings
├── auth/                # Authentication screens
│   ├── login.tsx        # Email + password login
│   └── register.tsx     # Registration with name, email, password, location
├── item/
│   ├── [id].tsx         # Item detail view
│   ├── edit/[id].tsx    # Edit item listing
│   └── requests/[id].tsx # View/manage requests for an item
├── chat/
│   └── [requestId].tsx  # Chat conversation screen
└── user/
    └── [id].tsx         # Other user's profile
```

### Backend (Express Server)

- **Framework**: Express v5 running on Node.js
- **Server Entry**: `server/index.ts` — sets up CORS, JSON parsing, static file serving, and routes
- **Routes**: `server/routes.ts` — currently minimal, placeholder for API routes prefixed with `/api`
- **Storage Layer**: `server/storage.ts` — uses in-memory Map storage (MemStorage class) implementing an IStorage interface. This is designed to be swapped with a database-backed implementation
- **Database Schema**: `shared/schema.ts` — Drizzle ORM schema with PostgreSQL dialect. Currently only has a `users` table with id, username, and password. The schema is minimal and doesn't yet match the full data model in the client-side `lib/storage.ts`
- **Build**: Server is bundled with esbuild for production (`server_dist/`)

### Data Models (Client-Side in lib/storage.ts)

The client-side storage defines the complete data model:
- **User**: id, name, email, password, profilePhoto, location, reputationScore, itemsGivenCount, itemsReceivedCount, blockedUsers
- **Item**: id, userId, title, description, category (10 types), condition (4 levels), status (available/reserved/given_away), images, pickupArea, timestamps
- **ItemRequest**: id, itemId, requesterId, message, status (pending/accepted/rejected), timestamps
- **ChatMessage**: id, requestId, senderId, text, timestamp, read status

### Authentication

- Client-side email + password authentication using AsyncStorage
- AuthContext wraps the entire app and handles login/register/logout
- Route protection via expo-router segments — unauthenticated users are redirected to `/auth/login`
- No server-side auth is implemented yet

### Key Architectural Decisions

1. **Local-first with AsyncStorage**: All data operations happen client-side. This was chosen for rapid prototyping but should be migrated to server-side API calls with the PostgreSQL database
2. **Drizzle ORM configured but underutilized**: The server has Drizzle set up with PostgreSQL (`drizzle.config.ts`, `shared/schema.ts`) but the schema only has a basic users table. The full data model from `lib/storage.ts` needs to be migrated to Drizzle schema
3. **IStorage interface pattern**: The server uses an interface-based storage pattern making it easy to swap MemStorage for a DatabaseStorage implementation
4. **Shared schema directory**: `shared/` contains code shared between client and server (Drizzle schemas, Zod validation)
5. **Seed data**: The app seeds demo data on first load for testing purposes

### Development & Build

- **Dev mode**: Runs Expo dev server + Express server concurrently. Expo proxies through Replit's dev domain
- **Production build**: Static web export via custom `scripts/build.js`, server bundled with esbuild
- **Database migrations**: `drizzle-kit push` for schema changes
- **Path aliases**: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

## External Dependencies

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable. Drizzle ORM + drizzle-kit for schema management and migrations. The `migrations/` directory stores generated migration files

### Key NPM Packages
- **expo** (~54.0.27): Core framework for cross-platform mobile development
- **express** (^5.0.1): Backend HTTP server
- **drizzle-orm** (^0.39.3) + **drizzle-zod** (^0.7.0): Database ORM with Zod schema validation
- **pg** (^8.16.3): PostgreSQL client driver
- **@tanstack/react-query** (^5.83.0): Async state management for API calls
- **@react-native-async-storage/async-storage** (2.2.0): Local key-value storage
- **expo-image-picker** (~17.0.9): Camera/gallery image selection
- **expo-location** (~19.0.8): Geolocation services
- **zod**: Runtime schema validation (used by drizzle-zod)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for server/drizzle)
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests from the client
- `REPLIT_DEV_DOMAIN`: Replit development domain (auto-set by Replit)
- `REPLIT_DOMAINS`: Comma-separated list of allowed domains for CORS
- `REPLIT_INTERNAL_APP_DOMAIN`: Deployment domain for production builds

### Platform Support
- **iOS**: Bundle identifier `com.takeitfree`, tablet support disabled
- **Android**: Package `com.takeitfree`, adaptive icon configured
- **Web**: Supported via react-native-web, static export for deployment