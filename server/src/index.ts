import { buildApp } from './app.js';
import { serverEnv } from './config/env.js';

const app = buildApp();

app.listen({ host: serverEnv.host, port: serverEnv.port }).catch((error) => {
    app.log.error(error);
    process.exit(1);
});
