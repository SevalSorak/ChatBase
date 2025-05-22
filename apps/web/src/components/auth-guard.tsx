import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/auth-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if the route is public
    const isPublicPath = publicPaths.includes(router.pathname);

    if (!loading) {
      if (!isAuthenticated && !isPublicPath) {
        // Not authenticated and trying to access a protected route
        setAuthorized(false);
        router.push('/login');
      } else if (isAuthenticated && isPublicPath) {
        // Already authenticated and trying to access a public route (like login)
        setAuthorized(false);
        router.push('/');
      } else {
        // Either authenticated and accessing protected route, or not authenticated and accessing public route
        setAuthorized(true);
      }
    }
  }, [isAuthenticated, loading, router]);

  // Show loading or nothing while checking authentication
  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-black border-opacity-50 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
};