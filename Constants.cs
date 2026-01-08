using System.IdentityModel.Tokens.Jwt;

namespace MangoSPA;

/// <summary>
/// The following class was copied from the CentralAuth reporsitory > 'Shared' library project
/// </summary>
public class Constants
{
    public class ClaimType
    {
        public const string TrackingId = JwtRegisteredClaimNames.Jti;
        public const string Email = JwtRegisteredClaimNames.Email;
        public const string UserId = "userId";
        public const string Role = "role";
        public const string ContactId = "contactId";
        public const string ContactRole = "contactRole";
        public const string ClientKey = "clientKey";
        public const string SecurityLevel = "securityLevel";
        public const string IsAutoProvisioned = "isAutoProvisioned";
        public const string HasMultipleSites = "hasMultipleSites";
        public const string IsServiceAccount = "isServiceAccount";
        public const string AccessToken = "token";
        //public const string SessionId = "sessionId";

        // Indicates whether /login endpoint or /token endpoint was used to generate a JWT token
        public const string IsInternal = "isInternal";
    }

    public class Role
    {
        public const string Admin = "admin";
    }

    public class Policy
    {
        public const string FullAccess = "FullAccess";
        public const string SuperUserContact = "SuperUserContact";
        public const string AdminUserContact = "AdminUserContact";
        public const string AdminOrSuperUserContact = "AdminOrSuperUserContact";
    }

    public class Headers
    {
        public const string TrackingId = "TrackingId";
    }
}
