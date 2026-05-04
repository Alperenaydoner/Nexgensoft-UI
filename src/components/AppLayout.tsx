import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

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
            {t('nav.home')}
          </NavLink>
          <NavLink to="/services" className="nav__link">
            {t('nav.services')}
          </NavLink>
          <NavLink to="/about" className="nav__link">
            {t('nav.about')}
          </NavLink>
          <NavLink to="/basvuru" className="nav__link">
            {t('nav.application')}
          </NavLink>
          <NavLink to="/contact" className="nav__link">
            {t('nav.contact')}
          </NavLink>
        </nav>
        <div className="topbar__actions">
          <LanguageSwitcher />
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
