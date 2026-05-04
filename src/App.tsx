import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppLayout } from '@/components/AppLayout'
import { AboutPage } from '@/pages/AboutPage'
import { ApplicationPage } from '@/pages/ApplicationPage'
import { ContactPage } from '@/pages/ContactPage'
import { HomePage } from '@/pages/HomePage'
import { ServicesPage } from '@/pages/ServicesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors closeButton duration={5000} />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="basvuru" element={<ApplicationPage />} />
          <Route path="work-with-us" element={<Navigate to="/basvuru" replace />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
