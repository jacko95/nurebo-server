'use client';

import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {AppProvider} from "@/app/AppContext";
import {Popover, Transition} from '@headlessui/react';
import {useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
// import { MenuIcon, XIcon } from '@heroicons/react/outline';
// import * as navigation from "zod"; // Importa usePathname


export default function Home({children}) {
    const pathname = usePathname(); // Ottieni la rotta attuale
    const [email, setEmail] = useState("");
    const [open, setOpen] = useState(false);


    const sendEmail = async (e) => {
        e.preventDefault(); // Impedisce il comportamento di default del form (evitare il refresh della pagina)

        try {
            console.log('vfdggdbbgbgbgggfgg')
            console.log(e)
            // // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
            // const localDateTime = new Date(dateObject.getTime()).toISOString();
            // console.log('Local datetime:', localDateTime);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/business/info_request?email=${email}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                },
                // next: {revalidate: 10},
                body: JSON.stringify({
                    email: email,
                }),
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta dal server00000000000:', data);
                // window.alert(`Email inviata a: ${email}`);
                setOpen(true)

            } else {
                console.error('Errore durante la richiesta:', response.statusText);
                // window.alert(`Errore: ${response.body}`);
                // setOpen(true)
            }
        } catch (error) {
            console.error('Errore durante il fetch:', error);
            // alert(`Errore`);
        }
    };

    const handleDialogcHANGE = (open) => {
        console.log(open)
        setOpen(open);
        console.log(open)
        if (!open) {
            window.location.reload();
            // window.location.replace(`https://nurebo.com/${newUserUrlReservation}`);
            console.log('state45555555555')
            console.log(state)
        }
    };

    const handleClose = () => {
        setOpen(false);
        // router.push(router.asPath); // Ricarica navigando sulla stessa pagina
    };

    return (
        // <div className="absolute inset-0 bg-[#AA00FF]"></div>
        // <div className="absolute inset-0 bg-[#1B5E20]"></div>
        <div className={`z-20 absolute inset-0 bg-background grid gap-y-16 overflow-hidden`}>
            <div className={`z-20 relative bg-[#1B5E20]`}>
                <div className="z-20 max-w-7xl mx-auto">
                    {/*<div*/}
                    {/*    className={`relative z-10 pb-8 bg-[#1B5E20] sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32`}*/}
                    {/*>*/}
                    <>
                        {/*<svg*/}
                        {/*    className={`hidden lg:block absolute right-0 inset-y-0 h-[120vh] w-48 text-background transform translate-x-1/2`}*/}
                        {/*    // fill="currentColor"*/}
                        {/*    fill="#1B5E20"*/}
                        {/*    viewBox="0 0 100 100"*/}
                        {/*    preserveAspectRatio="none"*/}
                        {/*    aria-hidden="true"*/}
                        {/*>*/}
                        {/*    <polygon points="50,0 100,0 50,100 0,100"/>*/}
                        {/*</svg>*/}

                        {/*<Popover>*/}
                        <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
                            <nav
                                className="relative flex items-center justify-between sm:h-10 lg:justify-start"
                                aria-label="Global"
                            >
                                <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
                                    <div className="flex items-center justify-between w-full md:w-auto">
                                        <a href="#">
                                            {/*<span className="sr-only">{companyName}</span>*/}
                                            {/*<img alt="logo" className="h-16 w-auto sm:h-16" src={logo}/>*/}
                                        </a>
                                        <div className="-mr-2 flex items-center md:hidden">
                                            {/*<Popover.Button*/}
                                            {/*    className={`bg-background rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}*/}
                                            {/*>*/}
                                            {/*    <span className="sr-only">Open main menu</span>*/}
                                            {/*    <MenuIcon className="h-6 w-6" aria-hidden="true"/>*/}
                                            {/*</Popover.Button>*/}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:ml-2 xl:ml-[-5vw] md:mt-12 md:pr-4 md:space-x-8">
                                    {/*{navigation.map((item) => (*/}
                                    {/*    <Link*/}
                                    {/*        spy={true}*/}
                                    {/*        active="active"*/}
                                    {/*        smooth={true}*/}
                                    {/*        duration={1000}*/}
                                    {/*        key={item.name}*/}
                                    {/*        to={item.href}*/}
                                    {/*        className="font-medium text-gray-500 hover:text-gray-900"*/}
                                    {/*    >*/}
                                    {/*        {item.name}*/}
                                    {/*    </Link>*/}
                                    {/*))}*/}
                                    <img className={`s:w-[30vw] sm:w-[20vw] md:w-[12vw]`}
                                         src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/nurebo_logo_white.png"
                                         alt="cc"/>

                                </div>
                            </nav>
                        </div>

                        {/*/!*<Transition*!/*/}
                        {/*/!*    as={Fragment}*!/*/}
                        {/*/!*    enter="duration-150 ease-out"*!/*/}
                        {/*/!*    enterFrom="opacity-0 scale-95"*!/*/}
                        {/*/!*    enterTo="opacity-100 scale-100"*!/*/}
                        {/*/!*    leave="duration-100 ease-in"*!/*/}
                        {/*/!*    leaveFrom="opacity-100 scale-100"*!/*/}
                        {/*/!*    leaveTo="opacity-0 scale-95"*!/*/}
                        {/*/!*>*!/*/}
                        {/*    <Popover.Panel*/}
                        {/*        focus*/}
                        {/*        className="absolute z-10 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"*/}
                        {/*    >*/}
                        {/*        <div*/}
                        {/*            className={`rounded-lg shadow-md bg-background ring-1 ring-black ring-opacity-5 overflow-hidden`}*/}
                        {/*        >*/}
                        {/*            /!*<div className="px-5 pt-4 flex items-center justify-between">*!/*/}
                        {/*                <div>*/}
                        {/*                    /!*<img className="h-8 w-auto" src={logo} alt=""/>*!/*/}
                        {/*                </div>*/}
                        {/*                /!*<div className="-mr-2">*!/*/}
                        {/*                    /!*<Popover.Button*!/*/}
                        {/*                    /!*    className={`bg-background rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}*!/*/}
                        {/*                    /!*>*!/*/}
                        {/*                    /!*    <span className="sr-only">Close main menu</span>*!/*/}
                        {/*                    /!*    /!*<XIcon className="h-6 w-6" aria-hidden="true"/>*!/*!/*/}
                        {/*                    /!*</Popover.Button>*!/*/}
                        {/*                /!*</div>*!/*/}
                        {/*            /!*</div>*!/*/}
                        {/*            /!*<div className="px-2 pt-2 pb-3 space-y-1">*!/*/}
                        {/*            /!*    {navigation.map((item) => (*!/*/}
                        {/*            /!*        <Link*!/*/}
                        {/*            /!*            spy={true}*!/*/}
                        {/*            /!*            active="active"*!/*/}
                        {/*            /!*            smooth={true}*!/*/}
                        {/*            /!*            duration={1000}*!/*/}
                        {/*            /!*            key={item.name}*!/*/}
                        {/*            /!*            to={item.href}*!/*/}
                        {/*            /!*            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"*!/*/}
                        {/*            /!*        >*!/*/}
                        {/*            /!*            {item.name}*!/*/}
                        {/*            /!*        </Link>*!/*/}
                        {/*            /!*    ))}*!/*/}
                        {/*            /!*</div>*!/*/}
                        {/*            /!*<a*!/*/}
                        {/*            /!*    href={callToAction.href}*!/*/}
                        {/*            /!*    className={`block w-full px-5 py-3 text-center font-medium text-primary bg-gray-50 hover:bg-gray-100`}*!/*/}
                        {/*            /!*>*!/*/}
                        {/*            /!*    {callToAction.text}*!/*/}
                        {/*            /!*</a>*!/*/}
                        {/*        </div>*/}
                        {/*    </Popover.Panel>*/}
                        {/*</Transition>*/}
                        {/*</Popover>*/}
                    </>
                    <main
                        className="mt-10 md:ml-8 xl:ml-[-3vw] mx-auto max-w-7xl px-4 s:mt-12 sm:px-6 md:mt-16 lg:mt-[20vh] s:mt-[15vh] lg:px-8 xl:mt-[20vh]">
                        <div className="sm:text-center lg:text-left">
                            <h1 className="text-2xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
                                {/*<span className="block xl:inline">{mainHero.title}</span>{' '}*/}
                                <span className="block text-white">Le prenotazioni</span>{' '}
                                <span className="block text-white">per il tuo ristorante</span>{' '}
                                {/*<span className={`block text-primary xl:inline`}>{mainHero.subtitle}</span>*/}
                                <span className={`block text-white`}>come mai viste prima</span>
                            </h1>
                            {/*<p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">{mainHero.description}</p>*/}
                            {/*<p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">mainHero.description</p>*/}
                            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                <div className="rounded-md shadow">
                                    {/*<a*/}
                                    {/*    // href={mainHero.primaryAction.href}*/}
                                    {/*    href="mainHero.primaryAction.href"*/}
                                    {/*    className={`w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-background bg-primary hover:bg-border hover:text-primary md:py-4 md:text-lg md:px-10`}*/}
                                    {/*>*/}
                                    {/*    /!*{mainHero.primaryAction.text}*!/*/}
                                    {/*    mainHero.primaryAction.text*/}
                                    {/*</a>*/}
                                </div>
                                <div className="mt-3 sm:mt-0 sm:ml-3">
                                    {/*<a*/}
                                    {/*    // href={mainHero.secondaryAction.href}*/}
                                    {/*    href="mainHero.secondaryAction.href"*/}
                                    {/*    className={`w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md border-primary text-secondary bg-background hover:bg-border hover:text-primary md:py-4 md:text-lg md:px-10`}*/}
                                    {/*>*/}
                                    {/*    /!*{mainHero.secondaryAction.text}*!/*/}
                                    {/*    mainHero.secondaryAction.text*/}
                                    {/*</a>*/}
                                </div>
                                <form className="mt-10 ml-[-10px] flex flex-col gap-2.5 max-w-sm sm:flex-row">
                                    <input type="email" placeholder="address@email.com"
                                           className="h-12 bg-white/20 rounded-lg px-5 font-medium text-white placeholder:text-gray-200 sm:flex-1 focus:outline-none"
                                           value={email} // Il valore dell'input è legato allo stato
                                           onChange={(e) => setEmail(e.target.value)} // Aggiorna lo stato ogni volta che l'input cambia
                                    />
                                    {/*<button className="bg-green-400 text-white h-12 rounded-lg px-5">Get access</button>*/}
                                    <button
                                        className="bg-green-400 font-sans font-medium text-white h-12 rounded-lg px-5"
                                        onClick={(e) => sendEmail(e)}
                                    >
                                        Richiedi
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>
                    {/*</div>*/}
                </div>
                <div className="z-1 bottom-0 absolute lg:inset-y-0 lg:right-0 s:w-[100vw] lg:w-[40vw] xl:w-[45vw]">
                    <img
                        className=" h-56 s:w-[100vw] object-cover sm:h-50 md:h-[40vh] lg:h-full z-1"
                        // src={`https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?w=1260&h=750`}
                        src={`https://images.pexels.com/photos/2284166/pexels-photo-2284166.jpeg?w=1260&h=750`}
                        alt="happy team image"
                    />
                </div>
            </div>
            <Dialog open={open} onOpenChange={handleDialogcHANGE} onClose={handleClose} className="">
                {/*<Dialog open={open} onOpenChange={setOpen}>*/}
                <DialogContent className="sm:max-w-[425px] ">
                    {/*<DialogHeader>*/}
                    <DialogTitle className=""></DialogTitle>
                    <DialogDescription>{``}</DialogDescription>
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
                    {/*<p className="font-sans font-semibold mt-[40px]">Complimenti, la tua prenotazione è stata inoltrata!</p>*/}
                    <p className="font-sans font-semibold mt-[0px] text-center">{`La tua richiesta è stata inoltrata`}</p>
                    <img
                        // src="https://static.vecteezy.com/system/resources/previews/012/627/756/large_2x/3d-smartphone-mockup-with-empty-white-screen-phone-front-view-template-communication-template-high-quality-isolated-render-png.png"
                        // src="https://static.vecteezy.com/system/resources/previews/041/644/172/non_2x/minimal-cancel-close-delete-icon-3d-render-isolated-illustration-png.png"
                        src="https://static.vecteezy.com/system/resources/previews/041/493/315/large_2x/3d-checklist-sign-icon-checkmark-agreement-approved-free-png.png"
                        alt="Immagine del ristorante"
                        className="object-cover h-full w-full"
                    />

                </DialogContent>
            </Dialog>
        </div>
    );
}
