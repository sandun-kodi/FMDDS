using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace FMDDS.API.Middlewares
{
    /// <summary>
    /// Requirement validation class checking for specific permission string.
    /// Tags: #backend #security
    /// </summary>
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }

    /// <summary>
    /// Evaluates if authenticated user claims contain the required permission parameter.
    /// </summary>
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            // Extract the permissions claims list from authenticated user token claims
            var permissionsClaims = context.User.FindAll(c => c.Type == "permissions").Select(c => c.Value);

            if (permissionsClaims.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
