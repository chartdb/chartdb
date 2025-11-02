import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface BrandingSettings {
    title: string;
    accent: string;
    logoUrl?: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
    title: 'ChartDB',
    accent: '#2563eb',
};

const BRANDING_STORAGE_KEY = 'chartdb.branding';

const NavButton: React.FC<React.PropsWithChildren<{ to: string }>> = ({
    to,
    children,
}) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
        }
        end
    >
        {children}
    </NavLink>
);

interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (params: { current: string; next: string }) => Promise<void>;
    title: string;
    description: string;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
    open,
    onClose,
    onSubmit,
    title,
    description,
}) => {
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setCurrent('');
            setPassword('');
            setConfirm('');
            setError('');
        }
    }, [open]);

    if (!open) return null;

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!current) {
            setError('Current password is required');
            return;
        }
        if (!password) {
            setError('New password is required');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        try {
            await onSubmit({ current, next: password });
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Unable to update password'
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <form
                onSubmit={submit}
                className="w-full max-w-md rounded-lg bg-slate-900 p-6 shadow-xl"
            >
                <h2 className="mb-2 text-xl font-semibold text-white">
                    {title}
                </h2>
                <p className="mb-4 text-sm text-slate-300">{description}</p>
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            Current password
                        </label>
                        <input
                            type="password"
                            value={current}
                            onChange={(event) => setCurrent(event.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            New password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    {error ? (
                        <p className="text-sm text-red-400">{error}</p>
                    ) : null}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-md px-4 py-2 text-sm text-slate-300 hover:text-white"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                        >
                            Save password
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const ForcePasswordDialog: React.FC<{
    open: boolean;
    onSubmit: (password: string) => Promise<void>;
    title: string;
    description: string;
}> = ({ open, onSubmit, title, description }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setPassword('');
            setConfirm('');
            setError('');
        }
    }, [open]);

    if (!open) return null;

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!password) {
            setError('Password is required');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        try {
            await onSubmit(password);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Unable to update password'
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <form
                className="w-full max-w-md rounded-lg bg-slate-900 p-6 shadow-xl"
                onSubmit={submit}
            >
                <h2 className="mb-2 text-xl font-semibold text-white">
                    {title}
                </h2>
                <p className="mb-4 text-sm text-slate-300">{description}</p>
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            New password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                    {error ? (
                        <p className="text-sm text-red-400">{error}</p>
                    ) : null}
                    <div className="flex justify-end gap-2">
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                        >
                            Save password
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const BrandingDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    branding: BrandingSettings;
    onSave: (branding: BrandingSettings) => void;
}> = ({ open, onClose, branding, onSave }) => {
    const [formState, setFormState] = useState(branding);

    useEffect(() => {
        if (open) {
            setFormState(branding);
        }
    }, [branding, open]);

    if (!open) return null;

    const updateField =
        (field: keyof BrandingSettings) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setFormState((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(formState);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
            <form
                className="w-full max-w-lg rounded-lg bg-slate-900 p-6 shadow-xl"
                onSubmit={submit}
            >
                <h2 className="mb-4 text-lg font-semibold text-white">
                    Customize brand
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            Title
                        </label>
                        <input
                            value={formState.title}
                            onChange={updateField('title')}
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            Accent color
                        </label>
                        <input
                            type="color"
                            value={formState.accent}
                            onChange={updateField('accent')}
                            className="h-10 w-full rounded-md border border-slate-700 bg-slate-800"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-slate-300">
                            Logo URL (optional)
                        </label>
                        <input
                            value={formState.logoUrl ?? ''}
                            onChange={updateField('logoUrl')}
                            placeholder="https://example.com/logo.png"
                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-md px-4 py-2 text-sm text-slate-300 hover:text-white"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

const navItems = [
    { label: 'My Diagrams', path: '/diagrams' },
    { label: 'Shared with Me', path: '/shared' },
];

export const AppShell: React.FC = () => {
    const {
        currentUser,
        logout,
        mustChangePassword,
        completeForcedPasswordChange,
        changePassword,
    } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [branding, setBranding] =
        useState<BrandingSettings>(DEFAULT_BRANDING);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [brandingOpen, setBrandingOpen] = useState(false);

    const currentUserId = currentUser?.id;

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        if (!currentUserId) {
            setBranding(DEFAULT_BRANDING);
            return;
        }
        const key = `${BRANDING_STORAGE_KEY}.${currentUserId}`;
        const fallbackKey = BRANDING_STORAGE_KEY;
        const raw =
            window.localStorage.getItem(key) ??
            window.localStorage.getItem(fallbackKey);
        if (raw) {
            try {
                setBranding({ ...DEFAULT_BRANDING, ...JSON.parse(raw) });
            } catch (error) {
                console.warn('Unable to parse branding config', error);
                setBranding(DEFAULT_BRANDING);
            }
        } else {
            setBranding(DEFAULT_BRANDING);
        }
    }, [currentUserId]);

    const saveBranding = useCallback(
        (settings: BrandingSettings) => {
            setBranding(settings);
            if (typeof window !== 'undefined') {
                const key = currentUserId
                    ? `${BRANDING_STORAGE_KEY}.${currentUserId}`
                    : BRANDING_STORAGE_KEY;
                window.localStorage.setItem(key, JSON.stringify(settings));
            }
        },
        [currentUserId]
    );

    const isAdmin = currentUser?.role === 'admin';

    const sidebarItems = useMemo(() => {
        const items = [...navItems];
        if (isAdmin) {
            items.push({ label: 'User Management', path: '/users' });
            items.push({ label: 'Audit Logs', path: '/audit-logs' });
        }
        return items;
    }, [isAdmin]);

    useEffect(() => {
        if (currentUser && location.pathname === '/') {
            navigate('/diagrams', { replace: true });
        }
    }, [currentUser, location.pathname, navigate]);

    if (!currentUser) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200">
            <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/80 p-4 md:flex">
                <div className="flex items-center gap-3 px-2 pb-6">
                    {branding.logoUrl ? (
                        <img
                            src={branding.logoUrl}
                            alt="Brand logo"
                            className="size-10 rounded-md object-cover"
                        />
                    ) : (
                        <div
                            className="flex size-10 items-center justify-center rounded-md text-xl font-semibold text-white"
                            style={{ backgroundColor: branding.accent }}
                        >
                            {branding.title.slice(0, 1).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg font-semibold text-white">
                            {branding.title}
                        </h1>
                        <p className="text-xs text-slate-400">
                            Diagram workspace
                        </p>
                    </div>
                </div>
                <nav className="flex flex-1 flex-col gap-1">
                    {sidebarItems.map((item) => (
                        <NavButton key={item.path} to={item.path}>
                            {item.label}
                        </NavButton>
                    ))}
                </nav>
                <button
                    type="button"
                    onClick={() => setBrandingOpen(true)}
                    className="mt-auto rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                    Customize brand
                </button>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div className="flex items-center gap-3 md:hidden">
                        <span className="text-lg font-semibold text-white">
                            {branding.title}
                        </span>
                    </div>
                    <div className="flex flex-1 justify-end gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                                {currentUser.displayName}
                            </p>
                            <p className="text-xs text-slate-400">
                                {currentUser.role}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-blue-500 hover:text-white"
                                onClick={() => setChangePasswordOpen(true)}
                            >
                                Change password
                            </button>
                            <button
                                type="button"
                                className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-400"
                                onClick={() => {
                                    void logout().then(() =>
                                        navigate('/login')
                                    );
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
                    <Outlet />
                </main>
            </div>
            <BrandingDialog
                open={brandingOpen}
                onClose={() => setBrandingOpen(false)}
                branding={branding}
                onSave={saveBranding}
            />
            <ChangePasswordDialog
                open={changePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
                onSubmit={({ current, next }) => changePassword(current, next)}
                title="Change password"
                description="Update your account password."
            />
            <ForcePasswordDialog
                open={mustChangePassword}
                onSubmit={completeForcedPasswordChange}
                title="Change your temporary password"
                description="A new password is required before accessing the workspace."
            />
        </div>
    );
};
