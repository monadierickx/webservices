const { withServer, loginMember, loginAdmin } = require('../supertest.setup');
const { testAuthHeader } = require('../common/auth');
const Role = require('../../src/core/roles');

describe('Members', () => {
    let request;
    let prisma;
    let authHeaderMember;
    let authHeaderAdmin;

    withServer(async ({ supertest, prisma: p }) => {
        request = supertest;
        prisma = await p;
    });

    beforeAll(async () => {
        authHeaderMember = await loginMember(request);
        authHeaderAdmin = await loginAdmin(request);
    });

    // testdata 

    const data = {
        locations: [{
            id: 1,
            city: 'Testcity',
            street: 'Teststreet',
            number: 123,
        },
        {
            id: 2,
            city: 'Testcity',
            street: 'Teststreet',
            number: 234,
        }],
        members: [{
            id: 5,
            name: 'extra',
            email: 'extra@mail.com',
            password_hash: '$argon2id$v=19$m=131072,t=6,p=4$m7MhFWCSvJtOqcQ7CaAAEQ$4RWJ4ctt2AdamGAJgFe9oZKIph5GCvbktMm4nJODLxY',
            roles: JSON.stringify([Role.MEMBER]),
        }],
        events: [{
            id: 1,
            createdBy: 1,
            locationId: 1,
            start: '2024-06-02T12:00:00Z',
            end: '2024-06-02T18:00:00Z',
        },
        {
            id: 2,
            createdBy: 1,
            locationId: 2,
            start: '2024-07-02T12:00:00Z',
            end: '2024-07-02T18:00:00Z',
        },
        {
            id: 3,
            createdBy: 5,
            locationId: 2,
            start: '2024-07-02T12:00:00Z',
            end: '2024-07-02T18:00:00Z',
        },
        {
            id: 4,
            createdBy: 5,
            locationId: 2,
            start: '2024-07-02T12:00:00Z',
            end: '2024-07-02T18:00:00Z',
        }],
        staffmembers: [{
            memberId: 1,
            eventId: 1,
        },
        {
            memberId: 2,
            eventId: 1,
        },
        {
            memberId: 1,
            eventId: 2,
        },
        {
            memberId: 5,
            eventId: 3,
        },
        {
            memberId: 5,
            eventId: 4,
        },
        {
            memberId: 1,
            eventId: 4,
        },
        {
            memberId: 2,
            eventId: 4,
        },
        {
            memberId: 3,
            eventId: 4,
        },
        ],
    };

    const url = '/api/members';

    // Member inloggen 

    describe('POST api/members/login', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 1,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 2,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 2,
                        eventId: 1,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and the admin', async () => {
            const response = await request
                .post(`${url}/login`)
                .send({
                    email: 'testadmin@mail.be',
                    password: 'verydifficult',
                });
            expect(response.status).toBe(200);
            expect(response.body.member).toEqual({
                id: 1,
                name: 'Test Admin',
                email: 'testadmin@mail.be',
                roles: ['member', 'admin'],
                onStaff: [{
                    memberId: 1,
                    eventId: 1,
                },
                {
                    memberId: 1,
                    eventId: 2,
                }],
                createdEvents: [{
                    id: 1,
                    createdBy: 1,
                    locationId: 1,
                    start: '2024-06-02T12:00:00.000Z',
                    end: '2024-06-02T18:00:00.000Z',
                },
                {
                    id: 2,
                    createdBy: 1,
                    locationId: 2,
                    start: '2024-07-02T12:00:00.000Z',
                    end: '2024-07-02T18:00:00.000Z',
                }],
            });
            expect(response.body.token).toBeTruthy();
        });

        it('should return 200 and the member', async () => {
            const response = await request
                .post(`${url}/login`)
                .send({
                    email: 'testmember@mail.be',
                    password: 'verydifficult',
                });
            expect(response.status).toBe(200);
            expect(response.body.member).toEqual({
                id: 3,
                name: 'Test Member',
                email: 'testmember@mail.be',
                roles: ['member'],
                onStaff: [],
                createdEvents: [],
            });
            expect(response.body.token).toBeTruthy();
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .post(`${url}/login?invalid=true`)
                .send({
                    email: 'testmember@mail.be',
                    password: 'verydifficult',
                });
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when missing email', async () => {
            const response = await request.post(`${url}/login`)
                .send({
                    password: 'verydifficult',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('email');
        });

        it('should 400 when missing password', async () => {
            const response = await request.post(`${url}/login`)
                .send({
                    email: 'testmember@mail.be',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('password');
        });

        it('should 401 when non-existing email', async () => {
            const response = await request.post(`${url}/login`)
                .send({
                    email: 'invalid@mail.be',
                    password: 'verydifficult',
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
            expect(response.body.message).toBe('The given email or password do not match');
        });

        it('should 401 when wrong password', async () => {
            const response = await request.post(`${url}/login`)
                .send({
                    email: 'testmember@mail.be',
                    password: 'wrongpassword',
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
            expect(response.body.message).toBe('The given email or password do not match');
        });
    });

    // Member registreren

    describe('POST api/members/register', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 1,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 2,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 2,
                        eventId: 1,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.member.delete({ where: { id: 5 } });
            await prisma.member.delete({ where: { id: 6 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 201 and the new member', async () => {
            const response = await request
                .post(`${url}/register`)
                .send({
                    id: 5,
                    name: 'New Test Member',
                    email: 'newmember@mail.be',
                    password: 'verydifficult',
                });
            expect(response.status).toBe(201);
            expect(response.body.member).toEqual({
                id: 5,
                name: 'New Test Member',
                email: 'newmember@mail.be',
                roles: ['member'],
                onStaff: [],
                createdEvents: [],
            });
            expect(response.body.token).toBeTruthy();
        });

        it('should return 201 and the new member even when given no name', async () => {
            const response = await request.post(`${url}/register`).send({
                id: 6,
                email: 'validtest@mail.be',
                password: 'verydifficult',
            });
            expect(response.status).toBe(201);
            expect(response.body.member).toEqual({
                id: 6,
                name: null,
                email: 'validtest@mail.be',
                roles: ['member'],
                onStaff: [],
                createdEvents: [],
            });
            expect(response.body.token).toBeTruthy();
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .post(`${url}/register?invalid=true`)
                .send({
                    name: 'Invalid Test User',
                    email: 'invalid@mail.be',
                    password: 'verydifficult',
                });
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when missing email', async () => {
            const response = await request.post(`${url}/register`)
                .send({
                    name: 'Invalid Test User',
                    password: 'verydifficult',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('email');
        });

        it('should 400 when missing password', async () => {
            const response = await request.post(`${url}/register`)
                .send({
                    name: 'Invalid Test User',
                    email: 'invalid@mail.be',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('password');
        });

        it('should 400 when email is already in use', async () => {
            const response = await request.post(`${url}/register`)
                .send({
                    name: 'InvalidUser',
                    email: 'testmember@mail.be',
                    password: 'password',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.message).toBe('A member with email testmember@mail.be already exists');
            expect(response.body.details).toHaveProperty('email');
        });

        it('should 400 when id is already in use', async () => {
            const response = await request.post(`${url}/register`)
                .send({
                    id: 2,
                    name: 'InvalidUser',
                    email: 'invaliduser@mail.be',
                    password: 'password',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.message).toBe('A member with id 2 already exists');
            expect(response.body.details).toHaveProperty('id');
        });
    });

    // Alle members opvragen 

    describe('GET /api/members', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 1,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 2,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 2,
                        eventId: 1,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and all members', async () => {
            const response = await request
                .get(url)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(4);
            expect(response.body[0]).toEqual({
                id: 1,
                name: 'Test Admin',
                email: 'testadmin@mail.be',
                roles: ['member', 'admin'],
                onStaff: [{
                    memberId: 1,
                    eventId: 1,
                },
                {
                    memberId: 1,
                    eventId: 2,
                }],
                createdEvents: [
                    {
                        id: 1,
                        createdBy: 1,
                        locationId: 1,
                        start: '2024-06-02T12:00:00.000Z',
                        end: '2024-06-02T18:00:00.000Z',
                    },
                    {
                        id: 2,
                        createdBy: 1,
                        locationId: 2,
                        start: '2024-07-02T12:00:00.000Z',
                        end: '2024-07-02T18:00:00.000Z',
                    },
                ],
            });
            // expect(response.body[1]).toEqual({
            //     id: 2,
            //     name: 'Second Test User',
            //     email: 'secondtest@mail.be',
            //     onStaff: [{
            //         memberId: 2,
            //         eventId: 1
            //     }],
            //     createdEvents: []
            // });
            // expect(response.body[2]).toEqual({
            //     id: 3,
            //     name: 'Third Test User',
            //     email: 'thirdtest@mail.be',
            //     onStaff: [],
            //     createdEvents: []
            // });
        });

        it('should 403 when not admin', async () => {
            const response = await request
                .get(url)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed this action');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .get(`${url}?invalid=true`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request.get(url)
                .send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.get(url));
    });

    // Member opvragen 

    describe('GET /api/members/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 1,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 2,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 2,
                        eventId: 1,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and the member itself', async () => {
            const response = await request
                .get(`${url}/3`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 3,
                name: 'Test Member',
                email: 'testmember@mail.be',
                roles: ['member'],
                createdEvents: [],
                onStaff: [],
            });
        });

        it('should return 200 and a different member when admin', async () => {
            const response = await request
                .get(`${url}/2`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 2,
                name: 'Second Test Admin',
                email: 'secondtestadmin@mail.be',
                roles: ['member', 'admin'],
                createdEvents: [],
                onStaff: [
                    {
                        memberId: 2,
                        eventId: 1,
                    },
                ],
            });
        });

        it('should 403 when requesting a different member when not admin', async () => {
            const response = await request
                .get(`${url}/1`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to acces this member\'s information');
        });

        it('should 404 when requesting not existing member', async () => {
            const response = await request
                .get(`${url}/8`)
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No member with id 8 exists',
                details: {
                    id: 8,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 with invalid member id', async () => {
            const response = await request
                .get(`${url}/invalid`)
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.params).toHaveProperty('id');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .get(`${url}/3?invalid=true`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .get(`${url}/3`).send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        it('should 440 when given an expired JWT token', async () => {
            const response = await request
                .get(`${url}/2`)
                .set('Authorization', 
                    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJJZCI6Miwicm9sZXMiOiJbXCJtZW1iZXJcIixcImFkbWluXCJdIiwiaWF0IjoxNzIzNTU5NDQ1LCJleHAiOjE3MjM1NjMwNDUsImF1ZCI6ImV2ZW50LmhvZ2VudC5iZSIsImlzcyI6ImV2ZW50LmhvZ2VudC5iZSIsInN1YiI6ImF1dGgifQ.5NjKlRImsnByYqLD0exGsjlq3PneD7IOluXDAANELDE',
                );
            expect(response.statusCode).toBe(440);
            expect(response.body.code).toBe('LOGIN_TIME_OUT');
            expect(response.body.message).toBe('Your session is expired, log in to continue');
        });

        it('should 401 when given a JWT token from wrong environment', async () => {
            const response = await request
                .get(`${url}/2`)
                .set('Authorization', 
                    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJJZCI6Mywicm9sZXMiOiJbXCJtZW1iZXJcIl0iLCJpYXQiOjE3MjM2Mjg3NjIsImV4cCI6MTcyMzYzOTU2MiwiYXVkIjoiZXZlbnQuaG9nZW50LmJlIiwiaXNzIjoiZXZlbnQuaG9nZW50LmJlIiwic3ViIjoiYXV0aCJ9.HKmUIbJZHo5K1QCkbtyQ0SHC6PzZaqurKMumMgLja_E',
                );
            expect(response.statusCode).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
            expect(response.body.message).toBe('You need to be signed in on the test version of the app');
        });

        testAuthHeader(() => request.get(`${url}/3`));

    });

    // Member aanpassen 

    describe('PUT /api/members/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 1,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 2,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 2,
                        eventId: 1,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and the changed member', async () => {
            const response = await request
                .put(`${url}/3`)
                .send({
                    id: 10,
                    name: 'Changed Test Member',
                    email: 'changedtestmember@mail.be',
                })
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 10,
                name: 'Changed Test Member',
                email: 'changedtestmember@mail.be',
                roles: ['member'],
                createdEvents: [],
                onStaff: [],
            });
        });

        it('should return 200 and the changed member when done by admin', async () => {
            const response = await request
                .put(`${url}/10`)
                .send({
                    id: 3,
                    name: 'Test Member',
                    email: 'testmember@mail.be',
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 3,
                name: 'Test Member',
                email: 'testmember@mail.be',
                roles: ['member'],
                createdEvents: [],
                onStaff: [],
            });
        });

        it('should 403 when requesting a different member when not admin', async () => {
            const response = await request
                .put(`${url}/1`)
                .send({
                    id: 10,
                    name: 'Changed Test Member',
                    email: 'changedtestmember@mail.be',
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to acces this member\'s information');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .put(`${url}/2?invalid=true`)
                .send({
                    name: 'Changed',
                    email: 'changed@mail.be',
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 404 when member does not exist', async () => {
            const response = await request.put(`${url}/8`)
                .send({
                    name: 'Changed',
                    email: 'changed@mail.be',
                })
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No member with id 8 exists',
                details: {
                    id: 8,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 when new id already in use', async () => {
            const response = await request.put(`${url}/2`)
                .send({
                    id: 1,
                    name: 'Changed',
                    email: 'changed@mail.be',
                })
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                code: 'VALIDATION_FAILED',
                message: 'A member with id 1 already exists',
                details: {
                    id: 1,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        testAuthHeader(() => request
            .put(`${url}/2`)
            .send({
                id: 2,
                name: 'Changed',
                email: 'changed@mail.be',
            }),
        );

    });

    // Member verwijderen  

    describe('DELETE api/members/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.member.create({ data: data.members[0] });
            await prisma.event.create({ data: data.events[2] });
            await prisma.event.create({ data: data.events[3] });
            await prisma.staffmember.create({ data: data.staffmembers[3] });
            await prisma.staffmember.create({ data: data.staffmembers[4] });
            await prisma.staffmember.create({ data: data.staffmembers[5] });
            await prisma.staffmember.create({ data: data.staffmembers[6] });
            await prisma.staffmember.create({ data: data.staffmembers[7] });
        });

        afterAll(async () => {
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 204 and the body should be empty when admin', async () => {
            const response = await request
                .delete(`${url}/5`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
        });

        it('should 403 when requesting a different member when not admin', async () => {
            const response = await request
                .delete(`${url}/1`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to acces this member\'s information');
        });

        it('should 404 when requesting not existing member when admin', async () => {
            const response = await request
                .delete(`${url}/8`)
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No member with id 8 exists',
                details: {
                    id: 8,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 with invalid event id', async () => {
            const response = await request
                .delete(`${url}/invalid`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.params).toHaveProperty('id');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .delete(`${url}/2?invalid=true`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .delete(`${url}/2`)
                .send({
                    invalid: 2,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.delete(`${url}/1`));
    });

    // Opvragen welke events een member on staff is 

    describe('GET api/members/:memberId/staffmembers', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 1,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 1,
                        eventId: 2,
                    },
                },
            });
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 2,
                        eventId: 1,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and all events where member is on staff when admin', async () => {
            const response = await request
                .get(`${url}/1/staffmembers`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body[0]).toEqual(
                {
                    id: 1,
                    createdBy: 1,
                    locationId: 1,
                    start: '2024-06-02T12:00:00.000Z',
                    end: '2024-06-02T18:00:00.000Z',
                });
            expect(response.body[1]).toEqual(
                {
                    id: 2,
                    createdBy: 1,
                    locationId: 2,
                    start: '2024-07-02T12:00:00.000Z',
                    end: '2024-07-02T18:00:00.000Z',
                },
            );
        });

        it('should return 200 and all events where member is on staff when requesting same member', async () => {
            const response = await request
                .get(`${url}/3/staffmembers`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
            expect(response.body).toEqual([]);
        });

        it('should 403 when requesting a different member when not admin', async () => {
            const response = await request
                .get(`${url}/2/staffmembers`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to acces this member\'s information');
        });

        it('should 404 when requesting events for not existing member', async () => {
            const response = await request
                .get(`${url}/5/staffmembers`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No member with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .get(`${url}/1/staffmembers?invalid=true`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .get(`${url}/1/staffmembers`).send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.get(`${url}/1/staffmembers`));

    });

});