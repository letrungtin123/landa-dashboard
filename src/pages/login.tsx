import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore, StaffAccessDeniedError } from '@/utils/store';
import { useGoogleLogin } from '@react-oauth/google';
import { googleLoginOrRegister, GoogleAuthError } from '@/api/googleAuth';
import { microsoftLoginOrRegister, MicrosoftAuthError } from '@/api/microsoftAuth';
import { keycloakLogin, KeycloakAuthError } from '@/api/keycloakAuth';
import { microsoftPopupLogin } from '@/config/msalConfig';
import { keycloakPopupLogin, getKeycloakRedirectUri } from '@/config/keycloakConfig';
import { config } from '@/config/env';
import logoImg from '@/assets/WhiteLogoLeftPanel.png';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';

const formSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithMicrosoft = useAuthStore((s) => s.loginWithMicrosoft);
  const loginWithKeycloak = useAuthStore((s) => s.loginWithKeycloak);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [isKeycloakLoading, setIsKeycloakLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  // Hiển thị lỗi nếu bị auto-logout do tài khoản bị khóa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'account_disabled') {
      setAuthError('Tài khoản của bạn đã bị vô hiệu hóa bởi Admin.');
    }
  }, []);

  // ── Handle error centrally ──
  function handleAuthError(err: unknown) {
    if (err instanceof StaffAccessDeniedError) {
      setAuthError(err.message);
      toast.error('Truy cập bị từ chối', { description: err.message });
      return;
    }
    if (err instanceof GoogleAuthError || err instanceof MicrosoftAuthError || err instanceof KeycloakAuthError) {
      toast.error(err.message);
      return;
    }
    const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại.';
    toast.error(msg);
  }

  /** Redirect theo role sau login thành công */
  function redirectAfterLogin() {
    const role = useAuthStore.getState().user?.role;
    navigate(role === 'learner_plus' ? '/report-summary' : '/library');
  }

  // ── Password login ──
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAuthError(null);
    try {
      await login(values.email, values.password);
      toast.success('Đăng nhập thành công');
      redirectAfterLogin();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Google login ──
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setIsGoogleLoading(true);
      setAuthError(null);
      try {
        const result = await googleLoginOrRegister(response.access_token);
        await loginWithGoogle(result.tokens);
        toast.success('Đăng nhập Google thành công');
        redirectAfterLogin();
      } catch (err) {
        handleAuthError(err);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => toast.error('Google login thất bại.'),
  });

  // ── Microsoft login ──
  async function handleMicrosoftLogin() {
    setIsMicrosoftLoading(true);
    setAuthError(null);
    try {
      const idToken = await microsoftPopupLogin();
      const result = await microsoftLoginOrRegister(idToken);
      await loginWithMicrosoft(result.tokens);
      toast.success('Đăng nhập Microsoft thành công');
      redirectAfterLogin();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsMicrosoftLoading(false);
    }
  }

  // ── Keycloak login ──
  async function handleKeycloakLogin() {
    setIsKeycloakLoading(true);
    setAuthError(null);
    try {
      const { code, codeVerifier } = await keycloakPopupLogin();
      const redirectUri = getKeycloakRedirectUri();
      const result = await keycloakLogin(code, redirectUri, codeVerifier);
      await loginWithKeycloak(result.tokens);
      toast.success('Đăng nhập SSO thành công');
      redirectAfterLogin();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsKeycloakLoading(false);
    }
  }

  const isAnyLoading = isLoading || isGoogleLoading || isMicrosoftLoading || isKeycloakLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-6 w-full transform-gpu"
    >
      <div className="text-center space-y-2 relative z-10">
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200, damping: 15 }}
        >
          <img src={logoImg} alt="L&A Logo" className="h-[2.5rem] w-auto drop-shadow-xl mb-3" />
        </motion.div>
      </div>

      {/* Staff access denied banner */}
      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{authError}</span>
        </motion.div>
      )}

      <div className="relative rounded-2xl p-8">
        <div
          className="absolute inset-0 rounded-2xl p-[1px]"
          style={{ background: `linear-gradient(135deg, rgba(34,211,238,0.15), transparent 50%, rgba(6,182,212,0.1))` }}
        >
          <div className="h-full w-full rounded-2xl bg-[#020a1a]/40 backdrop-blur-md" />
        </div>
        <div className="relative z-10 space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 font-semibold text-xs tracking-wide uppercase">
                      Username / Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@example.com"
                        {...field}
                        disabled={isAnyLoading}
                        className="h-11 bg-white/5 border-white/10 text-white hover:border-ring/50 focus:border-ring focus:ring-ring/20 transition-all cursor-text placeholder:text-white/25"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 font-semibold text-xs tracking-wide uppercase">
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="••••••••"
                        {...field}
                        disabled={isAnyLoading}
                        className="h-11 bg-white/5 border-white/10 text-white hover:border-ring/50 focus:border-ring focus:ring-ring/20 transition-all cursor-text placeholder:text-white/25"
                        toggleClassName="text-white/40 hover:text-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full h-11 font-semibold text-md text-white cursor-pointer relative overflow-hidden shadow-lg hover:opacity-90 transition-all duration-300 hover:bg-transparent"
                  style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
                  disabled={isAnyLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </motion.div>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-3 text-white/40 font-medium">hoặc tiếp tục với</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google */}
            {/* {config.googleClientId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => googleLogin()}
                disabled={isAnyLoading}
                className="h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Google
              </Button>
            )} */}

            {/* Microsoft 365 */}
            {/* {config.microsoftClientId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleMicrosoftLogin}
                disabled={isAnyLoading}
                className="h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
              >
                {isMicrosoftLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M1 12h10v10H1z" />
                    <path fill="#7fba00" d="M12 1h10v10H12z" />
                    <path fill="#ffb900" d="M12 12h10v10H12z" />
                  </svg>
                )}
                Microsoft 365
              </Button>
            )} */}
          </div>

          {/* Keycloak SSO */}
          {config.keycloakClientId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleKeycloakLogin}
              disabled={isAnyLoading}
              className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
            >
              {isKeycloakLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              )}
              Đăng nhập bằng SSO
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
