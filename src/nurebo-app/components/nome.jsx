'use client';

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppProvider, useAppContext } from '@/app/AppContext';
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from 'next/navigation';

export default function Nome({ /*params,*/ restaurantData, }) {
    const pathname = usePathname();
    const router = useRouter();
    const { state, setState } = useAppContext(); // Accedi allo stato globale
    const [imageUrl, setImageUrl] = useState(''); // Stato per l'URL dell'immagine
    const [errorMessage, setErrorMessage] = useState(''); // Stato per messaggi di errore
    const [path, setPath] = useState(state.path || 'nome');  // Se non c'è valore in contesto, predefinisci a 2
    const [showWarning, setShowWarning] = useState(false);


    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${/*params.restaurant*/restaurantData.business_id}/form?path=nome`, {
                    method: 'GET',
                    // headers: {
                    //     'Content-Type': 'application/json',
                    // },
                    // cache: 'no-store',
                    next: { revalidate: 10 },
                }); // Esempio di endpoint
                const data = await response.json();
                // setImageUrl(data[0].image_url); // Imposta l'URL dell'immagine ricevuta
                setImageUrl(data); // Imposta l'URL dell'immagine ricevuta
            } catch (error) {
                console.error("Errore durante il fetch dell'immagine:", error);
            }
        };

        fetchImageUrl();
    }, []);

    const handleChange = (e) => {
        const name = e.target.value;
        setState({ ...state, reservationName: name }); // Aggiorna solo il nome

        if (name.length === 0) {
            // setErrorMessage('Il nome deve essere lungo almeno 4 caratteri e contenere solo lettere.');
            setShowWarning(false)
        }
        else if (name.length < 4 && !/^[A-Za-zÀ-ÿ]+$/.test(name)) {
        // else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]{4,}$/.test(name)) {
            // setErrorMessage('Il nome deve essere lungo almeno 4 caratteri e contenere solo lettere.');
            setShowWarning(true)
        }
        else if (/^[A-Za-zÀ-ÿ]+$/.test(name)) {
            setShowWarning(false)
        }
        else {
            setShowWarning(true)
        }
        // if (name.length < 4 && !/^[A-Za-zÀ-ÿ]+$/.test(name)) {
        //     // setErrorMessage(''); // Non mostrare errore se l'input è vuoto
        // }
        // else if (name.length /*<*/>= 4 /*||*/&& !/^[A-Za-zÀ-ÿ]+$/.test(name)) { // Aggiungi il supporto per lettere accentate
        //     // setErrorMessage('Il nome deve essere lungo almeno 4 caratteri e contenere solo lettere.');
        //     setShowWarning(true)
        // }
        /*else {
            setErrorMessage(''); // Reset dell'errore se valido
        }*/
    };

    const handleNext = (ciccio) => {
        // if (isValid) {
        //     router.push(`/prenotazione/${params.restaurant}/riepilogo`);
        // if(name.length < 4 || !/^[A-Za-zÀ-ÿ]+$/.test(name)){
        //     setErrorMessage('Il nome deve essere lungo almeno 4 caratteri e contenere solo lettere.');
        // }
        // else {
            setState(prevState => ({
                ...prevState,
                path: ciccio,  // Aggiorna anche il contesto globale
            }));
        // }
        // }
    };

    const handleNextClick = (ciccio) => {
        if (state.reservationName.length >= 4 && /^[A-Za-zÀ-ÿ]+$/.test(state.reservationName)) {
        // if (/^[A-Za-zÀ-ÖØ-öø-ÿ]{4,}$/.test(state.reservationName)) {
            // window.location.href = `/prenotazione/${params.restaurant}/telefono`;
            // router.push(`/prenotazione/${params.restaurant}/telefono`);
            handleNext(ciccio)
        }
        else
            // setErrorMessage('Il nome deve essere lungo almeno 4 caratteri e contenere solo lettere.');
            setShowWarning(true)
    };

    const isNameValid = state.reservationName.length >= 4 && /^[A-Za-zÀ-ÿ]+$/.test(state.reservationName);
    // const isNameValid = /^[A-Za-zÀ-ÖØ-öø-ÿ]{4,}$/.test(state.reservationName);

    // const backgroundColor = `${restaurantData.business_form_color_background}`;
    // const activeColor = `${restaurantData.business_form_color_active}`;
    const backgroundColor = `A5D6A7`;
    const activeColor = `2E7D32`;

    return (
        <div className="relative s:h-screen-dynamic md:h-[calc(100vh)] bg-cover bg-center z-1 overflow-hidden"
            /*style={{
                backgroundImage: `url(${imageUrl})`,
            }}*/
        >
            <div
                className="absolute inset-0 s:block bg-cover bg-center"
                style={{backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
            >
                {/*<div className="absolute inset-0 bg-[#81D4FA]"></div>*/}
                {/*<div className={`absolute inset-0 bg-[#${backgroundColor ? backgroundColor : ''}] overflow-hidden`}></div>*/}
                {/*<div className={`absolute inset-0 overflow-hidden bg-[#${backgroundColor || '000000'}] opacity-50`}></div>*/}
                {/*<div className={`absolute inset-0 overflow-hidden bg-[#000000] opacity-30`}></div>*/}
                <div className={`absolute inset-0 bg-[#${backgroundColor || '000000'}] opacity-50`}></div>
            </div>

            {/* Colore di background visibile solo su desktop */}
            <div className={`absolute inset-0 s:hidden md:block bg-[#${backgroundColor || '81D4FA'}]`}></div>

            <div className="flex items-center justify-center h-full relative z-10 overflow-hidden">
                <div className="relative s:h-screen md:h-auto flex flex-col items-center justify-center">
                    {/* Barre orizzontali sopra la card */}
                    <div
                        className="absolute s:top-[60px] sm:top-[60px] md:top-[-15px] left-1/2 transform -translate-x-1/2 flex s:space-x-3 md:space-x-4 z-20">
                        {[
                            {label: "Quanti", path: `quanti`},
                            {label: "Quando", path: `quando`},
                            {label: "Nome", path: `nome`},
                            {label: "Telefono", path: `telefono`},
                            {label: "Email", path: `email`},
                            {label: "Riepilogo", path: `riepilogo`},
                        ].map((item, index) => {
                            const isActive = /*pathname*/state.path === item.path; // Controlla se la rotta è attiva

                            // const textColor = isActive ? "text-[#0277BD]" : "text-white"; // Colore del testo
                            // const textColor = isActive ? "text-[#2E7D32]" : "text-white"; // Colore del testo
                            const textColor = isActive ? `text-[#${activeColor}]` : "text-white"; // Colore del testo
                            // const textColor = isActive ? "text-[#C62828]" : "text-white"; // Colore del testo

                            // const barColor = isActive ? "bg-[#0277BD]" : "bg-white"; // Colore della barra
                            // const barColor = isActive ? "bg-[#2E7D32]" : "bg-white"; // Colore della barra
                            const barColor = isActive ? `bg-[#${activeColor}]` : "bg-white"; // Colore della barra
                            // const barColor = isActive ? "bg-[#C62828]" : "bg-white"; // Colore della barra

                            return (
                                // <Link key={index} href={item.path}>
                                //     <div className="flex flex-col cursor-pointer">
                                <div className="flex flex-col cursor-default" key={item.label}>
                                      <span
                                          className={`${textColor} s:text-[14px] md:text-sm font-semibold font-[Roboto] mb-[3px] mt-1 pl-[1px]`}>
                                        {item.label}
                                      </span>
                                    <div
                                        className={`${barColor} s:h-[2px] md:h-[4px] s:w-[20px] md:w-[100px] rounded-full`}></div>
                                </div>
                                // </Link>
                            );
                        })}
                    </div>

                    <div
                        className="relative bg-white rounded-lg shadow-md s:h-[50vh] sm:h-[50vh] md:h-[80vh] s:w-[90vw] sm:w-[90vw] md:w-[92vw] lg:w-[75vw] xl:w-[60vw] flex overflow-hidden mt-10">
                        <div className="relative h-full w-[20vw] s:hidden md:block">
                            {imageUrl ? (
                                <img src={imageUrl} className="object-cover h-full w-full"/>
                            ) : (
                                <Skeleton className="h-full w-full"/>
                            )}
                            <div className="absolute inset-0 bg-black opacity-10"></div>
                        </div>

                        <div className="ml-[50px] mt-[50px] h-[60px] w-[350px]">
                            <div className="mb-[65px]">
                                {/*<label className="text-[15px] font-sans font-medium text-[#1976D2]">*/}
                                <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                    {restaurantData.business_name}:
                                </label>
                                <div className="w-[20px]"></div>
                                <label className="text-[20px] font-sans font-medium text-gray-600">
                                    A nome di chi prenotiamo?
                                </label>
                            </div>

                            <div className="flex flex-col s:mt-[10vh] md:mt-[150px] s:w-[65vw] md:w-[53vw] lg:w-[40vw] xl:w-[33vw]">
                                <input
                                    type="text"
                                    placeholder="Inserisci il tuo cognome"
                                    value={state.reservationName}
                                    onChange={handleChange}
                                    className={`w-full border-b-2 border-gray-500 focus:outline-none focus:border-[#${activeColor}] s:text-[23px] md:text-[32px] font-sans text-gray-700 placeholder-gray-500 input-placeholder`}
                                />
                                {/*{errorMessage &&*/}
                                {showWarning &&
                                    // <p className="font-sans font-medium mt-[10px] text-red-500 ">{errorMessage}</p>
                                    <p className="font-sans font-medium mt-[10px] text-red-500 ">{"Il nome deve essere lungo almeno 4 caratteri e contenere solo lettere."}</p>
                                }
                            </div>
                        </div>

                        {/*<Link href={`/prenotazione/${params.restaurant}/quando`} prefetch={true}>*/}
                        <div
                            className={`absolute s:left-[10vw] sm:right-[22vw] md:left-[25vw] bottom-[20px] space-x-4 `}>
                            <Button
                                className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
                                onClick={() => handleNext('quando')}
                                type="button">Indietro
                            </Button>
                        </div>
                        {/*</Link>*/}

                        <Button
                            className={`absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl px-6 font-sans font-semibold rounded-md ${isNameValid ? `bg-[#${activeColor}]` : `bg-[#${backgroundColor}]`} text-white h-[35px] w-[120px]`}
                            type="button"
                            onClick={() => handleNextClick('telefono')} // Usa la funzione handleNextClick
                            // disabled={!isNameValid}
                        >
                            Avanti
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
