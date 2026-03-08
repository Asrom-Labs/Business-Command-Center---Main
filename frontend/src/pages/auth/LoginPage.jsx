import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Zap, TrendingUp, Package, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { cn } from '@/lib/utils';
import i18n, { SUPPORTED_LANGUAGES } from '@/lib/i18n';

// ─── Validation schema ─────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'auth.login.errors.emailRequired')
    .email('auth.login.errors.emailInvalid'),
  password: z
    .string()
    .min(1, 'auth.login.errors.passwordRequired')
    .min(8, 'auth.login.errors.passwordMinLength'),
});

// ─── Brand panel feature highlights ───────────────────────────────────────
const FEATURES = [
  { Icon: TrendingUp, label: 'Sales & revenue tracking'          },
  { Icon: Package,    label: 'Inventory & stock management'       },
  { Icon: Users,      label: 'Customers & suppliers in one place' },
];

// ─── Map API error responses to i18n keys ─────────────────────────────────
function getApiErrorKey(err) {
  if (err?.status === 429)               return 'auth.login.errors.tooManyAttempts';
  if (err?.status === 401)               return 'auth.login.errors.invalidCredentials';
  if (err?.error === 'UNAUTHORIZED')     return 'auth.login.errors.invalidCredentials';
  if (err?.error === 'VALIDATION_ERROR') return 'auth.login.errors.invalidCredentials';
  if (!navigator.onLine)                 return 'auth.login.errors.networkError';
  if (!err?.status || err?.status >= 500) return 'auth.login.errors.serverError';
  return 'auth.login.errors.serverError';
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate    = useNavigate();
  const loginStore  = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError]         = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (values) => {
    setApiError('');
    try {
      // Axios interceptor returns response.data (the API body), so:
      //   result.data.token → JWT string
      //   result.data.user  → user object
      const result = await authApi.login(values.email, values.password);
      const token  = result?.data?.token;
      const user   = result?.data?.user;

      // Defensive guard — if the response shape is unexpected, surface a clear error
      if (!token || !user) {
        setApiError(t('auth.login.errors.serverError'));
        return;
      }

      loginStore(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(t(getApiErrorKey(err)));
    }
  };

  // Language toggle — shows the OTHER language (the one you'll switch TO)
  const currentCode = i18n.language;
  const targetLang  = SUPPORTED_LANGUAGES.find((l) => l.code !== currentCode)
    ?? SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative flex min-h-screen w-full">

      {/* ── Language toggle — absolute top-right, always visible ── */}
      <div className="absolute right-4 top-4 z-50">
        <button
          type="button"
          onClick={() => i18n.changeLanguage(targetLang.code)}
          aria-label={`Switch to ${targetLang.label}`}
          className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-accent"
        >
          <span>{targetLang.flag}</span>
          <span>{targetLang.label}</span>
        </button>
      </div>

      {/* ── Left brand panel (desktop only) ── */}
      <div
        className="relative hidden md:flex md:w-[55%] flex-col overflow-hidden"
        style={{
          background:
            'linear-gradient(140deg, hsl(231,75%,36%) 0%, hsl(252,68%,36%) 50%, hsl(272,58%,32%) 100%)',
        }}
      >
        {/* Decorative depth orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, hsl(220,90%,85%) 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 -right-48 h-[420px] w-[420px] rounded-full opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, hsl(258,80%,78%) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 left-1/3 h-[320px] w-[320px] rounded-full opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, hsl(280,70%,78%) 0%, transparent 70%)' }}
          />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 40px,white 40px,white 41px),' +
                'repeating-linear-gradient(90deg,transparent,transparent 40px,white 40px,white 41px)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <div>
              <div className="text-xl font-bold leading-none tracking-tight">BCC</div>
              <div className="mt-0.5 text-[11px] font-medium tracking-wide text-white/55">
                {t('app.name')}
              </div>
            </div>
          </div>

          {/* Tagline + features */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              {t('app.tagline')}
            </h1>
            <p className="mb-10 max-w-sm text-lg leading-relaxed text-white/65">
              {t('auth.login.subtitle')}
            </p>
            <div className="space-y-3">
              {FEATURES.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                    <Icon className="h-4 w-4 text-white/85" />
                  </div>
                  <span className="text-sm font-medium text-white/75">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <p className="text-white/40 text-xs">
            {t('auth.login.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-16">
        <div className="fade-in w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-lg font-bold text-foreground">BCC</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('auth.login.title')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
            >
              <div className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
              <p className="text-sm font-medium text-destructive">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                {t('auth.login.emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder={t('auth.login.emailPlaceholder')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={cn(
                  'h-11',
                  errors.email && 'border-destructive focus-visible:ring-destructive/30'
                )}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="field-error">
                  {t(errors.email.message)}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                {t('auth.login.passwordLabel')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={cn(
                    'h-11 pr-11',
                    errors.password && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="field-error">
                  {t(errors.password.message)}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full text-sm font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.login.submitting')}
                </span>
              ) : (
                t('auth.login.submitButton')
              )}
            </Button>
          </form>

          {/* Contact admin note */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <span className="font-medium text-primary">{t('auth.login.contactAdmin')}</span>
          </p>

        </div>
      </div>
    </div>
  );
}
