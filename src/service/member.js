const config = require('config');

const { getPrisma } = require('../../prisma/index');
const ServiceError = require('../core/serviceError');
const Role = require('../core/roles');
const { hashPassword, verifyPassword } = require('../core/password');
const { generateJWT, verifyJWT } = require('../core/jwt');
const { getLogger } = require('../core/logging');
const NODE_ENV = config.get('env');

const handleDBError = require('./_handleDBError');

const makeExposedMember = ({ id, name, email, roles, onStaff, createdEvents }) => ({
    id,
    name,
    email,
    roles: JSON.parse(roles),
    onStaff,
    createdEvents,
});

const makeLoginData = async (member) => {
    const token = await generateJWT(member);
    return {
        token,
        member: makeExposedMember(member),
    };
};

const login = async (email, password) => {
    const prisma = await getPrisma();

    const member = await prisma.member.findUnique({
        where: {
            email: email,
        },
        include: {
            onStaff: true,
            createdEvents: true,
        },
    });

    if (!member) {
        throw ServiceError.unauthorized('The given email or password do not match');
    }

    const valid = await verifyPassword(password, member.password_hash);

    if (!valid) {
        throw ServiceError.unauthorized('The given email or password do not match');
    }

    return await makeLoginData(member);

};

const register = async ({ id, name, email, password }) => {
    const prisma = await getPrisma();

    if (id) {
        const memberWithSameId = await prisma.member.findUnique({
            where: { id: parseInt(id) },
        });
        if (memberWithSameId) {
            throw ServiceError.validationFailed(`A member with id ${id} already exists`, { id });
        }
    }

    const memberWithSameEmail = await prisma.member.findUnique({
        where: {
            email: email,
        },
    });

    if (memberWithSameEmail) {
        throw ServiceError.validationFailed(`A member with email ${email} already exists`, { email });
    }

    try {
        const passwordHash = await hashPassword(password);

        const member = await prisma.member.create({
            data: {
                id,
                name,
                email,
                roles: JSON.stringify([Role.MEMBER]),
                password_hash: passwordHash,
            },
            include: {
                onStaff: true,
                createdEvents: true,
            },
        });
        return await makeLoginData(member);
    } catch (error) {
        throw handleDBError(error);
    }
};

const checkAndParseSession = async (authHeader) => {
    if (!authHeader) {
        throw ServiceError.unauthorized('You need to be signed in');
    }

    if (!authHeader.startsWith('Bearer')) {
        throw ServiceError.unauthorized('Invalid authentication token');
    }

    const authToken = authHeader.substring(7);

    try {
        const { memberId, roles } = await verifyJWT(authToken);
        return {
            memberId,
            roles,
            authToken,
        };
    } catch (err) {
        if (err.message === 'jwt expired'){
            throw ServiceError.loginTimeOut('Your session is expired, log in to continue');
        }
        if (err.message === 'invalid signature'){
            throw ServiceError.unauthorized(
                `You need to be signed in on the ${NODE_ENV} version of the app`,
            );
        }
        getLogger().error(err, { err });
        throw new Error(err.message);
    }
};


const checkRole = async (role, roles) => {
    const hasPermission = roles.includes(role);

    if (!hasPermission) {
        throw ServiceError.forbidden('You are not allowed this action');
    }
};

const getAll = async () => {
    const prisma = await getPrisma();
    const members = await prisma.member.findMany({
        include: {
            onStaff: true,
            createdEvents: true,
        },
    });
    return members.map((member) => makeExposedMember(member));
};

const getById = async (id) => {
    const prisma = await getPrisma();
    console.log(id);
    const member = await prisma.member.findUnique({
        where: { id: parseInt(id) },
        include: {
            onStaff: true,
            createdEvents: true,
        },
    });
    if (!member) {
        throw ServiceError.notFound(`No member with id ${id} exists`, { id });
    }
    return makeExposedMember(member);
};

const updateById = async ({currentId, data}) => {
    const prisma = await getPrisma();

    console.log(currentId);
    await getById(currentId);

    if (data.id && data.id !== currentId) {
        const existingMember = await prisma.member.findUnique({
            where: {
                id: parseInt(data.id),
            },
        });
        if (existingMember) {
            const id = data.id;
            throw ServiceError.validationFailed(`A member with id ${data.id} already exists`, { id });
        }

    }

    try {
        const member = await prisma.member.update({
            where: {
                id: parseInt(currentId),
            },
            data,
            include: {
                onStaff: true,
                createdEvents: true,
            },
        });
        return makeExposedMember(member);
    } catch (error) {
        throw handleDBError(error);
    }
};

const deleteById = async (id) => {
    const prisma = await getPrisma();

    await getById(id);

    try {
        const createdEvents = await prisma.event.findMany({
            where: {
                createdBy: id,
            },
        });

        const deleteEventsPromises = createdEvents.map(async ({ id }) => {
            const deleteStaffmembersForEvent = prisma.staffmember.deleteMany({
                where: {
                    eventId: id,
                },
            });
            const deleteEvent = prisma.event.delete({
                where: {
                    id: id,
                },
            });
            return await prisma.$transaction([deleteStaffmembersForEvent, deleteEvent]);
        });

        await Promise.all(deleteEventsPromises); // wachten op de map 

        const deleteStaffmembersForMember = prisma.staffmember.deleteMany({
            where: {
                memberId: id,
            },
        });

        const deleteMember = prisma.member.delete({
            where: {
                id: id,
            },
        });

        return await prisma.$transaction([deleteStaffmembersForMember, deleteMember]);
    } catch (error) {
        throw handleDBError(error);
    }
};

const getAllOnStaffEvents = async (memberId) => {
    const prisma = await getPrisma();

    const member = await getById(memberId);

    const eventPromises = member.onStaff.map(async ({ eventId }) => {
        return prisma.event.findUnique({
            where: { id: parseInt(eventId) },
        });
    });
    return await Promise.all(eventPromises);
};


module.exports = {
    getAll,
    getById,
    register,
    updateById,
    deleteById,
    getAllOnStaffEvents,
    login,
    checkAndParseSession,
    checkRole,
};