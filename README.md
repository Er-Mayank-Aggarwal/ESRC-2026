# ESRC 2026 - Competition Management System

Welcome to the ESRC 2026 project repository! This is a comprehensive Next.js web application designed to manage team competitions, track daily tasks, distribute questions, and display real-time leaderboards. 

## Features

- **🏆 Real-time Leaderboard:** View live team rankings, scores, and rank changes.
- **🛡️ Secure Admin Panel:** Protected by Firebase Authentication (Email/Password), allowing authorized personnel to:
  - Add, edit, and safely delete daily questions.
  - Distribute questions to all registered teams.
  - Revoke distributions (with safe undo/redo workflows).
  - Manage custom holidays and competition schedules.
- **📚 API Documentation:** A conceptual Swagger UI page located at `/docs` detailing the database schema and operations.
- **🔥 Firebase Integration:** Uses Firestore for fast, scalable, real-time database operations directly from the client.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **API Docs:** Swagger UI React

## Getting Started

### 1. Environment Variables
Create a `.env.local` file in the root directory and add your Firebase configuration:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Security Rules
Ensure your Firestore Security Rules are set to securely allow authenticated writes and public reads:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true; 
      allow write: if request.auth != null; 
    }
  }
}
```
*Note: Make sure to enable Email/Password Authentication in your Firebase Console and manually create an Admin user.*

### 3. Running the Development Server

Install dependencies and start the local server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Application Structure

- **`/`** - Main dashboard / landing page.
- **`/leaderboard`** - Public facing team rankings.
- **`/admin`** - Admin dashboard for managing teams and scores.
- **`/admin/login`** - Firebase Authentication login page.
- **`/admin/questions`** - Manage daily questions and handle distributions/revocations.
- **`/docs`** - Swagger UI documenting the Firestore data model.
