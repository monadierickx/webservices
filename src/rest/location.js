const Router = require('@koa/router');
const Joi = require('joi');

const locationService = require('../service/location');
const validate = require('../core/validation');
const { requireAuthentication, makeRequireRole } = require('../core/auth');
const Role = require('../core/roles');


const getAllLocations = async (ctx) => {
    ctx.body = await locationService.getAll();
};

getAllLocations.validationScheme = null;

const createLocation = async (ctx) => {
    ctx.status = 201;
    ctx.body = await locationService.create({
        ...ctx.request.body,
        number: Number(ctx.request.body.number),
    });
};

createLocation.validationScheme = {
    body: {
        id: Joi.number().integer().positive().optional(),
        city: Joi.string().max(255),
        street: Joi.string().max(255),
        number: Joi.number().integer().positive(),
    },
};

const getLocationById = async (ctx) => {
    ctx.body = await locationService.getById(Number(ctx.params.id));
};

getLocationById.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
};

const updateLocation = async (ctx) => {
    ctx.body = await locationService.updateById(
        Number(ctx.params.id),
        {
            ...ctx.request.body,
        },
    );
};

updateLocation.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
    body: {
        id: Joi.number().integer().positive().optional(),
        city: Joi.string().max(255).optional(),
        street: Joi.string().max(255).optional(),
        number: Joi.number().integer().positive().optional(),
    },
};

const deleteLocation = async (ctx) => {
    await locationService.deleteById(Number(ctx.params.id));
    ctx.status = 204;
};

deleteLocation.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
};

/**
 * Install Locations routes in the given router.
 *
 * @param {Router} app - The parent router.
 */
module.exports = (app) => {
    const router = new Router({
        prefix: '/locations',
    });

    const requireAdmin = makeRequireRole(Role.ADMIN);

    router.use(requireAuthentication);

    router.get('/', validate(getAllLocations.validationScheme), getAllLocations);

    router.post('/', validate(createLocation.validationScheme), createLocation);

    router.get('/:id', validate(getLocationById.validationScheme), getLocationById);

    router.put('/:id', validate(updateLocation.validationScheme), updateLocation);

    router.delete('/:id',
        validate(deleteLocation.validationScheme),
        requireAdmin,
        deleteLocation,
    );

    app.use(router.routes())
        .use(router.allowedMethods());
};
