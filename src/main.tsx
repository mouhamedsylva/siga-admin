import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ApiError } from '@/api/client';
import { App } from '@/App';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import './styles/theme.css';

/** Comportements de React Router v7 activés dès maintenant */
const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      // Pas de nouvelle tentative sur une erreur « métier » (401, 403, 404…)
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});

function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster theme={resolved} position="top-right" richColors closeButton />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/backoffice" future={ROUTER_FUTURE}>
          <App />
        </BrowserRouter>
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
