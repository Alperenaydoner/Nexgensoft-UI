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

void bootstrapRemoteContent().finally(() => {
  registerRemoteContentLanguageListener()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </StrictMode>,
  )
})
