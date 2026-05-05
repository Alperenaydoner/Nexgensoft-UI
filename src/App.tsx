import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppLayout } from '@/components/AppLayout'
import { AboutPage } from '@/pages/AboutPage'
import { ApplicationPage } from '@/pages/ApplicationPage'
import { ContactPage } from '@/pages/ContactPage'
import { HomePage } from '@/pages/HomePage'
import { ServicesPage } from '@/pages/ServicesPage'
import { AdminContactDetailPage } from '@/pages/admin/AdminContactDetailPage'
import { AdminContactListPage } from '@/pages/admin/AdminContactListPage'
import { AdminContentPage } from '@/pages/admin/AdminContentPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminLogDetailPage } from '@/pages/admin/AdminLogDetailPage'
import { AdminLogsPage } from '@/pages/admin/AdminLogsPage'
import { AdminRolesPage } from '@/pages/admin/AdminRolesPage'
import { AdminUserDetailPage } from '@/pages/admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors closeButton duration={5000} />
      <Routes>
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="contact" element={<AdminContactListPage />} />
          <Route path="contact/:id" element={<AdminContactDetailPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
          <Route path="logs/:id" element={<AdminLogDetailPage />} />
          <Route path="content" element={<AdminContentPage />} />
        </Route>
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
