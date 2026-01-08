"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const setItem = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  const getItem = (key) => {
    try {
      const item = window.localStorage.getItem(key);
      console.log('item');
      console.log(item);
      return item ? JSON.parse(item) : undefined;
    } catch (error) {
      console.log(error);
    }
  };

  const clearAll = () => {
    try {
      window.localStorage.clear();
      setCount(0);
    } catch (error) {
      console.log(error);
    }
  };

  const [count, setCount] = useState(0);

  // useEffect(() => {
  //   const item = getItem('count');
  //   if (item !== undefined) {
  //     setCount(item);
  //   }
  // }, []);
  //
  // useEffect(() => {
  //   setItem('count', count);
  // }, [count]);

  useEffect(() => {
    // Recupera il valore iniziale di count dal server
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/api/count`, {
      credentials: 'include', // Include i cookie nella richiesta
    })
      .then(response => response.json())
      .then(data => setCount(data.count))
      .catch(error => console.log('Error fetching count:', error));
  }, []);

  useEffect(() => {
    // Aggiorna il valore di count nel server ogni volta che cambia
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/api/count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
      },
      credentials: 'include', // Include i cookie nella richiesta
      body: JSON.stringify({ newCount: count }),
    }).catch(error => console.log('Error updating count:', error));
  }, [count]);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={clearAll}>Clear</button>
    </div>
  );
}
