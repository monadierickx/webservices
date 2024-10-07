
const { withServer, loginMember, loginAdmin } = require('../supertest.setup');
const { testAuthHeader } = require('../common/auth');

describe('Events', () => {
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
            createdBy: 1,
            locationId: 1,
            start: '2024-08-02T12:00:00Z',
            end: '2024-08-02T18:00:00Z',
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
        ],
    };

    const url = '/api/events';

    // Alle events opvragen 

    describe('GET /api/events', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.event.create({ data: data.events[2] });
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
            await prisma.event.delete({ where: { id: 3 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and all events', async () => {
            const response = await request
                .get(url)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toEqual({
                id: 1,
                start: '2024-06-02T12:00:00.000Z',
                end: '2024-06-02T18:00:00.000Z',
                createdBy: 1,
                locationId: 1,
                creator: {
                    id: 1,
                    name: 'Test Admin',
                    email: 'testadmin@mail.be',
                },
                location: {
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 123,
                },
                staff: [{
                    memberId: 1,
                    eventId: 1,
                }, {
                    memberId: 2,
                    eventId: 1,
                }],
            });
            expect(response.body[1]).toEqual({
                id: 2,
                createdBy: 1,
                locationId: 2,
                start: '2024-07-02T12:00:00.000Z',
                end: '2024-07-02T18:00:00.000Z',
                creator: {
                    id: 1,
                    name: 'Test Admin',
                    email: 'testadmin@mail.be',
                },
                location: {
                    id: 2,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 234,
                },
                staff: [{
                    memberId: 1,
                    eventId: 2,
                }],
            });
            expect(response.body[2]).toEqual({
                id: 3,
                createdBy: 1,
                locationId: 1,
                start: '2024-08-02T12:00:00.000Z',
                end: '2024-08-02T18:00:00.000Z',
                creator: {
                    id: 1,
                    name: 'Test Admin',
                    email: 'testadmin@mail.be',
                },
                location: {
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 123,
                },
                staff: [],
            });
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .get(`${url}?invalid=true`)
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .get(url)
                .send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.get(url));
    });

    // Een specifiek event opvragen 

    describe('GET /api/events/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.event.create({ data: data.events[2] });
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
            await prisma.event.delete({ where: { id: 3 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and the event', async () => {
            const response = await request
                .get(`${url}/3`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 3,
                createdBy: 1,
                locationId: 1,
                start: '2024-08-02T12:00:00.000Z',
                end: '2024-08-02T18:00:00.000Z',
                creator: {
                    id: 1,
                    name: 'Test Admin',
                    email: 'testadmin@mail.be',
                },
                location: {
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 123,
                },
                staff: [],
            });
        });

        it('should 404 when requesting not existing event', async () => {
            const response = await request
                .get(`${url}/5`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No event with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 with invalid event id', async () => {
            const response = await request
                .get(`${url}/invalid`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.params).toHaveProperty('id');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .get(`${url}/3?invalid=true`)
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .get(`${url}/3`).send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.get(`${url}/3`));

    });

    // Een nieuw event toevoegen 

    describe('POST /api/events', () => {

        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
        });

        afterAll(async () => {
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 1 } });
        });

        it('should return 201 and the new event', async () => {
            const response = await request
                .post(url)
                .send({
                    id: 1,
                    locationId: 1,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(201);
            expect(response.body.id).toBe(1);
            expect(response.body.start).toBe('2024-09-02T12:00:00.000Z');
            expect(response.body.end).toBe('2024-09-02T18:00:00.000Z');
            expect(response.body.createdBy).toBe(3);
            expect(response.body.locationId).toBe(1);
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .post(`${url}?invalid=true`)
                .send({
                    locationId: 1,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 404 when location does not exist', async () => {
            const response = await request
                .post(url)
                .send({
                    locationId: 5,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No location with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 when missing locationId', async () => {
            const response = await request
                .post(url)
                .send({
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('locationId');
        });

        it('should 400 when given createdBy', async () => {
            const response = await request
                .post(url)
                .send({
                    locationId: 1,
                    createdBy: 3,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('createdBy');
        });

        testAuthHeader(() => request.post(url).send({
            id: 1,
            createdBy: 1,
            locationId: 1,
            start: '2024-09-02T12:00:00Z',
            end: '2024-09-02T18:00:00Z',
        }));

    });

    // Event aanpassen

    describe('PUT /api/events/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.event.create({ data: data.events[2] });
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
            await prisma.event.delete({ where: { id: 6 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 200 and the event', async () => {
            const response = await request
                .put(`${url}/2`)
                .send({
                    createdBy: 1,
                    locationId: 1,
                    start: '2024-07-02T12:00:00Z',
                    end: '2024-07-02T18:00:00Z',
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 2,
                createdBy: 1,
                locationId: 1,
                start: '2024-07-02T12:00:00.000Z',
                end: '2024-07-02T18:00:00.000Z',
                creator: {
                    id: 1,
                    name: 'Test Admin',
                    email: 'testadmin@mail.be',
                },
                location: {
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 123,
                },
                staff: [{
                    memberId: 1,
                    eventId: 2,
                }],
            });
        });

        it('should return 200 and the event even when changing id', async () => {
            const response = await request
                .put(`${url}/3`)
                .send({
                    id: 6,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(6);
            expect(response.body).toEqual({
                id: 6,
                createdBy: 1,
                locationId: 1,
                start: '2024-08-02T12:00:00.000Z',
                end: '2024-08-02T18:00:00.000Z',
                creator: {
                    id: 1,
                    name: 'Test Admin',
                    email: 'testadmin@mail.be',
                },
                location: {
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 123,
                },
                staff: [],
            });
        });

        it('should return 400 when new id already in use', async () => {
            const response = await request
                .put(`${url}/2`)
                .send({
                    id: 6,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.message).toBe('An event with id 6 already exists');
            expect(response.body.details).toHaveProperty('id');
        });

        it('should 403 when requesting a different member\'s event when not admin', async () => {
            const response = await request
                .put(`${url}/1`)
                .send({
                    createdBy: 3,
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to change this event\'s information');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .put(`${url}/2?invalid=true`)
                .send({
                    createdBy: 1,
                    locationId: 1,
                    start: '2024-07-02T12:00:00Z',
                    end: '2024-07-02T18:00:00Z',
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 404 when event does not exist', async () => {
            const response = await request.put(`${url}/5`)
                .send({
                    createdBy: 1,
                    locationId: 5,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No event with id 5 exists',
                details: {
                    currentId: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 404 when new location does not exist', async () => {
            const response = await request.put(`${url}/2`)
                .send({
                    createdBy: 1,
                    locationId: 5,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
                .set('Authorization', authHeaderAdmin);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No location with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 404 when new creator does not exist', async () => {
            const response = await request.put(`${url}/2`)
                .send({
                    createdBy: 5,
                    locationId: 1,
                    start: '2024-09-02T12:00:00Z',
                    end: '2024-09-02T18:00:00Z',
                })
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

        testAuthHeader(() => request
            .put(`${url}/2`)
            .send({
                createdBy: 1,
                locationId: 1,
                start: '2024-07-02T12:00:00Z',
                end: '2024-07-02T18:00:00Z',
            }),
        );

    });

    // Members ophalen die komen helpen op het event 

    describe('GET api/events/:eventId/staffmembers', () => {
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

        it('should return 200 and all staffmembers for the event', async () => {
            const response = await request
                .get(`${url}/1/staffmembers`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
            expect(response.body[0]).toEqual({
                id: 1,
                name: 'Test Admin',
                email: 'testadmin@mail.be',
            });
            expect(response.body[1]).toEqual({
                id: 2,
                name: 'Second Test Admin',
                email: 'secondtestadmin@mail.be',
            });
        });

        it('should 404 when requesting staffmembers for not existing event', async () => {
            const response = await request
                .get(`${url}/5/staffmembers`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No event with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 with invalid eventId', async () => {
            const response = await request
                .get(`${url}/invalid/staffmembers`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.params).toHaveProperty('eventId');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .get(`${url}/1/staffmembers?invalid=true`)
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .get(`${url}/1/staffmembers`).send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request
            .get(`${url}/1/staffmembers`),
        );

    });

    // Toevoegen dat een member komt helpen op een event 

    describe('POST api/events/:eventId/staffmembers', () => {

        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.event.create({ data: data.events[2] });
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
            await prisma.staffmember.delete({
                where: {
                    memberId_eventId: {
                        memberId: 3,
                        eventId: 2,
                    },
                },
            });
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.event.delete({ where: { id: 3 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 201 and the new staffmember', async () => {
            const response = await request
                .post(`${url}/2/staffmembers`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(201);
            expect(response.body.memberId).toBe(3);
            expect(response.body.eventId).toBe(2);
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .post(`${url}/2/staffmembers?invalid=true`)
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 404 when event does not exist', async () => {
            const response = await request.post(`${url}/5/staffmembers`)
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No event with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        testAuthHeader(() => request.post(`${url}/2/staffmembers`));

    });

    // Event verwijderen 

    describe('DELETE /api/events/:id', () => {

        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
        });

        afterAll(async () => {
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 204 and the body should be empty', async () => {
            const response = await request
                .delete(`${url}/1`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
        });

        it('should 403 when requesting a different member\'s event when not admin', async () => {
            const response = await request
                .delete(`${url}/2`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to delete this event\'s information');
        });

        it('should 404 when requesting not existing event', async () => {
            const response = await request
                .delete(`${url}/5`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No event with id 5 exists',
                details: {
                    id: 5,
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
                    invalid: 3,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.delete(`${url}/2`));

    });

    // Staffmember verwijderen voor een event 

    describe('DELETE api/events/:eventId/staffmembers/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.event.create({ data: data.events[2] });
            await prisma.staffmember.create({ data: data.staffmembers[0] });
            await prisma.staffmember.create({ data: data.staffmembers[1] });
            await prisma.staffmember.create({ data: data.staffmembers[2] });
        });

        afterAll(async () => {
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
            await prisma.event.delete({ where: { id: 3 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        it('should return 204 and the body should be empty', async () => {
            const response = await request
                .delete(`${url}/1/staffmembers/1`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
        });

        it('should 403 when requesting a different member when not admin', async () => {
            const response = await request
                .delete(`${url}/1/staffmembers/2`)
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
            expect(response.body.message).toBe('You are not allowed to acces this member\'s information');
        });

        it('should 404 when requesting not existing event and member combination', async () => {
            const response = await request
                .delete(`${url}/3/staffmembers/3`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(404);
            expect(response.body.code).toBe('NOT_FOUND');
            expect(response.body.message).toBe('No staffmember with memberId 3 and eventId 3 exists');
            expect(response.body.details).toHaveProperty('memberId');
            expect(response.body.details).toHaveProperty('eventId');
            expect(response.body.stack).toBeTruthy();
        });

        it('should 404 when requesting not existing event', async () => {
            const response = await request
                .delete(`${url}/5/staffmembers/1`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                code: 'NOT_FOUND',
                message: 'No event with id 5 exists',
                details: {
                    id: 5,
                },
            });
            expect(response.body.stack).toBeTruthy();
        });

        it('should 400 with invalid eventId', async () => {
            const response = await request
                .delete(`${url}/invalid/staffmembers/1`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.params).toHaveProperty('eventId');
        });

        it('should 400 with invalid memberId', async () => {
            const response = await request
                .delete(`${url}/1/staffmembers/invalid`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.params).toHaveProperty('id');
        });

        it('should 404 when requesting not existing member', async () => {
            const response = await request
                .delete(`${url}/1/staffmembers/5`)
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
                .delete(`${url}/1/staffmembers/1?invalid=true`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .delete(`${url}/1/staffmembers/1`)
                .send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request.delete(`${url}/1/staffmembers/1`));
    });
});
