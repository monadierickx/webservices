const config = require('config');

const { initializeLogger } = require('../src/core/logging');
const Role = require('../src/core/roles');
const { initializePrisma, getPrisma } = require('../prisma/index');

module.exports = async () => {

    initializeLogger({
        level: config.get('logging.level'),
        disabled: config.get('logging.disabled'),
    });

    await initializePrisma();

    // Insert some test members with password verydifficult
    const prisma = await getPrisma(); 

    await prisma.member.createMany({
        data: [{
            id: 1,
            name: 'Test Admin',
            email: 'testadmin@mail.be',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER, Role.ADMIN]),
        },{
            id: 2,
            name: 'Second Test Admin',
            email: 'secondtestadmin@mail.be',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER, Role.ADMIN]),
        },{
            id: 3,
            name: 'Test Member',
            email: 'testmember@mail.be',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER]),
        },{
            id: 4,
            name: 'Second Test Member',
            email: 'secondtestmember@mail.be',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER]),
        },
        ],
    });

};
