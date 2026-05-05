import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BriefcaseBusiness, CircleUserRound, House, Mail, Sparkles } from 'lucide-react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'

import '@/components/app-layout.css'

export function AppLayout() {
  const { t } = useTranslation()

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label={t('brand.ariaCompany')}>
          <span className="brand__nex">{t('brand.nex')}</span>
          <span className="brand__soft">{t('brand.soft')}</span>
        </NavLink>
        <nav className="nav nav--main" aria-label={t('aria.mainNavigation')}>
          <NavLink to="/" className="nav__link" end>
            <House size={14} strokeWidth={2} />
            {t('nav.home')}
          </NavLink>
          <NavLink to="/services" className="nav__link">
            <Sparkles size={14} strokeWidth={2} />
            {t('nav.services')}
          </NavLink>
          <NavLink to="/about" className="nav__link">
            <CircleUserRound size={14} strokeWidth={2} />
            {t('nav.about')}
          </NavLink>
          <NavLink to="/basvuru" className="nav__link">
            <BriefcaseBusiness size={14} strokeWidth={2} />
            {t('nav.application')}
          </NavLink>
          <NavLink to="/contact" className="nav__link">
            <Mail size={14} strokeWidth={2} />
            {t('nav.contact')}
          </NavLink>
        </nav>
        <div className="topbar__actions">
          <LanguageSwitcher />
          <span className="topbar__divider" aria-hidden="true" />
          <NavLink to="/contact" className="btn-header-ghost">
            {t('nav.getInTouch')}
          </NavLink>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <section className="impact" aria-label={t('brand.ariaCompany')}>
        <p className="impact__line">{t('footer.impactLine')}</p>
        <p className="impact__sub">{t('footer.impactSub')}</p>
      </section>
      <footer className="footer">
        © {new Date().getFullYear()} Nexgensoft — {t('footer.rights')}
      </footer>
    </div>
  )
}
