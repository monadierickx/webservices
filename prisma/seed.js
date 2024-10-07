const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const Role = require('../src/core/roles');

async function main() {

    // members
    const alice = await prisma.member.upsert({
        where: { email: 'alice@mail.be' },
        update: {},
        create: {
            id: 1,
            email: 'alice@mail.be',
            name: 'Alice',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER, Role.ADMIN]),
        },
    });

    const bella = await prisma.member.upsert({
        where: { email: 'bella@mail.be' },
        update: {},
        create: {
            id: 2,
            email: 'bella@mail.be',
            name: 'Bella',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER, Role.ADMIN]),
        },
    });

    const celine = await prisma.member.upsert({
        where: { email: 'celine@mail.be' },
        update: {},
        create: {
            id: 3,
            email: 'celine@mail.be',
            name: 'Celine',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER]),
        },
    });

    // locations 
    const location1 = await prisma.location.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            city: 'Brussels',
            street: 'Hoofdstraat',
            number: 12,
        },
    });

    const location2 = await prisma.location.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            city: 'Gent',
            street: 'Hoofdstraat',
            number: 23,
        },
    });

    // events 
    const event1 = await prisma.event.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            createdBy: 1,
            locationId: 1,
            start: '2024-06-02T12:00:00Z',
            end: '2024-06-02T18:00:00Z',
        },
    });

    const event2 = await prisma.event.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            createdBy: 1,
            locationId: 2,
            start: '2024-07-02T12:00:00Z',
            end: '2024-07-02T18:00:00Z',
        },
    });

    const event3 = await prisma.event.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            createdBy: 1,
            locationId: 1,
            start: '2024-08-02T12:00:00Z',
            end: '2024-08-02T18:00:00Z',
        },
    });

    // staffmembers 

    const staff1 = await prisma.staffmember.upsert({
        where: {
            memberId_eventId: {
                memberId: 1, 
                eventId: 1,
            },
        },
        update: {},
        create: {
            memberId: 1, 
            eventId: 1,
        },
    });

    const staff2 = await prisma.staffmember.upsert({
        where: {
            memberId_eventId: {
                memberId: 1, 
                eventId: 2,
            },
        },
        update: {},
        create: {
            memberId: 1, 
            eventId: 2,
        },
    });

    const staff3 = await prisma.staffmember.upsert({
        where: {
            memberId_eventId: {
                memberId: 2, 
                eventId: 1,
            },
        },
        update: {},
        create: {
            memberId: 2, 
            eventId: 1,
        },
    });

    const staff4 = await prisma.staffmember.upsert({
        where: {
            memberId_eventId: {
                memberId: 3, 
                eventId: 1,
            },
        },
        update: {},
        create: {
            memberId: 3, 
            eventId: 1,
        },
    });

    const staff5 = await prisma.staffmember.upsert({
        where: {
            memberId_eventId: {
                memberId: 3, 
                eventId: 2,
            },
        },
        update: {},
        create: {
            memberId: 3, 
            eventId: 2,
        },
    });

    console.log('MEMBERS:');
    console.log({ alice, bella, celine });
    console.log('\nLOCATIONS:');
    console.log({ location1, location2 });  
    console.log('\nEVENTS:');
    console.log({ event1, event2, event3 });
    console.log('\STAFFMEMBERS:');
    console.log({ staff1, staff2, staff3, staff4, staff5 });
}
main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });