import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HOST_URL } from '@/lib/env';

export interface TemplatesPageHelmetProps {
    tag?: string;
    isFeatured: boolean;
}

export const TemplatesPageHelmet: React.FC<TemplatesPageHelmetProps> = ({
    tag,
    isFeatured,
}) => {
    const { tag: tagParam } = useParams<{ tag: string }>();

    return (
        <Helmet>
            {HOST_URL !== 'https://chartdb.io' ? (
                <link rel="canonical" href="https://chartdb.io/templates" />
            ) : null}

            {tag ? (
                <title>{`${tag} database Schema Diagram Templates | ChartDB`}</title>
            ) : isFeatured ? (
                <title>
                    Featured database Schema Diagram Templates | ChartDB
                </title>
            ) : (
                <title>Database Schema Diagram Templates | ChartDB</title>
            )}

            {tag ? (
                <meta
                    name="description"
                    content={`Discover a collection of real-world database schema diagrams for ${tag}, featuring example applications and popular open-source projects.`}
                />
            ) : (
                <meta
                    name="description"
                    content="Discover a collection of real-world database schema diagrams, featuring example applications and popular open-source projects."
                />
            )}

            {tag ? (
                <meta
                    property="og:title"
                    content={`${tag} database Schema Diagram Templates | ChartDB`}
                />
            ) : isFeatured ? (
                <meta
                    property="og:title"
                    content="Featured database Schema Diagram Templates | ChartDB"
                />
            ) : (
                <meta
                    property="og:title"
                    content="Database Schema Diagram Templates | ChartDB"
                />
            )}

            {tag ? (
                <meta
                    property="og:url"
                    content={`${HOST_URL}/templates/${tagParam}`}
                />
            ) : isFeatured ? (
                <meta
                    property="og:url"
                    content={`${HOST_URL}/templates/featured`}
                />
            ) : (
                <meta property="og:url" content={`${HOST_URL}/templates`} />
            )}

            {tag ? (
                <meta
                    property="og:description"
                    content={`Discover a collection of real-world database schema diagrams for ${tag}, featuring example applications and popular open-source projects.`}
                />
            ) : (
                <meta
                    property="og:description"
                    content="Discover a collection of real-world database schema diagrams, featuring example applications and popular open-source projects."
                />
            )}
            <meta property="og:image" content={`${HOST_URL}/chartdb.png`} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="ChartDB" />

            {tag ? (
                <meta
                    name="twitter:title"
                    content={`${tag} database Schema Diagram Templates | ChartDB`}
                />
            ) : (
                <meta
                    name="twitter:title"
                    content="Database Schema Diagram Templates | ChartDB"
                />
            )}

            {tag ? (
                <meta
                    name="twitter:description"
                    content={`Discover a collection of real-world database schema diagrams for ${tag}, featuring example applications and popular open-source projects.`}
                />
            ) : (
                <meta
                    name="twitter:description"
                    content="Discover a collection of real-world database schema diagrams, featuring example applications and popular open-source projects."
                />
            )}

            <meta name="twitter:image" content={`${HOST_URL}/chartdb.png`} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@ChartDB_io" />
            <meta name="twitter:creator" content="@ChartDB_io" />
        </Helmet>
    );
};
