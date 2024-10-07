
const { withServer, loginMember, loginAdmin } = require('../supertest.setup');
const { testAuthHeader } = require('../common/auth');

describe('Locations', () => {
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
        },
        {
            id: 3,
            city: 'Testcity',
            street: 'Teststreet',
            number: 345,
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
        }],
    };

    const url = '/api/locations';

    // Alle locations opvragen 

    describe('GET /api/locations', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.location.create({ data: data.locations[2] });
            await prisma.event.create({ data: data.events[0] });
        });

        afterAll(async () => {
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 3 } });
        });

        it('should return 200 and all locations', async () => {
            const response = await request
                .get(url)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toEqual({
                id: 1,
                city: 'Testcity',
                street: 'Teststreet',
                number: 123,
            });
            expect(response.body[1]).toEqual({
                id: 2,
                city: 'Testcity',
                street: 'Teststreet',
                number: 234,
            });
            expect(response.body[2]).toEqual({
                id: 3,
                city: 'Testcity',
                street: 'Teststreet',
                number: 345,
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
            const response = await request.get(url)
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

    // Een specifieke location opvragen met alle evenementen op die plaats

    describe('GET /api/locations/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.location.create({ data: data.locations[2] });
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
            await prisma.location.delete({ where: { id: 3 } });
        });

        // locatie waar geen evenementen plaatsvinden 
        it('should return 200 and the location', async () => {
            const response = await request
                .get(`${url}/3`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 3,
                city: 'Testcity',
                street: 'Teststreet',
                number: 345,
                events: [],
            });
        });

        // locatie waar wel evenementen plaatsvinden 
        it('should return 200 and the location with all events', async () => {
            const response = await request
                .get(`${url}/1`)
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 1,
                city: 'Testcity',
                street: 'Teststreet',
                number: 123,
                events: [{
                    id: 1,
                    createdBy: 1,
                    locationId: 1,
                    start: '2024-06-02T12:00:00.000Z',
                    end: '2024-06-02T18:00:00.000Z',
                },
                {
                    id: 3,
                    createdBy: 1,
                    locationId: 1,
                    start: '2024-08-02T12:00:00.000Z',
                    end: '2024-08-02T18:00:00.000Z',
                }],
            });
        });

        it('should 404 when requesting not existing location', async () => {
            const response = await request
                .get(`${url}/5`)
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

        testAuthHeader(() => request.get(`${url}/1`));
    });

    // Een nieuwe location toevoegen 

    describe('POST /api/locations', () => {

        afterAll(async () => {
            await prisma.location.delete({ where: { id: 1 } });
        });

        it('should return 201 and the new location', async () => {
            const response = await request
                .post(url)
                .send({
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 111,
                })
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(201);
            expect(response.body.id).toBeTruthy();
            expect(response.body.city).toBe('Testcity');
            expect(response.body.street).toBe('Teststreet');
            expect(response.body.number).toBe(111);
        });

        it('should return 400 when address already in use', async () => {
            const response = await request
                .post(url)
                .send({
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 111,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.message).toBe('A location with address Testcity Teststreet 111 already exists');
            expect(response.body.details).toHaveProperty('city');
            expect(response.body.details).toHaveProperty('street');
            expect(response.body.details).toHaveProperty('number');
        });


        it('should 400 when given an argument in query', async () => {
            const response = await request
                .post(`${url}?invalid=true`)
                .send({
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 111,
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when missing city', async () => {
            const response = await request
                .post(url)
                .send({
                    street: 'Teststreet',
                    number: 111,
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('city');
        });

        it('should 400 when missing street', async () => {
            const response = await request
                .post(url)
                .send({
                    city: 'Testcity',
                    number: 111,
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('street');
        });

        it('should 400 when missing number', async () => {
            const response = await request
                .post(url)
                .send({
                    city: 'Testcity',
                    street: 'Teststreet',
                })
                .set('Authorization', authHeaderMember);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('number');
        });

        it('should return 400 when given used id', async () => {
            const response = await request
                .post(`${url}`)
                .send({
                    id: 1,
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 333,
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
        });

        testAuthHeader(() => request
            .post(url)
            .send({
                id: 1,
                city: 'Testcity',
                street: 'Teststreet',
                number: 111,
            }));

    });

    // Location aanpassen

    describe('PUT /api/locations/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.location.create({ data: data.locations[2] });
            await prisma.event.create({ data: data.events[0] });
        });

        afterAll(async () => {
            await prisma.event.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 1 } });
            await prisma.location.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 6 } });
        });

        it('should return 200 and the location', async () => {
            const response = await request
                .put(`${url}/2`)
                .send({
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 333,
                })
                .set('Authorization', authHeaderMember);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 2,
                city: 'Testcity',
                street: 'Teststreet',
                number: 333,
            });
        });

        it('should return 200 and the location even when changing id', async () => {
            const response = await request
                .put(`${url}/3`)
                .send({
                    id: 6,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 6,
                city: 'Testcity',
                street: 'Teststreet',
                number: 345,
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
            expect(response.body.message).toBe('A location with id 6 already exists');
            expect(response.body.details).toHaveProperty('id');
        });

        it('should return 400 when address already in use', async () => {
            const response = await request
                .put(`${url}/2`)
                .send({
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 123,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.message).toBe('A location with address Testcity Teststreet 123 already exists');
            expect(response.body.details).toHaveProperty('city');
            expect(response.body.details).toHaveProperty('street');
            expect(response.body.details).toHaveProperty('number');
        });

        it('should 400 when given an argument in query', async () => {
            const response = await request
                .put(`${url}/2?invalid=true`)
                .send({
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 333,
                })
                .set('Authorization', authHeaderMember);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 404 when location does not exist', async () => {
            const response = await request
                .put(`${url}/5`)
                .send({
                    city: 'Testcity',
                    street: 'Teststreet',
                    number: 333,
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

        testAuthHeader(() => request
            .put(`${url}/2`)
            .send({
                city: 'Testcity',
                street: 'Teststreet',
                number: 333,
            }));
    });

    // Location verwijderen 

    describe('DELETE /api/locations/:id', () => {
        beforeAll(async () => {
            await prisma.location.create({ data: data.locations[0] });
            await prisma.location.create({ data: data.locations[1] });
            await prisma.location.create({ data: data.locations[2] });
            await prisma.event.create({ data: data.events[0] });
            await prisma.event.create({ data: data.events[1] });
            await prisma.event.create({ data: data.events[2] });
        });

        afterAll(async () => {
            await prisma.event.delete({ where: { id: 2 } });
            await prisma.location.delete({ where: { id: 2 } });
        });

        // zonder events
        it('should return 204 and the body should be empty', async () => {
            const response = await request
                .delete(`${url}/3`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
        });

        // met events 
        it('should return 204 and the body should be empty', async () => {
            const response = await request
                .delete(`${url}/1`)
                .set('Authorization', authHeaderAdmin);
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
        });

        it('should 404 when requesting not existing location', async () => {
            const response = await request
                .delete(`${url}/5`)
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
                .delete(`${url}/3?invalid=true`)
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 when given an argument in body', async () => {
            const response = await request
                .delete(`${url}/3`).send({
                    invalid: 3,
                })
                .set('Authorization', authHeaderAdmin);
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

        testAuthHeader(() => request
            .delete(`${url}/3`),
        );
    });

});