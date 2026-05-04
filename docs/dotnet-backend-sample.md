# .NET 8 — Örnek APIResult ve ContactController

`Program.cs` içinde camelCase ve lokalizasyon:

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.Configure<RequestLocalizationOptions>(o =>
{
    var supported = new[] { "tr", "en" };
    o.SetDefaultCulture("tr")
     .AddSupportedCultures(supported)
     .AddSupportedUICultures(supported);
});

var app = builder.Build();
app.UseRequestLocalization();
```

## ApiResult

```csharp
public record ApiResult<T>(
    bool Success,
    T? Data,
    string? Message,
    string? TraceId,
    IReadOnlyList<string>? Errors
)
{
    public static ApiResult<T> Ok(T data) =>
        new(true, data, null, null, null);

    public static ApiResult<T> Fail(string message, IEnumerable<string>? errors = null) =>
        new(false, default, message, Activity.Current?.Id, errors?.ToArray());
}
```

## Controller

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class ContactController : ControllerBase
{
    [HttpPost]
    public ActionResult<ApiResult<Guid>> Post([FromBody] ContactFormDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        // TODO: kaydet
        return Ok(ApiResult<Guid>.Ok(Guid.NewGuid()));
    }
}

public record ContactFormDto(
    string FullName,
    string Email,
    string? Company,
    string Message
);
```

İstemci `Accept-Language` gönderir; `IStringLocalizer` veya `HttpContext.GetCurrentCulture()` ile mesajlar yerelleştirilebilir.
