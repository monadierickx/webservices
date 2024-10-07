
const { PrismaClient } = require('@prisma/client');

const { getLogger } = require('../src/core/logging');

let prisma;
let logger;

async function initializePrisma() {

    logger = getLogger();
    logger.info('Initializing connection to the database');

    try {
        prisma = new PrismaClient(); // prisma.$connect happens automatically
    } catch (error) {
        logger.error(error.message, { error });
        throw new Error('Could not initialize the data layer');
    }

    // logger.info('Testing connection to the database');

    // try {
    //     const l = await prisma.location.findMany();
    //     console.log(l);
    // } catch (error) {
    //     logger.error(error.message, { error });
    //     throw new Error('Could not retrieve information from data layer');
    // }

    logger.info('Successfully initialized connection to the database');
}

async function getPrisma(){
    return await prisma;
}

async function shutDownPrisma(){
    logger.info('Shutting down connection to the database');
    await prisma.$disconnect;
    prisma = null;
    logger.info('Successfully shut down connection to the database');
}

const tables = Object.freeze({
    location: 'locations',
    member: 'members',
    event: 'events',
    staffmember: 'staffmembers',
});

module.exports = {
    initializePrisma,
    getPrisma,
    shutDownPrisma,
    tables,
};

