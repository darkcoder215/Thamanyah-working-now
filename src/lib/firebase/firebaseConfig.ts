// Firebase configuration file
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"
import { Auth, getAuth } from "firebase/auth"

// Check if auth bypass is enabled
const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "bypass-api-key",
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bypass.firebaseapp.com",
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bypass-project",
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bypass.appspot.com",
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123",
}

// Initialize Firebase only if not in bypass mode
let app: FirebaseApp | null
let auth: Auth | null

if (bypassAuth) {
	console.log("Firebase bypass mode enabled - skipping initialization")
	// Set to null in bypass mode
	app = null
	auth = null
} else {
	app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
	auth = getAuth(app)
}

export { app, auth }
