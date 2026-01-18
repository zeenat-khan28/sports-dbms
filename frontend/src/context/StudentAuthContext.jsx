/**
 * Student authentication context using Firebase.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import firebaseConfig from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Restrict to rvce.edu.in domain
googleProvider.setCustomParameters({
    hd: 'rvce.edu.in'  // Hosted domain restriction
});

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
    const [student, setStudent] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Verify domain
                if (!user.email?.endsWith('@rvce.edu.in')) {
                    await signOut(auth);
                    setStudent(null);
                    setToken(null);
                    alert('Only @rvce.edu.in emails are allowed.');
                } else {
                    setStudent({
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName,
                        picture: user.photoURL
                    });
                    const idToken = await user.getIdToken();
                    setToken(idToken);
                }
            } else {
                setStudent(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Double check domain
            if (!user.email?.endsWith('@rvce.edu.in')) {
                await signOut(auth);
                throw new Error('Only @rvce.edu.in emails are allowed');
            }

            const idToken = await user.getIdToken();
            return idToken;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setStudent(null);
        setToken(null);
    };

    const getToken = async () => {
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
        return null;
    };

    return (
        <StudentAuthContext.Provider value={{
            student,
            token,
            loading,
            login,
            logout,
            getToken,
            isAuthenticated: !!student
        }}>
            {children}
        </StudentAuthContext.Provider>
    );
}

export function useStudentAuth() {
    const context = useContext(StudentAuthContext);
    if (!context) {
        throw new Error('useStudentAuth must be used within StudentAuthProvider');
    }
    return context;
}
