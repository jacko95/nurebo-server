"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {notFound, usePathname} from "next/navigation";
import {AppProvider, useAppContext} from "@/app/AppContext";
import {useRouter} from "next/navigation";
import Quanti from "@/components/quanti";
import Quando from "@/components/quando";
import Telefono from "@/components/telefono";
import Email from "@/components/email";
import Riepilogo from "@/components/riepilogo";
import Nome from "@/components/nome";

function RestaurantClientComponent({restaurantData}) {
  const pathname = usePathname(); // Ottieni la rotta attuale
  const { state, setState } = useAppContext();  // Accedi allo stato globale
    // const {state, setState} = AppProvider(); // Usa il context
    // const [path, setPath] = useState('quanti');  // Inizia con 'quanti'
    const [path, setPath] = useState(state.path /*|| 'quanti'*/);  // Se non c'è valore in contesto, predefinisci a 2
    const [isValid, setIsValid] = useState(true);  // Stato validità ristorante

    console.log('restaurantData566666666666666666');
    console.log(restaurantData);
    console.log('state000000000');
    console.log(state);

    const handleNext = (ciccio) => {
        // if (isValid) {
        //     router.push(`/prenotazione/${params.restaurant}/riepilogo`);
        setState(prevState => ({
            ...prevState,
            path: ciccio,  // Aggiorna anche il contesto globale
        }));
        // }
    };

    // // Aggiorna il context con i dati del ristorante
    // setState((prevState) => ({
    //   ...prevState,
    //   restaurantData,  // Salva i dati nel context
    // }));


    if (state.path === 'quanti') {
        return (
            <Quanti restaurantData={restaurantData/*restaurants*/} />
            // <div>
            //     {/*<Link href={`/prenotazione/${params.restaurant}/telefono`} prefetch={true}>*/}
            //     {/*    <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">*/}
            //     {/*        <Button*/}
            //     {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"*/}
            //     {/*            type="button">Indietro*/}
            //     {/*        </Button>*/}
            //     {/*    </div>*/}
            //     {/*</Link>*/}
            //     <h1>{state.path}</h1>
            //
            //     <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
            //         <Button
            //             className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
            //             type="button"
            //             onClick={() => handleNext('quando')}
            //             disabled={!isValid} // Disabilita il pulsante se non valido
            //         >
            //             Avanti
            //         </Button>
            //     </div>
            // </div>
        );
    }
    else if (state.path === 'quando') {
        return (
            <Quando restaurantData={restaurantData/*restaurants*/} />
            // <div>
            //     <h1>{state.path}</h1>
            //     <div>
            //         <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
            //                 onClick={() => handleNext('quanti')}
            //                 type="button">Indietro
            //             </Button>
            //         </div>
            //         <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
            //                 type="button"
            //                 onClick={() => handleNext('telefono')}
            //                 disabled={!isValid} // Disabilita il pulsante se non valido
            //             >
            //                 Avanti
            //             </Button>
            //         </div>
            //     </div>
            // </div>
        );
    }

    else if (state.path === 'nome') {
        return (
            <Nome restaurantData={restaurantData/*restaurants*/} />
            // <div>
            //     <h1>{state.path}</h1>
            //     <div>
            //         <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
            //                 onClick={() => handleNext('quanti')}
            //                 type="button">Indietro
            //             </Button>
            //         </div>
            //         <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
            //                 type="button"
            //                 onClick={() => handleNext('telefono')}
            //                 disabled={!isValid} // Disabilita il pulsante se non valido
            //             >
            //                 Avanti
            //             </Button>
            //         </div>
            //     </div>
            // </div>
        );
    }
    else if (state.path === 'telefono') {
        return (
            <Telefono restaurantData={restaurantData/*restaurants*/} />
            // <div>
            //     <h1>{state.path}</h1>
            //     <div>
            //         <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
            //                 onClick={() => handleNext('quando')}
            //                 type="button">Indietro
            //             </Button>
            //         </div>
            //         <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
            //                 type="button"
            //                 onClick={() => handleNext('email')}
            //                 disabled={!isValid} // Disabilita il pulsante se non valido
            //             >
            //                 Avanti
            //             </Button>
            //         </div>
            //     </div>
            // </div>
        );
    }
    else if (state.path === 'email') {
        return (
            <Email restaurantData={restaurantData/*restaurants*/} />
            // <div>
            //     <h1>{state.path}</h1>
            //     <div>
            //         <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
            //                 onClick={() => handleNext('quanti')}
            //                 type="button">Indietro
            //             </Button>
            //         </div>
            //         <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
            //                 type="button"
            //                 onClick={() => handleNext('telefono')}
            //                 disabled={!isValid} // Disabilita il pulsante se non valido
            //             >
            //                 Avanti
            //             </Button>
            //         </div>
            //     </div>
            // </div>
        );
    }
    else if (state.path === 'riepilogo') {
        return (
            <Riepilogo restaurantData={restaurantData/*restaurants*/} />
            // <div>
            //     <h1>{state.path}</h1>
            //     <div>
            //         <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
            //                 onClick={() => handleNext('quanti')}
            //                 type="button">Indietro
            //             </Button>
            //         </div>
            //         <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
            //             <Button
            //                 className={`px-6 font-sans font-semibold rounded-md ${isValid ? 'bg-[#0091EA]' : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
            //                 type="button"
            //                 onClick={() => handleNext('telefono')}
            //                 disabled={!isValid} // Disabilita il pulsante se non valido
            //             >
            //                 procediamo
            //             </Button>
            //         </div>
            //     </div>
            // </div>
        );
    }
    else {
        return (
            // <div>
            //     <h1>{restaurantData.name}</h1>
            //     <p>Città: {restaurantData.city}</p>
            //     <p>Telefono: {restaurantData.phone}</p>
            // </div>
            <div></div>
        );
    }
}

export default RestaurantClientComponent;
