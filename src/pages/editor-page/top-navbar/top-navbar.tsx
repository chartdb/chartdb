import React, { useCallback } from 'react';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { DiagramName } from './diagram-name';
import { LastSaved } from './last-saved';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';
import { HIDE_BUCKLE_DOT_DEV } from '@/lib/env';
import { Button } from '@/components/button/button';
import { randomColor } from '@/lib/colors';
import { generateId } from '@/lib/utils';
import { type Diagram } from '@/lib/domain/diagram';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDiff } from '@/context/diff-context/use-diff';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { effectiveTheme } = useTheme();
    const { isMd: isDesktop } = useBreakpoint('md');
    const { currentDiagram } = useChartDB();
    const { calculateDiff } = useDiff();

    const renderStars = useCallback(() => {
        return (
            <iframe
                src={`https://ghbtns.com/github-btn.html?user=chartdb&repo=chartdb&type=star&size=${isDesktop ? 'large' : 'small'}&text=false`}
                width={isDesktop ? '40' : '25'}
                height={isDesktop ? '30' : '20'}
                title="GitHub"
            ></iframe>
        );
    }, [isDesktop]);

    const openBuckleWaitlist = useCallback(() => {
        window.open('https://waitlist.buckle.dev', '_blank');
    }, []);

    const renderGetBuckleButton = useCallback(() => {
        if (HIDE_BUCKLE_DOT_DEV) {
            return null;
        }

        return (
            <button
                className="gradient-background relative inline-flex items-center justify-center overflow-hidden rounded-lg p-0.5 text-base text-gray-700 focus:outline-none focus:ring-0"
                onClick={openBuckleWaitlist}
            >
                <span className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md bg-background px-2 py-0.5 font-primary text-xs font-semibold text-foreground md:text-sm">
                    ChartDB v2.0 🔥
                </span>
            </button>
        );
    }, [openBuckleWaitlist]);

    return (
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-[10px]">
                    <a
                        href="https://chartdb.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? ChartDBLogo
                                    : ChartDBDarkLogo
                            }
                            alt="chartDB"
                            className="h-4 max-w-fit"
                        />
                    </a>
                    {!isDesktop ? (
                        <div className="flex items-center gap-2">
                            {renderGetBuckleButton()}
                            {renderStars()}
                            <LanguageNav />
                        </div>
                    ) : null}
                </div>
                <Menu />
            </div>
            {isDesktop ? (
                <>
                    <DiagramName />
                    <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
                        {renderGetBuckleButton()}
                        <LastSaved />
                        {renderStars()}
                        <LanguageNav />
                        <Button
                            className="text-xs"
                            onClick={() => {
                                const newDiagram: Diagram = {
                                    ...currentDiagram,
                                    tables: [
                                        ...(currentDiagram.tables?.map(
                                            (t, index) =>
                                                index === 0
                                                    ? { ...t, name: 'as' }
                                                    : index === 1
                                                      ? {
                                                            ...t,
                                                            fields: t.fields.filter(
                                                                (f, i) => i == 1
                                                            ),
                                                        }
                                                      : { ...t }
                                        ) ?? []),
                                        {
                                            id: generateId(),
                                            name: `table_${1293102}`,
                                            x: 0,
                                            y: 0,
                                            fields: [
                                                {
                                                    id: generateId(),
                                                    name: 'id',
                                                    type: {
                                                        id: 'bigint',
                                                        name: 'bigint',
                                                    },
                                                    unique: true,
                                                    nullable: false,
                                                    primaryKey: true,
                                                    createdAt: Date.now(),
                                                },
                                            ],
                                            indexes: [],
                                            color: randomColor(),
                                            createdAt: Date.now(),
                                            isView: false,
                                        },
                                    ],
                                };

                                calculateDiff({
                                    diagram: currentDiagram,
                                    newDiagram,
                                });
                            }}
                        >
                            test
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-1 justify-center pb-2 pt-1">
                    <DiagramName />
                </div>
            )}
        </nav>
    );
};
