'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import axios from 'axios';  // Importa Axios
import {AppProvider, useAppContext} from '@/app/AppContext';
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import {Skeleton} from "@/components/ui/skeleton";
import {notFound, usePathname} from "next/navigation";  // Importa il contesto


export default function Quanti({ /*params,*/ restaurantData, }) {
    const pathname = usePathname(); // Ottieni la rotta attuale
    const { state, setState } = useAppContext();  // Accedi allo stato globale
    const [value, setValue] = useState(state.reservationQty || 2);  // Se non c'è valore in contesto, predefinisci a 2
    const [path, setPath] = useState(state.path || 'quanti');  // Se non c'è valore in contesto, predefinisci a 2
    const [imageUrl, setImageUrl] = useState('');  // Stato per l'URL dell'immagine
    // const { restaurantData } = state; // Ottieni restaurantData dal context
    const [isLoading, setIsLoading] = useState(true);  // Stato di caricamento
    const [isValid, setIsValid] = useState(true);  // Stato validità ristorante
    // const [restaurantData, setRestaurantData] = useState({
    //     name: '',
    //     phone: '',
    //     email: '',
    //     address: '',
    //     address_number: '',
    //     cell: '',
    //     city: '',
    //     created_at: '',
    //     id: '',
    //     info: '',
    //     postal_code: '',
    //     province: '',
    //     region: ''
    // });

    console.log('restaurantData11111111111111111');
    console.log(restaurantData);

    // console.log('params444545');
    // console.log(params);

    // useEffect(() => {
    //
    //     // if (restaurantData.name) {
    //     //     setIsLoading(false); // Non caricare se i dati sono già presenti
    //     //     return; // Uscire se i dati sono già disponibili
    //     // }
    //
    //     const fetchRestaurant = async () => {
    //         try {
    //             const response = await fetch(
    //                 `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/${params.restaurant}`,
    //             );
    //             const data = await response.json();
    //
    //             if (!response.ok || !data) {
    //                 setIsValid(false);
    //             } else {
    //                 console.log('data23333');
    //                 console.log(data);
    //                 // Imposta tutti i campi del ristorante
    //                 setRestaurantData({
    //                     name: data.name,
    //                     phone: data.phone,
    //                     email: data.email,
    //                     address: data.address,
    //                     address_number: data.address_number,
    //                     cell: data.cell,
    //                     city: data.city,
    //                     created_at: data.created_at,
    //                     id: data.id,
    //                     info: data.info,
    //                     postal_code: data.postal_code,
    //                     province: data.province,
    //                     region: data.region
    //                 });
    //
    //             }
    //         } catch (error) {
    //             console.error("Errore durante il fetch:", error);
    //             setIsValid(false);  // Se c'è un errore, considera i dati non validi
    //         } finally {
    //             setIsLoading(false);  // Fine del caricamento
    //         }
    //     };
    //
    //     fetchRestaurant();
    // }, []);

    // Sincronizza il valore locale con quello del contesto globale quando il componente è montato
    useEffect(() => {
        setPath(state.path || 'quanti');
    }, [state.path]);

    // Sincronizza il valore locale con quello del contesto globale quando il componente è montato
    // useEffect(() => {
    //     setValue(state.reservationQty || 2);
    // }, [state.reservationQty]);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${restaurantData.business_id}/form?path=quanti`, {
                    // cache: 'no-store',
                    next: { revalidate: 10 },
                });  // Esempio di endpoint
                const data = await response.json();
                // const response = await axios.get(
                //     `${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/${params.restaurant}/form?path=quanti`,
                //     {
                //         data: {
                //
                //         },
                //         headers: {
                //             // 'Authorization': `Bearer ${accessToken}`,
                //             'Content-Type': 'application/json'
                //         },
                //     },
                // );
                console.log('response.data5555555555555555555555555');
                // console.log(response.data[0]);
                console.log(data);
                console.log(data[0]);
                // console.log(response.data.image_url[0]);  // Imposta l'URL dell'immagine ricevuta
                console.log(data[0].image_url);  // Imposta l'URL dell'immagine ricevuta
                console.log(data[0].signedUrl);  // Imposta l'URL dell'immagine ricevuta
                // setImageUrl(response.data[0].image_url);  // Imposta l'URL dell'immagine ricevuta
                // setImageUrl(data[0].image_url);  // Imposta l'URL dell'immagine ricevuta
                // setImageUrl(data[0]);  // Imposta l'URL dell'immagine ricevuta
                // setImageUrl(data);  // Imposta l'URL dell'immagine ricevuta
                // setImageUrl(data[0].signedUrl);  // Imposta l'URL dell'immagine ricevuta
                setImageUrl(data);  // Imposta l'URL dell'immagine ricevuta
            } catch (error) {
                console.error("Errore durante il fetch dell'immagine:", error);
            }
        };

        fetchImageUrl();
    }, []);  // Questo effetto si esegue solo una volta, al caricamento del componente

    useEffect(() => {
        const setRealVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--real-vh', `${vh * 100}px`);
        };

        setRealVH();
        window.addEventListener('resize', setRealVH);

        return () => window.removeEventListener('resize', setRealVH);
    }, []);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        setState(prevState => ({
            ...prevState,
            reservationQty: newValue,  // Aggiorna anche il contesto globale
        }));
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

    // if (isLoading) {
    //     return <div></div>;  // Mostra un caricamento mentre è in fase di fetch
    // }

    if (!isValid) {
        return notFound();  // Mostra una pagina 404 se i dati non sono validi
    }

    // const backgroundColor = `${restaurantData.business_form_color_background}`;
    // const activeColor = `${restaurantData.business_form_color_active}`;
    const backgroundColor = `A5D6A7`;
    const activeColor = `2E7D32`;

    return (
        // <div className="relative w-screen h-screen bg-cover bg-center z-1 overflow-hidden">
        //
        //     {/*<div className="absolute inset-0 bg-[#81D4FA]"></div>*/}
        //     {/*<div className="absolute inset-0 bg-[#A5D6A7]"></div>*/}
        //     {/*<div className="absolute inset-0 "></div>*/}
        //     <div className={`absolute inset-0 bg-[#${backgroundColor ? backgroundColor : ''}]`}></div>
        //     {/*<div className="absolute inset-0 bg-[#EF9A9A]"></div>*/}
        //
        //     <div className="flex items-center justify-center h-full relative z-10">
        //         <div className="relative s:h-screen sm:h-auto flex flex-col items-center justify-center">
        //             {/* Barre orizzontali sopra la card */}
        //             <div className="absolute s:top-[30px] md:top-[-15px] left-1/2 transform -translate-x-1/2 flex s:space-x-3 md:space-x-4 z-20">
        //                 {[
        //                     {label: "Quanti", path: `quanti`},
        //                     {label: "Quando", path: `quando`},
        //                     {label: "Nome", path: `nome`},
        //                     {label: "Telefono", path: `telefono`},
        //                     {label: "Email", path: `email`},
        //                     {label: "Riepilogo", path: `riepilogo`},
        //                 ].map((item, index) => {
        //                     const isActive = /*pathname*/state.path === item.path; // Controlla se la rotta è attiva
        //
        //                     // const textColor = isActive ? "text-[#0277BD]" : "text-white"; // Colore del testo
        //                     // const textColor = isActive ? "text-[#2E7D32]" : "text-white"; // Colore del testo
        //                     const textColor = isActive ? `text-[#${activeColor}]` : "text-white"; // Colore del testo
        //                     // const textColor = isActive ? "text-[#C62828]" : "text-white"; // Colore del testo
        //
        //                     // const barColor = isActive ? "bg-[#0277BD]" : "bg-white"; // Colore della barra
        //                     // const barColor = isActive ? "bg-[#2E7D32]" : "bg-white"; // Colore della barra
        //                     const barColor = isActive ? `bg-[#${activeColor}]` : "bg-white"; // Colore della barra
        //                     // const barColor = isActive ? "bg-[#C62828]" : "bg-white"; // Colore della barra
        //
        //                     return (
        //                         // <Link key={index} href={item.path}>
        //                         //     <div className="flex flex-col cursor-pointer">
        //                         <div className="flex flex-col cursor-default" key={item.label}>
        //                               <span
        //                                   className={`${textColor} s:text-[14px] md:text-sm font-semibold font-[Roboto] mb-[3px] mt-1 pl-[1px]`}>
        //                                 {item.label}
        //                               </span>
        //                             <div className={`${barColor} s:h-[2px] md:h-[4px] s:w-[20px] md:w-[100px] rounded-full`}></div>
        //                         </div>
        //                         // </Link>
        //                     );
        //                 })}
        //             </div>
        //
        //             {/*{children}*/}
        //             <div
        //                 className="relative bg-white rounded-lg shadow-md s:h-[85vh] sm:h-[85vh] s:w-[90vw] sm:w-[62vw] flex overflow-hidden mt-10">
        //                 <div className="relative h-full w-[20vw] s:hidden md:block">
        //                     {imageUrl ? (
        //                         <img
        //                             src={imageUrl}  // Usa l'URL dinamico
        //                             // src={`http://localhost:5000/image?path=image/business_post/6d16ed3b-0c97-4898-8a57-68213fc63ff2/7810dba1-f49e-4c6f-95b9-506a56b5a036.jpg`}  // Usa l'URL dinamico
        //                             // src={`https://nurebo-s3.s3.eu-central-1.amazonaws.com/image/business_post/6d16ed3b-0c97-4898-8a57-68213fc63ff2/7810dba1-f49e-4c6f-95b9-506a56b5a036.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIASLKERVN6CKWD6GMJ%2F20241202%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20241202T005659Z&X-Amz-Expires=3600&X-Amz-Signature=7769da2d724575c74a8ab5749833f6599e15176f1f3ea2a033881b8121323dee&X-Amz-SignedHeaders=host`}  // Usa l'URL dinamico
        //                             // alt="Immagine del ristorante"
        //                             className="object-cover h-full w-full"
        //                         />
        //                     ) : (
        //                         <Skeleton className="h-full w-full"/>
        //                     )}
        //                     <div className="absolute inset-0 bg-black opacity-10"></div>
        //                 </div>
        //
        //                 <div className="flex flex-col ml-[50px] mt-[50px] h-[60px] w-[300px] min-w-[300px]">
        //                     <div className="mb-[120px]">
        //                         <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
        //                             {restaurantData.business_name}:
        //                         </label>
        //                         <div className="w-[20px]"></div>
        //                         <label className={`text-[20px] font-sans font-medium text-gray-600`}>
        //                             In quanti sarete?
        //                         </label>
        //                     </div>
        //
        //                     <div
        //                         className={`flex flex-col items-center bg-[#${activeColor}] s:mt-[40px] md:mt-[0px] s:w-[320px] md:w-[530px] pt-[30px] s:pb-[30px] md:pb-[50px] s:ml-[-30px] md:ml-[0px] pl-[50px] pr-[50px] rounded-lg shadow-md s:transform s:rotate-[-90deg] md:rotate-[0deg]`}>
        //                         {/* Valore numerico sopra lo slider */}
        //                         <div
        //                             className="font-sans mb-[25px] text-[20px] font-semibold text-white hidden md:block">
        //                             Saremo {value} persone
        //                         </div>
        //
        //                         {/* Slider */}
        //                         <div
        //                             className="relative w-full s:h-[4vh] md:h-[0vh] s:overflow-hidden md:overflow-visible"
        //                             // onTouchStart={(e) => e.stopPropagation()} // Blocca lo scroll all'inizio
        //                             onTouchMove={(e) => e.preventDefault()} // Impedisce lo scroll verticale
        //                             // onTouchEnd={(e) => e.stopPropagation()} // Ripristina il comportamento
        //                             onTouchStart={(e) => {
        //                                 e.stopPropagation();
        //                                 document.body.style.overflow = 'hidden'; // Disabilita lo scroll durante l'interazione
        //                             }}
        //                             onTouchEnd={(e) => {
        //                                 e.stopPropagation();
        //                                 document.body.style.overflow = ''; // Ripristina lo scroll al termine
        //                             }}
        //                         >
        //                             <input
        //                                 type="range"
        //                                 min="1"
        //                                 max="15"
        //                                 value={value}
        //                                 onChange={handleChange}
        //                                 className={`absolute top-1/2 transform -translate-y-1/2 w-full h-[1vh] bg-[#E0E0E0] rounded-lg appearance-none cursor-pointer slider-thumb`}
        //                             />
        //                         </div>
        //
        //                     </div>
        //
        //                     <div
        //                         className={`font-sans mt-[150px] text-center text-[20px] s:ml-[-40px] ml-[80px] font-semibold text-[#${activeColor}] md:hidden`}>
        //                         Saremo {value} persone
        //                     </div>
        //                 </div>
        //
        //                 {/*{state.isEdit && (*/}
        //                 {/*    <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">*/}
        //                 {/*    <Button*/}
        //                 {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"*/}
        //                 {/*            onClick={() => setState(prevState => ({...prevState, isEdit: false,}))}*/}
        //                 {/*            type="button"*/}
        //                 {/*        >*/}
        //                 {/*            Indietro*/}
        //                 {/*        </Button>*/}
        //                 {/*    </div>*/}
        //                 {/*)}*/}
        //
        //                 {/* Pulsante Avanti */}
        //                 {/*/!*<Link href={`/prenotazione/${params.restaurant}/quando`} prefetch={true}>*!/*/}
        //                 {/*    <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
        //                 {/*        <Button*/}
        //                 {/*            className="px-6 font-sans font-semibold rounded-md bg-[#0091EA] text-white h-[35px] w-[120px]"*/}
        //                 {/*            type="submit">Avanti*/}
        //                 {/*        </Button>*/}
        //                 {/*    </div>*/}
        //                 {/*/!*</Link>*!/*/}
        //                 <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
        //                     <Button
        //                         className={`px-6 font-sans font-semibold rounded-md ${isValid ? `bg-[#${activeColor}]` : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
        //                         type="button"
        //                         onClick={() => handleNext('quando')}
        //                         disabled={!isValid} // Disabilita il pulsante se non valido
        //                     >
        //                         Avanti
        //                     </Button>
        //                 </div>
        //             </div>
        //
        //         </div>
        //     </div>
        // </div>

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
                <div className={`absolute inset-0 overflow-hidden bg-[#${backgroundColor || '000000'}] opacity-50`}></div>
                {/*<div className={`absolute inset-0 overflow-hidden bg-[#000000] opacity-30`}></div>*/}
                {/*<div className={`absolute inset-0 bg-[#${backgroundColor || '000000'}] opacity-50`}></div>*/}
            </div>

            {/* Colore di background visibile solo su desktop */}
            <div className={`absolute inset-0 s:hidden md:block bg-[#${backgroundColor || '81D4FA'}]`}></div>

            <div className="flex items-center justify-center h-full relative z-10 overflow-hidden">
                <div className="relative s:h-screen md:h-auto flex flex-col items-center justify-center">
                    {/* Barre orizzontali sopra la card */}
                    <div
                        className="absolute s:top-[60px] md:top-[-15px] left-1/2 transform -translate-x-1/2 flex s:space-x-3 md:space-x-4 z-20">
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

                    <div className="relative bg-white rounded-lg shadow-md s:h-[60vh] md:h-[80vh] s:w-[90vw] md:w-[82vw] xl:w-[62vw] flex overflow-hidden mt-10">
                        <div className="relative h-full w-[20vw] s:hidden md:block">
                            {imageUrl ? (
                                <img src={imageUrl} className="object-cover h-full w-full"/>
                            ) : (
                                <Skeleton className="h-full w-full"/>
                            )}
                            <div className="absolute inset-0 bg-black opacity-10"></div>
                        </div>

                        <div className="flex flex-col ml-[50px] mt-[50px] h-[60px] w-[300px] min-w-[300px]">
                            <div className="s:mb-[20px] md:mb-[120px]">
                                <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                    {restaurantData.business_name}:
                                </label>
                                <div className="w-[20px]"></div>
                                <label className={`text-[20px] font-sans font-medium text-gray-600`}>
                                    In quanti sarete?
                                </label>
                            </div>

                            <div
                                className={`flex flex-col items-center bg-[#${activeColor}] s:mt-[40px] md:mt-[0px] s:w-[70vw] sm:w-[75vw] md:w-[50vw] xl:w-[35vw] pt-[30px] s:pb-[30px] md:pb-[50px] s:ml-[-10px] md:ml-[0px] s:pl-[30px] md:pl-[50px] s:pr-[30px] md:pr-[50px] rounded-lg shadow-md`}>
                                <div
                                    className="font-sans mb-[25px] text-[20px] font-semibold text-white ">
                                    {value} persone
                                </div>

                                <div
                                    className="relative w-full s:h-[4vh] md:h-[0vh] s:overflow-hidden md:overflow-visible"
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        document.body.style.overflow = 'hidden'; // Disabilita lo scroll durante l'interazione
                                    }}
                                    onTouchEnd={() => {
                                        document.body.style.overflow = ''; // Ripristina lo scroll al termine
                                    }}
                                >
                                    <input
                                        type="range"
                                        min="1"
                                        max="15"
                                        value={value}
                                        onChange={handleChange}
                                        className={`absolute top-1/2 transform -translate-y-1/2 w-full h-[1vh] bg-[#E0E0E0] rounded-lg appearance-none cursor-pointer`}
                                    />
                                </div>
                            </div>

                            <div
                                className={`font-sans mt-[40px] text-center text-[20px] s:ml-[-40px] ml-[80px] font-semibold text-[#${activeColor}] s:hidden`}>
                                {value} persone
                            </div>
                        </div>

                        <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                            <Button
                                className={`px-6 font-sans font-semibold rounded-md ${isValid ? `bg-[#${activeColor}]` : 'bg-gray-400'} text-white h-[35px] w-[120px]`}
                                type="button" onClick={() => handleNext('quando')} disabled={!isValid}>
                                Avanti
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
