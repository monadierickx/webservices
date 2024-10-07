
const memberService = require('../service/member');

const requireAuthentication = async (ctx, next) => {
    const {authorization} = ctx.headers;
    const {authToken, ...session} = await memberService.checkAndParseSession(authorization);

    ctx.state.session = session;
    ctx.state.authToken = authToken;

    return next();
};

const makeRequireRole = (role) => async (ctx, next) => {
    const {roles = []} = ctx.state.session;

    await memberService.checkRole(role, roles);

    return next();
};

module.exports = {
    requireAuthentication,
    makeRequireRole,
};
