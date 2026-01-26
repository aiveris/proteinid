# 🔥 Firebase Setup Instructions

## Step 1: Get Firebase Web Config

### Method 1: Firebase Console (Easiest)

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/proteinid-a1c04/settings/general
   ```

2. **Scroll down to "Your apps"**

3. **If you don't have a Web app:**
   - Click "Add app" (</> icon)
   - Give it a nickname: "ProteinID React"
   - Click "Register app"
   - Copy the `firebaseConfig` object

4. **If you already have a Web app:**
   - Click the </> icon next to your web app
   - Copy the `firebaseConfig` object

5. **It looks like this:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "proteinid-a1c04.firebaseapp.com",
     projectId: "proteinid-a1c04",
     storageBucket: "proteinid-a1c04.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### Method 2: Create from scratch

If Firebase Console doesn't help, create it manually:

```javascript
{
  apiKey: "[FROM FIREBASE CONSOLE]",
  authDomain: "proteinid-a1c04.firebaseapp.com",
  projectId: "proteinid-a1c04",
  storageBucket: "proteinid-a1c04.firebasestorage.app",
  messagingSenderId: "[FROM FIREBASE CONSOLE]",
  appId: "[FROM FIREBASE CONSOLE]"
}
```

---

## Step 2: Create .env File

1. **In `proteinid-react/` folder, create `.env`:**

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=proteinid-a1c04.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proteinid-a1c04
VITE_FIREBASE_STORAGE_BUCKET=proteinid-a1c04.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

2. **Replace values** with your actual Firebase config values

---

## Step 3: Enable Authentication Methods

1. **Go to Authentication:**
   ```
   https://console.firebase.google.com/project/proteinid-a1c04/authentication/providers
   ```

2. **Enable Google Sign-In:**
   - Click "Google"
   - Toggle "Enable"
   - Add support email
   - Save

3. **Enable Email/Password:**
   - Click "Email/Password"
   - Toggle "Enable"
   - Save

4. **Add Authorized Domains:**
   - Click "Settings" tab
   - "Authorized domains"
   - Add:
     - `localhost` (already there)
     - Your Vercel domain (e.g., `proteinid-react.vercel.app`)
     - Your custom domain (e.g., `proteinid.uk`)

---

## Step 4: Firestore Database

### Check if database exists:

```
https://console.firebase.google.com/project/proteinid-a1c04/firestore
```

### If no database, create one:

1. Click "Create database"
2. Choose location: `europe-west1`
3. Start in **production mode**
4. Click "Enable"

### Add Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Daily logs collection
    match /daily_logs/{document} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Weight logs collection
    match /weight_logs/{document} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

---

## Step 5: Create Composite Index

The app needs a composite index for history queries.

### Automatic way (URL):

Click this link (replace project ID if needed):
```
https://console.firebase.google.com/project/proteinid-a1c04/firestore/indexes?create_composite=Clxwcm9qZWN0cy9wcm90ZWluaWQtYTFjMDQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2RhaWx5X2xvZ3MvaW5kZXhlcy9fEAEaCwoHdXNlcl9pZBABGggKBGRhdGUQAhoMCghfX25hbWVfXxAB
```

### Manual way:

1. Go to Firestore → Indexes
2. Click "Create Index"
3. Collection: `daily_logs`
4. Add fields:
   - `user_id` - Ascending
   - `date` - Descending
5. Query scope: Collection
6. Click "Create"

---

## Step 6: Test Locally

```bash
npm run dev
```

Visit: http://localhost:5173

Test:
- ✅ Register with email
- ✅ Sign in with Google
- ✅ Add foods
- ✅ View history
- ✅ Update profile

---

## 🚀 Ready to Deploy!

Once everything works locally, deploy to:
- **Vercel** (recommended)
- **Netlify**
- **Firebase Hosting**

See main README.md for deployment instructions.

---

## 🔍 Troubleshooting

### "Firebase: Firebase App named '[DEFAULT]' already exists"
- Reload the page

### "Missing or insufficient permissions"
- Check Firestore Security Rules
- Make sure you're signed in

### "The query requires an index"
- Click the link in error message
- Or manually create index (Step 5)

### Google Sign-In doesn't work
- Check authorized domains in Firebase Console
- Make sure your domain is added

---

**All set! Start building! 🎨**
