
const Router = require('@koa/router');
const Joi = require('joi');

const memberService = require('../service/member');
const validate = require('../core/validation');
const { requireAuthentication, makeRequireRole } = require('../core/auth');
const Role = require('../core/roles');
const { checkIdParams, checkMemberIdParams } = require('../core/accesChecks');


const register = async (ctx) => {
    ctx.status = 201;
    const member = await memberService.register({
        ...ctx.request.body,
    });
    ctx.body = member;
};

register.validationScheme = {
    body: {
        id: Joi.number().integer().positive().optional(),
        email: Joi.string().email(),
        name: Joi.string().max(225).optional(),
        password: Joi.string().min(8).max(50),
    },
};

const login = async (ctx) => {
    const { email, password } = ctx.request.body;
    const token = await memberService.login(email, password);
    ctx.body = token;
};

login.validationScheme = {
    body: {
        email: Joi.string().email(),
        password: Joi.string(),
    },
};

const getAllMembers = async (ctx) => {
    ctx.body = await memberService.getAll();
};

getAllMembers.validationScheme = null;

const getMemberById = async (ctx) => {
    ctx.body = await memberService.getById(Number(ctx.params.id));
};

getMemberById.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
};

const updateMember = async (ctx) => {
    ctx.body = await memberService.updateById(
        {
            currentId: Number(ctx.params.id), 
            data: {
                ...ctx.request.body,
            }},
    );
};

updateMember.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
    body: {
        id: Joi.number().integer().positive().optional(),
        email: Joi.string().email().optional(),
        name: Joi.string().max(225).optional(),
    },
};

const deleteMember = async (ctx) => {
    await memberService.deleteById(Number(ctx.params.id));
    ctx.status = 204;
};

deleteMember.validationScheme = {
    params: {
        id: Joi.number().integer().positive(),
    },
};

const getOnStaffEventsbyMemberId = async (ctx) => {
    ctx.status = 200;
    ctx.body = await memberService.getAllOnStaffEvents(Number(ctx.params.memberId));
};

getOnStaffEventsbyMemberId.validationScheme = {
    params: {
        memberId: Joi.number().integer().positive(),
    },
};

/**
 * Install member routes in the given router.
 *
 * @param {Router} app - The parent router.
 */
module.exports = (app) => {
    const router = new Router({
        prefix: '/members',
    });

    router.post('/login', validate(login.validationScheme), login);
    router.post('/register', validate(register.validationScheme), register);

    const requireAdmin = makeRequireRole(Role.ADMIN);

    router.get('/',
        requireAuthentication,
        requireAdmin,
        validate(getAllMembers.validationScheme),
        getAllMembers);

    router.get('/:id',
        requireAuthentication,
        validate(getMemberById.validationScheme),
        checkIdParams,
        getMemberById);

    router.put('/:id',
        requireAuthentication,
        validate(updateMember.validationScheme),
        checkIdParams,
        updateMember);

    router.delete('/:id',
        requireAuthentication,
        validate(deleteMember.validationScheme),
        checkIdParams,
        deleteMember);

    router.get('/:memberId/staffmembers',
        requireAuthentication,
        validate(getOnStaffEventsbyMemberId.validationScheme),
        checkMemberIdParams,
        getOnStaffEventsbyMemberId);

    app.use(router.routes())
        .use(router.allowedMethods());
};
