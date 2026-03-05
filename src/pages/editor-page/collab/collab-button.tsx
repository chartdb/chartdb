import React, { useState } from 'react';
import { useCollab } from '@/hooks/use-collab';
import { Button } from '@/components/button/button';
import { Users } from 'lucide-react';
import { ShareDialog } from './share-dialog';

export const CollabButton: React.FC = () => {
    const { isCollaborating, isConnected, collaborators } = useCollab();
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const otherCollaborators = Array.from(collaborators.values()).filter(
        (c) => !c.isCurrentUser
    );

    return (
        <>
            <Button
                variant={isCollaborating ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => setShareDialogOpen(true)}
            >
                <Users className="size-4" />
                <span className="hidden sm:inline">
                    {isCollaborating ? 'Live' : 'Collaborate'}
                </span>
                {isCollaborating && (
                    <span className="flex items-center gap-1">
                        <span
                            className={`size-2 rounded-full ${
                                isConnected ? 'bg-green-400' : 'bg-yellow-400'
                            }`}
                        />
                        {otherCollaborators.length > 0 && (
                            <span className="text-xs">
                                {otherCollaborators.length + 1}
                            </span>
                        )}
                    </span>
                )}
            </Button>
            <ShareDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
            />
        </>
    );
};
