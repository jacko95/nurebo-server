'use client';

import * as React from "react";
import { useState, useEffect } from 'react';
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {format, isValid} from "date-fns";
import { it } from "date-fns/locale";
import {AppProvider, useAppContext} from '@/app/AppContext';
import { Skeleton } from "@/components/ui/skeleton";
import {usePathname} from "next/navigation";
import {MdAccessTime, MdArrowBackIos, MdEvent} from "react-icons/md";


export default function Quando({ /*params,*/ restaurantData, }) {
    const pathname = usePathname();
    const { state, setState } = useAppContext();
    const [times, setTimes] = useState([]);
    // const [date, setDate] = useState(state.date || new Date());
    const [date, setDate] = useState(state.isEdit ? new Date((state.reservationDatetime)) : state.date/*new Date()*/);
    // const [date, setDate] = useState(() => {
    //     if (state.isEdit) {
    //         return isValid(new Date((state.reservationDatetime))) ? format(new Date((state.reservationDatetime)), "dd/MM/yyyy") : "17/12/1900";
    //     }
    //     return state.date || "12/12/2020";
    // });
    // const [selectedTime, setSelectedTime] = useState(state.selectedTime || new Date());
    // const [selectedTime, setSelectedTime] = useState(state.isEdit ? format(new Date((state.reservationDatetime)), "HH:mm")/*"08:48"*/ : state.selectedTime/*state.reservationDatetime*//*format(new Date(), "HH:mm")*//*new Date()*/);
    const [selectedTime, setSelectedTime] = useState(() => {
        if (state.isEdit) {
            return isValid(new Date(state.reservationDatetime)) ? format(new Date(state.reservationDatetime), "HH:mm") : "00:00";
        }
        return state.selectedTime || "00:00";
    });
    const [imageUrl, setImageUrl] = useState('');
    const [isTimeSelected, setIsTimeSelected] = useState(!!state.selectedTime);
    const [isClicked, setIsClicked] = useState(false);
    const [isAccordion1Open, setIsAccordion1Open] = useState(true);
    const [isAccordion2Open, setIsAccordion2Open] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    // const [isLoading, setIsLoading] = useState(true); // Stato di caricamento
    const [noTimesAvailable, setNoTimesAvailable] = useState(false); // Stato per orari non disponibili
    const [path, setPath] = useState(state.path || 'quando');  // Se non c'è valore in contesto, predefinisci a 2


    console.log(`fsgggbhhh`)
    console.log(state.reservationDatetime)
    // console.log(format(new Date((state.reservationDatetime)), "HH:mm"))
    // console.log((state.reservationDatetime).split(' ')[0])
    // console.log((state.reservationDatetime).split(' ')[1])

    // const getDayOfWeek = (selectedDate) => {
    //     const day = selectedDate.getDay();
    //     return day === 0 ? 7 : day; // Se è domenica (0), la trattiamo come 7
    // };
    const getDayOfWeek = (selectedDate) => {
        if (!selectedDate) {
            return null; // o qualsiasi altro valore predefinito appropriato
        }

        const day = selectedDate.getDay();
        return day === 0 ? 7 : day; // Se è domenica (0), la trattiamo come 7
    };

    const fetchTimesForDay = async (selectedDate) => {
        const dayOfWeek = getDayOfWeek(selectedDate);
        // setIsLoading(true); // Inizio del caricamento
        setNoTimesAvailable(false); // Reset stato orari non disponibili

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${/*params*/restaurantData.business_id}/timetable/${dayOfWeek}`,
                {
                    next: { revalidate: 10 },
                    cache: 'no-store',
                }
            );
            const data = await response.json();

            // Cancelliamo gli slot se ci sono e resettiamo lo stato
            const allTimes = [];
            data.forEach((slot) => {
                const openHour = parseInt(slot.open_at_hour, 10);
                const openMinute = parseInt(slot.open_at_minute, 10);
                const closeHour = parseInt(slot.close_at_hour, 10);
                const closeMinute = parseInt(slot.close_at_minute, 10);

                let currentTime = openHour * 60 + openMinute;
                const closeTime = closeHour * 60 + closeMinute;

                while (currentTime <= closeTime) {
                    const hours = Math.floor(currentTime / 60);
                    const minutes = currentTime % 60;
                    allTimes.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                    currentTime += 30;
                }
            });

            allTimes.sort((a, b) => {
                const [oraA, minutoA] = a.split(':').map(Number);
                const [oraB, minutoB] = b.split(':').map(Number);

                if (oraA === oraB) {
                    return minutoA - minutoB;
                } else {
                    return oraA - oraB;
                }
            });

            setTimes(allTimes);

            console.log('allTimes.length0000')
            console.log(allTimes.length)
            console.log(allTimes)

            // Controlla se ci sono orari disponibili
            if (allTimes.length === 0) {
                setNoTimesAvailable(true);
            }
        } catch (error) {
            console.error("Errore durante il fetch degli slot orari:", error);
            setNoTimesAvailable(true);
        } finally {
            // setIsLoading(false); // Fine del caricamento
        }
    };

    useEffect(() => {
        console.log('date1233333333')
        console.log(date)
        fetchTimesForDay(date); // Otteniamo gli slot per il giorno iniziale (stato `date`)
        if(state.isEdit){
            // setDate(new Date((state.reservationDatetime)))
            // setSelectedTime(format(new Date((state.reservationDatetime)), "HH:mm"))
            setIsTimeSelected(true)
        }
    }, [date]);

    const toggleAccordion = () => {
        setIsAccordion2Open(false);
        setIsAccordion1Open(!isAccordion1Open);
    };

    const toggleAccordion2 = () => {
        setIsAccordion1Open(false);
        setIsAccordion2Open(!isAccordion2Open);
    };

    const handleDateSelect = (selectedDate) => {
        setIsAccordion1Open(false)
        setIsAccordion2Open(true)
        setIsClicked(true)
        setDate(selectedDate /*|| (state.reservationDatetime).split(' ')[0]*/);
        setTimes([]); // Reset degli slot
        fetchTimesForDay(selectedDate); // Ricarichiamo gli slot per il giorno selezionato
        setSelectedTime(""); // Resettiamo l'orario selezionato
        setIsTimeSelected(false); // Disabilitiamo il bottone "Avanti"
    };

    const handleTimeSelect = (time) => {
        let newt = new Date();
        console.log('time15511541')
        console.log(time)
        console.log(time.split(':'))
        console.log(new Date(newt.setHours(time.split(':')[0])).getHours())
        console.log(new Date(newt.setMinutes(time.split(':')[1])).getMinutes())
        console.log(new Date(newt.setSeconds(0)).getSeconds())
        console.log(newt)
        console.log(new Date(newt))
        // console.log(new Date(time.split(':')[0]).getMinutes())
        console.log(date)

        setSelectedTime(time /*|| (state.reservationDatetime).split(' ')[1]*/);
        setIsTimeSelected(true);
        setShowWarning(false);
        const formattedDate = format(date, 'dd/MM/yyyy');
        console.log(formattedDate)

        setState({
            ...state,
            // reservationDatetime: `${formattedDate} ${time}`,
            // reservationDatetime: new Date(Date.UTC(2024, 11, 18, 10, 48, 0)),
            // reservationDatetime: (new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), newt.getHours(), newt.getMinutes(), newt.getSeconds(), 0))).toISOString(),
            reservationDatetime: (new Date(/*Date.UTC(*/date.getFullYear(), date.getMonth(), date.getDate(), newt.getHours(), newt.getMinutes(), newt.getSeconds(), 0)/*)*/).toISOString(),
            date: date,
            selectedTime: time,
        });

        // console.log(`ime}`)
        // console.log(`${formattedDate} ${time}`)
        console.log('state.reservationDatetime12222')
        console.log(state.reservationDatetime)
        console.log(state)
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

    const handleNextClick = (e, ciccio) => {
        console.log('porme')
        console.log(isTimeSelected)

        if (!isTimeSelected) {
            e.preventDefault();
            setShowWarning(true);
        }
        else {
            handleNext(ciccio)
        }
        // handleNext(ciccio)
    };

    const fetchImageUrl = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${restaurantData.business_id}/form?path=quando`, {
                // cache: 'no-store',
                next: { revalidate: 10 },
            });
            const data = await response.json();
            // setImageUrl(data[0].image_url);
            setImageUrl(data);
        } catch (error) {
            console.error("Errore durante il fetch dell'immagine:", error);
        }
    };

    useEffect(() => {
        fetchImageUrl();
        // handleTimeSelect(state.reservationDatetime);

    }, []);

    useEffect(() => {
        const setRealVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--real-vh', `${vh * 100}px`);
        };

        setRealVH();
        window.addEventListener('resize', setRealVH);

        return () => window.removeEventListener('resize', setRealVH);
    }, []);


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
                        className="absolute s:top-[50px] sm:top-[-5px] md:top-[-15px] left-1/2 transform -translate-x-1/2 flex s:space-x-3 md:space-x-4 z-20">
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

                    <div className="relative bg-white rounded-lg shadow-md s:h-[80vh] sm:h-[80vh] md:h-[80vh] s:w-[90vw] sm:w-[72vw] md:w-[92vw] lg:w-[82vw] xl:w-[62vw] flex overflow-hidden mt-10 ">
                        <div className="relative h-full w-[20vw] s:hidden md:block">
                            {imageUrl ? (
                                <img src={imageUrl} className="object-cover h-full w-full"/>
                            ) : (
                                <Skeleton className="h-full w-full"/>
                            )}
                            <div className="absolute inset-0 bg-black opacity-10"></div>
                        </div>

                        <div
                            // style={{
                            //     // overflowY: 'auto',
                            //     WebkitOverflowScrolling: 'touch',
                            //     scrollBehavior: 'smooth',
                            // }}
                             className={`flex-1 s:overflow-y-auto md:overflow-y-hidden overflow-x-hidden `}
                             // style={{
                             //     scrollbarWidth: 'none', // Per Firefox
                             //     msOverflowStyle: 'none', // Per IE e Edge
                             // }}
                        >
                            <div className="ml-[50px] s:mt-[35px] md:mt-[50px] h-[60px] w-[300px] min-w-[300px]">
                                <div className="s:mb-[15px] md:mb-[55px]">
                                    {/*<label className="text-[15px] font-sans font-medium text-[#1976D2]">*/}
                                    <label className={`s:text-[15px] md:text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                        {restaurantData.business_name}:
                                    </label>
                                    <div className="w-[20px]"></div>
                                    <label className="s:text-[17px] md:text-[20px] font-sans font-medium text-gray-600">
                                        Quando vorresti venire?
                                    </label>
                                </div>

                                <div className={`flex s:flex-col md:flex-row w-[500px]`}>
                                    <div className="flex flex-col">
                                        <div className="flex justify-center align-middle mb-[20px] ml-[5px] md:hidden s:block">
                                            {/*<Button*/}
                                            {/*    className={`font-semibold rounded-md text-left bg-[#1E88E5] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px]`}>*/}
                                            {/*    {date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} {date.getDate()} {date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} alle {selectedTime}*/}
                                            {/*</Button>*/}

                                            {/*<Button*/}
                                            {/*    className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none ml-[0px] mt-[20px] w-[250px] h-[40px]`}*/}
                                            {/*>*/}
                                            {/*    {date ? (*/}
                                            {/*        `${date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +*/}
                                            {/*        date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} */}
                                            {/*    ${date.getDate()} */}
                                            {/*    ${date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() +*/}
                                            {/*        date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} */}
                                            {/*    ${selectedTime ? `alle ${selectedTime}` : ''}` // Mostra "alle" solo se selectedTime è definito*/}
                                            {/*    ) : (*/}
                                            {/*        // 'Data non disponibile'*/}
                                            {/*        'Seleziona un giorno e un orario'*/}
                                            {/*    )}*/}
                                            {/*</Button>*/}

                                        </div>

                                        <div className="md:hidden s:block accordion rounded-md w-[250px] ml-[5px]">
                                            <Button
                                                onClick={toggleAccordion}
                                                className={`font-sans font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#${activeColor}] ml-[0px] w-[250px] h-[40px] accordion-header flex justify-between items-center p-4 focus:bg-[#${activeColor}] focus:outline-none`}
                                            >
                                                <span className="flex font-sans font-medium text-[#ffffff]"><MdEvent className={`mt-[1px] mr-[8px] text-[#ffffff] text-[18px]`} />{date ? (
                                                    `${date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +
                                                    date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} 
                                                ${date.getDate()} 
                                                ${date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() +
                                                    date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)}`
                                                ) : (
                                                    // 'Data non disponibile'
                                                    <span className={`flex`}>{`Giorno`}</span>
                                                )}</span>
                                                <span
                                                    className={` transform transition-transform ${isAccordion1Open ? 'rotate-90 mb-[-5px]' : '-rotate-90  mb-[5px]'}`}><MdArrowBackIos/></span>
                                            </Button>
                                            <div className={`h-[10px] `}></div>
                                            <div
                                                className={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${
                                                    isAccordion1Open ? 'max-h-300' : 'max-h-0'
                                                }`}
                                            >
                                                <Calendar
                                                    style={{
                                                        width: '250px',
                                                        height: '300px',
                                                    }}
                                                    mode="single"
                                                    selected={date}
                                                    defaultMonth={date}
                                                    locale={it}
                                                    onSelect={handleDateSelect}
                                                    // fromDate={new Date()}
                                                    fromDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                                                    toDate={new Date().setMonth(new Date().getMonth() + 1)}
                                                    className="m-[0px] transform s:scale-[1] md:scale-[1.1] rounded-md"
                                                />
                                            </div>
                                        </div>

                                        <Calendar
                                            style={{
                                                width: '250px',
                                                height: '300px',
                                            }}
                                            mode="single"
                                            selected={date}
                                            defaultMonth={date}
                                            locale={it}
                                            onSelect={handleDateSelect}
                                            // fromDate={new Date()}
                                            fromDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                                            toDate={new Date().setMonth(new Date().getMonth() + 1)}
                                            className="s:hidden md:block m-[0px] transform s:scale-[1] md:scale-[1.1] rounded-md"
                                        />

                                    </div>

                                    <div className={`s:mb-[13vh] md:mb-[0px]`}>
                                        <div
                                            className="flex justify-center align-middle mb-[30px] ml-[5px] s:hidden md:block">
                                            {/*<Button*/}
                                            {/*    className={`font-semibold rounded-md text-left bg-[#1E88E5] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px]`}>*/}
                                            {/*    {date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} {date.getDate()} {date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} alle {selectedTime}*/}
                                            {/*</Button>*/}
                                            <Button
                                                className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none mt-[0px] w-[250px] h-[40px] ml-[12px]`}
                                            >
                                                {date ? (
                                                    `${date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +
                                                    date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} 
                                                ${date.getDate()} 
                                                ${date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() +
                                                    date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} 
                                                ${selectedTime ? `alle ${selectedTime}` : ''}` // Mostra "alle" solo se selectedTime è definito
                                                ) : (
                                                    // 'Data non disponibile'
                                                    'Seleziona un giorno e un orario'
                                                )}
                                            </Button>

                                        </div>

                                        <div className="md:hidden s:block accordion rounded-md w-[250px] ml-[5px]">
                                            <Button
                                                onClick={toggleAccordion2}
                                                className={`font-sans font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#${activeColor}] ml-[0px] w-[250px] h-[40px] accordion-header flex justify-between items-center p-4 focus:bg-[#${activeColor}] focus:outline-none`}
                                            >
                                                <span className="flex font-medium text-[#ffffff]"><MdAccessTime
                                                    className={`mt-[1px] mr-[8px] text-[#ffffff] text-[18px]`}/>{isTimeSelected ? (
                                                    `${selectedTime ? `${selectedTime}` : ''}`
                                                ) : (
                                                    // 'Data non disponibile'
                                                    'Ora'
                                                )}</span>
                                                <span
                                                    className={` transform transition-transform ${isAccordion2Open ? 'rotate-90 mb-[-5px]' : '-rotate-90  mb-[5px]'}`}><MdArrowBackIos/></span>
                                            </Button>
                                            {/*<div className={`h-[10px] `}></div>*/}
                                            <div
                                                className={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${
                                                    isAccordion2Open ? '' : 'max-h-0'}`}
                                            >
                                                <div
                                                    style={{
                                                        overflowY: 'auto',
                                                        padding: '16px',
                                                        WebkitOverflowScrolling: 'touch',
                                                        scrollBehavior: 'smooth',
                                                    }}
                                                    className="w-[280px] h-[210px] s:mt-[30px] md:mt-[0px] overflow-y-hidden rounded-md s:ml-[-15px] md:ml-[0px] md:hidden s:block">
                                                    {noTimesAvailable && isClicked ? (
                                                        <p className=" mt-[50px] text-[#616161] text-center font-semibold font-sans text-[30px]">Chiuso</p>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-2 w-full">
                                                            {times.map((time) => (
                                                                <Button
                                                                    key={time}
                                                                    onClick={() => handleTimeSelect(time)}
                                                                    className={`text-[#424242] font-semibold py-2 px-4 rounded-md mb-2 w-full text-left ${selectedTime === time ? 'bg-[#212121] text-white' : 'bg-white hover:bg-[#9E9E9E] hover:text-[#FFFFFF]'}`}
                                                                >
                                                                    {time}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                        // times.map((time) => (
                                                        //     <Button
                                                        //         key={time}
                                                        //         onClick={() => handleTimeSelect(time)}
                                                        //         className={`text-[#424242] font-semibold py-2 px-4 rounded-md mb-2 w-full text-left ${selectedTime === time ? 'bg-[#212121] text-white' : 'bg-white hover:bg-[#9E9E9E] hover:text-[#FFFFFF]'}`}
                                                        //     >
                                                        //         {time}
                                                        //     </Button>
                                                        // ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                overflowY: 'auto',
                                                padding: '16px',
                                                WebkitOverflowScrolling: 'touch',
                                                scrollBehavior: 'smooth',
                                            }}
                                            className="w-[280px] h-[210px] s:mt-[30px] md:mt-[0px] overflow-y-auto rounded-md s:ml-[-20px] md:ml-[0px] s:hidden md:block">
                                            {noTimesAvailable && isClicked ? (
                                                <p className=" mt-[50px] text-[#616161] text-center font-semibold font-sans text-[30px]">Chiuso</p>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-2 w-full">
                                                    {times.map((time) => (
                                                        <Button
                                                            key={time}
                                                            onClick={() => handleTimeSelect(time)}
                                                            className={`text-[#424242] font-semibold py-2 px-4 rounded-md mb-2 w-full text-left ${selectedTime === time ? 'bg-[#212121] text-white' : 'bg-white hover:bg-[#9E9E9E] hover:text-[#FFFFFF]'}`}
                                                        >
                                                            {time}
                                                        </Button>
                                                    ))}
                                                </div>
                                                // times.map((time) => (
                                                //     <Button
                                                //         key={time}
                                                //         onClick={() => handleTimeSelect(time)}
                                                //         className={`text-[#424242] font-semibold py-2 px-4 rounded-md mb-2 w-full text-left ${selectedTime === time ? 'bg-[#212121] text-white' : 'bg-white hover:bg-[#9E9E9E] hover:text-[#FFFFFF]'}`}
                                                //     >
                                                //         {time}
                                                //     </Button>
                                                // ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {showWarning && (
                                    <p className="s:hidden md:block w-[60vw] font-sans font-semibold text-red-600 mt-[40px]">
                                        Seleziona una data e un orario per procedere.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/*<div className={``}>*/}
                        {/*<Link href={`/prenotazione/${params.restaurant}/quanti`} prefetch={true}>*/}
                        {/*    <div className="absolute left-[340px] bottom-[20px] space-x-4 shadow-2xl">*/}
                        {/*        <Button*/}
                        {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"*/}
                        {/*            type="submit">Indietro*/}
                        {/*        </Button>*/}
                        {/*    </div>*/}
                        {/*</Link>*/}

                        {/*<div className={`absolute s:left-[20px] sm:left-[300px] md:left-[420px] md:left-[480px] bottom-[20px] space-x-4 shadow-2xl`}>*/}
                        <div
                            className={`absolute s:left-[10vw] sm:right-[22vw] md:left-[25vw] bottom-[20px] space-x-4 `}>
                            <Button
                                className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
                                onClick={() => handleNext('quanti')}
                                type="submit">Indietro
                            </Button>
                        </div>
                        {/*<Link href={`/prenotazione/${params.restaurant}/nome`} onClick={handleNextClick} prefetch={true}>*/}
                        {/*    <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl cursor-default">*/}
                        {/*        <Button*/}
                        {/*            className={`shadow-md font-sans font-semibold py-2 px-4 rounded-md text-white h-[35px] w-[120px] ${!isTimeSelected ? 'bg-[#B0BEC5]' : 'bg-[#1E88E5] hover:bg-[#1565C0] cursor-pointer'}`}*/}
                        {/*            type="submit"*/}
                        {/*            disabled={!isTimeSelected}> /!* Disabilita se non è stato selezionato un orario *!/*/}
                        {/*            Avanti*/}
                        {/*        </Button>*/}
                        {/*    </div>*/}
                        {/*</Link>*/}

                        <div className="absolute s:right-[10vw] md:right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                            <Button
                                className={`px-6 font-sans font-semibold rounded-md ${isTimeSelected ? `bg-[#${activeColor}]` : `bg-[#${activeColor}] cursor-default opacity-50 focus:bg-[#${activeColor}] hover:bg-[#${activeColor}]`} text-white h-[35px] w-[120px]`}
                                type="button"
                                onClick={(e) => handleNextClick(e, 'nome')}
                                // disabled={!isTimeSelected /*&& !state.isEdit*/} // Disabilita il pulsante se non valido
                            >
                                Avanti
                            </Button>
                        </div>
                        {/*</div>*/}
                    </div>

                </div>
            </div>
        </div>
    );
}
