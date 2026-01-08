// 'use client';

import React, {createContext, useContext, useState} from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // const [state, setState] = useState({ value: '' });
  const [state, setState] = useState({
    reservationName: '',
    reservationEmail: '',
    reservationPhone: '',
    reservationDatetime: '',
    // reservationQty: '',
    reservationQty: 2,
    restaurantData: {}, // Inizializza lo stato del ristorante
    // restaurantData: null, // Stato per i dati del ristorante
    path: 'quanti', // Aggiungi il campo path
    reservationId: '',
  });

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
