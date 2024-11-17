"use client";
// AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, getCurrentUser, createUserWithEmailAndPassword, signOutUser, isAuthenticated } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { sendEmailVerification, verifyEmailVerificationCode } from "../emailVerificationService";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error('Incorrect email or password');
      }
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already in use');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const sendVerificationEmail = async (email) => {
    try {
      await sendEmailVerification(email);
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  };

  const verifyCode = async (email, code) => {
    try {
      await verifyEmailVerificationCode(email, code);
    } catch (error) {
      console.error("Verification code error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, signInWithGoogle, signInWithEmail, registerWithEmail, 
      getCurrentUser, signOut, sendVerificationEmail, verifyCode, isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);