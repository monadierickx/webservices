const ServiceError = require('../core/serviceError'); 


const handleDBError = (error) => {
    const { code = '', sqlMessage } = error; 

  
    if (code === 'ER_DUP_ENTRY') {
        switch (true) {
        case sqlMessage.includes('idx_member_email_unique'):
            return ServiceError.validationFailed(
                'There is already a member with this email address',
            );
        default:
            return ServiceError.validationFailed('This item already exists');
        }
    }

  
    if (code.startsWith('ER_NO_REFERENCED_ROW')) {
        switch (true) {
        case sqlMessage.includes('fk_event_createdby'):
            return ServiceError.notFound('This member does not exist');
        case sqlMessage.includes('fk_event_locationid'):
            return ServiceError.notFound('This location does not exist');
        }
    }

    // Return error because we don't know what happened
    return error;
};

module.exports = handleDBError; 
