import type { ContactAttachmentInput } from '@/api/types/dotnet-contract'

/** Tarayıcı `File` listesini API’nin beklediği Base64 eklerine çevirir (data URL gövdesi). */
export async function filesToBase64Attachments(
  files: File[],
  onProgress?: (fileKey: string, progress: number) => void,
  maxRetries = 1,
): Promise<ContactAttachmentInput[]> {
  function readSingleFile(file: File, retriesLeft: number): Promise<ContactAttachmentInput> {
    return new Promise<ContactAttachmentInput>((resolve, reject) => {
      const reader = new FileReader()
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      onProgress?.(fileKey, 0)
      reader.onprogress = (e) => {
        if (!e.lengthComputable) {
          return
        }
        const p = Math.round((e.loaded / e.total) * 100)
        onProgress?.(fileKey, p)
      }
      reader.onload = () => {
        const r = String(reader.result ?? '')
        const base64 = r.includes('base64,') ? (r.split('base64,').pop() ?? r) : r
        onProgress?.(fileKey, 100)
        resolve({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          base64: base64.trim(),
        })
      }
      reader.onerror = () => {
        if (retriesLeft > 0) {
          onProgress?.(fileKey, 0)
          void readSingleFile(file, retriesLeft - 1).then(resolve).catch(reject)
          return
        }
        reject(reader.error ?? new Error('FileReader failed'))
      }
      reader.readAsDataURL(file)
    })
  }

  return Promise.all(
    files.map((file) => readSingleFile(file, maxRetries)),
  )
}
