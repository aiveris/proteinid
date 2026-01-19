# 🚀 ProteinID React SPA

Modern React SPA version of ProteinID protein tracking application.

## ✨ Features

- ✅ **React 18** with Vite
- ✅ **Firebase Auth** (Google OAuth + Email/Password)
- ✅ **Firebase Firestore** database
- ✅ **React Router** for navigation
- ✅ **Bootstrap 5** + React Bootstrap
- ✅ **Responsive design** - mobile-first
- ✅ **Quick select foods** with emoji icons
- ✅ **Real-time progress tracking**
- ✅ **History tracking**
- ✅ **User profiles** with goal calculation

---

## 🛠️ Setup Instructions

### 1. Firebase Configuration

1. **Get Firebase Web Config:**
   ```
   1. Go to: https://console.firebase.google.com/
   2. Select your project: proteinid-a1c04
   3. Click ⚙️ (Settings) → Project Settings
   4. Scroll to "Your apps" → Web app
   5. Copy the firebaseConfig object
   ```

2. **Create `.env` file:**
   ```bash
   # In proteinid-react folder
   cp .env.example .env
   ```

3. **Fill `.env` with your Firebase values:**
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=proteinid-a1c04.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=proteinid-a1c04
   VITE_FIREBASE_STORAGE_BUCKET=proteinid-a1c04.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

App will run at: **http://localhost:5173**

---

## 🚀 Deployment

### Option 1: Vercel (Recommended - FREE!)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Deploy to Vercel:**
   ```
   1. Go to: https://vercel.com
   2. Import GitHub repository
   3. Add environment variables (from .env)
   4. Click "Deploy"
   ```

3. **Auto-deploy on push:**
   - Every `git push` automatically deploys!

### Option 2: Netlify (FREE!)

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```
   1. Go to: https://netlify.com
   2. Drag & drop `dist/` folder
   OR
   3. Connect GitHub for auto-deploy
   ```

### Option 3: Firebase Hosting (FREE!)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login & Initialize:**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build & Deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📁 Project Structure

```
proteinid-react/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase initialization
│   ├── contexts/
│   │   └── AuthContext.jsx      # Auth state management
│   ├── components/
│   │   └── ProtectedRoute.jsx   # Route protection
│   ├── pages/
│   │   ├── Landing.jsx          # Landing page
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── History.jsx          # History view
│   │   └── Profile.jsx          # User profile
│   ├── data/
│   │   └── quickSelectFoods.js  # Food data
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables
├── package.json
└── vite.config.js
```

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🌐 Custom Domain Setup (proteinid.uk)

### Vercel:
```
1. Vercel Dashboard → Project Settings
2. Domains → Add Domain
3. Enter: proteinid.uk
4. Copy DNS records
5. Add to Cloudflare:
   - Type: CNAME
   - Name: @
   - Target: cname.vercel-dns.com
   - Proxy: OFF (grey cloud)
6. Wait 5-30 minutes
```

### Netlify:
```
1. Site Settings → Domain Management
2. Add custom domain: proteinid.uk
3. Add DNS records to Cloudflare:
   - Type: CNAME
   - Name: @
   - Target: [your-site].netlify.app
   - Proxy: OFF
```

---

## 🔥 Firebase Setup

### Enable Authentication:

```
1. Firebase Console → Authentication
2. Sign-in method
3. Enable: Google, Email/Password
4. Add authorized domains:
   - localhost
   - your-vercel-app.vercel.app
   - proteinid.uk
```

### Firestore Security Rules:

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
        request.resource.data.user_id == request.auth.uid;
    }
  }
}
```

---

## 📊 Comparison: Flask vs React

| Feature | Flask (Current) | React SPA (New) |
|---------|----------------|-----------------|
| **Deploy time** | 2 minutes | 30 seconds |
| **Deploy method** | Docker build | Git push |
| **Cost** | ~$5-10/month | **FREE** |
| **Speed** | Good | Faster (CDN) |
| **Complexity** | High | Low |
| **Updates** | Manual rebuild | Auto deploy |

---

## 🎯 Next Steps

1. ✅ Setup Firebase config (`.env`)
2. ✅ Run `npm run dev`
3. ✅ Test locally
4. ✅ Push to GitHub
5. ✅ Deploy to Vercel/Netlify
6. ✅ Add custom domain (proteinid.uk)
7. ✅ Configure Firebase authorized domains

---

## 💡 Tips

- **Fast refresh**: Changes show immediately in dev mode
- **No backend needed**: Firebase handles everything
- **Free hosting**: Vercel/Netlify generous free tiers
- **Auto HTTPS**: Automatic SSL certificates
- **Global CDN**: Fast worldwide

---

## 📞 Support

Issues? Check:
- Firebase Console for errors
- Browser console (F12)
- Firestore indexes (if query fails)

---

**Built with ❤️ using React + Firebase**
