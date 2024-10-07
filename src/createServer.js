// imports 
const Koa = require('koa');
const config = require('config');

const { initializePrisma, shutDownPrisma } = require('../prisma');

const installRest = require('./rest');
const { initializeLogger, getLogger } = require('./core/logging');
const installMiddleware = require('./core/installMiddlewares');

// omgevingsvariabelen 
const LOG_LEVEL = config.get('logging.level');
const LOG_DISABLED = config.get('logging.disabled');
const NODE_ENV = config.get('env');

module.exports = async function createServer() {

    initializeLogger({
        level: LOG_LEVEL,
        disabled: LOG_DISABLED,
        defaultMeta: { NODE_ENV },
    },
    );

    getLogger().info(`log level = ${LOG_LEVEL}, log disabled = ${LOG_DISABLED}, env = ${NODE_ENV}`);

    // connectie met datalaag 

    await initializePrisma();

    // app maken 

    const app = new Koa();

    installMiddleware(app);

    installRest(app);

    return {
        getApp() {
            return app;
        },
        start() {
            return new Promise((resolve) => {
                const PORT = process.env.PORT;
                app.listen(PORT);
                getLogger().info(`Server is running at http://localhost:${PORT}`);
                resolve();
            });
        },
        async stop() {
            app.removeAllListeners();
            await shutDownPrisma();
            getLogger().info('Afgesloten');
        },
    };

};

