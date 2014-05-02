(function (global) {

    "use strict";

    var Appacitive = global.Appacitive;

    Appacitive.Error = function(status) {
        status = status || {};
        this.code = status.code || "400";
        this.message = status.message || "Unknown Error";
        if (status.referenceId) this.referenceId = status.referenceId;
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

        Unknown_cause: 100,
        NoHttpClassFound: 600,
        NotImplemented: 700,
        FunctionNotFound: 800,
        InvalidParameters: 900,
        No_Connection: 1001,
        NotInitialized: 1001,
        InvalidQuery: 1003,
        IvalidClassName: 1004,
        MissingId: 1005,
        IvalidKeyName: 1006,
        InvalidJson: 1007,
        ObjectNotFound: 1008,
        ProvideType: 1009,
        ProvideRelation: 1010,
        ProvideLabel: 1011,    
        InvalidAccessName: 1020,
        InvalidScript: 1016,
        InvalidFileData: 1030,
        MissingUsername: 2001,
        MissingPassword: 2002,
        DuplicateUsername: 2003,
        MissingEmail: 2004,
        AccountLinked: 2005,
        MissingLinkType: 2006,
        XDomainRequest: 5000
    });

})(global);
