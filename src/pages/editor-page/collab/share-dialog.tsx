import React, { useCallback, useState } from 'react';
import { useCollab } from '@/hooks/use-collab';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Check, Copy, Link2, LogOut } from 'lucide-react';
import { CollaboratorAvatars } from './collaborator-avatars';

export interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const {
        isCollaborating,
        startCollaboration,
        stopCollaboration,
        getShareableLink,
        collaborators,
        setUsername,
        username,
    } = useCollab();

    const [copied, setCopied] = useState(false);
    const [nameInput, setNameInput] = useState(username);
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = useCallback(async () => {
        setIsStarting(true);
        try {
            if (nameInput && nameInput !== username) {
                setUsername(nameInput);
            }
            await startCollaboration();
        } finally {
            setIsStarting(false);
        }
    }, [startCollaboration, setUsername, nameInput, username]);

    const handleStop = useCallback(() => {
        stopCollaboration(true);
        onOpenChange(false);
    }, [stopCollaboration, onOpenChange]);

    const handleCopyLink = useCallback(() => {
        const link = getShareableLink();
        if (link) {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [getShareableLink]);

    const handleNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setNameInput(e.target.value);
        },
        []
    );

    const handleNameBlur = useCallback(() => {
        if (nameInput && nameInput !== username) {
            setUsername(nameInput);
        }
    }, [nameInput, username, setUsername]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isCollaborating
                            ? 'Live Collaboration'
                            : 'Start Collaboration'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCollaborating
                            ? 'Share this link with others to collaborate in real-time.'
                            : 'Start a live collaboration session. Changes will be synced in real-time with all participants.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Your Name</label>
                        <Input
                            value={nameInput}
                            onChange={handleNameChange}
                            onBlur={handleNameBlur}
                            placeholder="Enter your name"
                        />
                    </div>

                    {isCollaborating && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Share Link
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={getShareableLink() ?? ''}
                                        className="flex-1 text-xs"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyLink}
                                    >
                                        {copied ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Copy className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <CollaboratorAvatars
                                collaborators={collaborators}
                            />
                        </>
                    )}
                </div>

                <DialogFooter>
                    {isCollaborating ? (
                        <Button
                            variant="destructive"
                            onClick={handleStop}
                            className="flex items-center gap-1.5"
                        >
                            <LogOut className="size-4" />
                            Stop Session
                        </Button>
                    ) : (
                        <Button
                            onClick={handleStart}
                            disabled={isStarting}
                            className="flex items-center gap-1.5"
                        >
                            <Link2 className="size-4" />
                            {isStarting ? 'Starting...' : 'Start Live Session'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
