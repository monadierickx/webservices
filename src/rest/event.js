
const Router = require('@koa/router');
const Joi = require('joi');

const eventService = require('../service/event');
const validate = require('../core/validation');
const { requireAuthentication } = require('../core/auth');
const { checkIdParams } = require('../core/accesChecks');


const getAllEvents = async (ctx) => {
    ctx.body = await eventService.getAll();
};

getAllEvents.validationScheme = null;

const createEvent = async (ctx) => {
    ctx.status = 201;
    ctx.body = await eventService.create({
        ...ctx.request.body,
        locationId: Number(ctx.request.body.locationId),
        createdBy: Number(ctx.state.session.memberId),
    });
};

createEvent.validationScheme = {
    body: {
        id: Joi.number().integer().positive().optional(),
        start: Joi.date().iso().optional(),
        end: Joi.date().iso().optional(),
        locationId: Joi.number().integer().positive(),
    },
};

const getEventById = async (ctx) => {
    ctx.body = await eventService.getById(Number(ctx.params.id));
};

getEventById.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
};

const updateEvent = async (ctx) => {
    const { memberId, roles } = ctx.state.session;
    ctx.body = await eventService.updateById({
        currentId: Number(ctx.params.id),
        data: {
            ...ctx.request.body,
        },
        memberId,
        roles,
    });
};

updateEvent.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
    body: {
        id: Joi.number().integer().positive().optional(),
        start: Joi.date().iso().optional(),
        end: Joi.date().iso().optional(),
        locationId: Joi.number().integer().positive().optional(),
        createdBy: Joi.number().integer().positive().optional(),
    },
};

const deleteEvent = async (ctx) => {
    const { memberId, roles } = ctx.state.session;
    await eventService.deleteById(Number(ctx.params.id), memberId, roles);
    ctx.status = 204;
};

deleteEvent.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
};

// staffmembers 

const getStaffmembersbyEventId = async (ctx) => {
    ctx.body = await eventService.getAllStaffmembers(Number(ctx.params.eventId));
};

getStaffmembersbyEventId.validationScheme = {
    params: {
        eventId: Joi.number().integer().positive(),
    },
};

const createStaffmemberbyEventId = async (ctx) => {
    ctx.status = 201;
    ctx.body = await eventService.createStaffmember({
        eventId: Number(ctx.params.eventId),
        memberId: Number(ctx.state.session.memberId),
    });
};

createStaffmemberbyEventId.validationScheme = {
    params: {
        eventId: Joi.number().integer().positive(),
    },
};

const deleteStaffmemberbyEventId = async (ctx) => {
    ctx.status = 204;
    const { memberId, roles } = ctx.state.session;
    await eventService.deleteStaffmember({
        data: {
            eventId: Number(ctx.params.eventId),
            memberId: Number(ctx.params.id),
        },
        session: {
            memberId,
            roles,
        },
    });
};

deleteStaffmemberbyEventId.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
        eventId: Joi.number().integer().positive(),
    },
};

/**
 * Install Event routes in the given router.
 *
 * @param {Router} app - The parent router.
 */
module.exports = (app) => {
    const router = new Router({
        prefix: '/events',
    });

    router.use(requireAuthentication);

    router.get('/',
        validate(getAllEvents.validationScheme),
        getAllEvents,
    );

    router.post('/',
        validate(createEvent.validationScheme),
        createEvent,
    );

    router.get('/:id',
        validate(getEventById.validationScheme),
        getEventById,
    );

    router.put('/:id',
        validate(updateEvent.validationScheme),
        updateEvent,
    );

    router.delete('/:id',
        validate(deleteEvent.validationScheme),
        deleteEvent,
    );

    router.get('/:eventId/staffmembers',
        validate(getStaffmembersbyEventId.validationScheme),
        getStaffmembersbyEventId,
    );

    router.post('/:eventId/staffmembers',
        validate(createStaffmemberbyEventId.validationScheme),
        createStaffmemberbyEventId,
    );

    router.delete('/:eventId/staffmembers/:id',
        validate(deleteStaffmemberbyEventId.validationScheme),
        checkIdParams,
        deleteStaffmemberbyEventId,
    );

    app.use(router.routes())
        .use(router.allowedMethods());
};
