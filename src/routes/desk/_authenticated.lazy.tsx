import { Login } from '@/desk/Login';
import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';

const Component = () => {
  const loaderData = Route.useLoaderData();
  const [user, setUser] = useState(loaderData.user);

  useEffect(() => {
    const auth = getAuth();

    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  if (user) {
    return <Outlet />;
  }

  return <Login />;
};

export const Route = createLazyFileRoute('/desk/_authenticated')({
  component: Component,
});
