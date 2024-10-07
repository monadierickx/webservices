
// imports 
const config = require('config');
const bodyParser = require('koa-bodyparser');
const koaCors = require('@koa/cors');
const emoji = require('node-emoji');
const koaHelmet = require('koa-helmet');

const { getLogger } = require('./logging');
const ServiceError = require('./serviceError');

const NODE_ENV = config.get('env');

// omgevingsvariabelen 
const CORS_ORIGINS = config.get('cors.origins');
const CORS_MAX_AGE = config.get('cors.maxAge');


module.exports = function installMiddleware(app) {

    // cors 

    app.use(
        koaCors({
            origin: (ctx) => {
                if (CORS_ORIGINS.indexOf(ctx.request.header.origin) !== -1) {
                    return ctx.request.header.origin;
                }
                return CORS_ORIGINS[0];
            },
            allowHeaders: ['Accept', 'Content-Type', 'Authorization'],
            maxAge: CORS_MAX_AGE,
        }),
    );

    // validation 

    app.use(async (ctx, next) => {
        getLogger().info(`${emoji.get('fast_forward')} method: ${ctx.method} url: ${ctx.url}`);

        const getStatusEmoji = () => {
            if (ctx.status >= 500) return `${emoji.get('skull')} schuld van de server`;
            if (ctx.status >= 400) return `${emoji.get('x')} schuld van de client`;
            if (ctx.status >= 300) return emoji.get('rocket');
            if (ctx.status >= 200) return `${emoji.get('white_check_mark')} succesvol request`;
            return emoji.get('rewind');
        };

        try {
            await next();

            getLogger().info(
                `${getStatusEmoji()} ${ctx.method} ${ctx.status} ${ctx.url}`,
            );
        } catch (error) {
            getLogger().error(
                `${emoji.get('x')} ${ctx.method} ${ctx.status} ${ctx.url}`,
                {
                    error,
                },
            );

            throw error;
        }
    });

    // bodyparser

    app.use(bodyParser());

    // Add some security headers
  
    app.use(koaHelmet());

    // foutafhandeling 

    app.use(async (ctx, next) => {

        try {
            await next(); // gebeurd op de terugweg pas 
        } catch (error) {

            getLogger().error('Error occured while handling a request', { error });
            let statusCode = error.status || 500;
            let errorBody = {
                code: error.code || 'INTERNAL_SERVER_ERROR',
                message: error.message,
                details: error.details || {},
                stack: NODE_ENV !== 'production' ? error.stack : undefined,
            };

            if (error instanceof ServiceError) {
        
                if (error.isValidationFailed) {
                    statusCode = 400;
                }

                if (error.isUnauthorized) {
                    statusCode = 401;
                }

                if (error.isForbidden) {
                    statusCode = 403;
                }

                if (error.isNotFound) {
                    statusCode = 404;
                }

                if (error.loginTimeOut) {
                    statusCode = 440;
                }
            }

            ctx.status = statusCode;
            ctx.body = errorBody;
        }
    });

    // Handle 404 not found with uniform response
    app.use(async (ctx, next) => {
        await next();

        if (ctx.status === 404) {
            ctx.status = 404;
            ctx.body = {
                code: 'NOT_FOUND',
                message: `Unknown resource: ${ctx.url}`,
            };
        }
    });


};
