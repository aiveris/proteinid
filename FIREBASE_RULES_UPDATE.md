# Firebase Security Rules Update

## Problem
Error: `Missing or insufficient permissions` when trying to access `weight_logs` collection.

## Solution
Update Firestore Security Rules in Firebase Console.

## Steps:

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/proteinid-a1c04/firestore/rules
   ```

2. **Replace the current rules with:**

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

3. **Click "Publish"** to save the rules.

4. **Wait 1-2 minutes** for rules to propagate.

5. **Refresh your app** and try again.

## What these rules do:

- **Users collection**: Users can only read/write their own user document
- **Daily logs collection**: Users can only read/write logs where `user_id` matches their auth ID
- **Weight logs collection**: Users can only read/write weight logs where `user_id` matches their auth ID
