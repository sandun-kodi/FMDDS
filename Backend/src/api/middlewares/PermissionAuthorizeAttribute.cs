using System;
using Microsoft.AspNetCore.Authorization;

namespace FMDDS.API.Middlewares
{
    /// <summary>
    /// Custom Authorization Attribute to enforce permission checks on API routes.
    /// Tags: #backend #security
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
    public class PermissionAuthorizeAttribute : AuthorizeAttribute
    {
        public string Permission { get; }

        public PermissionAuthorizeAttribute(string permission) : base(policy: permission)
        {
            Permission = permission;
        }
    }
}
