# Database and Backend Rules

- **NO FIREBASE / NO FIRESTORE**: This project has completely migrated away from Firebase and Firestore. Do **NOT** suggest, implement, or configure Firebase, Firestore, or any Firebase-specific SDKs.
- **SUPABASE (POSTGRESQL) IS THE BACKEND**: All database operations must go through the existing Supabase setup. 
- **ADAPTER PATTERN**: The file `supabase-adapter.js` exposes a Firebase-like API (e.g., `getDocs`, `collection`, `doc`, `onSnapshot`), but under the hood, it connects strictly to our Supabase Postgres database. You must continue to use this adapter for data access so you don't break existing calls, but conceptually remember that the backend is Supabase, not Firebase.
