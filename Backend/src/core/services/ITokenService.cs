using System.Collections.Generic;
using FMDDS.Data.Entities;

namespace FMDDS.Core.Services
{
    /// <summary>
    /// JWT Token generation contract.
    /// Tags: #backend #security
    /// </summary>
    public interface ITokenService
    {
        string GenerateToken(User user, string roleName, IEnumerable<string> permissions);
    }
}
