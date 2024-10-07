const supertest = require('supertest');
 
const createServer = require('../src/createServer'); 
const { getPrisma } = require('../prisma');


const loginMember = async (supertest) => {

    const response = await supertest.post('/api/members/login').send({
        email: 'testmember@mail.be',
        password: 'verydifficult',
    });


    if (response.statusCode !== 200) {
        throw new Error(response.body.message || 'Unknown error occured');
    }

    return `Bearer ${response.body.token}`; 
};

const loginAdmin = async (supertest) => {

    const response = await supertest.post('/api/members/login').send({
        email: 'testadmin@mail.be',
        password: 'verydifficult',
    });


    if (response.statusCode !== 200) {
        throw new Error(response.body.message || 'Unknown error occured');
    }

    return `Bearer ${response.body.token}`; 
};

const withServer = (setter) => { 
    let server; 

    beforeAll(async () => {
        server = await createServer(); 

        setter({
            prisma: getPrisma(),
            supertest: supertest(server.getApp().callback()),
        });
    });

    afterAll(async () => {
        await server.stop(); 
    });
};

module.exports = {
    loginAdmin,
    loginMember,
    withServer,
};
