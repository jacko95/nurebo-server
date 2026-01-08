// 'use client';

// import { useState, useEffect } from 'react';
// import {AppProvider, useAppContext} from "@/app/AppContext";
import { notFound } from 'next/navigation';
import {Button} from "@/components/ui/button";
import RestaurantClientComponent from "@/components/RestaurantClientComponent";


export async function generateStaticParams() {
  // const { state, setState } = AppProvider(); // Usa il context
  // const { setState } = useAppContext();  // Usa il context per aggiornare lo stato globale

  // console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);


  const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/business`,
      {
        next: { revalidate: 10 },
      }
  );
  const restaurants = await response.json();

  console.log(restaurants);

  return restaurants.map((business) => ({
    restaurant: business.id.toString(),
  }));
}

export default async function RestaurantPage({ params }) {
  const { business } = params;
    // const [path, setPath] = useState(state.path || 'quanti');


  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business`, {
    next: { revalidate: 10 }, // La pagina verrà rigenerata ogni 10 secondi se ci sono richieste
  });

    if (!response.ok) {
        return notFound();
    }

  const restaurants = await response.json();
  // const restaurantData = await response.json();


  // console.log(restaurants);
  //
  // const handleNext = (ciccio) => {
  //   // if (isValid) {
  //   //     router.push(`/prenotazione/${params.restaurant}/riepilogo`);
  //   setState(prevState => ({
  //       ...prevState,
  //       path: ciccio,
  //   }));
  //   // }
  //   };
  //
  // Trova il ristorante corrispondente usando l'ID
  const matchedRestaurant = restaurants.find((r) => r.id.toString() === business);

  // Se non trovi il ristorante, puoi gestire il caso
  if (!matchedRestaurant) {
    // return <p>Ristorante non trovato.</p>;
    // return { notFound: true };
    return notFound();
  }

  console.log('matchedRestaurant.id');
  console.log(matchedRestaurant.id);

  const detailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${matchedRestaurant.id}`,
      {
        next: { revalidate: 10 },
      }
  );
  const restaurantData = await detailResponse.json();

  console.log('restaurantData');
  console.log(restaurantData);

  //
  // setState((prevState) => ({
  //   ...prevState,
  //   restaurantData,  // Salva i dati nel context
  // }));

  if (!restaurantData) {
    return notFound();
  }
  //
  // if(state.path === 'quanti'){
  //       return(
  //
  //           <div>
  //               {/*<Link href={`/prenotazione/${params.restaurant}/telefono`} prefetch={true}>*/}
  //               {/*    <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">*/}
  //               {/*        <Button*/}
  //               {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"*/}
  //               {/*            type="button">Indietro*/}
  //               {/*        </Button>*/}
  //               {/*    </div>*/}
  //               {/*</Link>*/}
  //               <h1>{state.path}</h1>
  //
  //               <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
  //                   <Button
  //                       className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
  //                       type="button"
  //                       onClick={() => handleNext('quando')}
  //                       disabled={!isValid} // Disabilita il pulsante se non valido
  //                   >
  //                       Avanti
  //                   </Button>
  //               </div>
  //           </div>
  //       );
  //   }
  // else if (state.path === 'quando') {
  //     return (
  //         <div>
  //             <h1>{state.path}</h1>
  //             <div>
  //                 <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
  //                         onClick={() => handleNext('quanti')}
  //                         type="button">Indietro
  //                     </Button>
  //                 </div>
  //                 <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
  //                         type="button"
  //                         onClick={() => handleNext('telefono')}
  //                         disabled={!isValid} // Disabilita il pulsante se non valido
  //                     >
  //                         Avanti
  //                     </Button>
  //                 </div>
  //             </div>
  //         </div>
  //     );
  // }
  // else if (state.path === 'telefono') {
  //     return (
  //         <div>
  //             <h1>{state.path}</h1>
  //             <div>
  //                 <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
  //                         onClick={() => handleNext('quanti')}
  //                         type="button">Indietro
  //                     </Button>
  //                 </div>
  //                 <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
  //                         type="button"
  //                         onClick={() => handleNext('telefono')}
  //                         disabled={!isValid} // Disabilita il pulsante se non valido
  //                     >
  //                         Avanti
  //                     </Button>
  //                 </div>
  //             </div>
  //         </div>
  //     );
  // }
  // else if (state.path === 'email') {
  //     return (
  //         <div>
  //             <h1>{state.path}</h1>
  //             <div>
  //                 <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
  //                         onClick={() => handleNext('quanti')}
  //                         type="button">Indietro
  //                     </Button>
  //                 </div>
  //                 <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
  //                         type="button"
  //                         onClick={() => handleNext('telefono')}
  //                         disabled={!isValid} // Disabilita il pulsante se non valido
  //                     >
  //                         Avanti
  //                     </Button>
  //                 </div>
  //             </div>
  //         </div>
  //     );
  // }
  // else if (state.path === 'riepilogo') {
  //     return (
  //         <div>
  //             <h1>{state.path}</h1>
  //             <div>
  //                 <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
  //                         onClick={() => handleNext('quanti')}
  //                         type="button">Indietro
  //                     </Button>
  //                 </div>
  //                 <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
  //                     <Button
  //                         className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
  //                         type="button"
  //                         onClick={() => handleNext('telefono')}
  //                         disabled={!isValid} // Disabilita il pulsante se non valido
  //                     >
  //                         procediamo
  //                     </Button>
  //                 </div>
  //             </div>
  //         </div>
  //     );
  // }
  // else {
  //     return (
  //       <div>
  //         <h1>{restaurantData.name}</h1>
  //         <p>Città: {restaurantData.city}</p>
  //         <p>Telefono: {restaurantData.phone}</p>
  //       </div>
  //     );
  // }

    return <RestaurantClientComponent restaurantData={restaurantData/*restaurants*/} />;
}
