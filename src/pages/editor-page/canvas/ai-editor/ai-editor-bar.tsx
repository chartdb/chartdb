import React, { useCallback, useRef, useState } from 'react';
import { Check, Loader2, Sparkles, Undo2, X } from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDiff } from '@/context/diff-context/use-diff';
import { useToast } from '@/components/toast/use-toast';
import { Button } from '@/components/button/button';
import { editDiagramWithAI } from '@/lib/ai/edit-diagram';
import { describeLLMError } from '@/lib/ai/llm-client';
import type { Diagram } from '@/lib/domain/diagram';

export interface AIEditorBarProps {}

export const AIEditorBar: React.FC<AIEditorBarProps> = () => {
    const { currentDiagram, updateDiagramData, loadDiagramFromData } =
        useChartDB();
    const { calculateDiff, resetDiff, hasDiff, originalDiagram, newDiagram } =
        useDiff();
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const handleGenerate = useCallback(async () => {
        const request = prompt.trim();
        if (!request || isGenerating) return;

        // Always diff against the pre-change diagram so repeated prompts don't
        // compound onto a previous (un-accepted) preview.
        const sourceDiagram: Diagram = originalDiagram ?? currentDiagram;
        if (originalDiagram) {
            resetDiff();
            loadDiagramFromData(originalDiagram);
        }

        setIsGenerating(true);
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const result = await editDiagramWithAI(sourceDiagram, request, {
                signal: controller.signal,
            });

            calculateDiff({ diagram: sourceDiagram, newDiagram: result });
        } catch (error) {
            if (controller.signal.aborted) return;
            console.error('AI editor error:', error);
            toast({
                title: 'AI Editor Error',
                description: describeLLMError(error),
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
            abortRef.current = null;
        }
    }, [
        prompt,
        isGenerating,
        originalDiagram,
        currentDiagram,
        resetDiff,
        loadDiagramFromData,
        calculateDiff,
        toast,
    ]);

    const handleAccept = useCallback(async () => {
        if (!newDiagram) return;
        await updateDiagramData(newDiagram, { forceUpdateStorage: true });
        resetDiff();
        setPrompt('');
    }, [newDiagram, updateDiagramData, resetDiff]);

    const handleRevert = useCallback(() => {
        if (originalDiagram) {
            loadDiagramFromData(originalDiagram);
        }
        resetDiff();
    }, [originalDiagram, loadDiagramFromData, resetDiff]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
            }
        },
        [handleGenerate]
    );

    return (
        <div className="pointer-events-auto flex flex-col items-center gap-2">
            <div className="flex w-[min(90vw,32rem)] items-center gap-2 rounded-full border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <input
                    type="text"
                    value={prompt}
                    disabled={isGenerating}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask AI to change the diagram…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
                />
                {hasDiff ? (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 rounded-full px-2 text-green-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40"
                            onClick={handleAccept}
                        >
                            <Check className="size-3.5" />
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 rounded-full px-2 text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40"
                            onClick={handleRevert}
                        >
                            <Undo2 className="size-3.5" />
                            Revert
                        </Button>
                    </div>
                ) : isGenerating ? (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 rounded-full px-2"
                        onClick={() => abortRef.current?.abort()}
                    >
                        <X className="size-3.5" />
                        Cancel
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        className="h-7 gap-1 rounded-full px-3"
                        disabled={!prompt.trim()}
                        onClick={handleGenerate}
                    >
                        <Sparkles className="size-3.5" />
                        Generate
                    </Button>
                )}
            </div>
            {isGenerating ? (
                <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow">
                    <Loader2 className="size-3 animate-spin" />
                    Generating changes…
                </div>
            ) : null}
        </div>
    );
};
