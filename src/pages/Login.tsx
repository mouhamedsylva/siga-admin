import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useLogin, useMe } from '@/api/hooks';
import { ThemeToggle } from '@/components/common';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/primitives';

const schema = z.object({
  login: z.string().trim().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { data: me } = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/relecture';
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  if (me) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => navigate(from, { replace: true }) }),
  );

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Panneau de marque */}
      <div className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-accent/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <ShieldCheck className="size-6" />
          </div>
          <span className="text-lg font-bold tracking-wide">SIGA</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Vérifier les preuves de paiement, sereinement.
          </h2>
          <p className="mt-4 text-sidebar-muted">
            Relis les cas douteux, suis tes vendeurs et active leurs abonnements depuis un seul
            endroit.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-muted">
          SIGA évalue une cohérence : il ne confirme jamais qu’un paiement est arrivé.
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accès réservé aux administrateurs.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login">Identifiant</Label>
              <Input id="login" autoComplete="username" autoFocus {...register('login')} />
              <FieldError>{errors.login?.message}</FieldError>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              <FieldError>{errors.password?.message}</FieldError>
            </div>
            {login.error && (
              <p role="alert" className="rounded-md bg-faux-soft px-3 py-2 text-sm text-faux">
                {login.error.message}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
              {login.isPending && <Loader2 className="animate-spin" />}
              Se connecter
            </Button>
          </form>
        </div>
        <div className="mt-10 rounded-md bg-sidebar p-1">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
