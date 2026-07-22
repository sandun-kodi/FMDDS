using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FMDDS.API.Middlewares
{
    /// <summary>
    /// Global exception handling middleware capturing unhandled exceptions and returning standard JSON responses.
    /// Tags: #backend #security #middleware
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred during HTTP request execution: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new ExceptionResponse();

            switch (exception)
            {
                case ArgumentException argEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Code = "ERR_VALIDATION_FAILED";
                    response.Message = argEx.Message;
                    break;
                case InvalidOperationException invEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Code = "ERR_INVALID_OPERATION";
                    response.Message = invEx.Message;
                    break;
                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response.Code = "ERR_UNAUTHORIZED";
                    response.Message = "Access denied.";
                    break;
                case KeyNotFoundException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Code = "ERR_NOT_FOUND";
                    response.Message = "The requested resource was not found.";
                    break;
                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Code = "ERR_INTERNAL_SERVER";
                    response.Message = "An unexpected error occurred on the server.";
                    break;
            }

            var jsonResult = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            return context.Response.WriteAsync(jsonResult);
        }
    }

    public class ExceptionResponse
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
