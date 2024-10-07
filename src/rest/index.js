// verantwoordelijk voor de parent route 

const Router = require('@koa/router');

const installHealthRouter = require('./health');
const installEventRouter = require('./event');
const installMemberRouter = require('./member');
const installLocationRouter = require('./location');

/**
 * Install all routes in the given Koa application.
 *
 * @param {Koa} app - The Koa application.
 */

module.exports = (app) => {
    const router = new Router({
        prefix: '/api',
    });

    installEventRouter(router);
    installMemberRouter(router);
    installHealthRouter(router);
    installLocationRouter(router);

    app.use(router.routes())
        .use(router.allowedMethods());
};
