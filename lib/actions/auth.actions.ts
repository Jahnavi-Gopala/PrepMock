'use server';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as clientAuth } from "@/firebase/client"; 
import { db, auth } from "@/firebase/admin";
import { cookies } from "next/headers";
// Only import client-side Firebase Auth in client-side code, not here

export  async function signUp(params: SignUpParams){
    const {uid, name, email} = params;
    try{
        const userRecord = await db.collection('users').doc(uid).get();
        if (userRecord.exists) {
            return {
                success: false,
                message: 'User already exists. Please Sign in instead.'
            }
        }
        await db.collection('users').doc(uid).set({
            name,
            email
        });

        return {
            success: true,
            message: 'User signed up successfully.'
        }

    }catch(error){
        console.error('Error during sign up:', error);

        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'auth/email-already-exists') {
            return {
                success: false,
                message: 'Email already exists. Please use a different email.'
            }
        }
        return {
            success: false,
            message: 'An error occurred during sign up. Please try again later.'
        }
    }
}

export  async function signIn(params: SignInParams){
    const {email, idToken} = params;
    try{
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord) {
            return {
                success: false,
                message: 'User not found. Please sign up first.'
            }
        }
        await setSessionCookie(idToken);
    }catch(error){
        console.error('Error during sign in:', error);
        return {
            success: false,
            message: 'An error occurred during sign in. Please try again later.'
        }
    }
}

export async function setSessionCookie(idToken:string) {
    const cookieStore  = await cookies();
    const sessionCookie = await auth.createSessionCookie(idToken, { 
        expiresIn: 60 * 60 * 24 * 7 * 1000 
    }); // 7 days

    cookieStore.set('session', sessionCookie, {
        maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    })
}

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // Ensure clientAuth is the client-side Firebase Auth instance
    const result = await signInWithPopup(clientAuth, provider);

    const user = result.user;
    console.log("Google User:", user);
    return user;
  } catch (error) {
    console.error("Google Sign-In Error", error);
    throw error;
  }
};

export async function getCurrentUser(): Promise<User | null>{
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userRecord = await db.collection('users').doc(decodedClaims.uid).get();

        if (!userRecord.exists) return null;
        
        return {
            ...userRecord.data(),
            id: userRecord.id,
        }as User;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        return null;
    }
}

export async function isAuthenticated(){
    const user = await getCurrentUser();
    return !!user;
}

export async function getInterviewByUserId(userId: string):Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    } as Interview));
}

export async function getLatestInterviews(params: GetLatestInterviewsParams):Promise<Interview[] | null> {
    const { userId, limit=20 } = params;
    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();
    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    } as Interview));
}