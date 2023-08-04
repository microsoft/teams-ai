﻿using System;
using System.Collections.Generic;
using System.Net;
using System.Text;

namespace Microsoft.TeamsAI.Exceptions
{
    /// <summary>
    /// A custom exception for invoke response errors.
    /// </summary>
    internal class InvokeResponseException : Exception
    {
        private readonly HttpStatusCode _statusCode;
        private readonly object? _body;

        /// <summary>
        /// A getter for the <see cref="InvokeResponseException"/> status code
        /// </summary>
        public HttpStatusCode StatusCode => _statusCode;

        /// <summary>
        /// A getter for the <see cref="InvokeResponseException"/> body
        /// </summary>
        public object? Body => _body;

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        /// <param name="statusCode">The Http status code of the error.</param>
        /// <param name="body">The body of the exception. Default is null.</param>
        public InvokeResponseException(HttpStatusCode statusCode, object? body = null, Exception? innerException = null) : base("InvokeResponseException", innerException)
        {
            _statusCode = statusCode;
            _body = body;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        public InvokeResponseException()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        /// <param name="message">The message that explains the reason for the exception, or an empty string.</param>
        public InvokeResponseException(string message)
            : base(message)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        /// <param name="message">The message that explains the reason for the exception, or an empty string.</param>
        /// <param name="innerException">Gets the System.Exception instance that caused the current exception.</param>
        public InvokeResponseException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
