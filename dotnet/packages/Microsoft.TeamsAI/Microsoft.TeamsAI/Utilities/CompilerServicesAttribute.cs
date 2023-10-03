#pragma warning disable IDE0130 // Namespace does not match folder structure
#pragma warning disable IDE0160 // Convert to block scoped namespace
namespace System.Runtime.CompilerServices;
#pragma warning restore IDE0160
#pragma warning restore IDE0130

#if !NETCOREAPP3_0_OR_GREATER // CallerArgumentExpressionAttribute is built-in in .NET Core 3.0+

[AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false, Inherited = false)]
internal sealed class CallerArgumentExpressionAttribute : Attribute
{
    public string ParameterName { get; }

    public CallerArgumentExpressionAttribute(string parameterName)
    {
        this.ParameterName = parameterName;
    }

}

#endif
