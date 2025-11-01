import React, { useEffect, useMemo, useState } from 'react';
import { useCollaboration } from '@/hooks/use-collaboration';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Button } from '@/components/button/button';
import { Avatar, AvatarFallback } from '@/components/avatar/avatar';
import { Input } from '@/components/input/input';
import { cn } from '@/lib/utils';
import { UsersRound } from 'lucide-react';

const MAX_VISIBLE_AVATARS = 3;

const getInitials = (name: string) => {
    if (!name) {
        return '?';
    }

    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

const getStatusLabel = (lastActive: number) => {
    const delta = Date.now() - lastActive;
    if (delta < 5000) {
        return 'Active now';
    }
    if (delta < 15000) {
        return 'Recently active';
    }
    return 'Away';
};

export const CollaborationPresence: React.FC = () => {
    const {
        participants,
        localParticipant,
        username,
        setUsername,
        isConnected,
        isSupported,
        connect,
        disconnect,
    } = useCollaboration();
    const [nameInput, setNameInput] = useState(username);

    useEffect(() => {
        setNameInput(username);
    }, [username]);

    const visibleParticipants = useMemo(
        () => participants.slice(0, MAX_VISIBLE_AVATARS),
        [participants]
    );

    const othersCount = Math.max(
        participants.length - visibleParticipants.length,
        0
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-2"
                >
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {visibleParticipants.map((participant) => (
                                <Avatar
                                    key={participant.id}
                                    className="size-7 border-2 border-background text-xs"
                                    style={{
                                        backgroundColor: participant.color,
                                    }}
                                >
                                    <AvatarFallback className="text-[11px] font-semibold text-white">
                                        {getInitials(participant.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {othersCount > 0 && (
                                <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[11px] font-semibold text-muted-foreground">
                                    +{othersCount}
                                </div>
                            )}
                        </div>
                        <div className="hidden flex-col items-start text-left sm:flex">
                            <span className="text-xs font-semibold">
                                {participants.length} online
                            </span>
                            <span
                                className={cn(
                                    'text-[10px] uppercase',
                                    isConnected
                                        ? 'text-emerald-500'
                                        : 'text-destructive'
                                )}
                            >
                                {isConnected ? 'Connected' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <UsersRound className="hidden size-4 text-muted-foreground sm:block" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" sideOffset={10} align="end">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold">
                            Live collaboration
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Share this diagram across open tabs to collaborate
                            in real time.
                        </p>
                    </div>
                    <span
                        className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-semibold uppercase',
                            isConnected
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-destructive/10 text-destructive'
                        )}
                    >
                        {isConnected ? 'Connected' : 'Offline'}
                    </span>
                </div>

                {!isSupported && (
                    <div className="mt-3 rounded-md border border-dashed border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                        Your browser does not support real-time collaboration.
                        Open ChartDB in a modern browser to collaborate across
                        tabs.
                    </div>
                )}

                <form
                    className="mt-4 flex items-center gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (nameInput.trim().length === 0) {
                            return;
                        }
                        setUsername(nameInput.trim());
                    }}
                >
                    <Input
                        value={nameInput}
                        onChange={(event) => setNameInput(event.target.value)}
                        placeholder="Display name"
                        aria-label="Update display name"
                    />
                    <Button type="submit" disabled={!isSupported}>
                        Save
                    </Button>
                </form>

                <div className="mt-4 space-y-2">
                    {participants.map((participant) => (
                        <div
                            key={participant.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <Avatar
                                    className="size-9 border border-border"
                                    style={{
                                        backgroundColor: participant.color,
                                    }}
                                >
                                    <AvatarFallback className="text-xs font-semibold text-white">
                                        {getInitials(participant.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {participant.name}
                                        {participant.isYou && ' (You)'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {participant.isYou
                                            ? 'Editing now'
                                            : getStatusLabel(
                                                  participant.lastActive
                                              )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    {isConnected ? (
                        <Button
                            variant="outline"
                            onClick={disconnect}
                            disabled={!isSupported}
                        >
                            Leave collaboration session
                        </Button>
                    ) : (
                        <Button onClick={connect} disabled={!isSupported}>
                            Rejoin collaboration session
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                        You are currently editing as
                        <span className="font-semibold">
                            {` ${localParticipant.name}`}.
                        </span>
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
};
