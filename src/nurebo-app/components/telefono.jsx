'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {AppProvider, useAppContext} from "@/app/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import {usePathname, useRouter} from 'next/navigation';
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp";


export default function Telefono({ /*params,*/ restaurantData, }) {
    const pathname = usePathname(); // Ottieni la rotta attuale
    const { state, setState } = useAppContext();
    const [imageUrl, setImageUrl] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const [path, setPath] = useState(state.path || 'telefono');  // Se non c'è valore in contesto, predefinisci a 2
    const [phone, setPhone] = useState("");


    // // Sincronizza il valore locale con quello del contesto globale quando il componente è montato
    // useEffect(() => {
    //     setPath(state.path || 'nome');
    // }, [state.path]);


    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${/*params.restaurant*/restaurantData.business_id}/form?path=telefono`, {
                        next: { revalidate: 10 },
                        // cache: 'no-store',
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

    useEffect(() => {
        // Modello per numeri che iniziano con 3 e sono lunghi tra 9 e 11 cifre
        // const phonePattern = /^3\d{8,9}$/;
        const phonePattern = /^3\d{9}$/;
        const isValidNumber = phonePattern.test(state.reservationPhone);
        setIsValid(isValidNumber);

        // Imposta il messaggio di validità
        if (state.reservationPhone.length > 0) {
            setMessage(isValidNumber ? 'Numero valido!' : 'Numero non valido!');
        } else {
            setMessage('');
        }
    }, [state.reservationPhone]);


    const handleChange = (e) => {
        // const phoneNumber = e.target.value;
        // setState({ ...state, reservationPhone: phoneNumber });

        setState({ ...state, reservationPhone: e });
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

    const handleNextClick = (ciccio) => {
        if (isValid) {
            // router.push(`/prenotazione/${params.restaurant}/email`);
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
                        <div className="relative h-full w-[20vw] s:hidden md:block">
                            {imageUrl ? (
                                <img src={imageUrl} className="object-cover h-full w-full"/>
                            ) : (
                                <Skeleton className="h-full w-full"/>
                            )}
                            <div className="absolute inset-0 bg-black opacity-10"></div>
                        </div>

                        <div className="s:ml-[40px] md:ml-[50px] s:mt-[40px] md:mt-[50px] s:w-[60vw]">
                            <div className="mb-[15px]">
                                <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                    {restaurantData.business_name}:
                                </label>
                                <div className="w-[20px]"></div>
                                <label className={`text-[20px] font-sans font-medium text-gray-600`}>
                                    Quale è il tuo numero di telefono?
                                </label>
                            </div>

                            <div className="flex items-center s:mt-[10vh] md:mt-[150px]">
                                {/*<span*/}
                                {/*    className={`s:text-[22px] s:text-[4vw] md:text-[1.7vw] font-sans text-[#${activeColor}] mr-2`}>+39</span> /!* Prefisso senza border *!/*/}
                                {/*<div*/}
                                {/*    className="flex items-center border-b-2 border-gray-500 s:w-[60vw] sm:w-[40vw] md:w-[33vw]"> /!* Solo input con bordo *!/*/}
                                {/*    <input*/}
                                {/*        type="tel"*/}
                                {/*        value={state.reservationPhone}*/}
                                {/*        placeholder="Numero di cellulare"*/}
                                {/*        onChange={handleChange}*/}
                                {/*        className="w-full focus:outline-none focus:border-blue-500 s:text-[23px] md:text-[32px]  font-sans text-gray-700 input-text input-placeholder"*/}
                                {/*    />*/}
                                {/*    */}
                                {/*</div>*/}
                                    <InputOTP
                                        maxLength={10}
                                        // value={otp}
                                        // value={phone}
                                        value={state.reservationPhone}
                                        // onChange={(otp) => setOtp(otp)}
                                        // onChange={(phone) => setPhone(phone)}
                                        onChange={(value) => handleChange(value)}
                                        // className={`transform scale-[4.8]`}
                                    >
                                        {/*<InputOTPGroup className={`transform scale-[1.3]`}>*/}
                                        <InputOTPGroup className={``}>
                                            <InputOTPSlot index={0} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={1} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={2} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={3} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={4} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={5} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={6} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={7} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={8} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                            <InputOTPSlot index={9} className={`font-sans s:w-[7vw] s:h-[7vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[1.7vw]`}/>
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <div className="text-center text-sm">
                                        {/*{otp === "" ? (*/}
                                        {/*    <></>*/}
                                        {/*) : (*/}
                                        {/*    <>You entered: {otp}</>*/}
                                        {/*)}*/}
                                    </div>
                            </div>

                            {/*<div*/}
                            {/*    className={`font-sans font-medium ml-[60px] mt-2 text-[18px] ${isValid ? 'text-green-500' : 'text-red-500'}`}>*/}
                            {/*    {message}*/}
                            {/*</div>*/}
                        </div>

                        {/*<Link href={`/prenotazione/${params.restaurant}/quando`} prefetch={true}>*/}
                        <div
                            className={`absolute s:left-[10vw] sm:right-[22vw] md:left-[25vw] bottom-[20px] space-x-4 `}>
                            <Button
                                className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
                                onClick={() => handleNext('nome')}
                                type="button">Indietro
                            </Button>
                        </div>
                        {/*</Link>*/}

                        <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                            <Button
                                className={`px-6 font-sans font-semibold rounded-md ${isValid ? `bg-[#${activeColor}]` : `bg-[#${backgroundColor}]`} text-white h-[35px] w-[120px]`}
                                type="button"
                                onClick={() => handleNextClick('email')}
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
