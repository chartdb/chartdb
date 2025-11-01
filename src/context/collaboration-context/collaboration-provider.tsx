import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { collaborationContext } from './collaboration-context';
import { useChartDB } from '@/hooks/use-chartdb';
import type { Diagram } from '@/lib/domain/diagram';
import { generateId } from '@/lib/utils';

interface ParticipantPayload {
    id: string;
    name: string;
    color: string;
    lastActive: number;
}

interface BaseMessage {
    sessionId: string;
    senderId: string;
}

type CollaborationMessage =
    | (BaseMessage & { type: 'user-join'; user: ParticipantPayload })
    | (BaseMessage & { type: 'user-update'; user: ParticipantPayload })
    | (BaseMessage & { type: 'presence'; user: ParticipantPayload })
    | (BaseMessage & { type: 'user-leave'; userId: string })
    | (BaseMessage & { type: 'sync-request'; requestId: string })
    | (BaseMessage & {
          type: 'diagram-sync';
          diagram: SerializedDiagram;
          requestId?: string;
          user?: ParticipantPayload;
      });

type OutgoingMessage =
    | { type: 'user-join'; user: ParticipantPayload }
    | { type: 'user-update'; user: ParticipantPayload }
    | { type: 'presence'; user: ParticipantPayload }
    | { type: 'user-leave'; userId: string }
    | { type: 'sync-request'; requestId: string }
    | {
          type: 'diagram-sync';
          diagram: SerializedDiagram;
          requestId?: string;
          user?: ParticipantPayload;
      };

interface SerializedDiagram extends Omit<Diagram, 'createdAt' | 'updatedAt'> {
    createdAt: string;
    updatedAt: string;
}

const USERNAME_STORAGE_KEY = 'chartdb.collaboration.displayName';
const HEARTBEAT_INTERVAL_MS = 5000;
const STALE_PARTICIPANT_AFTER_MS = 15000;
const PARTICIPANT_COLORS = [
    '#2563eb',
    '#10b981',
    '#f97316',
    '#ec4899',
    '#6366f1',
    '#0ea5e9',
    '#f59e0b',
    '#a855f7',
];

const supportsBroadcastChannel =
    typeof window !== 'undefined' && 'BroadcastChannel' in window;

const stringToColor = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PARTICIPANT_COLORS.length;
    return PARTICIPANT_COLORS[index];
};

const serializeDiagram = (diagram: Diagram): SerializedDiagram => ({
    ...diagram,
    createdAt: diagram.createdAt.toISOString(),
    updatedAt: diagram.updatedAt.toISOString(),
});

const deserializeDiagram = (diagram: SerializedDiagram): Diagram => ({
    ...diagram,
    createdAt: new Date(diagram.createdAt),
    updatedAt: new Date(diagram.updatedAt),
});

export const CollaborationProvider: React.FC<PropsWithChildren> = ({
    children,
}) => {
    const { diagramId, currentDiagram, updateDiagramData } = useChartDB();
    const [remoteParticipants, setRemoteParticipants] = useState<
        ParticipantPayload[]
    >([]);
    const [isConnected, setIsConnected] = useState(false);
    const [manuallyDisconnected, setManuallyDisconnected] = useState(false);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const handleMessageRef = useRef<(message: CollaborationMessage) => void>();
    const userIdRef = useRef<string>(generateId());
    const colorRef = useRef<string>(stringToColor(userIdRef.current));
    const requestIdRef = useRef<string>('');
    const [username, setUsernameState] = useState(() => {
        if (typeof window === 'undefined') {
            return '';
        }
        return (
            window.localStorage.getItem(USERNAME_STORAGE_KEY) ||
            `Guest ${Math.floor(Math.random() * 999)}`
        );
    });
    const usernameRef = useRef(username);
    const lastDiagramVersionRef = useRef<number>(
        currentDiagram.updatedAt?.getTime?.() ?? Date.now()
    );
    const isApplyingRemoteRef = useRef(false);

    const sessionId = useMemo(() => diagramId || 'default', [diagramId]);

    useEffect(() => {
        usernameRef.current = username;
    }, [username]);

    useEffect(() => {
        lastDiagramVersionRef.current =
            currentDiagram.updatedAt?.getTime?.() ?? Date.now();
    }, [currentDiagram.updatedAt, sessionId]);

    const updateParticipant = useCallback((participant: ParticipantPayload) => {
        setRemoteParticipants((prev) => {
            const filtered = prev.filter((p) => p.id !== participant.id);
            return [...filtered, participant];
        });
    }, []);

    const removeParticipant = useCallback((participantId: string) => {
        setRemoteParticipants((prev) =>
            prev.filter((participant) => participant.id !== participantId)
        );
    }, []);

    const postMessage = useCallback(
        (message: OutgoingMessage) => {
            const channel = channelRef.current;
            if (!channel || !supportsBroadcastChannel) {
                return;
            }

            channel.postMessage({
                ...message,
                sessionId,
                senderId: userIdRef.current,
            } as CollaborationMessage);
        },
        [sessionId]
    );

    const sendPresence = useCallback(() => {
        const now = Date.now();
        postMessage({
            type: 'presence',
            user: {
                id: userIdRef.current,
                name: usernameRef.current,
                color: colorRef.current,
                lastActive: now,
            },
        });
    }, [postMessage]);

    const broadcastDiagram = useCallback(
        (diagram: Diagram, requestId?: string) => {
            if (!supportsBroadcastChannel) {
                return;
            }

            postMessage({
                type: 'diagram-sync',
                diagram: serializeDiagram(diagram),
                requestId,
                user: {
                    id: userIdRef.current,
                    name: usernameRef.current,
                    color: colorRef.current,
                    lastActive: Date.now(),
                },
            });
        },
        [postMessage]
    );

    const applyRemoteDiagram = useCallback(
        async (serializedDiagram: SerializedDiagram) => {
            const diagram = deserializeDiagram(serializedDiagram);
            const updatedAt = diagram.updatedAt.getTime();

            if (updatedAt <= lastDiagramVersionRef.current) {
                return;
            }

            isApplyingRemoteRef.current = true;
            lastDiagramVersionRef.current = updatedAt;
            try {
                await updateDiagramData(diagram, { forceUpdateStorage: true });
            } finally {
                isApplyingRemoteRef.current = false;
            }
        },
        [updateDiagramData]
    );

    const handleMessage = useCallback(
        (message: CollaborationMessage) => {
            if (
                message.sessionId !== sessionId ||
                message.senderId === userIdRef.current
            ) {
                return;
            }

            switch (message.type) {
                case 'user-join':
                    updateParticipant({
                        ...message.user,
                        lastActive: Date.now(),
                    });
                    postMessage({
                        type: 'user-update',
                        user: {
                            id: userIdRef.current,
                            name: usernameRef.current,
                            color: colorRef.current,
                            lastActive: Date.now(),
                        },
                    });
                    break;
                case 'user-update':
                case 'presence':
                    updateParticipant({
                        ...message.user,
                        lastActive: Date.now(),
                    });
                    break;
                case 'user-leave':
                    removeParticipant(message.userId);
                    break;
                case 'sync-request':
                    broadcastDiagram(currentDiagram, message.requestId);
                    break;
                case 'diagram-sync':
                    if (message.user) {
                        updateParticipant({
                            ...message.user,
                            lastActive: Date.now(),
                        });
                    } else {
                        updateParticipant({
                            id: message.senderId,
                            name:
                                remoteParticipants.find(
                                    (participant) =>
                                        participant.id === message.senderId
                                )?.name || 'Collaborator',
                            color:
                                remoteParticipants.find(
                                    (participant) =>
                                        participant.id === message.senderId
                                )?.color || stringToColor(message.senderId),
                            lastActive: Date.now(),
                        });
                    }
                    void applyRemoteDiagram(message.diagram);
                    break;
                default:
                    break;
            }
        },
        [
            sessionId,
            updateParticipant,
            removeParticipant,
            broadcastDiagram,
            currentDiagram,
            applyRemoteDiagram,
            remoteParticipants,
            postMessage,
        ]
    );

    useEffect(() => {
        handleMessageRef.current = handleMessage;
    }, [handleMessage]);

    useEffect(() => {
        const userId = userIdRef.current;

        if (!supportsBroadcastChannel) {
            setIsConnected(false);
            return;
        }

        if (manuallyDisconnected) {
            setIsConnected(false);
            if (channelRef.current) {
                postMessage({ type: 'user-leave', userId });
                channelRef.current.close();
                channelRef.current = null;
            }
            setRemoteParticipants([]);
            return;
        }

        const channelName = `chartdb-collaboration-${sessionId}`;
        const channel = new BroadcastChannel(channelName);
        channelRef.current = channel;
        setRemoteParticipants([]);
        setIsConnected(true);

        channel.onmessage = (event: MessageEvent<CollaborationMessage>) => {
            handleMessageRef.current?.(event.data);
        };

        const joinPayload: ParticipantPayload = {
            id: userId,
            name: usernameRef.current,
            color: colorRef.current,
            lastActive: Date.now(),
        };

        channel.postMessage({
            type: 'user-join',
            user: joinPayload,
            sessionId,
            senderId: userId,
        } satisfies CollaborationMessage);

        requestIdRef.current = generateId();
        channel.postMessage({
            type: 'sync-request',
            requestId: requestIdRef.current,
            sessionId,
            senderId: userId,
        } satisfies CollaborationMessage);

        sendPresence();

        return () => {
            channel.postMessage({
                type: 'user-leave',
                userId,
                sessionId,
                senderId: userId,
            } satisfies CollaborationMessage);
            channel.close();
            channelRef.current = null;
            setIsConnected(false);
        };
    }, [sessionId, manuallyDisconnected, sendPresence, postMessage]);

    useEffect(() => {
        if (!supportsBroadcastChannel || !isConnected) {
            return;
        }

        const interval = window.setInterval(() => {
            sendPresence();
            setRemoteParticipants((prev) => {
                const now = Date.now();
                return prev.filter(
                    (participant) =>
                        now - participant.lastActive <=
                        STALE_PARTICIPANT_AFTER_MS
                );
            });
        }, HEARTBEAT_INTERVAL_MS);

        return () => window.clearInterval(interval);
    }, [isConnected, sendPresence]);

    const diagramUpdatedAt = currentDiagram.updatedAt?.getTime?.() ?? 0;

    useEffect(() => {
        if (!supportsBroadcastChannel || !isConnected) {
            return;
        }

        if (isApplyingRemoteRef.current) {
            return;
        }

        if (!diagramUpdatedAt) {
            return;
        }

        if (diagramUpdatedAt === lastDiagramVersionRef.current) {
            return;
        }

        lastDiagramVersionRef.current = diagramUpdatedAt;
        broadcastDiagram(currentDiagram);
    }, [broadcastDiagram, currentDiagram, diagramUpdatedAt, isConnected]);

    const setUsername = useCallback(
        (name: string) => {
            setUsernameState(name);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(USERNAME_STORAGE_KEY, name);
            }
            postMessage({
                type: 'user-update',
                user: {
                    id: userIdRef.current,
                    name,
                    color: colorRef.current,
                    lastActive: Date.now(),
                },
            });
        },
        [postMessage]
    );

    const connect = useCallback(() => {
        setManuallyDisconnected(false);
    }, []);

    const disconnect = useCallback(() => {
        setManuallyDisconnected(true);
    }, []);

    const participants = useMemo(() => {
        const others = remoteParticipants
            .filter((participant) => participant.id !== userIdRef.current)
            .sort((a, b) => b.lastActive - a.lastActive);

        return [
            {
                id: userIdRef.current,
                name: username,
                color: colorRef.current,
                lastActive: Date.now(),
                isYou: true,
            },
            ...others,
        ];
    }, [remoteParticipants, username]);

    const localParticipant = participants[0];

    const value = useMemo(
        () => ({
            sessionId,
            userId: userIdRef.current,
            username,
            participants,
            localParticipant,
            isConnected: isConnected && supportsBroadcastChannel,
            isSupported: supportsBroadcastChannel,
            setUsername,
            connect,
            disconnect,
        }),
        [
            connect,
            disconnect,
            isConnected,
            localParticipant,
            participants,
            sessionId,
            setUsername,
            username,
        ]
    );

    return (
        <collaborationContext.Provider value={value}>
            {children}
        </collaborationContext.Provider>
    );
};
