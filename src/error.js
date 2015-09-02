(function (global) {

    "use strict";

    var Appacitive = global.Appacitive;

    Appacitive.Error = function(status) {
        if (_type.isString(arguments[0]) || _type.isNumber(arguments[0])) {
            status = {
                code: arguments[0],
                message: arguments[1],
                referenceId: arguments[2],
                additionalMessages: arguments[3]
            }
        }

        this.code = status.code || "400";
        this.message = status.message || "Unknown Error";
        if (status.referenceId) this.referenceId = status.referenceid || status.referenceId;
        if (status.additionalmessages) this.additionalMessages = status.additionalmessages || additionalMessages;
    };

    Appacitive.Error.toJSON = function(error) {
        return {
            code: error.code,
            message: error.message,
            referenceId: error.referenceId,
            additionalmessages: error.additionalMessages
        };
    };

    _extend(Appacitive.Error, {
    
        // Appacitive Status codes

        BadRequest: "400",
        AccessControl: "401",
        PaymentRequired: "402",
        UsageLimitReached: "403",
        NotFound: "404",
        Duplicate: "435",
        MvccFailure: "409",
        PreconditionFailed: "412",
        ApiAuthenticationError: "420",
        IdentityFailures: "421",
        IncorrectConfiguration: "436",
        InternalServerError: "500",
        DataAccessFailure: "512",

        //SDK Internal Error codes

        UnknownCause: 100,
        InvalidParameters: '400',
        ConnectionFailed: 1001,
        MissingId: '404',
        InvalidJson: 1007,
        DuplicateUsername: '435',
        DuplicateValue: '435',
        XDomainRequest: 5000
    });

})(global);
