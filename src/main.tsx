import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import 'sonner/dist/styles.css'

import i18n from '@/i18n'
import '@/i18n'
import App from '@/App'
import { syncDocumentLang } from '@/i18n/syncDocumentLang'
import '@/index.css'
import {
  bootstrapRemoteContent,
  registerRemoteContentLanguageListener,
} from '@/i18n/bootstrapRemoteContent'

syncDocumentLang(i18n.language)
i18n.on('languageChanged', (lng) => {
  syncDocumentLang(lng)
})

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <Suspense
        fallback={
          <div className="app-shell-loader" aria-busy="true" aria-label="Loading Nexgensoft">
            <div className="app-shell-loader__glow" />
            <div className="app-shell-loader__card">
              <span className="app-shell-loader__badge">Nexgensoft</span>
              <h1 className="app-shell-loader__title">Yükleniyor…</h1>
              <p className="app-shell-loader__subtitle">
                Şirket sitesi açılırken içerik hazırlanıyor. Bu işlem birkaç saniye sürebilir.
              </p>
              <div className="app-shell-loader__meter">
                <div />
              </div>
            </div>
          </div>
        }
      >
        <App />
      </Suspense>
    </StrictMode>,
  )

  void bootstrapRemoteContent().finally(() => {
    registerRemoteContentLanguageListener()
  })
}
