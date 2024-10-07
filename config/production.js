module.exports = {
    logging: {
        level: 'info',
        disabled: false,
    },
    cors: {
        origins: ['http://localhost:5173'],
        maxAge: 3 * 60 * 60,
    },
    database: {
        client: 'mysql2',
    },
    auth: {
        argon: {
            saltLength: 16,
            hashLength: 32,
            timeCost: 6,
            memoryCost: 2 ** 17,
        },
        jwt: {
            secret: 'eenveeltemoeilijksecretdatniemandooitzalradenandersisdesitegehacked',
            expirationInterval: 3 * 60 * 60 * 1000, // ms (3 hours)
            issuer: 'event.hogent.be',
            audience: 'event.hogent.be',
        },
    },
};
