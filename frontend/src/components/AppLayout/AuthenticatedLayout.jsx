import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';
import { LayoutContext } from './LayoutContext';

export default function AuthenticatedLayout() {
  const { layoutProps } = useContext(LayoutContext);

  return (
    <AppLayout 
      title={layoutProps.title} 
      subtitle={layoutProps.subtitle} 
      user={layoutProps.user}
    >
      <Outlet />
    </AppLayout>
  );
}
