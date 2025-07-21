import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorage } from '@/hooks/use-storage.ts';
import { useChartDB } from '@/hooks/use-chartdb';
import { diagramSchema } from '@/lib/domain/diagram';
import LoadLogo from '@/assets/load.svg';
import SaveLogo from '@/assets/save.svg';
import HistoryLogo from '@/assets/history.svg';

type Version = {
    id: string;
    diagramId: string;
    version: number;
    inserted_at: string; // ISO 8601 format
};

export const DiagramSyncPanel = () => {
    const { loadDiagramFromData, currentDiagram } = useChartDB();

    const diagramId = 'pionv3';
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState<
        'latest' | string
    >('latest');
    const [loading, setLoading] = useState(false);

    const { addDiagram, updateDiagram, getDiagram } = useStorage();
    const navigate = useNavigate();

    const API_BASE =
        import.meta.env.MODE === 'development'
            ? 'http://localhost:4000/api/diagrams'
            : import.meta.env.VITE_API_BASE;

    const fetchVersions = async () => {
        fetch(`${API_BASE}/versions?diagramId=${diagramId}`)
            .then((res) => res.json())
            .then(setVersions)
            .catch((err) => console.error('Failed to load versions:', err));
    };

    useEffect(() => {
        fetchVersions();
    });

    const formatTime = (isoUtcString: string) => {
        return new Intl.DateTimeFormat('tr-TR', {
            timeZone: 'Europe/Istanbul',
            // year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            // second: '2-digit',
        }).format(new Date(isoUtcString + 'Z'));
    };

    const saveDiagram = async () => {
        if (!currentDiagram) return console.error('No diagram found to save');

        const diagram = { ...currentDiagram, id: 'pionv3' };

        setLoading(true);
        await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagram }),
        });
        await fetchVersions();
        setSelectedVersionId('latest');
        setLoading(false);
    };

    const loadDiagramFromServer = async () => {
        setLoading(true);
        const url =
            selectedVersionId === 'latest'
                ? `${API_BASE}?diagramId=${diagramId}`
                : `${API_BASE}/version/${selectedVersionId}`;

        const res = await fetch(url);
        const data = await res.json();

        const diagram = diagramSchema.parse({
            ...data.diagram,
            createdAt: new Date(data.diagram.createdAt),
            updatedAt: new Date(data.diagram.updatedAt),
        });

        diagram.id = 'pionv3'; // Ensure the diagram ID is set to 'pionv3'

        const existing = await getDiagram(diagram.id);

        if (existing) {
            await updateDiagram({
                id: 'pionv3',
                attributes: {
                    ...diagram,
                },
            });

            if (window.location.pathname.split('/').pop() !== 'pionv3') {
                navigate(`/diagrams/${diagram.id}`);
                loadDiagramFromData(diagram);
            } else {
                loadDiagramFromData(diagram);
            }
            setLoading(false);
        } else {
            await addDiagram({ diagram });
            console.log('navigating to new diagram', diagram.id);
            setLoading(false);
            navigate(`/diagrams/${diagram.id}`);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 1rem',
                height: '100%',
                paddingLeft: '26px',
            }}
        >
            <div style={{ position: 'relative' }}>
                <img
                    src={HistoryLogo}
                    style={{
                        position: 'absolute',
                        left: 8,
                        top: 8,
                        width: 16,
                        height: 16,
                        pointerEvents: 'none',
                        opacity: 0.7,
                    }}
                />
                <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    disabled={loading}
                    style={{
                        // appearance: 'none',
                        padding: '0.3rem 2rem 0.3rem 0.8rem',
                        borderRadius: '4px',
                        border: '1px solid #555',
                        backgroundColor: '#e5e5ea',
                        color: '#1a1a1a',
                        fontSize: '0.85rem',
                        minWidth: '140px',
                        height: '2rem',
                    }}
                >
                    <option value="latest">Latest</option>
                    {versions.map((v: Version) => (
                        <option key={v.id} value={v.id}>
                            {`v${v.version} — ${formatTime(v.inserted_at)}`}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={loadDiagramFromServer}
                disabled={loading}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    padding: '0 0.4rem',
                }}
            >
                <img
                    src={LoadLogo}
                    alt="Load"
                    style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: '0.85rem' }}>Load</span>
            </button>

            <button
                onClick={saveDiagram}
                disabled={loading}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    padding: '0 0.4rem',
                }}
            >
                <img
                    src={SaveLogo}
                    alt="Save"
                    style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: '0.85rem' }}>Save</span>
            </button>
        </div>
    );
};
