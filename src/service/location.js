const { getPrisma } = require('../../prisma/index');
const ServiceError = require('../core/serviceError');

const handleDBError = require('./_handleDBError');

async function getAll() {
    const prisma = await getPrisma();
    return await prisma.location.findMany();
};

const getById = async (id) => {
    const prisma = await getPrisma();
    const location = await prisma.location.findUnique({
        where: { id: parseInt(id) },
        include: {
            events: true,
        },
    });
    if (!location) {
        throw ServiceError.notFound(`No location with id ${id} exists`, { id });
    }
    return location;
};

const create = async (data) => {
    const prisma = await getPrisma();

    if (data.id) {
        const id = data.id;
        const existingLocation = await prisma.location.findUnique({
            where: { id: parseInt(id) },
        });
        if (existingLocation) {
            throw ServiceError.validationFailed(`A location with id ${id} already exists`, { id });
        }
    }

    const existingLocation = await prisma.location.findUnique({
        where: {
            city_street_number: {
                city: data.city,
                street: data.street,
                number: data.number,
            },
        },
    });
    if (existingLocation) {
        const city = data.city;
        const street = data.street;
        const number = data.number;
        throw ServiceError.validationFailed(
            `A location with address ${city} ${street} ${number} already exists`,
            { city, street, number },
        );
    }

    try {
        return await prisma.location.create({
            data,
        });
    } catch (error) {
        throw handleDBError(error);
    }
};

const updateById = async (currentId, data) => {
    const prisma = await getPrisma();
    const currentLocation = await getById(currentId);

    if (data.id && data.id !== currentId) {
        const existingLocation = await prisma.location.findUnique({
            where: {
                id: data.id,
            },
        });
        if (existingLocation) {
            const id = data.id;
            throw ServiceError.validationFailed(`A location with id ${id} already exists`, { id });
        }
    }

    if (data.city || data.street || data.number) {
        const existingLocation = await prisma.location.findUnique({
            where: {
                city_street_number: {
                    city: data.city || currentLocation.city,
                    street: data.street || currentLocation.street,
                    number: data.number || currentLocation.number,
                },
            },
        });
        if (existingLocation && existingLocation.id !== currentLocation.id) {
            const city = data.city || currentLocation.city;
            const street = data.street || currentLocation.street;
            const number = data.number || currentLocation.number;
            throw ServiceError.validationFailed(
                `A location with address ${city} ${street} ${number} already exists`,
                { city, street, number },
            );
        };
    }

    try {
        return await prisma.location.update({
            where: { id: parseInt(currentId) },
            data,
        });
    } catch (error) {
        throw handleDBError(error);
    };
};

const deleteById = async (id) => {
    const prisma = await getPrisma();
    const location = await prisma.location.findUnique({
        where: { id: parseInt(id) },
    });

    if (!location) {
        throw ServiceError.notFound(`No location with id ${id} exists`, { id });
    };

    try {

        const events = await prisma.event.findMany({
            where: {
                locationId: id,
            },
        });

        await events.map(async ({ id }) => {
            const deleteStaffmembersForEvent = prisma.staffmember.deleteMany({
                where: {
                    eventId: id,
                },
            });
            return await prisma.$transaction([deleteStaffmembersForEvent]);
        });

        const deleteEvents = prisma.event.deleteMany({
            where: {
                locationId: id,
            },
        });

        const deleteLocation = prisma.location.delete({
            where: { id: parseInt(id) },
        });

        return await prisma.$transaction([deleteEvents, deleteLocation]);

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
};