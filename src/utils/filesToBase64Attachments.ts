import type { ContactAttachmentInput } from '@/api/types/dotnet-contract'

/** Tarayıcı `File` listesini API’nin beklediği Base64 eklerine çevirir (data URL gövdesi). */
export async function filesToBase64Attachments(files: File[]): Promise<ContactAttachmentInput[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<ContactAttachmentInput>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const r = String(reader.result ?? '')
            const base64 = r.includes('base64,') ? (r.split('base64,').pop() ?? r) : r
            resolve({
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              base64: base64.trim(),
            })
          }
          reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
          reader.readAsDataURL(file)
        }),
    ),
  )
}
