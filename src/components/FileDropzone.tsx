import { Upload, X } from 'lucide-react'

type FileDropzoneProps = {
  files: File[]
  accept: string
  maxFiles: number
  disabled?: boolean
  progressByFile?: Record<string, number>
  onFilesChange: (files: File[]) => void
  title: string
  hint: string
}

export function FileDropzone({
  files,
  accept,
  maxFiles,
  disabled,
  progressByFile = {},
  onFilesChange,
  title,
  hint,
}: FileDropzoneProps) {
  function mergeFiles(next: File[]) {
    const merged = [...files, ...next].slice(0, maxFiles)
    onFilesChange(merged)
  }

  return (
    <div className="file-dropzone">
      <span className="file-dropzone__title">{title}</span>
      <label className={`file-dropzone__area${disabled ? ' is-disabled' : ''}`}>
        <input
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          onChange={(e) => mergeFiles(Array.from(e.target.files ?? []))}
        />
        <Upload size={18} strokeWidth={2} />
        <span>{hint}</span>
      </label>
      {files.length > 0 ? (
        <ul className="file-dropzone__list">
          {files.map((f) => {
            const key = `${f.name}-${f.size}-${f.lastModified}`
            const progress = Math.max(0, Math.min(100, Math.round(progressByFile[key] ?? 0)))
            return (
              <li key={key} className="file-dropzone__item">
                <div className="file-dropzone__meta">
                  <span className="file-dropzone__name">{f.name}</span>
                  <span className="file-dropzone__size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="file-dropzone__progress">
                  <div style={{ width: `${progress}%` }} />
                </div>
                <button
                  type="button"
                  className="file-dropzone__remove"
                  onClick={() => onFilesChange(files.filter((x) => x !== f))}
                  disabled={disabled}
                  aria-label="Remove file"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
