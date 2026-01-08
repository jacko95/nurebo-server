'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { AppProvider, useAppContext } from '@/app/AppContext';
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";

export default function Reservation({ params, }) {
  const pathname = usePathname(); // Ottieni la rotta attuale
  const { state, setState } = useAppContext();  // Accedi allo stato globale
  const dateString = state.reservationDatetime || "01/01/2024 00:00"; // Default se undefined
  // const reservationQty = state.reservationQty || 2; // Default se undefined
  const [datePart, timePart] = dateString.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const dateObject = new Date(year, month - 1, day, hours, minutes);
  const [imageUrl, setImageUrl] = useState('');  // Stato per l'URL dell'immagine
  const [open, setOpen] = useState(false); // Stato per gestire la visibilità del Dialog


  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/${/*params.restaurant*/restaurantData.id}/form?path=riepilogo`, {
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
          },
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

  const handleProceedClick = async () => {
  try {
    // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
    const localDateTime = new Date(dateObject.getTime()).toISOString();
    console.log('Local datetime:', localDateTime);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
        },
        next: { revalidate: 10 },
        body: JSON.stringify({
          ...restaurantData,
          reservation_phone: state.reservationPhone,
          business_phone: restaurantData.phone,
          reservation_name: state.reservationName,
          business_name: restaurantData.name,
          // business_id: "osteria-serafina-milano",
          business_id: `${/*params.restaurant*/restaurantData.id}`,
          quantity: state.reservationQty,
          phone: state.reservationPhone,
          datetime: localDateTime,
          business_email: restaurantData.email,
          reservation_email: state.reservationEmail,
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Risposta dal server:', data);
        setOpen(true); // Apri il Dialog se la richiesta ha avuto successo
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
    setOpen(false); // Funzione per chiudere il dialog
  };

  return (
      <div className="relative w-screen h-screen bg-cover bg-center z-1">
        {/*<div className="absolute inset-0 bg-[#81D4FA]"></div>*/}
        {/*<div className="absolute inset-0 bg-[#A5D6A7]"></div>*/}
        <div className="absolute inset-0 bg-[#BCAAA4]"></div>
        {/*<div className="absolute inset-0 bg-[#EF9A9A]"></div>*/}
        <div className="flex items-center justify-center h-full relative z-10">
          <div className="relative">
            {/* Barre orizzontali sopra la card */}
            <div className="absolute top-[-15px] left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
              {[
                {label: "Quanti", path: `quanti`},
                {label: "Quando", path: `quando`},
                {label: "Nome", path: `nome`},
                {label: "Telefono", path: `telefono`},
                {label: "Email", path: `email`},
                {label: "Riepilogo", path: `riepilogo`},
              ].map((item, index) => {
                const isActive = /*pathname*/state.path === item.path;
                // const textColor = isActive ? "text-[#0277BD]" : "text-white"; // Colore del testo
                // const textColor = isActive ? "text-[#2E7D32]" : "text-white"; // Colore del testo
                const textColor = isActive ? "text-[#6D4C41]" : "text-white"; // Colore del testo
                // const textColor = isActive ? "text-[#C62828]" : "text-white"; // Colore del testo
                // const barColor = isActive ? "bg-[#0277BD]" : "bg-white"; // Colore della barra
                // const barColor = isActive ? "bg-[#2E7D32]" : "bg-white"; // Colore della barra
                const barColor = isActive ? "bg-[#6D4C41]" : "bg-white"; // Colore della barra
                // const barColor = isActive ? "bg-[#C62828]" : "bg-white"; // Colore della barra


                return (
                    // <Link key={index} href={item.path}>
                    //     <div className="flex flex-col cursor-pointer">
                    <div className="flex flex-col cursor-default" key={item.label}>
                                      <span
                                          className={`${textColor} text-sm font-semibold font-[Roboto] mb-[3px] mt-1 pl-[1px]`}>
                                        {item.label}
                                      </span>
                      <div className={`${barColor} h-[4px] w-[100px] rounded-full`}></div>
                    </div>
                    // </Link>
                );
              })}
            </div>

            {/*{children}*/}
            <div className="relative bg-white rounded-lg shadow-md h-[80vh] w-[62vw] flex overflow-hidden mt-10">
              <div className="relative h-full w-[20vw]">
                {imageUrl ? (
                    <img
                        src={imageUrl}  // Usa l'URL dinamico
                        // alt="Immagine del ristorante"
                        className="object-cover h-full w-full"
                    />
                ) : (
                    <Skeleton className="h-full w-full"/>
                )}
                <div className="absolute inset-0 bg-black opacity-10"></div>
              </div>

              <div className="flex flex-col ml-[50px] mt-[50px]">
                <div className="mb-[25px]">
                  <label className="text-[15px] font-sans font-medium text-[#1976D2]">
                    {restaurantData.name}:
                  </label>
                  <div className="h-[7px]"></div>
                  <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                    Ricapitoliamo...
                  </label>
                </div>

                <div className="flex space-x-16 mt-[50px] mb-[40px]">
                  {state.reservationName && (
                      <div>
                        <label className="text-[15px] font-sans font-medium text-gray-400">
                          Il tuo nome:
                        </label>
                        <div className="h-[2px]"></div>
                        <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                          {state.reservationName}
                        </label>
                      </div>
                  )}

                  {state.reservationQty && (
                      <div>
                        <label className="text-[15px] font-sans font-medium text-gray-400">
                          Sarete in:
                        </label>
                        <div className="h-[2px]"></div>
                        <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                          {state.reservationQty}
                        </label>
                      </div>
                  )}

                  {state.reservationPhone && (
                      <div>
                        <label className="text-[15px] font-sans font-medium text-gray-400">
                          Il tuo numero è:
                        </label>
                        <div className="h-[2px]"></div>
                        <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                          {state.reservationPhone}
                        </label>
                      </div>
                  )}
                </div>

                {state.reservationEmail && (
                    <div className="mb-[40px]">
                      <label className="text-[15px] font-sans font-medium text-gray-400">
                        La tua mail è:
                      </label>
                      <div className="h-[2px]"></div>
                      <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                        {state.reservationEmail}
                      </label>
                    </div>
                )}

                {formattedDate && (
                    <div>
                      <label className="text-[15px] font-sans font-medium text-gray-400">
                        Ci vedremo:
                      </label>
                      <div className="h-[2px]"></div>
                      <label className="text-[20px] font-sans font-medium text-gray-600 leading-[27px]">
                        {formattedDate}
                      </label>
                    </div>
                )}

              </div>

              {/* Pulsante Indietro */}
              {/*<Link href={`/prenotazione/${params.restaurant}/email`} prefetch={true}>*/}
                <div className={`absolute s:right-[32vw] sm:right-[22vw] md:right-[18vw] bottom-[20px] space-x-4 shadow-2xl`}>
                  <Button
                      className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#9E9E9E] text-white h-[35px] w-[120px]"
                      onClick={() => handleNext('email')}
                      type="submit">Indietro
                  </Button>
                </div>
              {/*</Link>*/}

              <div>
                <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                  <Button
                      className="px-6 font-sans font-semibold rounded-md bg-[#FF1744] text-white h-[35px] w-[140px]"
                      type="button"
                      onClick={handleProceedClick}
                  >
                    Procediamo!
                  </Button>
                </div>

                {/* Dialog che si apre solo se `open` è true */}
                {/*<Dialog open={open} onOpenChange={setOpen} onClose={handleClose}>*/}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    {/*<DialogHeader>*/}
                      {/*<DialogTitle className="">Edit profile</DialogTitle>*/}
                      {/*<DialogDescription>*/}
                      {/*  Make changes to your profile here. Click save when you're done.*/}
                      {/*</DialogDescription>*/}
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
                    <p className="font-sans font-semibold mt-[40px]">Complimenti, la tua prenotazione è stata effettuata!</p>
                    <img
                        src="https://static.vecteezy.com/system/resources/previews/041/493/315/large_2x/3d-checklist-sign-icon-checkmark-agreement-approved-free-png.png"
                        // alt="Immagine del ristorante"
                        className="object-cover h-full w-full"
                    />

                  </DialogContent>
                </Dialog>
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

  );
}
