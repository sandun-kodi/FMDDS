using System;
using System.Collections.Concurrent;
using System.Linq;

namespace FMDDS.Core.Services
{
    public interface ITokenDenylistService
    {
        void RevokeToken(string jti, DateTime? expiration = null);
        bool IsRevoked(string jti);
    }

    /// <summary>
    /// In-Memory JWT Denylist Service for single-process development environments.
    /// NOTE: Revoked tokens stored in memory are lost when the application restarts
    /// and are not shared across multi-node clusters. For production deployments,
    /// a distributed store (e.g. Redis) or refresh-token architecture must be used.
    /// </summary>
    public class TokenDenylistService : ITokenDenylistService
    {
        private readonly ConcurrentDictionary<string, DateTime> _revokedJtis = new();

        public void RevokeToken(string jti, DateTime? expiration = null)
        {
            if (!string.IsNullOrWhiteSpace(jti))
            {
                var expiry = expiration ?? DateTime.UtcNow.AddHours(8);
                _revokedJtis.TryAdd(jti.Trim(), expiry);
                CleanupExpired();
            }
        }

        public bool IsRevoked(string jti)
        {
            if (string.IsNullOrWhiteSpace(jti)) return false;

            CleanupExpired();
            return _revokedJtis.TryGetValue(jti.Trim(), out var expiry) && expiry > DateTime.UtcNow;
        }

        private void CleanupExpired()
        {
            var now = DateTime.UtcNow;
            var expiredKeys = _revokedJtis.Where(kvp => kvp.Value <= now).Select(kvp => kvp.Key).ToList();
            foreach (var key in expiredKeys)
            {
                _revokedJtis.TryRemove(key, out _);
            }
        }
    }
}
