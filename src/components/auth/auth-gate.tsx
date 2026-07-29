import React, { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Button } from '@/components/button/button';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { Spinner } from '@/components/spinner/spinner';
import { isFirebaseConfigured } from '@/lib/firebase/firebase-config';
import {
    signInWithGoogle,
    signOutUser,
    onAuthChange,
    isEmailAllowed,
} from '@/lib/firebase/firebase-auth';

type AuthGateState = 'loading' | 'sign-in' | 'denied' | 'granted';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const isDarkSystemTheme = useMediaQuery({
        query: '(prefers-color-scheme: dark)',
    });
    const [state, setState] = useState<AuthGateState>(
        isFirebaseConfigured ? 'loading' : 'granted'
    );
    const [error, setError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        if (!isFirebaseConfigured) return;

        const unsubscribe = onAuthChange((user) => {
            if (!user) {
                setState('sign-in');
                setUserEmail(null);
                return;
            }

            const email = user.email;
            setUserEmail(email);
            if (isEmailAllowed(email)) {
                setState('granted');
            } else {
                setState('denied');
            }
        });

        return unsubscribe;
    }, []);

    const handleSignIn = async () => {
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        }
    };

    const handleSignOut = async () => {
        await signOutUser();
    };

    if (state === 'loading') {
        return (
            <div className="flex h-dvh w-dvw items-center justify-center bg-background">
                <Spinner />
            </div>
        );
    }

    if (state === 'granted') {
        return <>{children}</>;
    }

    const logo = isDarkSystemTheme ? ChartDBDarkLogo : ChartDBLogo;

    return (
        <div className="flex h-dvh w-dvw items-center justify-center bg-background p-4">
            <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border bg-card p-8 shadow-sm">
                <img src={logo} alt="ChartDB" className="h-6" />

                {state === 'sign-in' && (
                    <>
                        <p className="text-center text-sm text-muted-foreground">
                            Sign in with your @rome2rio.com Google account to
                            access ChartDB
                        </p>
                        <Button
                            variant="default"
                            size="lg"
                            onClick={handleSignIn}
                        >
                            <GoogleIcon />
                            Sign in with Google
                        </Button>
                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}
                    </>
                )}

                {state === 'denied' && (
                    <>
                        <p className="text-center text-sm text-muted-foreground">
                            Access denied. Only @rome2rio.com email addresses
                            are allowed.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Signed in as{' '}
                            <span className="font-medium">
                                {userEmail ?? 'unknown'}
                            </span>
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                        >
                            Sign out and try again
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

const GoogleIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);
