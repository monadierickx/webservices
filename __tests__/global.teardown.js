const { getPrisma, shutDownPrisma } = require('../prisma');


module.exports = async () => {
    const prisma = await getPrisma();
    const deleteStaffmembers = prisma.staffmember.deleteMany({});
    const deleteEvents = prisma.event.deleteMany({});
    const deleteLocations = prisma.location.deleteMany({});
    const deleteMembers = prisma.member.deleteMany({});

    await prisma.$transaction([deleteStaffmembers, deleteEvents, deleteLocations, deleteMembers]);

    await shutDownPrisma();
};
