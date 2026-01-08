'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {AppProvider, useAppContext} from "@/app/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import {usePathname, useRouter} from 'next/navigation';


export default function Email({ /*params,*/ restaurantData, }) {
    const pathname = usePathname(); // Ottieni la rotta attuale
    const { state, setState } = useAppContext();
    const [imageUrl, setImageUrl] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const [path, setPath] = useState(state.path || 'email');  // Se non c'è valore in contesto, predefinisci a 2


    // Sincronizza il valore locale con quello del contesto globale quando il componente è montato
    useEffect(() => {
        setPath(state.path || 'email');
    }, [state.path]);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${/*params.restaurant*/restaurantData.business_id}/form?path=email`, {
                        // cache: 'no-store',
                        next: { revalidate: 10 },
                        method: 'GET',
                        // headers: {
                        //     'Content-Type': 'application/json',
                        // },
                    }
                );
                const data = await response.json();
                // setImageUrl(data[0].image_url);
                setImageUrl(data);
            } catch (error) {
                console.error("Errore durante il fetch dell'immagine:", error);
            }
        };

        fetchImageUrl();
    }, []);

    // useEffect(() => {
    //     // Modello per validare l'email
    //     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //     const isValidEmail = emailPattern.test(state.reservationEmail); // Cambia il nome del campo a reservationEmail se necessario
    //     setIsValid(isValidEmail);
    //
    //     // Imposta il messaggio di validità
    //     if (state.reservationEmail.length > 0) {
    //         setMessage(isValidEmail ? 'Email valida!' : 'Email non valida!');
    //     } else {
    //         setMessage('');
    //     }
    // }, [state.reservationEmail]); // Cambia in [state.reservationEmail] se usi un campo diverso
    useEffect(() => {
        // Modello per validare l'email
        // const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // const emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}(\.[a-z]{2,})?$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,3}(\.[a-z]{2,3})?$/;

        const isValidEmail = emailPattern.test(state.reservationEmail);

        // Il campo è valido se l'email è valida o se è vuota
        setIsValid(isValidEmail || state.reservationEmail.length === 0);

        // Imposta il messaggio di validità solo se l'email non è vuota
        if (state.reservationEmail.length > 0) {
            setMessage(isValidEmail ? 'Email valida!' : 'Email non valida!');
        } else {
            setMessage('');
        }
    }, [state.reservationEmail]);

    const handleChange = (e) => {
        const email = e.target.value;
        setState({ ...state, reservationEmail: email });
    };

    const handleNext = (ciccio) => {
        // if (isValid) {
        //     router.push(`/prenotazione/${params.restaurant}/riepilogo`);
        setState(prevState => ({
            ...prevState,
            path: ciccio,  // Aggiorna anche il contesto globale
        }));
        // }
    };

    const sendNewReservation = async () => {
        try {
            // inserisce la prenotazione solo se l otp inserito è valido
            const dateObject = new Date(new Date(state.reservationDatetime).getFullYear(), new Date(state.reservationDatetime).getMonth(), new Date(state.reservationDatetime).getDate(), new Date(state.reservationDatetime).getHours(), new Date(state.reservationDatetime).getMinutes());

            // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
            const localDateTime = new Date(dateObject.getTime()).toISOString();
            console.log('Local datetime:', localDateTime);
            console.log('888888888888888')
            console.log(restaurantData)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                },
                // next: {revalidate: 10},
                body: JSON.stringify({
                    ...restaurantData,
                    reservation_phone: state.reservationPhone,
                    // business_phone: restaurantData.business_phone,
                    reservation_name: state.reservationName,
                    // business_name: restaurantData.name,
                    // business_id: "osteria-serafina-milano",
                    business_id: `${/*params.restaurant*/restaurantData.business_id}`,
                    quantity: state.reservationQty,
                    phone: state.reservationPhone,
                    datetime: localDateTime,
                    // business_email: restaurantData.business_email,
                    reservation_email: state.reservationEmail,
                }),
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta dal server:', data);
                // setOpen(true); // Apri il Dialog se la richiesta ha avuto successo
                // setNewUserUrlReservation(data)

                console.log('data.reservationId777777777777')
                console.log(data.reservationId)

                setState(prevState => ({
                    ...prevState,
                    reservationId: data.reservationId,  // Aggiorna anche il contesto globale
                }));
            } else {
                console.error('Errore durante la richiesta:', response.statusText);
            }
        } catch (error) {
            console.error('Errore durante il fetch:', error);
        }
    };

    const handleNextClick = async (ciccio) => {
        if (isValid) {
            await sendNewReservation();

            // router.push(`/prenotazione/${params.restaurant}/riepilogo`);
            handleNext(ciccio)
        }
    };

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
                <div className="relative s:h-screen sm:h-auto flex flex-col items-center justify-center">
                    {/* Barre orizzontali sopra la card */}
                    <div
                        className="absolute s:top-[60px] sm:top-[-105px] md:top-[-15px] left-1/2 transform -translate-x-1/2 flex s:space-x-3 md:space-x-4 z-20">
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
                        className="relative bg-white rounded-lg shadow-md s:h-[50vh] sm:h-[50vh] md:h-[80vh] s:w-[90vw] md:w-[85vw] sm:w-[90vw] lg:w-[75vw] xl:w-[60vw] flex overflow-hidden mt-10">
                        <div className="relative h-full w-[30vw] s:hidden md:block">
                            {imageUrl ? (
                                <img src={imageUrl} className="object-cover h-full w-full"/>
                            ) : (
                                <Skeleton className="h-full w-full"/>
                            )}
                            <div className="absolute inset-0 bg-black opacity-10"></div>
                        </div>

                        <div className="s:ml-[40px] md:ml-[50px] s:mt-[40px] md:mt-[50px] s:w-[70vw]">
                            <div className="s:mb-[-10px] md:mb-[15px]">
                                <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                    {restaurantData.business_name}:
                                </label>
                                <div className="w-[20px]"></div>
                                <label className="text-[20px] font-sans font-medium text-gray-600">
                                    Quale è la tua email? (facoltativo)
                                </label>
                            </div>

                            <div className="flex items-center s:mt-[0vh]">
                                <div className="flex items-center border-b-1 border-gray-500 s:mt-[10vh] md:mt-[150px] s:w-[65vw] md:w-[43vw] lg:w-[40vw] xl:w-[33vw]">
                                    <input
                                        // type="text"
                                        type="email"
                                        autoComplete="email"
                                        name="email"
                                        id="email"
                                        value={state.reservationEmail}
                                        placeholder="Inserisci la tua email"
                                        onChange={handleChange}
                                        className={`w-full border-b-2 border-gray-500 focus:outline-none focus:border-[#${activeColor}] s:text-[23px] md:text-[32px] font-sans text-gray-700 placeholder-gray-500 input-placeholder`}
                                    />
                                </div>
                            </div>
                            <div
                                className={`font-sans font-semibold mt-2 text-[18px] ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                                {message}
                            </div>
                        </div>

                        {/*<Link href={`/prenotazione/${params.restaurant}/telefono`} prefetch={true}>*/}
                        <div
                            className={`absolute s:left-[10vw] sm:right-[22vw] md:left-[30vw] lg:left-[25vw] xl:left-[20vw] bottom-[20px] space-x-4`}>
                            <Button
                                className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
                                onClick={() => handleNext('telefono')}
                                type="button">Indietro
                            </Button>
                        </div>
                        {/*</Link>*/}

                        <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                            <Button
                                className={`px-6 font-sans font-semibold rounded-md ${isValid ? `bg-[#${activeColor}]` : `bg-[#${backgroundColor}]`} text-white h-[35px] w-[120px]`}
                                type="button"
                                onClick={() => handleNextClick('riepilogo')}
                                disabled={!isValid} // Disabilita il pulsante se non valido
                            >
                                Avanti
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    );
}
