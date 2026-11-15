import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { UNAUTHORIZED_EVENT } from '@/api/client';
import { keys, useMe } from '@/api/hooks';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/Login';
import { ReviewPage } from '@/pages/Review';

// Pages secondaires chargées à la demande (les graphiques pèsent lourd)
const VerificationsPage = lazy(() =>
  import('@/pages/Verifications').then((m) => ({ default: m.VerificationsPage })),
);
const SellersPage = lazy(() => import('@/pages/Sellers').then((m) => ({ default: m.SellersPage })));
const SellerDetailPage = lazy(() =>
  import('@/pages/SellerDetail').then((m) => ({ default: m.SellerDetailPage })),
);
const StatsPage = lazy(() => import('@/pages/Stats').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })));

/** Redirige vers la connexion si la session est absente ou expire. */
function RequireAuth() {
  const { data: me, isLoading } = useMe();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const onUnauthorized = () => {
      qc.setQueryData(keys.me, null);
      navigate('/connexion', { replace: true, state: { from: location.pathname } });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [navigate, qc, location.pathname]);

  if (isLoading) return <Spinner />;
  if (!me) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return (
    <Suspense fallback={<Spinner />}>
      <Outlet />
    </Suspense>
  );
}

function Spinner() {
  return (
    <div className="flex h-full min-h-60 items-center justify-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/relecture" element={<ReviewPage />} />
          <Route path="/verifications" element={<VerificationsPage />} />
          <Route path="/vendeurs" element={<SellersPage />} />
          <Route path="/vendeurs/:id" element={<SellerDetailPage />} />
          <Route path="/statistiques" element={<StatsPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/relecture" replace />} />
    </Routes>
  );
}
