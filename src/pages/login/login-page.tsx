import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export const LoginPage: React.FC = () => {
    const { login, isLoading, currentUser } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        if (!isLoading && currentUser) {
            navigate('/', { replace: true });
        }
    }, [currentUser, isLoading, navigate]);

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setSubmitting(true);
            setError('');
            try {
                await login(username, password, { remember });
                navigate('/', { replace: true });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to login. Please try again.'
                );
            } finally {
                setSubmitting(false);
            }
        },
        [login, navigate, password, remember, username]
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
            <div className="w-full max-w-md rounded-lg bg-slate-900 p-8 shadow-xl">
                <h1 className="mb-6 text-center text-2xl font-semibold text-white">
                    Welcome to ChartDB
                </h1>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-200">
                            Username
                        </label>
                        <input
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            autoComplete="username"
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-200">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-200">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(event) =>
                                    setRemember(event.target.checked)
                                }
                                className="size-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                            />
                            Remember me
                        </label>
                    </div>
                    {error ? (
                        <p className="text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    ) : null}
                    <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                    >
                        {submitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
};
