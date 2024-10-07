module.exports = {
    env: 'NODE_ENV',
    database: {
        host: 'DATABASE_HOST',
        port: 'DATABASE_PORT',
        name: 'DATABASE_NAME',
        username: 'DATABASE_USERNAME',
        password: 'DATABASE_PASSWORD',
        url: 'DATABASE_URL',
    },
    auth: {
        jwt: {
            secret: 'AUTH_JWT_SECRET',
        },
    },
    port: 'PORT',
};  