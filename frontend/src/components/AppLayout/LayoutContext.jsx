import React, { createContext, useContext, useState, useEffect } from 'react';

export const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [layoutProps, setLayoutProps] = useState({ title: '', subtitle: '', user: null });

  return (
    <LayoutContext.Provider value={{ layoutProps, setLayoutProps }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (title, subtitle, user = null) => {
  const { setLayoutProps } = useContext(LayoutContext);

  useEffect(() => {
    setLayoutProps({ title, subtitle, user });
    
    // Opcional: Atualizar o título do documento HTML
    if (title) {
      document.title = `${title} | JC Hub`;
    }
  }, [title, subtitle, user, setLayoutProps]);
};
