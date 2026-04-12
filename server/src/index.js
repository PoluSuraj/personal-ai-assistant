import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

process.env.ACCESS_TOKEN_SECRET ||= 'local-demo-access-secret';
process.env.REFRESH_TOKEN_SECRET ||= 'local-demo-refresh-secret';
process.env.ACCESS_TOKEN_EXPIRY ||= '30d';
process.env.REFRESH_TOKEN_EXPIRY ||= '60d';

import connectDb from './db/db1.js';
import app from './app.js';
import fs from 'fs';

connectDb()
    .then(() => {
        const port = process.env.PORT || 8000;
        const server = app.listen(port, () => {
            const mode = process.env.DEMO_MODE === 'true' ? 'demo mode' : 'database mode';
            console.log(`Server listening on port ${port} (${mode})`);
            fs.writeFileSync('server_startup.log', `Server started on port ${port} (${mode}) at ${new Date().toISOString()}
`);
        });

        server.on('error', (err) => {
            console.error(`Server error: ${err.message}`);
            fs.appendFileSync('server_startup.log', `Server error: ${err.message} at ${new Date().toISOString()}
`);
        });

        process.on('uncaughtException', (err) => {
            console.error(`Uncaught Exception: ${err.message}`);
            fs.appendFileSync('server_startup.log', `Uncaught Exception: ${err.message} at ${new Date().toISOString()}
`);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            console.error(`Unhandled Rejection: ${reason}`);
            fs.appendFileSync('server_startup.log', `Unhandled Rejection: ${reason} at ${new Date().toISOString()}
`);
        });
    });
