const supertest = require('supertest');

const createServer = require('../../src/createServer');
const packageJson = require('../../package.json');

describe('Health', () => {
    let server;
    let request;

    beforeAll(async () => {
        server = await createServer();
        request = supertest(server.getApp().callback());
    });

    afterAll(async () => {
        await server.stop();
    });

    const url = '/api/health';

    // ping 

    describe('GET /api/health/ping', () => {

        it('should return 200 and pong', async () => {
            const response = await request.get(`${url}/ping`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                pong: true,
            });
        });

        it('should 400 with unknown query parameters', async () => {
            const response = await request.get(`${url}/ping?invalid=true`);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 with unknown body parameters', async () => {
            const response = await request.get(`${url}/ping`).send({
                invalid: 5,
            });
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });

    });

    // get version 

    describe('GET /api/health/version', () => {

        it('should return 200 and version', async () => {
            const response = await request.get(`${url}/version`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                env: 'test',
                version: packageJson.version,
                name: packageJson.name,
            });
        });

        it('should 400 with unknown query parameters', async () => {
            const response = await request.get(`${url}/version?invalid=true`);

            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.query).toHaveProperty('invalid');
        });

        it('should 400 with unknown body parameters', async () => {
            const response = await request.get(`${url}/version`).send({
                invalid: 5,
            });
            expect(response.statusCode).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(response.body.details.body).toHaveProperty('invalid');
        });
    });

    describe('General', () => {

        it('should return 404 when accessing invalid url', async () => {
            const response = await request.get('/invalid');

            expect(response.statusCode).toBe(404);
            expect(response.body).toEqual({
                code: 'NOT_FOUND',
                message: 'Unknown resource: /invalid',
            });
        });
    });

});