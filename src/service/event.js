const { getPrisma } = require('../../prisma/index');
const ServiceError = require('../core/serviceError');
const Role = require('../core/roles');

const locationService = require('./location');
const memberService = require('./member');
const handleDBError = require('./_handleDBError');

const getAll = async () => {
    const prisma = await getPrisma();
    return await prisma.event.findMany({
        include: {
            location: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            staff: true,
        },
    });
};

const getById = async (id) => {
    const prisma = await getPrisma();
    const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
        include: {
            location: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            staff: true,
        },
    });
    if (!event) {
        throw ServiceError.notFound(`No event with id ${id} exists`, { id });
    };
    return event;
};

const create = async (data) => {
    const prisma = await getPrisma();

    await locationService.getById(data.locationId);
    await memberService.getById(data.createdBy);

    try {
        return await prisma.event.create({
            data,
            include: {
                location: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                staff: true,
            },
        });
    } catch (error) {
        throw handleDBError(error);
    }
};

const updateById = async ({ currentId, data, memberId, roles }) => {
    const prisma = await getPrisma();

    const event = await prisma.event.findUnique({
        where: { id: parseInt(currentId) },
    });

    // bestaat het event? 
    if (!event) {
        throw ServiceError.notFound(`No event with id ${currentId} exists`, { currentId });
    };

    // mag deze member dit event aanpassen? (creator or admin)
    if (event.createdBy !== memberId && !roles.includes(Role.ADMIN)) {
        throw ServiceError.forbidden('You are not allowed to change this event\'s information');
    }

    // is het (eventuele) nieuwe id vrij?
    if (data.id) {
        const existingId = await prisma.event.findUnique({
            where: {
                id: data.id,
            },
        });
        if (existingId) {
            const id = data.id;
            throw ServiceError.validationFailed(`An event with id ${id} already exists`, { id });
        }
    }

    // bestaat de (eventuele) nieuwe location?
    if (data.locationId) {
        await locationService.getById(data.locationId);
    }

    // bestaat de (eventuele) nieuwe creator?
    if (data.createdBy) {
        await memberService.getById(data.createdBy);
    }

    try {
        return await prisma.event.update({
            where: { id: parseInt(currentId) },
            data,
            include: {
                location: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                staff: true,
            },
        });
    } catch (error) {
        throw handleDBError(error);
    }
};

const deleteById = async (id, memberId, roles) => {
    const prisma = await getPrisma();
    const event = await getById(id);

    if (event.createdBy !== memberId && !roles.includes(Role.ADMIN)) {
        throw ServiceError.forbidden('You are not allowed to delete this event\'s information');
    }

    try {
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
    } catch (error) {
        throw handleDBError(error);
    };
};

// staffmember

const getAllStaffmembers = async (eventId) => {
    const prisma = await getPrisma();
    await getById(eventId);

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
            staff: true,
        },
    });
    const staffmemberPromises = event.staff.map(async ({ memberId }) => {
        return prisma.member.findUnique({
            where: {
                id: parseInt(memberId),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    });
    return await Promise.all(staffmemberPromises);
};

const createStaffmember = async ({ eventId, memberId }) => {
    const prisma = await getPrisma();

    await getById(eventId);
    await memberService.getById(memberId);

    try {
        return await prisma.staffmember.create({
            data: {
                eventId,
                memberId,
            },
        });
    } catch (error) {
        throw handleDBError(error);
    };
};

const deleteStaffmember = async ({ data, session }) => {
    const prisma = await getPrisma();

    console.log(data.memberId);
    console.log(session.memberId);

    // if (data.memberId !== session.memberId && !session.roles.includes(Role.ADMIN)) {
    //     throw ServiceError.forbidden('You are not allowed to delete this member\'s information');
    // }
    // wordt gecontroleerd via accesChecks 

    await getById(data.eventId);
    await memberService.getById(data.memberId);

    const staffmember = await prisma.staffmember.findUnique({
        where: {
            memberId_eventId: {
                memberId: parseInt(data.memberId),
                eventId: parseInt(data.eventId),
            },
        },
    });
    if (!staffmember) {
        const memberId = data.memberId;
        const eventId = data.eventId;
        throw ServiceError.notFound(
            `No staffmember with memberId ${data.memberId} and eventId ${data.eventId} exists`, { memberId, eventId },
        );
    }
    try {
        return await prisma.staffmember.delete({
            where: {
                memberId_eventId: {
                    memberId: parseInt(data.memberId),
                    eventId: parseInt(data.eventId),
                },
            },
        });
    } catch (error) {
        throw handleDBError(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    updateById,
    deleteById,
    getAllStaffmembers,
    createStaffmember,
    deleteStaffmember,
};