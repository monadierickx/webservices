
const Role = require('./roles');


const checkIdParams = (ctx, next) => {
    const { memberId, roles } = ctx.state.session;
    const id = ctx.params.id;

    if (id !== memberId && !roles.includes(Role.ADMIN)) {
        return ctx.throw(
            403,
            'You are not allowed to acces this member\'s information',
            {
                code: 'FORBIDDEN',
            },
        );
    }
    return next();
};

const checkMemberIdParams = (ctx, next) => {
    const { memberId, roles } = ctx.state.session;
    const id = ctx.params.memberId;

    if (id !== memberId && !roles.includes(Role.ADMIN)) {
        return ctx.throw(
            403,
            'You are not allowed to acces this member\'s information',
            {
                code: 'FORBIDDEN',
            },
        );
    }
    return next();
};

module.exports = {
    checkIdParams, 
    checkMemberIdParams,
};