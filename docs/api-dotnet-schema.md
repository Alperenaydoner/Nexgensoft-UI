# .NET Core API — İstek / Cevap Şeması

React uygulaması `src/api/types/dotnet-contract.ts` ile aynı sözleşmeyi kullanır. Varsayılan JSON: **camelCase** (`PropertyNamingPolicy = JsonNamingPolicy.CamelCase`).

## Ortak başlıklar

| Başlık | Açıklama |
|--------|----------|
| `Accept-Language` | `tr`, `en` — `httpClient` i18n dilinden otomatik ekler |
| `Content-Type` | `application/json` (POST/PUT gövdeleri) |
| `Authorization` | İhtiyaç halinde `Bearer` token (middleware ile eklenir) |

## Başarılı sarmalayıcı: `ApiResult<T>`

```json
{
  "success": true,
  "data": { },
  "message": null,
  "traceId": "00-...",
  "errors": null
}
```

### C# örneği

```csharp
public record ApiResult<T>(
    bool Success,
    T? Data,
    string? Message,
    string? TraceId,
    IReadOnlyList<string>? Errors
);
```

## Hata: Problem Details (RFC 7807)

HTTP 4xx/5xx gövdesi `application/problem+json` olabilir.

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": ["The Email field is not a valid e-mail address."]
  },
  "traceId": "00-..."
}
```

## Sayfalama: `PageRequest` + `PagedResult<T>`

İstek (query): `page` (varsayılan 1), `pageSize` (varsayılan 20, üst sınır 100). Sunucu: `CoreService.Common.PageRequest` ile normalize edilir; `Skip = (pageNumber - 1) * pageSize`.

### Cevap: `PagedResult<T>`

```json
{
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 100,
  "totalPages": 5,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

## Örnek endpoint: İletişim formu

**İstek** — `POST /api/v1/contact` (`application/json`)

- `message` en az **10** karakter.
- İsteğe bağlı **`attachments`**: her öğede `fileName`, `contentType`, `base64` (ham veya `data:...;base64,` gövdesi). Sunucu doğrulayıp `contact_attachments` tablosunda **Base64 metin** olarak saklar.

```json
{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "company": "Nexgensoft",
  "message": "Merhaba, en az on karakter.",
  "attachments": [
    {
      "fileName": "not.pdf",
      "contentType": "application/pdf",
      "base64": "JVBERi0xLjQK..."
    }
  ]
}
```

**Cevap** — `200 OK`, `ApiResult<Guid>` (oluşturulan iletişim kaydı id’si; JSON’da guid string)

```json
{
  "success": true,
  "data": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": null,
  "traceId": null,
  "errors": null
}
```

## Vite proxy

Geliştirmede `/api` istekleri CoreService’e yönlendirilir (varsayılan `https://localhost:7001`; HTTP profili için `.env` içinde `VITE_DEV_PROXY_TARGET=http://localhost:5293`). Üretimde `VITE_API_BASE_URL` kullanın.

## Dil (.NET)

`Program.cs` içinde `RequestLocalizationOptions` ile desteklenen kültürler (`tr`, `en`) tanımlanmalı; `Accept-Language` ile seçilir.

## Statik site içeriği

**İstek:** `GET /api/v1/content/site?locale=tr`

**Cevap gövdesi:** `SiteContentBundle` (`dotnet-contract.ts`) — `navigation` + `pages` (yerleşim JSON’u) ve `translation` (i18n ile aynı ağaç; DB’de `site_localized_strings` satırlarından üretilir).

```json
{
  "locale": "tr",
  "navigation": [
    { "slug": "", "label": "Ana Sayfa", "order": 0 }
  ],
  "pages": {
    "home": {
      "slug": "home",
      "locale": "tr",
      "title": "Ana Sayfa",
      "blocks": [{ "key": "heroTitle", "content": "..." }]
    }
  },
  "translation": {
    "nav": { "home": "Ana Sayfa" },
    "home": { "badge": "…" }
  }
}
```

`VITE_USE_REMOTE_CONTENT=true` iken `fetchSiteContentBundle` sonrası `translation` i18n `translation` namespace’ine merge edilir (`src/i18n/bootstrapRemoteContent.ts`). Yerel `src/locales/*.json` yedek / geliştirme için kalır; seed kaynağı `CoreService` içindeki `SeedLocales/*.json` (Web ile senkron tutulmalı).
