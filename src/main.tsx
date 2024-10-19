import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './globals.css';
import { App } from './app';
import './i18n/i18n';

import * as Sentry from '@sentry/react';

Sentry.init({
    dsn: 'https://b1cd2b499e71b2fa2393442b786206ac@o4508147153698816.ingest.us.sentry.io/4508147156713472',
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/app\.chartdb\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
