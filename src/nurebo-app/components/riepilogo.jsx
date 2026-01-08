'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { AppProvider, useAppContext } from '@/app/AppContext';
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp";

export default function Riepilogo({ /*params,*/ restaurantData, }) {
  const pathname = usePathname(); // Ottieni la rotta attuale
  const { state, setState } = useAppContext();  // Accedi allo stato globale
  const dateString = state.reservationDatetime || "01/01/2024 00:00"; // Default se undefined
  // const reservationQty = state.reservationQty || 2; // Default se undefined
  // const [datePart, timePart] = dateString.split(" ");
  // const [day, month, year] = datePart.split("/").map(Number);
  // const [hours, minutes] = timePart.split(":").map(Number);
  // const dateObject = new Date(year, month - 1, day, hours, minutes);
  const dateObject = new Date(new Date(state.reservationDatetime).getFullYear(), new Date(state.reservationDatetime).getMonth(), new Date(state.reservationDatetime).getDate(), new Date(state.reservationDatetime).getHours(), new Date(state.reservationDatetime).getMinutes());
  const [imageUrl, setImageUrl] = useState('');  // Stato per l'URL dell'immagine
  const [open, setOpen] = useState(false); // Stato per gestire la visibilità del Dialog
  const [changeDialogOpen, setChangeDialogOpen] = useState(false); // Stato per gestire la visibilità del Dialog
  const [newUserUrlReservation, setNewUserUrlReservation] = useState(''); // Stato per gestire la visibilità del Dialog
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authId, setAuthId] = useState("");
  const [isOTPValid, setIsOTPValid] = useState(false);  // Stato validità ristorante
  const [showWarning, setShowWarning] = useState(false);


  console.log('state.reservationId5555555555555')
  console.log(state.reservationId)

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${/*params.restaurant*/restaurantData.business_id}/form?path=riepilogo`, {
          next: { revalidate: 10 },
          // cache: 'no-store',
        });
        const data = await response.json();
        // setImageUrl(data[0].image_url);  // Imposta l'URL dell'immagine ricevuta
        setImageUrl(data);  // Imposta l'URL dell'immagine ricevuta
      } catch (error) {
        console.error("Errore durante il fetch dell'immagine:", error);
      }
    };

    fetchImageUrl();
  }, []);

  // Funzione per formattare la data
  const formatDate = (date) => {
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
    const formattedDate = date.toLocaleDateString('it-IT', optionsDate);
    const formattedTime = date.toLocaleTimeString('it-IT', optionsTime);
    let dayName = formattedDate.split(' ')[0];
    let dayNumber = formattedDate.split(' ')[1];
    let monthName = formattedDate.split(' ')[2];
    let yearNumber = formattedDate.split(' ')[3];
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime}`;
  };

  const formattedDate = formatDate(dateObject);

  // Funzione per formattare la data nel formato MySQL
  const formatDateForMySQL = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mesi da 0 a 11
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // let datamerda = new Date();
    // datamerda.setTime(date.getHours(), date.getMinutes(), date.getSeconds());
    // datamerda.setDate(date.getDate());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    // return datamerda;
  };

  // Usare la nuova funzione per il datetime corretto
  // const formattedDateForMySQL = formatDateForMySQL(dateObject);

  // Funzione per gestire il click del pulsante
  // const handleProceedClick = async () => {
  //   try {
  //     const response = await fetch(
  //       // '${process.env.NEXT_PUBLIC_API_BASE_URL}/restaurant/reservation',
  //       '${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation',
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           name: state.reservationName,
  //           business_id: "osteria-serafina-milano",
  //           quantity: state.reservationQty,
  //           phone: state.reservationPhone,
  //           email: state.reservationEmail,
  //           datetime: new Date(formatDateForMySQL(dateObject)).toISOString(),
  //           // datetime: new Date(formatDateForMySQL(dateObject)).toLocaleString(),
  //         }),
  //       }
  //     );
  //
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log('Risposta dal server:', data);
  //       // Puoi fare un redirect o mostrare un messaggio di successo
  //     } else {
  //       console.error('Errore durante la richiesta:', response.statusText);
  //     }
  //   } catch (error) {
  //     console.error('Errore durante il fetch:', error);
  //   }
  // };

  const handleSubmitOTP = async () => {
    // const otpCode = otp.join('');
    console.log('Codice OTP:', otp/*Code*/);
    const localDateTime = new Date(dateObject.getTime()).toISOString();

    console.log('dddddddddddddddd8886655ccc')
    console.log(state.userType)
    // console.log(userType)

    if (otp/*Code*/.length === 6) {
      // setIsOTPValid(true)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationId}/verify_otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
          },
          credentials: 'include',
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
            reservation_datetime: state.reservationDatetime,
            // business_email: restaurantData.business_email,
            reservation_email: state.reservationEmail,
            user_type_id: 2,
            action: 'reservation_auth',
            auth_id: authId,
            otp: otp,
          }),
          cache: 'no-store',
        });

        const result = await response.json();

        console.log('Risultato:', result);
        console.log('result.success:', result.success);
        // console.log('result[0].success:', result[0].success);
        setOtp('')

        if (result.success === 1) {
          setIsOTPValid(true)
          setNewUserUrlReservation(result.reservation_user_url)
          // await handleProceedClick();
          setOpen(true)
          setShowWarning(false)
        }
        else {
          setIsOTPValid(false)
          setShowWarning(true)
        }
      } catch (error) {
        console.error('Errore nella richiesta:', error);
      }
    }

  };

  // const handleProceedClick = async () => {
  //   try {
  //     // inserisce la prenotazione solo se l otp inserito è valido
  //
  //
  //     // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
  //     const localDateTime = new Date(dateObject.getTime()).toISOString();
  //     console.log('Local datetime:', localDateTime);
  //     console.log('888888888888888')
  //     console.log(restaurantData)
  //
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       // next: {revalidate: 10},
  //       body: JSON.stringify({
  //         ...restaurantData,
  //         reservation_phone: state.reservationPhone,
  //         // business_phone: restaurantData.business_phone,
  //         reservation_name: state.reservationName,
  //         // business_name: restaurantData.name,
  //         // business_id: "osteria-serafina-milano",
  //         business_id: `${/*params.restaurant*/restaurantData.business_id}`,
  //         quantity: state.reservationQty,
  //         phone: state.reservationPhone,
  //         datetime: localDateTime,
  //         // business_email: restaurantData.business_email,
  //         reservation_email: state.reservationEmail,
  //       }),
  //       cache: 'no-store',
  //     });
  //
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log('Risposta dal server:', data);
  //       setOpen(true); // Apri il Dialog se la richiesta ha avuto successo
  //       setNewUserUrlReservation(data)
  //     } else {
  //       console.error('Errore durante la richiesta:', response.statusText);
  //     }
  //   } catch (error) {
  //     console.error('Errore durante il fetch:', error);
  //   }
  // };

  const sendOTP = async (data) => {
    if (otpSent) return; // Evita invii multipli
    setOtpSent(true);
    try {
      const localDateTime = new Date(dateObject.getTime()).toISOString();
      console.log('vfdggdbbgbgbgggfgg')
      console.log(data)
      console.log(restaurantData)

      // // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
      // const localDateTime = new Date(dateObject.getTime()).toISOString();
      // console.log('Local datetime:', localDateTime);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationId}/send_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
        },
        next: {revalidate: 10},
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
          reservation_datetime: state.reservationDatetime,
          datetime: localDateTime,
          // business_email: restaurantData.business_email,
          reservation_email: state.reservationEmail,
          user_type_id: 2,
        }),
        // cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Risposta dal server00000000000:', data);
        console.log('data.auth_id');
        console.log(data.auth_id);
        setAuthId(data.auth_id);
      } else {
        console.error('Errore durante la richiesta:', response.statusText);
      }
    } catch (error) {
      console.error('Errore durante il fetch:', error);
    }
  };

  const handlemodifyClick = async () => {
    try {
      // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
      const localDateTime = new Date(dateObject.getTime()).toISOString();

      console.log('pppppppppppppppppp')
      console.log(state)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationData.reservation_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
        },
        next: {revalidate: 10},
        body: JSON.stringify({
          ...state.restaurantData,
          ...state.reservationData,
          reservation_phone: state.reservationPhone,
          business_phone: state.restaurantData.business_phone,
          reservation_name: state.reservationName,
          business_name: state.restaurantData.business_name,
          // business_id: "osteria-serafina-milano",
          business_id: `${/*params.restaurant*/state.restaurantData.business_id}`,
          quantity: state.reservationQty,
          phone: state.reservationPhone,
          datetime: localDateTime,
          business_email: state.restaurantData.business_email,
          reservation_email: state.reservationEmail,
          user_type: state.userType
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Risposta dal server:', data);
        setChangeDialogOpen(true); // Apri il Dialog se la richiesta ha avuto successo
      } else {
        console.error('Errore durante la richiesta:', response.statusText);
      }
    } catch (error) {
      console.error('Errore durante il fetch:', error);
    }
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

  const handleClose = () => {
    console.log(open)
    setOpen(false); // Funzione per chiudere il dialog
    console.log(open)
  };

  const handleDialogcHANGE = (open) => {
    console.log(open)
    setOpen(open); // Funzione per chiudere il dialog
    console.log(open)
    if (!open) {
      // Azione quando il dialog viene chiuso
      // window.location.reload();
      // window.location.replace(`https://www.nurebo.com/${newUserUrlReservation}`);
      // window.location.href = `${newUserUrlReservation}`; //modifica solo dall ultimo '/'
      window.location.pathname = `${newUserUrlReservation}`;
      console.log('state45555555555')
      console.log(state)
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
            <div className="relative s:h-screen md:h-auto flex flex-col items-center justify-center">
              {/* Barre orizzontali sopra la card */}
              <div
                  className="absolute s:top-[60px] sm:top-[30px] md:top-[-15px] left-1/2 transform -translate-x-1/2 flex s:space-x-3 md:space-x-4 z-20">
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
                  className="relative bg-white rounded-lg shadow-md s:h-[75vh] sm:h-[85vh] md:h-[80vh] s:w-[90vw] md:w-[85vw] sm:w-[90vw] lg:w-[75vw] xl:w-[60vw] flex overflow-hidden mt-10">
                <div className="relative h-full w-[20vw] s:hidden md:block">
                  {imageUrl ? (
                      <img src={imageUrl} className="object-cover h-full w-full"/>
                  ) : (
                      <Skeleton className="h-full w-full"/>
                  )}
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                </div>

                <div className={`flex-1 overflow-y-auto overflow-x-hidden `}
                     style={{
                       scrollbarWidth: 'none', // Per Firefox
                       msOverflowStyle: 'none', // Per IE e Edge
                     }}
                >

                  <div className="flex flex-col s:ml-[35px] md:ml-[50px] mt-[40px] md:mb-[0px]">
                    <div className="mb-[25px]">
                      <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                        {restaurantData.business_name}:
                      </label>
                      <div className="h-[7px]"></div>
                      <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                        Ricapitoliamo...
                      </label>
                    </div>

                    <div className="flex s:flex-col md:flex-row s:ml-[0px] s:mt-[20px] md:mt-[60px] mb-[40px]">

                      <div className={`flex`}>
                        {state.reservationName && (
                            <div>
                              <label className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                Il tuo nome:
                              </label>
                              <div className="h-[2px]"></div>
                              <label
                                  className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                                {state.reservationName}
                              </label>
                            </div>
                        )}

                        {state.reservationQty && (
                            <div className={`s:block md:hidden s:ml-[50px]`}>
                              <label className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                Sarete in:
                              </label>
                              <div className="h-[2px]"></div>
                              <label
                                  className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                                {state.reservationQty}
                              </label>
                            </div>
                        )}

                      </div>

                      {state.reservationQty && (
                          <div className={`s:hidden md:block s:mt-[20px] md:mt-[0px] md:ml-[50px]`}>
                            <label className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                              Sarete in:
                            </label>
                            <div className="h-[2px]"></div>
                            <label
                                className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                              {state.reservationQty}
                            </label>
                          </div>
                      )}

                      {state.reservationPhone && (
                          <div className={`s:mt-[20px] md:mt-[0px] md:ml-[50px]`}>
                            <label className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                              Il tuo numero è:
                            </label>
                            <div className="h-[2px]"></div>
                            {/*<label className={`text-[20px] font-sans font-medium text-gray-600 leading-[27px]`}>*/}
                            <label
                                className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                              {state.reservationPhone}
                            </label>
                          </div>
                      )}
                    </div>

                    {state.reservationEmail && (
                        <div className="s:mt-[-10px] s:mb-[40px] md:mt-[0px]">
                          <label className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                            La tua mail è:
                          </label>
                          <div className="h-[2px]"></div>
                          <label
                              className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                            {state.reservationEmail}
                          </label>
                        </div>
                    )}

                    {formattedDate && (
                        <div className="s:mt-[-10px] md:mt-[10px]">
                          <label className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                            Ci vedremo:
                          </label>
                          <div className="h-[2px]"></div>
                          <label
                              className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                            {formattedDate}
                          </label>
                        </div>
                    )}

                  </div>

                  {/* Pulsante Indietro */}
                  {/*<Link href={`/prenotazione/${params.restaurant}/email`} prefetch={true}>*/}
                  <div
                      className={`absolute s:left-[10vw] sm:right-[22vw] md:left-[25vw] bottom-[20px] space-x-4 `}>
                    <Button
                        className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
                        onClick={() => handleNext('email')}
                        type="submit">Indietro
                    </Button>
                  </div>
                  {/*</Link>*/}

                  <div>
                    {/*<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                    {/*  <Button*/}
                    {/*      // className="px-6 font-sans font-semibold rounded-md bg-[#FF1744] text-white h-[35px] w-[140px]"*/}
                    {/*      className={`px-6 font-sans font-semibold rounded-md bg-[#${activeColor}] text-white h-[35px] w-[140px]`}*/}
                    {/*      type="button"*/}
                    {/*      // onClick={handleProceedClick}*/}
                    {/*      onClick={state.isEditing ? handlemodifyClick : handleProceedClick}*/}
                    {/*  >*/}
                    {/*    {state.isEditing ? "Conferma": "Procediamo!"}*/}
                    {/*  </Button>*/}
                    {/*</div>*/}
                    <AlertDialog className={``}>
                      <AlertDialogTrigger asChild>
                        <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                          <Button
                              // className="px-6 font-sans font-semibold rounded-md bg-[#FF1744] text-white h-[35px] w-[140px]"
                              className={`px-6 font-sans font-semibold rounded-md bg-[#${activeColor}] text-white h-[35px] w-[120px]`}
                              type="button"
                              // onClick={handleProceedClick}
                              onClick={() => sendOTP()}
                              // onClick={state.isEditing ? handlemodifyClick : handleProceedClick}
                          >
                            {/*{state.isEditing ? "Conferma" : "Invia"}*/}
                            {`Invia`}
                          </Button>
                        </div>
                      </AlertDialogTrigger>
                      {!isOTPValid && (<AlertDialogContent
                          className={`flex flex-col justify-center items-center md:w-[60vw] overflow-hidden`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle
                              className={`text-center mb-[20px]`}>{`Confermare la tua prenotazione`}</AlertDialogTitle>
                          <AlertDialogDescription className={`s:w-[80vw] md:w-[40vw] leading-[25px] text-center`}>
                            {/*{`Confermando invierai la richiesta di prenotazione al gestore del locale. Riceverai un SMS*/}
                            {/*  di conferma.`}*/}
                            {`Controlla il tuo cellulare! Hai ricevuto un SMS con un codice che dovrai inserire qui sotto per convalidare la tua prenotazione.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        {/*<div className="h-[10px]"></div>*/}

                        <InputOTP
                            maxLength={6}
                            value={otp}
                            // value={phone}
                            // value={state.reservationPhone}
                            onChange={(otp) => setOtp(otp)}
                            // onChange={(phone) => setPhone(phone)}
                            // onChange={(value) => handleChange(value)}
                            // className={`transform scale-[4.8]`}
                            className={``}
                        >
                          {/*<InputOTPGroup className={`transform scale-[1.3]`}>*/}
                          <InputOTPGroup className={`mt-[20px] mb-[10px]`}>
                            <InputOTPSlot index={0}
                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                            <InputOTPSlot index={1}
                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                            <InputOTPSlot index={2}
                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                            <InputOTPSlot index={3}
                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                            <InputOTPSlot index={4}
                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                            <InputOTPSlot index={5}
                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[5vw] md:h-[5vw] lg:w-[4vw] lg:h-[4vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                          </InputOTPGroup>
                        </InputOTP>

                        {showWarning && otp.length === 0 && !isOTPValid && (
                            <p className="flex text-center w-[60vw] font-sans font-semibold text-red-600 mt-2">
                              Il codice inserito non è valido.
                            </p>
                        )}

                        <AlertDialogFooter className={`flex flex-row justify-center items-center mt-[5vh]`}>
                          <AlertDialogCancel className={`s:w-[120px] md:w-[150px]`}>Annulla</AlertDialogCancel>
                          <div className="w-[20px]"></div>
                          <AlertDialogAction
                              className={`bg-[#${activeColor}] s:w-[120px] md:w-[150px]`}
                              onClick={/*state.isEditing ? handlemodifyClick :*/ /*handleProceedClick*/ /*() => handleSubmitOTP()*/(event) => {
                                event.preventDefault();
                                handleSubmitOTP();
                              }}>Conferma</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>)}
                    </AlertDialog>

                    {/* Dialog che si apre solo se `open` è true */}
                    {/*<Dialog open={open} onOpenChange={setOpen} onClose={handleClose}>*/}
                    <Dialog open={open} onOpenChange={handleDialogcHANGE} onClose={handleClose}>
                      {/*<Dialog open={open} onOpenChange={setOpen}>*/}
                      <DialogContent className="sm:max-w-[425px]">
                        {/*<DialogHeader>*/}
                        <DialogTitle className="mt-[20px]"></DialogTitle>
                        <DialogDescription>
                        {/*  Make changes to your profile here. Click save when you're done.*/}
                        </DialogDescription>
                        {/*</DialogHeader>*/}
                        {/*<div className="grid gap-4 py-4">*/}
                        {/*  <div className="grid grid-cols-4 items-center gap-4">*/}
                        {/*    /!* Contenuti aggiuntivi *!/*/}
                        {/*    cccioccoco*/}
                        {/*  </div>*/}
                        {/*  <div className="grid grid-cols-4 items-center gap-4">*/}
                        {/*    /!* Contenuti aggiuntivi *!/*/}
                        {/*    aaaaaaaaaaaaaaaa*/}
                        {/*  </div>*/}
                        {/*</div>*/}
                        <p className="font-sans font-semibold mb-[20px] text-center">Complimenti, la tua prenotazione è stata inoltrata!</p>
                        {/*<p className="font-sans font-semibold mt-[0px] text-center">Perfetto! Controlla il tuo cellulare.</p>*/}
                        {/*<p className="font-sans font-semibold mt-[0px] text-center underline">Hai ricevuto un SMS con un link dalla quale dovrai convalidare la tua prenotazione.</p>*/}
                        {/*<p className="font-sans font-semibold mt-[0px]">Successivamente, potrai modificare e verificare che il ristorante abbia convalidato la tua prenotazione</p>*/}
                        <img
                            // src="https://static.vecteezy.com/system/resources/previews/012/627/756/large_2x/3d-smartphone-mockup-with-empty-white-screen-phone-front-view-template-communication-template-high-quality-isolated-render-png.png"
                            src="https://static.vecteezy.com/system/resources/previews/041/493/315/large_2x/3d-checklist-sign-icon-checkmark-agreement-approved-free-png.png"
                            // // alt="Immagine del ristorante"
                            className="object-cover h-full w-full"
                        />

                      </DialogContent>
                    </Dialog>

                    {/*/!*<Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>*!/*/}
                    {/*<Dialog open={changeDialogOpen} onOpenChange={handleDialogChange}>*/}
                    {/*  <DialogContent className="sm:max-w-[425px]">*/}
                    {/*    /!*<DialogHeader>*!/*/}
                    {/*      <DialogTitle className=""></DialogTitle>*/}
                    {/*      /!*<DialogDescription>*!/*/}
                    {/*      /!*  Make changes to your profile here. Click save when you're done.*!/*/}
                    {/*      /!*</DialogDescription>*!/*/}
                    {/*    /!*</DialogHeader>*!/*/}
                    {/*    /!*<div className="grid gap-4 py-4">*!/*/}
                    {/*    /!*  <div className="grid grid-cols-4 items-center gap-4">*!/*/}
                    {/*    /!*    /!* Contenuti aggiuntivi *!/*!/*/}
                    {/*    /!*    cccioccoco*!/*/}
                    {/*    /!*  </div>*!/*/}
                    {/*    /!*  <div className="grid grid-cols-4 items-center gap-4">*!/*/}
                    {/*    /!*    /!* Contenuti aggiuntivi *!/*!/*/}
                    {/*    /!*    aaaaaaaaaaaaaaaa*!/*/}
                    {/*    /!*  </div>*!/*/}
                    {/*    /!*</div>*!/*/}
                    {/*    <p className="font-sans font-semibold mt-[40px]">Complimenti, la tua prenotazione è stata modificata!</p>*/}
                    {/*    <img*/}
                    {/*        src="https://static.vecteezy.com/system/resources/previews/041/493/315/large_2x/3d-checklist-sign-icon-checkmark-agreement-approved-free-png.png"*/}
                    {/*        alt="Immagine del ristorante"*/}
                    {/*        className="object-cover h-full w-full"*/}
                    {/*    />*/}

                    {/*  </DialogContent>*/}
                    {/*</Dialog>*/}
                  </div>

                  {/*/!* Pulsante Avanti *!/*/}
                  {/*<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                  {/*  <Button*/}
                  {/*      className="px-6 font-sans font-semibold rounded-md bg-[#FF1744] text-white h-[35px] w-[140px]"*/}
                  {/*      type="button"  // Cambia type in "button" per evitare submit*/}
                  {/*      onClick={handleProceedClick}*/}
                  {/*  >*/}
                  {/*    Procediamo!*/}
                  {/*  </Button>*/}
                  {/*</div>*/}
                </div>
              </div>
            </div>
          </div>
        </div>

    );
}
