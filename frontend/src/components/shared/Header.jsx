import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, ChevronDown, LogOut, User, KeyRound } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import i18n, { SUPPORTED_LANGUAGES } from '@/lib/i18n';

function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    }
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

function Dropdown({ trigger, children, align = 'end' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={`absolute top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg py-1 ${
            align === 'end' ? 'end-0' : 'start-0'
          }`}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon: Icon, label, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <span>{label}</span>
    </button>
  );
}

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];


  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = user?.role ? t(`header.role.${user.role}`) : '';

  return (
    <header
      className="flex items-center justify-end gap-2 px-4 border-b bg-background flex-shrink-0"
      style={{ height: 'var(--header-height)' }}
    >
      {/* Theme toggle */}
      <button
        aria-label={t('header.toggleTheme')}
        onClick={toggleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Language switcher */}
      <Dropdown
        trigger={
          <button
            aria-label={t('header.language')}
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="font-medium">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        }
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
              lang.code === i18n.language ? 'font-semibold text-primary' : ''
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </Dropdown>

      {/* User menu */}
      <Dropdown
        trigger={
          <button
            aria-label="User menu"
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                {user?.name ?? ''}
              </span>
              <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        }
      >
        {/* Header row */}
        <div className="px-3 py-2 border-b border-border mb-1">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>

        <DropdownItem icon={User} label={t('header.myProfile')} onClick={() => navigate('/profile')} />
        <DropdownItem icon={KeyRound} label={t('header.changePassword')} onClick={() => navigate('/change-password')} />
        <div className="border-t border-border mt-1 pt-1">
          <DropdownItem
            icon={LogOut}
            label={t('header.signOut')}
            onClick={handleLogout}
            className="text-destructive hover:text-destructive"
          />
        </div>
      </Dropdown>
    </header>
  );
}
