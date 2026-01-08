'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {AppProvider, useAppContext} from '@/app/AppContext';
import {Skeleton} from "@/components/ui/skeleton";
import {notFound, usePathname, useRouter} from "next/navigation";
// import { useRouter } from 'next/router';
import {useSearchParams} from 'next/navigation';
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"

// import { toast } from "@/components/hooks/use-toast"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import * as otp from "zod";
import {router} from "next/client";
import RestaurantClientComponent from "@/components/RestaurantClientComponent";
import Quanti from "@/components/quanti";
import {format, isValid} from "date-fns";
import {Calendar} from "@/components/ui/calendar";
import {it} from "date-fns/locale";
import {FaBeer} from 'react-icons/fa';
import {MdAccessTime, MdArrowBackIos, MdDeleteOutline, MdEditCalendar, MdEvent, MdOutlineUpload} from "react-icons/md";


export default function Reservation({ /*restaurantData,*/ params}) {
    const {reservation} = params; // Ottieni l'ID dal params
    const router = useRouter();
    // const { myParam } = router.query; // 'myParam' è il nome del parametro nella URL
    const searchParams = useSearchParams();
    const myParam = searchParams.get('myParam'); // 'myParam' è il nome del parametro
    const validate = searchParams.get('validate'); // 'myParam' è il nome del parametro
    const pathname = usePathname(); // Ottieni la rotta attuale
    const {state, setState} = useAppContext();  // Accedi allo stato globale
    // const dateString = ''; // Default se undefined
    // const reservationQty = state.reservationQty || 2; // Default se undefined
    const [imageUrl, setImageUrl] = useState('');  // Stato per l'URL dell'immagine
    const [open, setOpen] = useState(false); // Stato per gestire la visibilità del Dialog
    const [isDialogOpen1, setIsDialogOpen1] = useState(false); // Stato per gestire la visibilità del Dialog
    const [isAccordion1Open, setIsAccordion1Open] = useState(false);
    const [isAccordion2Open, setIsAccordion2Open] = useState(false);
    // let restaurantData = null;
    // const [restaurantData, setRestaurantData] = useState(null); // Definisci restaurantData come stato
    const [isLoading, setIsLoading] = useState(true);  // Stato di caricamento
    const [isTokenSuccess, setIsTokenSuccess] = useState(false);  // Stato di caricamento
    const [isValid, setIsValid] = useState(true);  // Stato validità ristorante
    const [isReservationUserValid, setIsReservationUserValid] = useState(false);
    const [isReservationConfirm, setIsReservationConfirm] = useState(false);
    const [isOTPValid, setIsOTPValid] = useState(false);  // Stato validità ristorante
    const [isPhoneValid, setIsPhoneValid] = useState(false);  // Stato validità ristorante
    const [isEdit, setIsEdit] = useState(false);  // Stato validità ristorante
    const [isFirstTime, setIsFirstTime] = useState(false);  // Stato validità ristorante
    const [isAllPastProposalDatetime, setIsAllPastProposalDatetime] = useState(false);  // Stato validità ristorante
    const [isFutureReservationDatetime, setIsFutureReservationDatetime] = useState(false);  // Stato validità ristorante
    const [reservationData, setReservationData] = useState({});
    // const [reservationData, setReservationData] = useState({
    //     reservation_id: '',
    //     reservation_name: '',
    //     reservation_datetime: '',
    //     reservation_email: '',
    //     reservation_phone: '',
    //     reservation_quantity: '',
    //     reservation_created_at: ''
    // });
    const [restaurantData, setRestaurantData] = useState({});
    // const [restaurantData, setRestaurantData] = useState({
    //     business_id: '',
    //     business_name: '',
    //     business_cell: '',
    //     business_info: '',
    //     business_image_url: '',
    //     business_phone: '',
    //     business_email: '',
    //     business_address: '',
    //     business_city: '',
    //     business_province: '',
    //     business_postal_code: '',
    //     business_region: '',
    //     business_address_number: '',
    //     business_created_at: ''
    // });
    // const [dateString, setDateString] = useState("01/01/2024 00:00");
    // const [dateString, setDateString] = useState('');
    const [dateString, setDateString] = useState(null);
    // const dateString = /*state.reservationDatetime*//*reservationData.reservation_datetime ||*/ "01/01/2024 00:00"; // Default se undefined
    // const [datePart, timePart] = dateString.split(" ");
    // const [day, month, year] = datePart.split("/").map(Number);
    // const [hours, minutes] = timePart.split(":").map(Number);
    // const dateObject = new Date(year, month - 1, day, hours, minutes);
    const [formattedDate, setFormattedDate] = useState("01/01/2024 00:00"/*''*/);
    const [userType, setUserType] = useState(0);
    const [otp, setOtp] = useState("");
    const [phone, setPhone] = useState("");
    const [authId, setAuthId] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [times, setTimes] = useState([]);
    const [date, setDate] = useState(state.isEdit ? new Date((state.reservationDatetime)) : state.date/*new Date()*/);
    const [selectedTime, setSelectedTime] = useState(() => {
        if (state.isEdit) {
            return isValid(new Date(state.reservationDatetime)) ? format(new Date(state.reservationDatetime), "HH:mm") : "00:00";
        }
        return state.selectedTime || "00:00";
    });
    const [isTimeSelected, setIsTimeSelected] = useState(!!state.selectedTime);
    const [noTimesAvailable, setNoTimesAvailable] = useState(false); // Stato per orari non disponibili
    // const backgroundColor = `${restaurantData.business_form_color_background}`;
    // const activeColor = `${restaurantData.business_form_color_active}`;
    const backgroundColor = `A5D6A7`;
    const activeColor = `2E7D32`;

    const [selectedEditTimes, setSelectedEditTimes] = useState([]); // Stato per la lista degli orari selezionati
    const [selectedDateTimes, setSelectedDateTimes] = useState([]); // Stato per la lista degli orari selezionati
    const [selectedSendDateTimes, setSelectedSendDateTimes] = useState([]); // Stato per la lista degli orari selezionati
    const [editDate, setEditDate] = useState(new Date()/*new Date(new Date().setDate(new Date().getDate() + 1))*/);
    const [selectedEditTime, setSelectedEditTime] = useState(new Date());
    const [editTimes, setEditTimes] = useState([]);
    const [maxEditSlots, setMaxEditSlots] = useState(false);
    // const [isConfirmedChangeDateSlots, setIsConfirmedChangeDateSlots] = useState(false);
    const [reservationProposals, setReservationProposals] = useState([]);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isClicked, setIsClicked] = useState(false);
    const buttonRefs = useRef({});
    const [showWarning, setShowWarning] = useState(false);
    const [showWarning1, setShowWarning1] = useState(false);
    const [showWarningMessage1, setShowWarningMessage1] = useState('');


    console.log('params00011')
    console.log(params)
    console.log(reservation)
    console.log(myParam)
    console.log(validate)
    console.log('state')
    console.log(state)
    console.log('userType.88888888888888888')
    console.log(userType)


    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const authIdooo = getCookie('authId');
    console.log('authI11dooo');
    console.log(authIdooo);
    console.log(document.cookie);
    console.log(document.cookie['authId']);

    // Imposta un cookie
    // Cookies.set('authIdppppp', 'your-token', { expires: 7 });  // Il cookie scade in 7 giorni

    // useEffect(() => {
    //     const setModifyValues = async (data) => {
    //         setState(prevState => ({
    //             ...prevState,
    //             path: "quanti",
    //             reservationEmail: "",
    //             reservationName: "",
    //             reservationPhone: "",
    //             reservationQty: 2,
    //             reservationDatetime: "",
    //             restaurantData: {}
    //         }));
    //     }
    // }, []); // Dipendenze corrette

    const handleSelectProposal = (proposalDate, /*event*/index) => {
        // document.activeElement.blur();
        // event.target.blur();
        // if (buttonRefs.current[index]) {
        //     buttonRefs.current[index].blur();
        // }

        console.log('proposalDate')
        console.log(proposalDate)
        if (userType === reservationProposals[0].reservation_proposal_user_type_id) {
            return;
        }
        // setSelectedProposal(proposalDate);
        setSelectedProposal((prevSelected) =>
            prevSelected === proposalDate ? null : proposalDate
        );

    };

    // useEffect(() => {
        const sendOTP = async (data) => {
            // if (otpSent) return; // Evita invii multipli
            // setOtpSent(true);
            try {
                console.log('vfdggdbbgbgbgggfgg')
                console.log(data)
                console.log(reservationData)
                // // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
                // const localDateTime = new Date(dateObject.getTime()).toISOString();
                // console.log('Local datetime:', localDateTime);

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${data.reservation_id}/send_otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,

                    },
                    // next: {revalidate: 10},
                    credentials: "include",
                    body: JSON.stringify({
                        // ...restaurantData,
                        // ...reservationData,
                        ...data,
                        user_type_id: reservation === data.reservation_business_url ? 1 : reservation === data.reservation_user_url ? 2 : null,
                        reservation_email: data.reservation_email,
                        reservation_phone: data.reservation_phone,
                    }),
                    cache: 'no-store',
                });

                const resdata = await response.json();
                console.log('data55522115')
                console.log(resdata)
                console.log(resdata.message)

                if (response.ok) {
                    console.log('Risposta dal server00000000000:', resdata);
                    console.log('resdata.auth_id');
                    console.log(resdata.auth_id);
                    setAuthId(resdata.auth_id);
                }
                else if (response.status === 429) {
                    setShowWarning1(true)
                    setShowWarningMessage1(resdata.message)
                }
                else {
                    console.error('Errore durante la richiesta:', response.statusText);
                }
            } catch (error) {
                console.error('Errore durante il fetch:', error);
            }
        };
        // sendOTP();
    // }, []);

    const handleSubmitOTP = async () => {
        // const otpCode = otp.join('');
        console.log('Codice OTP:', otp/*Code*/);
        // const localDateTime = new Date(dateObject.getTime()).toISOString();

        console.log('vbggggggggggggggggggggggg555000')
        console.log(state.userType)
        console.log(userType)

        if (otp/*Code*/.length === 6) {
            // setIsOTPValid(true)
            try {
                // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationId}/verify_otp`, {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservationData.reservation_id}/verify_otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        ...restaurantData,
                        ...reservationData,
                        // reservation_phone: state.reservationPhone,
                        // // business_phone: restaurantData.business_phone,
                        // reservation_name: state.reservationName,
                        // // business_name: restaurantData.name,
                        // // business_id: "osteria-serafina-milano",
                        // business_id: `${/*params.restaurant*/restaurantData.business_id}`,
                        // quantity: state.reservationQty,
                        // phone: state.reservationPhone,
                        // datetime: localDateTime,
                        // reservation_datetime: state.reservationDatetime,
                        // // business_email: restaurantData.business_email,
                        // reservation_email: state.reservationEmail,
                        // user_type_id: userType,
                        // user_type_id: state.userType,
                        user_type_id: reservation === reservationData.reservation_business_url ? 1 : reservation === reservationData.reservation_user_url ? 2 : null,
                        auth_id: authId,
                        action: 'access_auth',
                        otp: otp,
                    }),
                    cache: 'no-store',
                });

                // const result = await response.json();
                const data = (await response.json());

                console.log('Risultato777777777888:', data);
                console.log(response);
                console.log(response.status);
                console.log('result.success:', data.success);
                // console.log('result[0].success:', result[0].success);
                setOtp('')

                if (data.success === 1) {
                    const formattedDate = formatDate(new Date(data.reservation_datetime_datetime)); // Passa l'oggetto Date alla funzione di formattazione
                    setDateString(formattedDate);
                    setReservationData({
                        reservation_id: data.reservation_id,
                        reservation_name: data.reservation_name,
                        reservation_datetime_datetime: data.reservation_datetime_datetime/*formattedDate*/,
                        reservation_datetime_created_at: data.reservation_datetime_created_at,
                        reservation_datetime_id: data.reservation_datetime_id,
                        reservation_email: data.reservation_email,
                        reservation_user_url: data.reservation_user_url,
                        reservation_business_url: data.reservation_business_url,
                        reservation_phone: data.reservation_phone,
                        reservation_quantity: data.reservation_quantity,
                        reservation_created_at: data.reservation_created_at,
                        reservation_proposal_id: data.reservation_proposal_id,
                        reservation_proposal_user_type_id: data.reservation_proposal_user_type_id,
                        reservation_proposal_is_declined: data.reservation_proposal_is_declined,
                        reservation_proposal_datetime_id: data.reservation_proposal_datetime_id,
                        reservation_proposal_created_at: data.reservation_proposal_created_at,
                        reservation_validation_id: data.reservation_validation_id,
                        reservation_validation_created_at: data.reservation_validation_created_at,
                        reservation_cancel_id: data.reservation_cancel_id,
                        reservation_cancel_user_type_id: data.reservation_cancel_user_type_id,
                        reservation_cancel_created_at: data.reservation_cancel_created_at,
                    });

                    setIsOTPValid(true)
                    // await handleProceedClick();
                    setOpen(true)
                    setShowWarning(false)
                    setIsTokenSuccess(true)
                    window.location.reload();
                }
                else {
                    setIsOTPValid(false)
                    setShowWarning(true)
                    setIsTokenSuccess(false)

                }
            } catch (error) {
                console.error('Errore nella richiesta:', error);
            }
        }

    };

    const toggleAccordion = () => {
        setIsAccordion2Open(false);
        setIsAccordion1Open(!isAccordion1Open);
    };

    const toggleAccordion2 = () => {
        setIsAccordion1Open(false);
        setIsAccordion2Open(!isAccordion2Open);
    };

    const sendReservationProposal = async () => {
        // const otpCode = otp.join('');
        console.log('telefono inserito:', phone);

        // if (otp/*Code*/.length === 6) {
        // setIsOTPValid(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservationData.reservation_id}/proposal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                },
                body: JSON.stringify({
                    ...restaurantData,
                    ...reservationData,
                    reservation_proposal_datetime: /*selectedDateTimes*/selectedSendDateTimes,
                    'user_type_id': userType,
                }),
                cache: 'no-store',
            });

            // const result = await response.json();
            //
            // console.log('rrrrrrrrrrrrrrrrrrrrr:', result);
            // console.log('result.success:', result.success);

            // console.log('result[0].success:', result[0].success);

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta dal server00000000000:', data);
                //todo: inserire le proposte inviate al posto di ricaricare la pagina
                window.location.reload();
            } else {
                console.error('Errore durante la richiesta:', response.statusText);
            }
        } catch (error) {
            console.error('Errore nella richiesta:', error);
        }
        // }
    };


    // useEffect(() => {
    //     const fetchRestaurant = useCallback(async () => {
    const fetchRestaurant = async () => {
        try {
            console.log('mmmmmmmmmeeeeeee')
            const response = await fetch(
                // `${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservation}?validate=${validate}`,
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservation}`, {
                    method: 'GET',
                    credentials: 'include', // Include i cookie nella richiesta
                    headers: {
                        'Content-Type': 'application/json',
                        'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                    },
                    cache: 'no-store',
                }
            );
            // const data = (await response.json())[0];
            const data = (await response.json());

            console.log('data999999999999999999999999');
            console.log(response);
            console.log(response.status);
            console.log(data);
            console.log(data.reservation_authentication_is_success === 0);

            // if (response.status === 404) {
            if (response.status >= 400) {
                setIsValid(false);
            }
            // if (!response.ok || !data) {
            else if (response.status === 207 || !data) {
                // const data = (await response.json())[0];
                // console.log("(await response.json())")
                // console.log(data[0])

                setIsValid(true);
                setRestaurantData({
                    business_id: data.business_id,
                    business_name: data.business_name,
                    business_cell: data.business_cell,
                    business_info: data.business_info,
                    business_image_url: data.business_image_url,
                    business_phone: data.business_phone,
                    business_email: data.business_email,
                    business_address: data.business_address,
                    business_city: data.business_city,
                    business_province: data.business_province,
                    business_postal_code: data.business_postal_code,
                    business_region: data.business_region,
                    business_address_number: data.business_address_number,
                    business_created_at: data.business_created_at,
                    business_form_id: data.business_form_id,
                    business_form_color_id: data.business_form_color_id,
                    business_form_created_at: data.business_form_created_at,
                    business_form_color_background: data.business_form_color_background,
                    business_form_color_active: data.business_form_color_active,
                });
                setReservationData({
                    reservation_id: data.reservation_id,
                    reservation_name: data.reservation_name,
                    reservation_datetime_datetime: data.reservation_datetime_datetime/*formattedDate*/,
                    reservation_datetime_created_at: data.reservation_datetime_created_at,
                    reservation_datetime_id: data.reservation_datetime_id,
                    reservation_email: data.reservation_email,
                    reservation_user_url: data.reservation_user_url,
                    reservation_business_url: data.reservation_business_url,
                    reservation_phone: data.reservation_phone,
                    reservation_quantity: data.reservation_quantity,
                    reservation_created_at: data.reservation_created_at,
                    reservation_proposal_id: data.reservation_proposal_id,
                    reservation_proposal_user_type_id: data.reservation_proposal_user_type_id,
                    reservation_proposal_is_declined: data.reservation_proposal_is_declined,
                    reservation_proposal_datetime_id: data.reservation_proposal_datetime_id,
                    reservation_proposal_created_at: data.reservation_proposal_created_at,
                    reservation_validation_id: data.reservation_validation_id,
                    reservation_validation_created_at: data.reservation_validation_created_at,
                    reservation_cancel_id: data.reservation_cancel_id,
                    reservation_cancel_user_type_id: data.reservation_cancel_user_type_id,
                    reservation_cancel_created_at: data.reservation_cancel_created_at,
                });

                await sendOTP(data)
            }
            // else if(data.reservation_authentication_is_success === 0){
            //     setIsTokenSuccess(false)
            // }
            else {
                setIsValid(true)
                // if(data.reservation_authentication_is_success === 1) {
                    setIsTokenSuccess(true)
                    console.log('aaaaaaaaaaarabb')
                // }
                // console.log('data23333');
                // console.log(data);

                // Imposta tutti i campi del ristorante
                setRestaurantData({
                    business_id: data.business_id,
                    business_name: data.business_name,
                    business_cell: data.business_cell,
                    business_info: data.business_info,
                    business_image_url: data.business_image_url,
                    business_phone: data.business_phone,
                    business_email: data.business_email,
                    business_address: data.business_address,
                    business_city: data.business_city,
                    business_province: data.business_province,
                    business_postal_code: data.business_postal_code,
                    business_region: data.business_region,
                    business_address_number: data.business_address_number,
                    business_created_at: data.business_created_at,
                    business_form_id: data.business_form_id,
                    business_form_color_id: data.business_form_color_id,
                    business_form_created_at: data.business_form_created_at,
                    business_form_color_background: data.business_form_color_background,
                    business_form_color_active: data.business_form_color_active,
                });

                // const reservationDatetime = data.reservation_datetime;
                const reservationDatetime = data.reservation_datetime_datetime;
                const formattedDate = formatDate(new Date(reservationDatetime)); // Passa l'oggetto Date alla funzione di formattazione
                setDateString(formattedDate); // Aggiorna lo stato con la data formattata

                console.log('dateString555555566')
                console.log(dateString)
                console.log(formattedDate)

                setReservationData({
                    reservation_id: data.reservation_id,
                    reservation_name: data.reservation_name,
                    reservation_datetime_datetime: data.reservation_datetime_datetime/*formattedDate*/,
                    reservation_datetime_created_at: data.reservation_datetime_created_at,
                    reservation_datetime_id: data.reservation_datetime_id,
                    reservation_email: data.reservation_email,
                    reservation_user_url: data.reservation_user_url,
                    reservation_business_url: data.reservation_business_url,
                    reservation_phone: data.reservation_phone,
                    reservation_quantity: data.reservation_quantity,
                    reservation_created_at: data.reservation_created_at,
                    reservation_proposal_id: data.reservation_proposal_id,
                    reservation_proposal_user_type_id: data.reservation_proposal_user_type_id,
                    reservation_proposal_is_declined: data.reservation_proposal_is_declined,
                    reservation_proposal_datetime_id: data.reservation_proposal_datetime_id,
                    reservation_proposal_created_at: data.reservation_proposal_created_at,
                    reservation_validation_id: data.reservation_validation_id,
                    reservation_validation_created_at: data.reservation_validation_created_at,
                    reservation_cancel_id: data.reservation_cancel_id,
                    reservation_cancel_user_type_id: data.reservation_cancel_user_type_id,
                    reservation_cancel_created_at: data.reservation_cancel_created_at,
                });

                console.log('orcodii')
                console.log(new Date(data.reservation_datetime_datetime) > new Date(Date.now()))
                // setIsFutureReservationDatetime(new Date(data.reservation_datetime_datetime) > new Date(Date.now()))
                if(new Date(data.reservation_datetime_datetime) > new Date(Date.now())) {
                    setIsFutureReservationDatetime(true)
                }

                console.log('ellahhhhhhhhho')
                console.log(data.reservation_user_url === reservation)
                console.log(data.reservation_business_url === reservation)
                if (data.reservation_user_url === reservation) {
                    console.log('reservation_user_url')
                    // setUserType('reservation_user_url')

                    setUserType(2)
                    setState(prevState => ({
                        ...prevState,
                        userType: 2,  // Aggiorna anche il contesto globale
                    }));
                } else if (data.reservation_business_url === reservation) {
                    console.log('reservation_business_url')
                    // setUserType('reservation_business_url')
                    setUserType(1)
                    setState(prevState => ({
                        ...prevState,
                        userType: 1,  // Aggiorna anche il contesto globale
                    }));
                }

                console.log('userType1111111111111115555')
                console.log(userType)
                console.log(state.userType)
                console.log(reservation)
                console.log(data.reservation_business_url)

                console.log("!data.reservation_validation_created_at")
                console.log(!data.reservation_validation_created_at)
                console.log(userType)
                if (!data.reservation_validation_created_at && userType === 2) {
                    setIsFirstTime(true)
                }

                // (data.reservation_proposal).sort((a, b) => a.reservation_datetime_priority - b.reservation_datetime_priority);
                (data.reservation_proposal).sort((a, b) => new Date(a.reservation_datetime_datetime) - new Date(b.reservation_datetime_datetime));

                // setReservationProposals(prevProposals => {
                //     const newProposals = data.reservation_proposal;
                //     console.log('Nuovo stato:', newProposals);
                //     return newProposals;
                // });
                setReservationProposals(prevProposals => {
                    const newProposals = [...data.reservation_proposal];
                    console.log('Nuovo stato:', newProposals);
                    newProposals.forEach(item => {
                        console.log(`${item.reservation_datetime_priority} - ${format(new Date(item.reservation_datetime_datetime), 'HH:mm')}`);
                    });
                    console.log()
                    // /*(data.reservation_proposal)*/newProposals.sort((a, b) => a.reservation_datetime_priority - b.reservation_datetime_priority);
                    newProposals.forEach(item => {
                        console.log(`${item.reservation_datetime_priority} - ${format(new Date(item.reservation_datetime_datetime), 'HH:mm')}`);
                    });
                    return newProposals;
                });

                console.log('data.reservation_proposal9999999999')
                console.log(data.reservation_proposal)
                // console.log(data.reservation_proposal[0].reservation_datetime_datetime)
                console.log(data.reservation_proposal.length)

                // setIsAllPastProposalDatetime(true)
                //setta a true isAllPastProposalDatetime se tutte reservation_datetime_datetime in data.reservation_proposal sono nel passato
                // for(let i = 0; i < data.reservation_proposal.length; i++){
                //     console.log('merdoneeee')
                //     console.log(new Date(data.reservation_proposal[i].reservation_datetime_datetime))
                //     console.log(new Date())
                //     console.log(new Date(data.reservation_proposal[i].reservation_datetime_datetime) < new Date())
                //     if(new Date(data.reservation_proposal[i].reservation_datetime_datetime) < new Date()){
                //         console.log('dioporcomiseroinfame')
                //         setIsAllPastProposalDatetime(false)
                //         break
                //     }
                //     // else{
                //     //     setIsAllPastProposalDatetime(true)
                //     // }
                // }
                // console.log(isAllPastProposalDatetime)
                let allPast = true;
                for (let i = 0; i < data.reservation_proposal.length; i++) {
                    const proposalDate = new Date(data.reservation_proposal[i].reservation_datetime_datetime);
                    if (proposalDate > new Date()) {
                        allPast = false;
                        break;
                    }
                }
                setIsAllPastProposalDatetime(allPast); // True only if ALL proposals are past dates

                // setReservationProposals(data.reservation_proposal)
                console.log('data.reservation_proposal77777777777')
                console.log(reservationProposals)

                // console.log('data.reservation_datetime')
                // console.log(data.reservation_datetime)
                console.log('data.reservation_datetime_datetime')
                console.log(data.reservation_datetime_datetime)
                // setDateString(/*dateObject*/data.reservation_datetime)
                console.log('dateString')
                console.log(dateString)
                // const [datePart, timePart] = /*dateString*/(data.reservation_datetime).split(" ");
                // const [day, month, year] = datePart.split("/").map(Number);
                // const [hours, minutes] = timePart.split(":").map(Number);
                // const dateObject = new Date(year, month - 1, day, hours, minutes);
                // formatDate(dateObject)
                // setFormattedDate(/*dateObject*/formatDate(dateObject));
                console.log('formattedDate')
                console.log(formattedDate)

                console.log(reservation)
                console.log(data.reservation_user_url)
                console.log(data.reservation_business_url)

                if (!data.reservation_validation_created_at) {
                    console.log('reservation_user_url')
                    setIsReservationUserValid(false)
                    setState(prevState => ({
                        ...prevState,
                        isReservationValid: 0,  // Aggiorna anche il contesto globale
                    }));
                }
                else/* if (data.reservation_is_valid === 1)*/ {
                    console.log('reservation_business_url')
                    setIsReservationUserValid(true)
                    setState(prevState => ({
                        ...prevState,
                        isReservationValid: 1,  // Aggiorna anche il contesto globale
                    }));
                }

                if (data.reservation_datetime_datetime) {
                    setIsReservationConfirm(true)
                }

                console.log('data.reservation_proposal_datetime_id5555555')
                // console.log(data.reservation_proposal_datetime_id)

                // const crrrrr = (data.reservation_proposal).some(obj => obj.reservation_proposal_datetime_id === obj.reservation_proposal_datetime_select_id)
                // for (let i = 0; i < data.reservation_proposal.length; i++) {
                //     const obj = data.reservation_proposal[i];
                //     console.log('ggggggggggggggggrtisto')
                //     console.log(obj.reservation_proposal_datetime_id === obj.reservation_proposal_datetime_select_id)
                //     if (obj.reservation_proposal_datetime_id === obj.reservation_proposal_datetime_select_id) {
                //         break; // Esce dal ciclo appena trova un caso valido
                //     }
                // }

                // console.log(crrrrr)
                // setIsProposalValidated(crrrrr)

                // if(crrrrr){
                //     console.log('777777777777777777777777778')
                //     setIsProposalValidated(true)
                // }
                // else {
                //     setIsProposalValidated(false)
                // }
                // setIsProposalValidated(data.reservation_proposal_datetime_id === null)
                // console.log('isProposalValidated22222222222222222', setIsProposalValidated(crrrrr))

                // setState(prevState => ({
                //     ...prevState,
                //     isProposalValidated: 2,  // Aggiorna anche il contesto globale
                // }));
                // console.log('isProposalValidated555555555555555555', state.isProposalValidated)

                setImageUrl(data.business_image_url)

                // await sendOTP(data);

                setState(prevState => ({
                    ...prevState,
                    path: "quanti",
                    reservationEmail: data.reservation_email,
                    reservationName: data.reservation_name,
                    reservationPhone: data.reservation_phone,
                    reservationQty: data.reservation_quantity,
                    // reservationDatetime: data.reservation_datetime/*formattedDate*//*`${format(new Date(data.reservation_datetime), 'dd/MM/yyyy')} 08:48`*/,
                    reservationDatetime: data.reservation_datetime_datetime/*formattedDate*//*`${format(new Date(data.reservation_datetime), 'dd/MM/yyyy')} 08:48`*/,
                    isEditing: true,
                    restaurantData: {
                        business_id: data.business_id,
                        business_name: data.business_name,
                        business_cell: data.business_cell,
                        business_info: data.business_info,
                        business_image_url: data.business_image_url,
                        business_phone: data.business_phone,
                        business_email: data.business_email,
                        business_address: data.business_address,
                        business_city: data.business_city,
                        business_province: data.business_province,
                        business_postal_code: data.business_postal_code,
                        business_region: data.business_region,
                        business_address_number: data.business_address_number,
                        business_created_at: data.business_created_at,
                        business_form_id: data.business_form_id,
                        business_form_color_id: data.business_form_color_id,
                        business_form_created_at: data.business_form_created_at,
                        business_form_color_background: data.business_form_color_background,
                        business_form_color_active: data.business_form_color_active,
                    },
                    reservationData: {
                        reservation_id: data.reservation_id,
                        reservation_name: data.reservation_name,
                        // reservation_datetime: data.reservation_datetime/*formattedDate*/,
                        reservation_datetime_datetime: data.reservation_datetime_datetime/*formattedDate*/,
                        reservation_email: data.reservation_email,
                        reservation_user_url: data.reservation_user_url,
                        reservation_business_url: data.reservation_business_url,
                        reservation_phone: data.reservation_phone,
                        reservation_quantity: data.reservation_quantity,
                        reservation_created_at: data.reservation_created_at,
                        reservation_proposal_id: data.reservation_proposal_id,
                        reservation_proposal_user_type_id: data.reservation_proposal_user_type_id,
                        reservation_proposal_is_declined: data.reservation_proposal_is_declined,
                        reservation_proposal_datetime_id: data.reservation_proposal_datetime_id,
                        reservation_proposal_created_at: data.reservation_proposal_created_at,
                        reservation_validation_id: data.reservation_validation_id,
                        reservation_validation_created_at: data.reservation_validation_created_at,
                        reservation_cancel_id: data.reservation_cancel_id,
                        reservation_cancel_user_type_id: data.reservation_cancel_user_type_id,
                        reservation_cancel_created_at: data.reservation_cancel_created_at,
                    },
                }));
            }
        } catch (error) {
            console.error("Errore durante il fetch:", error);
            setIsValid(false);  // Se c'è un errore, considera i dati non validi
        } finally {
            setIsLoading(false);  // Fine del caricamento
        }
    };

    //     fetchRestaurant();
    // }, [reservation, isAllPastProposalDatetime, isFutureReservationDatetime]);

    useEffect(/*async*/ () => {
        /*await*/
        fetchRestaurant().then(r => {
            console.log('date1233333333')
            console.log(date)
            console.log(r)
            // /*await*/ fetchTimesForDay(date); // Otteniamo gli slot per il giorno iniziale (stato `date`)
            if (state.isEdit) {
                // setDate(new Date((state.reservationDatetime)))
                // setSelectedTime(format(new Date((state.reservationDatetime)), "HH:mm"))
                setIsTimeSelected(true)
            }
        });  // Evitare chiamate multiple di fetch
        // console.log('date1233333333')
        // console.log(date)
        // // /*await*/ fetchTimesForDay(date); // Otteniamo gli slot per il giorno iniziale (stato `date`)
        // if (state.isEdit) {
        //     // setDate(new Date((state.reservationDatetime)))
        //     // setSelectedTime(format(new Date((state.reservationDatetime)), "HH:mm"))
        //     setIsTimeSelected(true)
        // }
        // }, [date, fetchRestaurant, state.isEdit]);
    }, []);

    // useEffect(() => {
    //     console.log('date1233333333')
    //     console.log(date)
    //     fetchTimesForDay(date); // Otteniamo gli slot per il giorno iniziale (stato `date`)
    //     if(state.isEdit){
    //         // setDate(new Date((state.reservationDatetime)))
    //         // setSelectedTime(format(new Date((state.reservationDatetime)), "HH:mm"))
    //         setIsTimeSelected(true)
    //     }
    // }, [date]);


    // Funzione per formattare la data
    const formatDate = (date) => {
        const optionsDate = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
        const optionsTime = {hour: '2-digit', minute: '2-digit', hour12: false};
        const formattedDate = date.toLocaleDateString('it-IT', optionsDate);
        const formattedTime = date.toLocaleTimeString('it-IT', optionsTime);
        let dayName = formattedDate.split(' ')[0];
        let dayNumber = formattedDate.split(' ')[1];
        let monthName = formattedDate.split(' ')[2];
        let yearNumber = formattedDate.split(' ')[3];
        return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNumber} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} alle ore ${formattedTime}`;
    };

    // const formattedDate = formatDate(dateObject);

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

    // const handleProceedClick = async () => {
    //   try {
    //       // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
    //       const localDateTime = new Date(dateObject.getTime()).toISOString();
    //       console.log('Local datetime:', localDateTime);
    //
    //       const response = await fetch('${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation', {
    //           method: 'POST',
    //           headers: {
    //             'Content-Type': 'application/json',
    //           },
    //           next: { revalidate: 10 },
    //           body: JSON.stringify({
    //             ...restaurantData,
    //             reservation_phone: state.reservationPhone,
    //             business_phone: restaurantData.phone,
    //             reservation_name: state.reservationName,
    //             business_name: restaurantData.name,
    //             // business_id: "osteria-serafina-milano",
    //             business_id: `${/*params.restaurant*/restaurantData.id}`,
    //             quantity: state.reservationQty,
    //             phone: state.reservationPhone,
    //             datetime: localDateTime,
    //             business_email: restaurantData.email,
    //             reservation_email: state.reservationEmail,
    //           }),
    //         });
    //
    //         if (response.ok) {
    //           const data = await response.json();
    //           console.log('Risposta dal server:', data);
    //           setOpen(true); // Apri il Dialog se la richiesta ha avuto successo
    //         } else {
    //           console.error('Errore durante la richiesta:', response.statusText);
    //         }
    //   } catch (error) {
    //     console.error('Errore durante il fetch:', error);
    //   }
    // };

    const handleDeleteReservationClick = async () => {
        try {

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservationData.reservation_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                },
                next: {revalidate: 10},
                cache: 'no-store',
                body: JSON.stringify({
                    ...restaurantData,
                    ...reservationData,
                    //   reservation_phone: state.reservationPhone,
                    //   business_phone: restaurantData.phone,
                    //   reservation_name: state.reservationName,
                    //   business_name: restaurantData.name,
                    //   // business_id: "osteria-serafina-milano",
                    //   business_id: `${/*params.restaurant*/restaurantData.id}`,
                    //   quantity: state.reservationQty,
                    //   phone: state.reservationPhone,
                    //   datetime: localDateTime,
                    //   business_email: restaurantData.email,
                    //   reservation_email: state.reservationEmail,
                    user_type_id: userType,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta dal server:', data);
                setOpen(true); // Apri il Dialog se la richiesta ha avuto successo
                // window.location.reload();
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

    const handleConfirmSetSlots = () => {
        // if(selectedDateTimes.length > 0) {
        //     setIsConfirmedChangeDateSlots(true)
        setSelectedSendDateTimes(selectedDateTimes)
        // }
        // else {
        //     setIsConfirmedChangeDateSlots(false)
        // }
    };

    const handleAnnullaSlots = () => {
        // if(selectedDateTimes.length > 0) {
        //     setIsConfirmedChangeDateSlots(false)
        //     setSelectedDateTimes([]);
        // }
        // else {
        //     setIsConfirmedChangeDateSlots(false)
        // }
    };

    const handleDialogcHANGE = (open) => {
        console.log(open)
        setOpen(open); // Funzione per chiudere il dialog
        console.log(open)
        if (!open) {
            // Azione quando il dialog viene chiuso
            window.location.reload();
            // window.location.replace(`https://nurebo.com/${newUserUrlReservation}`);
            console.log('state45555555555')
            console.log(state)
        }
    };

    const handleClose = () => {
        setOpen(false); // Funzione per chiudere il dialog
        // router.push(router.asPath); // Ricarica navigando sulla stessa pagina
    };

    // const FormSchema = z.object({
    //   pin: z.string().min(6, {
    //     message: "Your one-time password must be 6 characters.",
    //   }),
    // })
    //
    // const form = useForm<z.infer<typeof FormSchema>>({
    //     resolver: zodResolver(FormSchema),
    //     defaultValues: {
    //       pin: "",
    //     },
    //   })
    //
    //   function onSubmit(data: z.infer<typeof FormSchema>) {
    //     toast({
    //       title: "You submitted the following values:",
    //       description: (
    //         <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
    //           <code className="text-white">{JSON.stringify(data, null, 2)}</code>
    //         </pre>
    //       ),
    //     })
    //   }

    const handleChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
    };

    // const handleSubmitOTP = async () => {
    //     // const otpCode = otp.join('');
    //     console.log('Codice OTP:', otp/*Code*/);
    //
    //     if (otp/*Code*/.length === 6) {
    //         // setIsOTPValid(true)
    //         try {
    //             const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservationData.reservation_id}/verify_otp`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify({
    //                     auth_id: authId,
    //                     otp: otp,
    //                 }),
    //                 cache: 'no-store',
    //             });
    //
    //             const result = await response.json();
    //
    //             console.log('Risultato:', result);
    //             console.log('result.success:', result.success);
    //             // console.log('result[0].success:', result[0].success);
    //
    //             if (result.success === 1) {
    //                 setIsOTPValid(true)
    //             } else {
    //                 setIsOTPValid(false)
    //             }
    //         } catch (error) {
    //             console.error('Errore nella richiesta:', error);
    //         }
    //     }
    //
    // };

    const handlePhoneSubmit = async () => {
        // const otpCode = otp.join('');
        console.log('telefono inserito:', phone);

        // if (otp/*Code*/.length === 6) {
        // setIsOTPValid(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservationData.reservation_id}/verify_phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
                },
                body: JSON.stringify({
                    // auth_id: authId,
                    phone: phone,
                }),
                cache: 'no-store',
            });

            const result = await response.json();

            console.log('Risultato:', result);
            console.log('result.success:', result.success);
            // console.log('result[0].success:', result[0].success);

            if (result.success === 1) {
                setIsPhoneValid(true)
            } else {
                setIsPhoneValid(false)
            }
        } catch (error) {
            console.error('Errore nella richiesta:', error);
        }
        // }
    };

    const handleModifica = async () => {
        // router.push(`/prenotazione/${restaurantData.business_id}`);
        // return <RestaurantClientComponent restaurantData={restaurantData/*restaurants*/} />;
        // return (<Quanti restaurantData={restaurantData/*restaurants*/} />);
        setIsEdit(true)
        setState(prevState => ({
            ...prevState,
            isEdit: true,  // Aggiorna anche il contesto globale
        }));
    }

    // const handleReservationConfirm = async () => {
    //     try {
    //         console.log('yyyyyyyyyyyyyyyyyyyy')
    //         console.log(state)
    //
    //         // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationData.reservation_id}/confirm`, {
    //         const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationData.reservation_id}/proposal/${state.reservationData.reservation_proposal_id}/confirm`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             next: {revalidate: 10},
    //             body: JSON.stringify({
    //                 ...state.restaurantData,
    //                 ...state.reservationData,
    //                 reservation_phone: state.reservationPhone,
    //                 business_phone: state.restaurantData.business_phone,
    //                 reservation_name: state.reservationName,
    //                 business_name: state.restaurantData.business_name,
    //                 // business_id: "osteria-serafina-milano",
    //                 business_id: `${/*params.restaurant*/state.restaurantData.business_id}`,
    //                 quantity: state.reservationQty,
    //                 phone: state.reservationPhone,
    //                 // datetime: localDateTime,
    //                 // reservation_is_valid: 1,
    //                 business_email: state.restaurantData.business_email,
    //                 reservation_email: state.reservationEmail,
    //                 user_type_id: state.userType
    //             }),
    //             cache: 'no-store',
    //         });
    //
    //         if (response.ok) {
    //             const data = await response.json();
    //             console.log('Risposta dal server:', data);
    //             setIsDialogOpen1(true); // Apri il Dialog se la richiesta ha avuto successo
    //             // setState(prevState => ({
    //             //     ...prevState,
    //             //     reservation_is_valid: 1,  // Aggiorna anche il contesto globale
    //             // }));
    //             // setIsReservationUserValid(true)
    //             setIsReservationConfirm(true)
    //
    //         } else {
    //             console.error('Errore durante la richiesta:', response.statusText);
    //         }
    //     } catch (error) {
    //         console.error('Errore durante il fetch:', error);
    //     }
    // };

    const handleReservationProposalConfirm = async () => {
        try {
            console.log('yyyyyyyyyyyyyyyyyyyy')
            console.log(state)

            console.log('reservationProposals11111111111111111')
            console.log(reservationProposals)
            // console.log('reservationProposals00000000')
            // console.log(reservationProposals.some(obj => obj.reservation_proposal_datetime_datetime === selectedProposal))
            // console.log('reservationProposals22222222')
            // console.log(reservationProposals.find(obj => obj.reservation_proposal_datetime_datetime === selectedProposal))

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationData.reservation_id}/proposal/${reservationProposals[0].reservation_proposal_id}/confirm`, {
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
                    // datetime: localDateTime,
                    reservation_is_valid: 1,
                    business_email: state.restaurantData.business_email,
                    reservation_email: state.reservationEmail,
                    user_type_id: state.userType,
                    // reservation_proposal_datetime_datetime: selectedProposal,
                    ...reservationProposals.find(obj => obj.reservation_datetime_datetime === selectedProposal)
                }),
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta dal server:', data);
                setIsDialogOpen1(true); // Apri il Dialog se la richiesta ha avuto successo
                setState(prevState => ({
                    ...prevState,
                    reservation_is_valid: 1,  // Aggiorna anche il contesto globale
                }));

                // setIsReservationUserValid(true)
                setIsReservationConfirm(true)
                // setDateString(new Date(Date.now()).toISOString())
                // setDateString(formatDate(selectedProposal))
                setReservationProposals([])
                window.location.reload();

            } else {
                console.error('Errore durante la richiesta:', response.statusText);
            }
        } catch (error) {
            console.error('Errore durante il fetch:', error);
        }
    };

    const handleDialogChange1 = (open) => {
        console.log(open)
        setIsDialogOpen1(open); // Funzione per chiudere il dialog
        console.log(open)
        if (!open) {
            // Azione quando il dialog viene chiuso
            // window.location.reload();
            console.log('state45555555555')
            console.log(state)
        }
    };

    const handleDialogClose1 = () => {
        console.log(isDialogOpen1)
        setIsDialogOpen1(false); // Funzione per chiudere il dialog
        console.log(isDialogOpen1)
    };

    const handleDateSelect = (selectedDate) => {
        setIsClicked(true)

        setIsAccordion1Open(false)
        setIsAccordion2Open(true)

        setDate(selectedDate /*|| (state.reservationDatetime).split(' ')[0]*/);
        setTimes([]); // Reset degli slot
        setEditDate(selectedDate);
        setEditTimes([]); // Reset degli slot

        fetchTimesForDay(selectedDate); // Ricarichiamo gli slot per il giorno selezionato
        setSelectedTime(""); // Resettiamo l'orario selezionato
        // setIsTimeSelected(false); // Disabilitiamo il bottone "Avanti"
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
        // setShowWarning(false);
        const formattedDate = format(date, 'dd/MM/yyyy');
        // console.log(formattedDate)

        // setState({
        //     ...state,
        //     // reservationDatetime: `${formattedDate} ${time}`,
        //     // reservationDatetime: new Date(Date.UTC(2024, 11, 18, 10, 48, 0)),
        //     // reservationDatetime: (new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), newt.getHours(), newt.getMinutes(), newt.getSeconds(), 0))).toISOString(),
        //     reservationDatetime: (new Date(/*Date.UTC(*/date.getFullYear(), date.getMonth(), date.getDate(), newt.getHours(), newt.getMinutes(), newt.getSeconds(), 0)/*)*/).toISOString(),
        //     date: date,
        //     selectedTime: time,
        // });

        // console.log(`ime}`)
        // console.log(`${formattedDate} ${time}`)
        // console.log('state.reservationDatetime12222')
        // console.log(state.reservationDatetime)
        // console.log(state)
    };

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
                    next: {revalidate: 10},
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
            setEditTimes(allTimes);

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

    const handleEditDateSelect = (selectedDate) => {
        setIsClicked(true)
        setEditDate(selectedDate);
        setEditTimes([]); // Reset degli slot
        fetchTimesForDay(selectedDate); // Ricarichiamo gli slot per il giorno selezionato
        setSelectedEditTime(""); // Resettiamo l'orario selezionato
        // setIsTimeSelected(false); // Disabilitiamo il bottone "Avanti"
    };

    // const handleEditTimeSelect = (time) => {
    //     // setSelectedEditTime(time);
    //     // if (!selectedEditTimes.includes(time)) {
    //     //     setSelectedEditTimes([...selectedEditTimes, time]); // Aggiunge l'orario selezionato alla lista
    //     // }
    //
    //     // setSelectedEditTimes((prevSelected) =>
    //     //     prevSelected.includes(time)
    //     //         ? prevSelected.filter((t) => t !== time) // Se già selezionato, rimuovilo
    //     //         : [...prevSelected, time] // Altrimenti aggiungilo
    //     // );
    //
    //     if (!editDate) return; // Assicurati che una data sia selezionata
    //     setSelectedDateTimes((prev) => [
    //         ...prev,
    //         {date: new Date(editDate), time}, // Salva una copia della data
    //     ]);
    //
    //     console.log('selectedEditTimesgg5fb54b45bb45b54')
    //     console.log(selectedEditTimes)
    // };

    // const handleEditTimeSelect = (time) => {
    //     console.log('selectedDateTimes0000000')
    //     console.log(selectedDateTimes)
    //
    //     if (!editDate) return; // Assicurati che una data sia selezionata
    //
    //     const newSelection = {date: new Date(editDate), time};
    //
    //     setSelectedDateTimes((prev) => {
    //         const exists = prev.some(
    //             (item) => item.date.toDateString() === newSelection.date.toDateString() && item.time === time
    //         );
    //
    //         if (exists) {
    //             // Rimuovi se già esiste
    //             return prev.filter(
    //                 (item) => !(item.date.toDateString() === newSelection.date.toDateString() && item.time === time)
    //             );
    //         }
    //
    //         // Aggiungi se non esiste
    //         return [...prev, newSelection];
    //     });
    // };

    // const handleEditTimeSelect = (time) => {
    //     console.log('selectedDateTimes0000000');
    //     console.log(selectedDateTimes);
    //
    //     if (!editDate) return; // Assicurati che una data sia selezionata
    //
    //     // Verifica se sono stati già selezionati 10 orari
    //     if (selectedDateTimes.length >= 10) {
    //         // alert("Puoi selezionare al massimo 10 orari!");
    //         setMaxEditSlots(true);
    //         return; // Blocca l'aggiunta di più orari
    //     }
    //
    //     // Crea una nuova data con il valore di editDate
    //     const newSelectionDate = new Date(editDate);
    //     const [hour, minute] = time.split(':'); // Supponiamo che 'time' sia nel formato "HH:mm"
    //     newSelectionDate.setHours(hour);
    //     newSelectionDate.setMinutes(minute);
    //     newSelectionDate.setSeconds(0); // Imposta i secondi a zero per una selezione precisa
    //
    //     // Aggiungi il campo datetime con il valore in UTC
    //     const datetimeUTC = newSelectionDate.toISOString(); // Converte la data in formato UTC
    //
    //     // Nuovo oggetto con il campo datetime
    //     const newSelection = {
    //         date: newSelectionDate,
    //         time,
    //         datetime: datetimeUTC // Aggiungi la data e l'orario in UTC
    //     };
    //
    //     setSelectedDateTimes((prev) => {
    //         const exists = prev.some(
    //             (item) => item.date.toDateString() === newSelection.date.toDateString() && item.time === time
    //         );
    //
    //         if (exists) {
    //             // Rimuovi se già esiste
    //             return prev.filter(
    //                 (item) => !(item.date.toDateString() === newSelection.date.toDateString() && item.time === time)
    //             );
    //         }
    //
    //         // Aggiungi se non esiste
    //         return [...prev, newSelection];
    //     });
    // };

    const handleEditTimeSelect = (time) => {
        console.log('selectedDateTimes0000000');
        console.log(selectedDateTimes);

        if (!editDate) return; // Assicurati che una data sia selezionata

        // Crea una nuova data con il valore di editDate
        const newSelectionDate = new Date(editDate);
        const [hour, minute] = time.split(':'); // Supponiamo che 'time' sia nel formato "HH:mm"
        newSelectionDate.setHours(hour);
        newSelectionDate.setMinutes(minute);
        newSelectionDate.setSeconds(0); // Imposta i secondi a zero per una selezione precisa

        // Aggiungi il campo datetime con il valore in UTC
        const datetimeUTC = newSelectionDate.toISOString(); // Converte la data in formato UTC

        // Nuovo oggetto con il campo datetime
        const newSelection = {
            date: newSelectionDate,
            time,
            datetime: datetimeUTC // Aggiungi la data e l'orario in UTC
        };

        setSelectedDateTimes((prev) => {
            const exists = prev.some(
                (item) => item.date.toDateString() === newSelection.date.toDateString() && item.time === time
            );

            if (exists) {
                // Rimuovi se già esiste
                return prev.filter(
                    (item) => !(item.date.toDateString() === newSelection.date.toDateString() && item.time === time)
                );
            }

            // Controlla il limite solo quando si aggiunge un nuovo elemento
            if (prev.length >= 10) {
                setMaxEditSlots(true); // Mostra il messaggio di errore
                return prev; // Non aggiunge nulla
            }

            // Aggiungi se non esiste
            return [...prev, newSelection];
        });
    };

    useEffect(() => {
        const setRealVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--real-vh', `${vh * 100}px`);
        };

        setRealVH();
        window.addEventListener('resize', setRealVH);

        return () => window.removeEventListener('resize', setRealVH);
    }, []);

    if (isLoading) {
        return <div></div>;  // Mostra un caricamento mentre è in fase di fetch
    }

    if (!isValid) {
        return notFound();  // Mostra una pagina 404 se i dati non sono validi
    }

    // if (!isPhoneValid && userType === /*'reservation_user_url'*/2) {
    if (!isTokenSuccess) {
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

                        <div
                            className="relative bg-white rounded-lg shadow-md s:h-[50vh] sm:h-[50vh] md:h-[60vh] s:w-[90vw] sm:w-[80vw] md:w-[65vw] lg:w-[55vw] xl:w-[50vw] flex overflow-hidden mt-10">
                            {/*<div className="relative h-full w-[20vw] s:hidden md:block">*/}
                            {/*    {imageUrl ? (*/}
                            {/*        <img src={imageUrl} className="object-cover h-full w-full"/>*/}
                            {/*    ) : (*/}
                            {/*        <Skeleton className="h-full w-full"/>*/}
                            {/*    )}*/}
                            {/*    <div className="absolute inset-0 bg-black opacity-10"></div>*/}
                            {/*</div>*/}

                            <div className="s:ml-[40px] md:ml-[50px] s:mt-[40px] md:mt-[50px] s:w-[60vw]">
                                <div className="mb-[15px]">
                                    <label className={`text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                        {restaurantData.business_name}:
                                    </label>
                                    <div className="w-[20px]"></div>
                                    <label className={`text-[20px] font-sans font-medium text-gray-600`}>
                                        Inserisci il codice che hai ricevuto
                                    </label>
                                </div>

                                <div className="flex flex-col s:mt-[5vh] sm:mt-[7vh] md:mt-[10vh] s:ml-[5vw] md:ml-[5vw]">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        // value={phone}
                                        // value={state.reservationPhone}
                                        onChange={(otp) => {
                                            setOtp(otp)
                                            setShowWarning(false)
                                        }}
                                        // onChange={(phone) => setPhone(phone)}
                                        // onChange={(value) => handleChange(value)}
                                        // className={`transform scale-[4.8]`}
                                        className={``}
                                    >
                                        {/*<InputOTPGroup className={`transform scale-[1.3]`}>*/}
                                        <InputOTPGroup className={`mt-[20px] mb-[10px]`}>
                                            <InputOTPSlot index={0}
                                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[7vw] md:h-[7vw] lg:w-[6vw] lg:h-[6vw] xl:w-[5vw] xl:h-[5vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                                            <InputOTPSlot index={1}
                                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[7vw] md:h-[7vw] lg:w-[6vw] lg:h-[6vw] xl:w-[5vw] xl:h-[5vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                                            <InputOTPSlot index={2}
                                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[7vw] md:h-[7vw] lg:w-[6vw] lg:h-[6vw] xl:w-[5vw] xl:h-[5vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                                            <InputOTPSlot index={3}
                                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[7vw] md:h-[7vw] lg:w-[6vw] lg:h-[6vw] xl:w-[5vw] xl:h-[5vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                                            <InputOTPSlot index={4}
                                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[7vw] md:h-[7vw] lg:w-[6vw] lg:h-[6vw] xl:w-[5vw] xl:h-[5vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                                            <InputOTPSlot index={5}
                                                          className={`font-sans s:w-[9vw] s:h-[9vw] md:w-[7vw] md:h-[7vw] lg:w-[6vw] lg:h-[6vw] xl:w-[5vw] xl:h-[5vw] s:text-[5vw] md:text-[2.0vw] lg:text-[1.7vw]`}/>
                                        </InputOTPGroup>
                                    </InputOTP>

                                    {showWarning && otp.length === 0 && !isOTPValid && (
                                        <p className="flex text-center w-[60vw] font-sans font-semibold text-red-600 mt-2">
                                            Il codice inserito non è valido.
                                        </p>
                                    )}

                                    {showWarning1 && (
                                        <p className="w-[60vw] font-sans font-semibold text-gray-500 mt-2">
                                            {showWarningMessage1}
                                        </p>
                                    )}

                                </div>

                                {/*<div*/}
                                {/*    className={`font-sans font-medium ml-[60px] mt-2 text-[18px] ${isValid ? 'text-green-500' : 'text-red-500'}`}>*/}
                                {/*    {message}*/}
                                {/*</div>*/}
                            </div>

                            <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">
                                <Button
                                    // className={`px-6 font-sans font-semibold rounded-md ${isValid ? `bg-[#${activeColor}]` : `bg-[#${backgroundColor}]`} text-white h-[35px] w-[120px]`}
                                    className={`px-6 font-sans font-semibold rounded-md bg-[#${activeColor}] text-white h-[35px] w-[120px]`}
                                    type="button"
                                    // onClick={() => sendOTP(reservationData)}
                                    onClick={() => {
                                        // setState(prevState => ({
                                        //     ...prevState,
                                        //     reservationName: '',
                                        //     reservationEmail: '',
                                        //     reservationPhone: '',
                                        //     reservationDatetime: '',
                                        //     // reservationQty: '',
                                        //     reservationQty: 2,
                                        //     restaurantData: {}, // Inizializza lo stato del ristorante
                                        //     // restaurantData: null, // Stato per i dati del ristorante
                                        //     // path: 'quanti', // Aggiungi il campo path
                                        //     reservationId: '',
                                        // }));
                                        return handleSubmitOTP();
                                    }}
                                    // disabled={!isValid} // Disabilita il pulsante se non valido
                                >
                                    Invia
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
    else {
        return (
            // <div className="relative w-screen h-screen-dynamic bg-cover bg-center z-1 overflow-hidden "
            <div className="relative s:h-screen-dynamic md:h-[calc(100vh)] bg-cover bg-center z-1 overflow-hidden "
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
                    <div
                        className="relative s:h-screen sm:h-auto flex flex-col items-center justify-center overflow-x-hidden">
                        <div className={`flex-1 overflow-y-auto`}
                             style={{
                                 scrollbarWidth: 'none', // Per Firefox
                                 msOverflowStyle: 'none', // Per IE e Edge
                             }}
                        >

                            <div
                                className={`s:justify-center md:justify-start relative bg-white flex-1 rounded-lg shadow-md s:h-[85vh] sm:h-[85vh] s:w-[90vw] sm:w-[72vw] md:w-[92vw] lg:w-[82vw] xl:w-[72vw] flex overflow-hidden overflow-y-auto s:mt-[60px] md:mt-[40px] ${(selectedSendDateTimes.length > 0 || reservationProposals.length > 0) ? 'md:w-[70vw]' : 'md:w-[70vw]'}`}
                                style={{
                                    scrollbarWidth: 'none', // Per Firefox
                                    msOverflowStyle: 'none', // Per IE e Edge
                                }}
                            >
                                <div className="relative h-full w-[20vw] s:hidden md:block">
                                    {imageUrl ? (
                                        <img src={imageUrl} className="object-cover h-full w-full"/>
                                    ) : (
                                        <Skeleton className="h-full w-full"/>
                                    )}
                                    <div className="absolute inset-0 bg-black opacity-10"></div>
                                </div>

                                <div
                                    className="s:mb-[30px] md:mb-[0px] s:ml-[35px] md:ml-[50px] s:mt-[35px] md:mt-[50px] h-[60px] s:w-[60vw] md:w-[40vw] min-w-[300px]">
                                    <div className="s:mb-[15px] md:mb-[25px] overflow-y-scroll ">
                                        <label
                                            className={`s:text-[15px] md:text-[15px] font-sans font-medium text-[#${activeColor}]`}>
                                            {restaurantData.business_name}:
                                            {/*{userType === 1 ? "reservation_business_url" : "reservation_user_url"}*/}
                                        </label>
                                        <div className="h-[7px]"></div>
                                        {userType && (<label
                                            className="s:text-[17px] md:text-[20px] font-sans font-medium text-gray-600">
                                            Prenotazione con codice <a style={{textDecoration: 'underline'}}
                                                                       href="">{userType === 1 ? reservationData.reservation_business_url : userType === 2 ? reservationData.reservation_user_url : ''}</a>
                                        </label>)}
                                    </div>

                                    <div className={`flex s:flex-col md:flex-row`}>
                                        <div>
                                            <div className={`s:flex-col md:flex-row`}>
                                                {dateString !== "Giovedì, 1 Gennaio alle ore 01:00" && reservationData.reservation_datetime_datetime && (
                                                    <div className={`s:w-[60vw] s:mt-[50px] md:mt-[20px] s:mb-[-30px] md:mb-[20px]`}>
                                                        <div className={`flex`}>
                                                            <label
                                                                className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                                                Data:
                                                            </label>
                                                            {/*{reservationProposals.length === 0 && (*/}
                                                            {/*    <Button*/}
                                                            {/*        className={`font-semibold rounded-md text-center bg-[#00E676] text-white hover:bg-[#00E676] cursor-not-allowed pointer-events-none w-[90px] h-[20px] ml-[10px] mt-[2px]`}*/}
                                                            {/*    >*/}
                                                            {/*        Confermata*/}
                                                            {/*    </Button>*/}
                                                            {/*)}*/}
                                                        </div>
                                                        <div className="h-[10px]"></div>
                                                        {/*<label*/}
                                                        {/*    className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>*/}
                                                        {/*    {dateString}*/}
                                                        {/*</label>*/}
                                                        <Button
                                                            className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white w-[250px] h-[40px] mb-[10px] cursor-default`}
                                                            // disabled=true
                                                        >
                                                            {dateString}
                                                        </Button>
                                                    </div>
                                                )}
                                                
                                                <div className="flex space-x-16 s:mt-[50px] md:mt-[20px] md:mb-[40px]">
                                                    {reservationData.reservation_name && (
                                                        <div>
                                                            <label
                                                                className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                                                Nome:
                                                            </label>
                                                            <div className="h-[2px]"></div>
                                                            <label
                                                                className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                                                                {/*{isReservationConfirm === false && userType === 1 ? `*************` : reservationData.reservation_name}*/}
                                                                {reservationData.reservation_validation_created_at === null && userType === 1 ? `*************` : reservationData.reservation_name}
                                                            </label>
                                                        </div>
                                                    )}

                                                    {/*{reservationData.reservation_quantity && (*/}
                                                    {/*    <div>*/}
                                                    {/*        <label*/}
                                                    {/*            className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">*/}
                                                    {/*            N° Coperti:*/}
                                                    {/*        </label>*/}
                                                    {/*        <div className="h-[2px]"></div>*/}
                                                    {/*        <label*/}
                                                    {/*            className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>*/}
                                                    {/*            {reservationData.reservation_quantity}*/}
                                                    {/*        </label>*/}
                                                    {/*    </div>*/}
                                                    {/*)}*/}
                                                </div>

                                                {/*{reservationData.reservation_phone && (*/}
                                                {/*    <div*/}
                                                {/*        className={`s:mb-[20px] md:mb-[30px] s:mt-[20px] md:mt-[-10px]`}>*/}
                                                {/*    <label*/}
                                                {/*            className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">*/}
                                                {/*            Telefono:*/}
                                                {/*        </label>*/}
                                                {/*        <div className="h-[2px]"></div>*/}
                                                {/*        <label*/}
                                                {/*            className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>*/}
                                                {/*            {isReservationConfirm === false && userType === 1 ? `**********` : reservationData.reservation_phone}*/}
                                                {/*        </label>*/}
                                                {/*    </div>*/}
                                                {/*)}*/}
                                                {reservationData.reservation_quantity && (
                                                    // <div>
                                                    <div className={`s:mb-[20px] md:mb-[30px] s:mt-[20px] md:mt-[-10px]`}>
                                                        <label
                                                            className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                                            N° Coperti:
                                                        </label>
                                                        <div className="h-[2px]"></div>
                                                        <label
                                                            className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                                                            {reservationData.reservation_quantity}
                                                        </label>
                                                    </div>
                                                )}
                                            </div>

                                            {/*{reservationData.reservation_email && (*/}
                                            {/*    <div className="s:mb-[20px] md:mb-[40px]">*/}
                                            {/*        <label*/}
                                            {/*            className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">*/}
                                            {/*            Mail:*/}
                                            {/*        </label>*/}
                                            {/*        <div className="h-[2px]"></div>*/}
                                            {/*        <label*/}
                                            {/*            className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>*/}
                                            {/*            {isReservationConfirm === false && userType === 1 ? `*************` : reservationData.reservation_email}*/}
                                            {/*        </label>*/}
                                            {/*    </div>*/}
                                            {/*)}*/}
                                            {(
                                                <div className="s:mb-[10px] md:mb-[40px]">
                                                    <label
                                                        className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                                        Effettuato il:
                                                    </label>
                                                    <div className="h-[2px]"></div>
                                                    <label
                                                        className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>
                                                        {/*{`${reservationData.reservation_created_at}`}*/}
                                                        {formatDate(new Date(reservationData.reservation_created_at))}
                                                    </label>
                                                </div>
                                            )}

                                            {/*{dateString !== "Giovedì, 1 Gennaio alle ore 01:00" && (*/}
                                            {/*    <div className={`s:w-[60vw] md:mt-[-10px]`}>*/}
                                            {/*        <div className={`flex`}>*/}
                                            {/*            <label*/}
                                            {/*                className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">*/}
                                            {/*                Data:*/}
                                            {/*            </label>*/}
                                            {/*            {reservationProposals.length === 0 && (*/}
                                            {/*                <Button*/}
                                            {/*                    className={`font-semibold rounded-md text-center bg-[#00E676] text-white hover:bg-[#00E676] cursor-not-allowed pointer-events-none w-[90px] h-[20px] ml-[10px] mt-[2px]`}*/}
                                            {/*                >*/}
                                            {/*                    Confermata*/}
                                            {/*                </Button>*/}
                                            {/*            )}*/}
                                            {/*        </div>*/}
                                            {/*        <div className="h-[10px]"></div>*/}
                                            {/*        <label*/}
                                            {/*            className={`s:text-[17px] md:text-[20px] font-sans font-medium text-[#${activeColor}] leading-[27px]`}>*/}
                                            {/*            {dateString}*/}
                                            {/*        </label>*/}
                                            {/*    </div>*/}
                                            {/*)}*/}

                                        </div>

                                        {/*{reservationProposals.length > 0 && selectedSendDateTimes.length === 0 && reservationData.reservation_datetime_datetime === null &&*/}
                                        {reservationProposals.length > 0 && /*selectedDateTimes*/selectedSendDateTimes.length === 0 && (
                                                <div
                                                    className={`md:fixed s:mt-[20px] md:mt-[20px] s:mb-[15vh] md:mb-[0vh] md:ml-[35vw] lg:ml-[29vw] xl:ml-[25vw]`}>
                                                    <div className={`flex`}>
                                                        <label
                                                            className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                                            Date proposte:
                                                        </label>
                                                        {reservationProposals[0].reservation_proposal_user_type_id === userType && (
                                                            <Button
                                                                className={`font-semibold rounded-md text-center bg-[#FF5722] text-white hover:bg-[#FF5722] cursor-not-allowed pointer-events-none w-[70px] h-[20px] ml-[10px] mt-[2px]`}
                                                            >
                                                                In attesa
                                                            </Button>
                                                        )}
                                                        {reservationProposals[0].reservation_proposal_user_type_id !== userType && (
                                                            <Button
                                                                className={`font-semibold rounded-md text-center bg-[#FF1744] text-white hover:bg-[#FF1744] cursor-not-allowed pointer-events-none w-[120px] h-[20px] ml-[10px] mt-[2px]`}
                                                            >
                                                                Da selezionare
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="h-[10px]"></div>
                                                    {/*<div className="md:flex s:hidden s:flex-col md:flex-row">*/}
                                                    {/*    {(*/}
                                                    {/*        <>*/}
                                                    {/*            /!* Colonna Sinistra *!/*/}
                                                    {/*            <div*/}
                                                    {/*                className={`flex flex-col max-h-[300px] ${*/}
                                                    {/*                    reservationProposals.length > 1 ? "overflow-y-auto" : ""*/}
                                                    {/*                } justify-start`}*/}
                                                    {/*            >*/}
                                                    {/*                {reservationProposals*/}
                                                    {/*                    .filter((_, index) => index % 2 === 0)*/}
                                                    {/*                    .map((item, index) => (*/}
                                                    {/*                        <Button*/}
                                                    {/*                            ref={(el) => (buttonRefs.current[index] = el)}*/}
                                                    {/*                            key={index}*/}
                                                    {/*                            className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#42A5F5] hover:text-white w-[240px] h-[40px] ml-[0px] mb-[10px] ${*/}
                                                    {/*                                selectedProposal === item.reservation_datetime_datetime*/}
                                                    {/*                                    ? "bg-blue-600 text-white"*/}
                                                    {/*                                    : "bg-gray-200 text-black"*/}
                                                    {/*                            }`}*/}
                                                    {/*                            onClick={(e) => handleSelectProposal(item.reservation_datetime_datetime, e)}*/}
                                                    {/*                            disabled={reservationProposals[0].reservation_proposal_user_type_id === userType}*/}
                                                    {/*                        >*/}
                                                    {/*                            /!*{item.reservation_proposal_datetime_datetime}*!/*/}
                                                    {/*                            /!*{format(new Date(item.reservation_proposal_datetime_datetime), "eeee, d/MM", {locale: it,})} {format(new Date(item.reservation_proposal_datetime_datetime), "HH:mm")}*!/*/}
                                                    {/*                            {format(new Date(item.reservation_datetime_datetime), "eeee, d MMMM", {locale: it,})} alle {format(new Date(item.reservation_datetime_datetime), "HH:mm")}*/}
                                                    {/*                            /!*{`${item.reservation_proposal_datetime_datetime.toLocaleDateString("it-IT", {*!/*/}
                                                    {/*                            /!*    weekday: "long",*!/*/}
                                                    {/*                            /!*}).charAt(0).toUpperCase() +*!/*/}
                                                    {/*                            /!*item.date*!/*/}
                                                    {/*                            /!*    .toLocaleDateString("it-IT", {weekday: "long"})*!/*/}
                                                    {/*                            /!*    .slice(1)} ${item.date.getDate()} ${*!/*/}
                                                    {/*                            /!*    item.date*!/*/}
                                                    {/*                            /!*        .toLocaleDateString("it-IT", {month: "long"})*!/*/}
                                                    {/*                            /!*        .charAt(0)*!/*/}
                                                    {/*                            /!*        .toUpperCase() +*!/*/}
                                                    {/*                            /!*    item.date*!/*/}
                                                    {/*                            /!*        .toLocaleDateString("it-IT", {month: "long"})*!/*/}
                                                    {/*                            /!*        .slice(1)*!/*/}
                                                    {/*                            /!*} alle ${item.time}`}*!/*/}
                                                    {/*                        </Button>*/}
                                                    {/*                    ))}*/}
                                                    {/*            </div>*/}

                                                    {/*            /!* Colonna Destra *!/*/}
                                                    {/*            <div*/}
                                                    {/*                className={`flex flex-col max-h-[300px] ${*/}
                                                    {/*                    reservationProposals.length > 1 ? "overflow-y-auto" : ""*/}
                                                    {/*                } justify-start`}*/}
                                                    {/*            >*/}
                                                    {/*                {reservationProposals*/}
                                                    {/*                    .filter((_, index) => index % 2 !== 0)*/}
                                                    {/*                    .map((item, index) => (*/}
                                                    {/*                        <Button*/}
                                                    {/*                            key={index}*/}
                                                    {/*                            className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#9E9E9E] hover:text-white w-[240px] h-[40px] md:ml-[10px] mb-[10px] ${*/}
                                                    {/*                                selectedProposal === item.reservation_datetime_datetime*/}
                                                    {/*                                    ? "bg-blue-600 text-white"*/}
                                                    {/*                                    : "bg-gray-200 text-black"*/}
                                                    {/*                            }`}*/}
                                                    {/*                            onClick={() => handleSelectProposal(item.reservation_datetime_datetime)}*/}
                                                    {/*                            disabled={reservationProposals[0].reservation_proposal_user_type_id === userType}*/}
                                                    {/*                        >*/}
                                                    {/*                            /!*{item.reservation_proposal_datetime_datetime}*!/*/}
                                                    {/*                            /!*{format(new Date(item.reservation_proposal_datetime_datetime), "eeee, d/MM", {locale: it,})} {format(new Date(item.reservation_proposal_datetime_datetime), "HH:mm")}*!/*/}
                                                    {/*                            {format(new Date(item.reservation_datetime_datetime), "eeee, d MMMM", {locale: it,})} alle {format(new Date(item.reservation_datetime_datetime), "HH:mm")}*/}
                                                    {/*                            /!*{`${item.date.toLocaleDateString("it-IT", {*!/*/}
                                                    {/*                            /!*    weekday: "long",*!/*/}
                                                    {/*                            /!*}).charAt(0).toUpperCase() +*!/*/}
                                                    {/*                            /!*item.date*!/*/}
                                                    {/*                            /!*    .toLocaleDateString("it-IT", {weekday: "long"})*!/*/}
                                                    {/*                            /!*    .slice(1)} ${item.date.getDate()} ${*!/*/}
                                                    {/*                            /!*    item.date*!/*/}
                                                    {/*                            /!*        .toLocaleDateString("it-IT", {month: "long"})*!/*/}
                                                    {/*                            /!*        .charAt(0)*!/*/}
                                                    {/*                            /!*        .toUpperCase() +*!/*/}
                                                    {/*                            /!*    item.date*!/*/}
                                                    {/*                            /!*        .toLocaleDateString("it-IT", {month: "long"})*!/*/}
                                                    {/*                            /!*        .slice(1)*!/*/}
                                                    {/*                            /!*} alle ${item.time}`}*!/*/}
                                                    {/*                        </Button>*/}
                                                    {/*                    ))}*/}
                                                    {/*            </div>*/}
                                                    {/*        </>*/}
                                                    {/*    )}*/}
                                                    {/*</div>*/}
                                                    {/*<div className="s:flex md:hidden s:flex-col md:flex-row">*/}
                                                    {/*    {(*/}
                                                    {/*        <>*/}
                                                    {/*            <div*/}
                                                    {/*                className={`flex flex-col max-h-[300px] ${*/}
                                                    {/*                    reservationProposals.length > 1 ? "overflow-y-auto" : ""*/}
                                                    {/*                } justify-start`}*/}
                                                    {/*            >*/}
                                                    {/*                {reservationProposals.map((item, index) => (*/}
                                                    {/*                        <Button*/}
                                                    {/*                            ref={(el) => (buttonRefs.current[index] = el)}*/}
                                                    {/*                            key={index}*/}
                                                    {/*                            className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#42A5F5] hover:text-white w-[240px] h-[40px] ml-[0px] mb-[10px] ${*/}
                                                    {/*                                selectedProposal === item.reservation_datetime_datetime*/}
                                                    {/*                                    ? "bg-blue-600 text-white"*/}
                                                    {/*                                    : "bg-gray-200 text-black"*/}
                                                    {/*                            }`}*/}
                                                    {/*                            onClick={(e) => handleSelectProposal(item.reservation_datetime_datetime, e)}*/}
                                                    {/*                            disabled={reservationProposals[0].reservation_proposal_user_type_id === userType}*/}
                                                    {/*                        >*/}
                                                    {/*                            /!*{item.reservation_proposal_datetime_datetime}*!/*/}
                                                    {/*                            /!*{format(new Date(item.reservation_proposal_datetime_datetime), "eeee, d/MM", {locale: it,})} {format(new Date(item.reservation_proposal_datetime_datetime), "HH:mm")}*!/*/}
                                                    {/*                            {format(new Date(item.reservation_datetime_datetime), "eeee, d MMMM", {locale: it,})} alle {format(new Date(item.reservation_datetime_datetime), "HH:mm")}*/}
                                                    {/*                            /!*{`${item.reservation_proposal_datetime_datetime.toLocaleDateString("it-IT", {*!/*/}
                                                    {/*                            /!*    weekday: "long",*!/*/}
                                                    {/*                            /!*}).charAt(0).toUpperCase() +*!/*/}
                                                    {/*                            /!*item.date*!/*/}
                                                    {/*                            /!*    .toLocaleDateString("it-IT", {weekday: "long"})*!/*/}
                                                    {/*                            /!*    .slice(1)} ${item.date.getDate()} ${*!/*/}
                                                    {/*                            /!*    item.date*!/*/}
                                                    {/*                            /!*        .toLocaleDateString("it-IT", {month: "long"})*!/*/}
                                                    {/*                            /!*        .charAt(0)*!/*/}
                                                    {/*                            /!*        .toUpperCase() +*!/*/}
                                                    {/*                            /!*    item.date*!/*/}
                                                    {/*                            /!*        .toLocaleDateString("it-IT", {month: "long"})*!/*/}
                                                    {/*                            /!*        .slice(1)*!/*/}
                                                    {/*                            /!*} alle ${item.time}`}*!/*/}
                                                    {/*                        </Button>*/}
                                                    {/*                    ))}*/}
                                                    {/*            </div>*/}
                                                    {/*        </>*/}
                                                    {/*    )}*/}
                                                    {/*</div>*/}
                                                    <div
                                                        className="flex flex-col max-h-[300px] overflow-y-auto overflow-x-hidden s:w-[260px]">
                                                        {reservationProposals.map((item, index) => (
                                                            <Button
                                                                ref={(el) => (buttonRefs.current[index] = el)}
                                                                key={index}
                                                                className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white ${reservationProposals[0].reservation_proposal_user_type_id !== userType && !isAllPastProposalDatetime ? "hover:bg-[#66BB6A] hover:text-white" : ''} w-[240px] h-[40px] mb-[10px] ${
                                                                    selectedProposal === item.reservation_datetime_datetime && !isAllPastProposalDatetime
                                                                        ? `bg-[#${activeColor}] text-white`
                                                                        : "bg-gray-200 text-black"
                                                                }`}
                                                                onClick={(e) => handleSelectProposal(item.reservation_datetime_datetime, e)}
                                                                disabled={reservationProposals[0].reservation_proposal_user_type_id === userType || isAllPastProposalDatetime}
                                                                // disabled={reservationData.reservation_proposal_user_type_id !== userType}
                                                            >
                                                                {format(new Date(item.reservation_datetime_datetime), "eeee, d MMMM", {locale: it})} alle{" "}
                                                                {format(new Date(item.reservation_datetime_datetime), "HH:mm")}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        }
                                        {
                                            /*isConfirmedChangeDateSlots &&*/ /*selectedDateTimes*/selectedSendDateTimes.length > 0 && (
                                            <div
                                                className={`md:fixed s:mt-[20px] md:mt-[20px] s:mb-[15vh] md:mb-[0vh] md:ml-[35vw] lg:ml-[29vw] xl:ml-[25vw]`}>
                                                <label
                                                    className="s:text-[14px] md:text-[16px] font-sans font-medium text-gray-400">
                                                    Date alternative:
                                                </label>
                                                <div className="h-[10px]"></div>
                                                <div className="flex s:flex-col md:flex-row">
                                                    {(
                                                        // <>
                                                        //     {/* Colonna Sinistra */}
                                                        //     <div
                                                        //         className={`flex flex-col max-h-[300px] ${
                                                        //             /*selectedDateTimes*/selectedSendDateTimes.length > 1 ? "overflow-y-auto" : ""
                                                        //         } justify-start`}
                                                        //     >
                                                        //         {/*selectedDateTimes*/selectedSendDateTimes
                                                        //             .filter((_, index) => index % 2 === 0)
                                                        //             .map((item, index) => (
                                                        //                 <Button
                                                        //                     key={index}
                                                        //                     className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[0px] mb-[10px]`}
                                                        //                 >
                                                        //                     {`${item.date.toLocaleDateString("it-IT", {
                                                        //                         weekday: "long",
                                                        //                     }).charAt(0).toUpperCase() +
                                                        //                     item.date
                                                        //                         .toLocaleDateString("it-IT", {weekday: "long"})
                                                        //                         .slice(1)} ${item.date.getDate()} ${
                                                        //                         item.date
                                                        //                             .toLocaleDateString("it-IT", {month: "long"})
                                                        //                             .charAt(0)
                                                        //                             .toUpperCase() +
                                                        //                         item.date
                                                        //                             .toLocaleDateString("it-IT", {month: "long"})
                                                        //                             .slice(1)
                                                        //                     } alle ${item.time}`}
                                                        //                 </Button>
                                                        //             ))}
                                                        //     </div>
                                                        //
                                                        //     {/* Colonna Destra */}
                                                        //     <div
                                                        //         className={`flex flex-col max-h-[300px] ${
                                                        //             /*selectedDateTimes*/selectedSendDateTimes.length > 1 ? "overflow-y-auto" : ""
                                                        //         } justify-start`}
                                                        //     >
                                                        //         {/*selectedDateTimes*/selectedSendDateTimes
                                                        //             .filter((_, index) => index % 2 !== 0)
                                                        //             .map((item, index) => (
                                                        //                 <Button
                                                        //                     key={index}
                                                        //                     className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] md:ml-[10px] mb-[10px]`}
                                                        //                 >
                                                        //                     {`${item.date.toLocaleDateString("it-IT", {
                                                        //                         weekday: "long",
                                                        //                     }).charAt(0).toUpperCase() +
                                                        //                     item.date
                                                        //                         .toLocaleDateString("it-IT", {weekday: "long"})
                                                        //                         .slice(1)} ${item.date.getDate()} ${
                                                        //                         item.date
                                                        //                             .toLocaleDateString("it-IT", {month: "long"})
                                                        //                             .charAt(0)
                                                        //                             .toUpperCase() +
                                                        //                         item.date
                                                        //                             .toLocaleDateString("it-IT", {month: "long"})
                                                        //                             .slice(1)
                                                        //                     } alle ${item.time}`}
                                                        //                 </Button>
                                                        //             ))}
                                                        //     </div>
                                                        // </>
                                                        <div
                                                            className="flex flex-col max-h-[300px] overflow-y-auto pr-[20px] w-[260px]">
                                                            {selectedSendDateTimes.map((item, index) => (
                                                                <Button
                                                                    key={index}
                                                                    className={`font-semibold rounded-md text-left bg-[#66BB6A] text-white hover:bg-[#66BB6A] hover:text-white w-[240px] h-[40px] mb-[10px] cursor-default`}
                                                                >
                                                                    {`${item.date.toLocaleDateString("it-IT", {
                                                                        weekday: "long",
                                                                    }).charAt(0).toUpperCase() +
                                                                    item.date
                                                                        .toLocaleDateString("it-IT", {weekday: "long"})
                                                                        .slice(1)} ${item.date.getDate()} ${
                                                                        item.date
                                                                            .toLocaleDateString("it-IT", {month: "long"})
                                                                            .charAt(0)
                                                                            .toUpperCase() +
                                                                        item.date
                                                                            .toLocaleDateString("it-IT", {month: "long"})
                                                                            .slice(1)
                                                                    } alle ${item.time}`}
                                                                </Button>
                                                            ))}
                                                        </div>

                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`s:h-[100vh] md:h-[0px]`}></div>

                            </div>

                            {/*{new Date(reservationData.reservation_datetime_datetime) > new Date(Date.now()) || userType === 2 && (<div*/}
                            {/*{new Date(reservationData.reservation_datetime_datetime) > new Date(Date.now()) || (!reservationData.reservation_datetime_datetime && isAllPastProposalDatetime) && (<div*/}
                            {/*{isAllPastProposalDatetime === false && (<div*/}
                            {(isFutureReservationDatetime || (reservationProposals.length > 0 && isAllPastProposalDatetime === false)) && (<div
                                className="absolute s:left-[-10vw] md:left-[25vw] s:bottom-[80px] sm:bottom-[20px] md:bottom-[20px] space-x-4">
                                <AlertDialog className={``}>
                                    <AlertDialogTrigger asChild>
                                        <div className={``}>
                                            <Button
                                                className="s:hidden md:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#757575] text-[#ffffff] h-[35px] w-[140px]"
                                                type="button"
                                                // onClick={handleProceedClick}
                                            >
                                                Cancella
                                            </Button>
                                            <Button
                                                className={`md:hidden s:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#757575] text-[#ffffff] h-[60px] w-[60px] ml-[25vw]`}
                                                type="button"
                                            >
                                                <MdDeleteOutline size={24} className="text-[#ffffff]"/>
                                            </Button>
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent
                                        className={`flex flex-col justify-center md:w-[62vw] items-center s:overflow-y-auto md:overflow-y-hidden overflow-x-hidden`}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle
                                                className={`mb-[20px]`}>{`Procediamo con l'annullamento?`}</AlertDialogTitle>
                                            <AlertDialogDescription className={`w-[80vw] leading-[25px] text-center`}>
                                                Questa azione eliminerà definitivamente la tua prenotazione.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="h-[10px]"></div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel
                                                className={`s:w-[120px] md:w-[150px]`}>Annulla</AlertDialogCancel>
                                            <div className="w-[20px]"></div>
                                            <AlertDialogAction
                                                className={`bg-[#D32F2F] s:w-[120px] md:w-[150px]`}
                                                onClick={handleDeleteReservationClick}>Conferma</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {/* Dialog che si apre solo se `open` è true */}
                                {/*<Dialog open={open} onOpenChange={setOpen} onClose={handleClose}>*/}
                                <Dialog open={open} onOpenChange={handleDialogcHANGE} onClose={handleClose}>
                                    {/*<Dialog open={open} onOpenChange={setOpen}>*/}
                                    <DialogContent className="sm:max-w-[425px]">
                                        {/*<DialogHeader>*/}
                                        <DialogTitle className=""></DialogTitle>
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
                                        {/*<p className="font-sans font-semibold mt-[40px]">Complimenti, la tua prenotazione è stata inoltrata!</p>*/}
                                        <p className="font-sans font-semibold mt-[0px] text-center">{`La tua prenotazione è stata annullata`}</p>
                                        <img
                                            // src="https://static.vecteezy.com/system/resources/previews/012/627/756/large_2x/3d-smartphone-mockup-with-empty-white-screen-phone-front-view-template-communication-template-high-quality-isolated-render-png.png"
                                            src="https://static.vecteezy.com/system/resources/previews/041/644/172/non_2x/minimal-cancel-close-delete-icon-3d-render-isolated-illustration-png.png"
                                            // src="https://static.vecteezy.com/system/resources/previews/041/493/315/large_2x/3d-checklist-sign-icon-checkmark-agreement-approved-free-png.png"
                                            // // alt="Immagine del ristorante"
                                            className="object-cover h-full w-full"
                                        />

                                    </DialogContent>
                                </Dialog>

                            </div>)}
                            {(<Dialog open={isFirstTime} onOpenChange={setIsFirstTime} onClose={() => {
                            }}>
                                <DialogContent className="sm:max-w-[425px]">
                                    {/*<DialogHeader>*/}
                                    <DialogTitle className=""></DialogTitle>
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
                                    {/*<p className="font-sans font-semibold mt-[40px]">Complimenti, la tua prenotazione è stata inoltrata!</p>*/}
                                    <p className="font-sans font-semibold mt-[0px] text-center">Fantastico!</p>
                                    <p className="font-sans font-semibold mt-[0px] text-center underline">La tua
                                        prenotazione è stata inoltrata al ristorante. Appena verrà convalidata
                                        riceverai
                                        un SMS di conferma.</p>
                                    {/*<p className="font-sans font-semibold mt-[0px]">Successivamente, potrai modificare e verificare che il ristorante abbia convalidato la tua prenotazione</p>*/}
                                    <img
                                        src="https://static.vecteezy.com/system/resources/previews/026/775/597/large_2x/3d-writing-business-email-icon-for-ui-ux-web-mobile-apps-social-media-ads-design-png.png"
                                        // src="https://static.vecteezy.com/system/resources/previews/041/493/315/large_2x/3d-checklist-sign-icon-checkmark-agreement-approved-free-png.png"
                                        // // alt="Immagine del ristorante"
                                        className="object-cover h-full w-full"
                                    />

                                </DialogContent>
                            </Dialog>)}

                            {/*{((new Date(reservationData.reservation_datetime_datetime) > new Date(Date.now())) || (reservationProposals.length > 0 && isAllPastProposalDatetime === false)) && (*/}
                            {(isFutureReservationDatetime || (reservationProposals.length > 0 && isAllPastProposalDatetime === false)) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <div
                                            className="absolute md:right-[25vw] lg:right-[20vw] xl:right-[15vw] s:right-[30vw] s:bottom-[80px] sm:bottom-[20px] md:bottom-[20px] space-x-4 ">
                                            <Button
                                                className="s:hidden md:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#757575] text-[#ffffff] h-[35px] w-[140px]"
                                                type="button"
                                                // onClick={handleProceedClick}
                                                // onClick={() => {console.log('cristoneeeeeeeeeeeeeeeeeee')}}
                                                // disabled={isFutureReservationDatetime === false || isAllPastProposalDatetime === true}
                                                // disabled={isAllPastProposalDatetime === true}
                                            >
                                                Modifica
                                            </Button>
                                            <Button
                                                className={`md:hidden s:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#757575] text-[#ffffff] h-[60px] w-[60px]`}
                                                type="button"
                                            >
                                                <MdEditCalendar size={24} className="text-[#ffffff]"/>
                                            </Button>
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent
                                        className="flex flex-col justify-center s:w-[90vw] sm:w-[72vw] md:w-[92vw] lg:w-[92vw] xl:w-[62vw] items-center s:overflow-y-auto md:overflow-y-hidden overflow-x-hidden">
                                        <AlertDialogHeader className={`overflow-hidden`}>
                                            <AlertDialogTitle
                                                className={`s:w-[80vw] sm:w-[62vw] md:w-[82vw] lg:w-[72vw] xl:w-[52vw] s:min-h-[60px] s:overflow-y-hidden md:text-center s:mb-[20px] lg:mb-[40px]`}>{`Seleziona le date disponibili per la nuova prenotazione`}</AlertDialogTitle>
                                            <AlertDialogDescription
                                                className={`overflow-y-auto scrollbar-hide lg:overflow-y-hidden relative`}>
                                                <div
                                                    className="flex justify-center items-center s:mt-[10px] lg:mt-[0px]">
                                                    <div
                                                        className="flex lg:overflow-y-hidden overflow-x-hidden overflow-y-auto s:flex-col lg:flex-row">
                                                        <div className="flex justify-center items-center ">
                                                            <div
                                                                className="lg:hidden s:block accordion rounded-md w-[250px] ml-[5px]">
                                                                <Button
                                                                    onClick={toggleAccordion}
                                                                    className="accordion-header flex justify-between items-center p-4 w-[250px] text-left bg-[#388E3C] hover:bg-[#388E3C] focus:bg-[#388E3C] focus:outline-none"
                                                                >
                                                                    <span
                                                                        className="flex font-sans font-medium text-[#ffffff]"><MdEvent
                                                                        className={`mt-[1px] mr-[8px] text-[#ffffff] text-[18px]`}/>{date ? (
                                                                        `${date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +
                                                                        date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} ${date.getDate()} ${date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() +
                                                                        date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)}`
                                                                    ) : (
                                                                        // 'Data non disponibile'
                                                                        <span className={`flex`}>{`Giorno`}</span>
                                                                    )}</span>
                                                                    {/*<span*/}
                                                                    {/*    className="font-medium text-[#ffffff]">Giorno</span>*/}
                                                                    <span
                                                                        className={`transform transition-transform ${isAccordion1Open ? 'rotate-90 mb-[-5px]' : '-rotate-90  mb-[5px]'}`}><MdArrowBackIos/></span>
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
                                                                        // selected={editDate}
                                                                        // defaultMonth={editDate}
                                                                        // locale={it}
                                                                        // onSelect={handleEditDateSelect}

                                                                        // fromDate={new Date()}
                                                                        fromDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                                                                        toDate={new Date().setMonth(new Date().getMonth() + 1)}
                                                                        className="m-[0px] transform s:scale-[1] lg:scale-[1.1] rounded-md"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <Calendar
                                                                style={{
                                                                    width: '250px',
                                                                    // height: '300px',
                                                                }}
                                                                mode="single"
                                                                selected={editDate}
                                                                defaultMonth={editDate}
                                                                locale={it}
                                                                onSelect={handleEditDateSelect}
                                                                // fromDate={new Date()}
                                                                fromDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                                                                toDate={new Date().setMonth(new Date().getMonth() + 1)}
                                                                className="s:hidden lg:block lg:ml-[20px] transform scale-[1] rounded-md s:min-h-[320px] "
                                                            />
                                                        </div>

                                                        <div
                                                            className="flex justify-center items-center lg:block s:hidden">
                                                            {/*<div className="flex justify-center align-middle mb-[30px] ml-[5px]">*/}

                                                            {/*<Button*/}
                                                            {/*    className={`font-semibold rounded-md text-left bg-[#1E88E5] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px]`}>*/}
                                                            {/*    {date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} {date.getDate()} {date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} alle {selectedTime}*/}
                                                            {/*</Button>*/}


                                                            {/*    <Button*/}
                                                            {/*        className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px]`}*/}
                                                            {/*    >*/}
                                                            {/*        {date ? (*/}
                                                            {/*            `${date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +*/}
                                                            {/*            date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)}  ${date.getDate()} ${date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() + date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} ${selectedTime ? `alle ${selectedTime}` : ''}` // Mostra "alle" solo se selectedTime è definito*/}
                                                            {/*        ) : (*/}
                                                            {/*            'Data non disponibile'*/}
                                                            {/*        )}*/}
                                                            {/*    </Button>*/}
                                                            {/*</div>*/}

                                                            <div
                                                                style={{
                                                                    overflowY: 'auto',
                                                                    // overflowX: 'auto',
                                                                    // minHeight: '320px',
                                                                    padding: '16px',
                                                                    WebkitOverflowScrolling: 'touch',
                                                                    scrollBehavior: 'smooth',
                                                                }}
                                                                className="w-[280px] s:h-[20vh] lg:h-[230px] s:mt-[40px] lg:mt-[50px] overflow-y-auto p-4 rounded-md">

                                                                {noTimesAvailable ? (
                                                                    <p className=" mt-[50px] text-[#616161] text-center font-semibold font-sans text-[30px]">Chiuso</p>
                                                                ) : (
                                                                    <div
                                                                        className="s:grid s:grid-cols-3 s:gap-2 w-full">
                                                                        {editTimes.map((time) => {
                                                                            const isSelected = selectedDateTimes.some(
                                                                                (item) => item.date.toDateString() === editDate?.toDateString() && item.time === time
                                                                            );

                                                                            return (
                                                                                <Button
                                                                                    key={time}
                                                                                    onClick={() => handleEditTimeSelect(time)}
                                                                                    className={`text-[#424242] font-semibold py-2 px-4 rounded-md mb-2 w-full text-left ${
                                                                                        isSelected ? 'bg-[#212121] text-white' : 'bg-white hover:bg-[#9E9E9E] hover:text-[#FFFFFF]'
                                                                                    }`}
                                                                                >
                                                                                    {time}
                                                                                </Button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="flex justify-center items-center s:relative lg:hidden">
                                                            <div
                                                                className="lg:hidden s:block accordion rounded-md w-[250px] ml-[5px]">
                                                                <Button
                                                                    onClick={toggleAccordion2}
                                                                    className={`accordion-header flex justify-between items-center p-4 w-[250px] text-left bg-[#388E3C] hover:bg-[#388E3C] focus:bg-[#388E3C] focus:outline-none`}
                                                                >
                                                                    {/*<span*/}
                                                                    {/*    className="font-medium text-[#ffffff]">Ora</span>*/}
                                                                    <span
                                                                        className="flex font-sans font-medium text-[#ffffff]"><MdAccessTime
                                                                        className={`mt-[1px] mr-[8px] text-[#ffffff] text-[18px]`}/>Ora</span>
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
                                                                            // overflowX: 'auto',
                                                                            // minHeight: '320px',
                                                                            padding: '16px',
                                                                            WebkitOverflowScrolling: 'touch',
                                                                            scrollBehavior: 'smooth',
                                                                        }}
                                                                        className="w-[280px] s:h-[20vh] lg:h-[230px] s:mt-[20px] lg:mt-[50px] s:ml-[-15px] overflow-y-auto p-4 rounded-md">

                                                                        {noTimesAvailable ? (
                                                                            <p className=" mt-[50px] text-[#616161] text-center font-semibold font-sans text-[30px]">Chiuso</p>
                                                                        ) : (
                                                                            <div
                                                                                className="s:grid s:grid-cols-3 s:gap-2 w-full">
                                                                                {editTimes.map((time) => {
                                                                                    const isSelected = selectedDateTimes.some(
                                                                                        (item) => item.date.toDateString() === editDate?.toDateString() && item.time === time
                                                                                    );

                                                                                    return (
                                                                                        <Button
                                                                                            key={time}
                                                                                            onClick={() => handleEditTimeSelect(time)}
                                                                                            className={`text-[#424242] font-semibold py-2 px-4 rounded-md mb-2 w-full text-left ${
                                                                                                isSelected ? 'bg-[#212121] text-white' : 'bg-white hover:bg-[#9E9E9E] hover:text-[#FFFFFF]'
                                                                                            }`}
                                                                                        >
                                                                                            {time}
                                                                                        </Button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                        {/*<Button*/}
                                                        {/*    className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[30px] `}*/}
                                                        {/*>*/}
                                                        {/*    {editDate ? (*/}
                                                        {/*        `${editDate.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +*/}
                                                        {/*        editDate.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)}  ${editDate.getDate()} ${editDate.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() + editDate.toLocaleDateString('it-IT', {month: 'long'}).slice(1)} ${selectedEditTime ? `alle ${selectedEditTime}` : ''}` // Mostra "alle" solo se selectedTime è definito*/}
                                                        {/*    ) : (*/}
                                                        {/*        'Data non disponibile'*/}
                                                        {/*    )}*/}
                                                        {/*</Button>*/}

                                                        {/*{selectedEditTimes.length > 0 ? (*/}
                                                        {/*    selectedEditTimes.map((time, index) => (*/}
                                                        {/*        <Button*/}
                                                        {/*            className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[30px] `}*/}
                                                        {/*        >*/}
                                                        {/*            {editDate ? (*/}
                                                        {/*                `${editDate.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +*/}
                                                        {/*                editDate.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} ${editDate.getDate()} ${*/}
                                                        {/*                    editDate.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() +*/}
                                                        {/*                    editDate.toLocaleDateString('it-IT', {month: 'long'}).slice(1)*/}
                                                        {/*                } alle ${time}` // Usa `time` direttamente*/}
                                                        {/*            ) : (*/}
                                                        {/*                'Data non disponibile'*/}
                                                        {/*            )}*/}
                                                        {/*        </Button>*/}
                                                        {/*    ))*/}
                                                        {/*) : (*/}
                                                        {/*    <p className="text-sm text-gray-500">Nessun orario*/}
                                                        {/*        selezionato</p>*/}
                                                        {/*)}*/}

                                                        {/*<div className={`flex flex-col`}>*/}
                                                        {/*    {selectedDateTimes.length > 0 ? (*/}
                                                        {/*        selectedDateTimes.map((item, index) => (*/}
                                                        {/*            <Button*/}
                                                        {/*                key={index}*/}
                                                        {/*                className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[30px] mb-[10px]`}*/}
                                                        {/*            >*/}
                                                        {/*                {`${item.date.toLocaleDateString('it-IT', {weekday: 'long'}).charAt(0).toUpperCase() +*/}
                                                        {/*                item.date.toLocaleDateString('it-IT', {weekday: 'long'}).slice(1)} ${item.date.getDate()} ${*/}
                                                        {/*                    item.date.toLocaleDateString('it-IT', {month: 'long'}).charAt(0).toUpperCase() +*/}
                                                        {/*                    item.date.toLocaleDateString('it-IT', {month: 'long'}).slice(1)*/}
                                                        {/*                } alle ${item.time}`}*/}
                                                        {/*            </Button>*/}
                                                        {/*        ))*/}
                                                        {/*    ) : (*/}
                                                        {/*        <p className="text-sm text-gray-500">Nessun orario*/}
                                                        {/*            selezionato</p>*/}
                                                        {/*    )}*/}
                                                        {/*</div>*/}

                                                        <div className="flex">
                                                            {selectedDateTimes.length === 0 ? (
                                                                <p className="flex justify-center items-center lg:ml-[40px] s:mt-[0px] md:mt-[0px] text-center text-gray-500 font-semibold w-[300px]">

                                                                </p>
                                                            ) : (
                                                                // <>
                                                                //     {/* Colonna Sinistra */}
                                                                //     <div
                                                                //         className={`flex flex-col max-h-[300px] ${
                                                                //             selectedDateTimes.length > 1 ? "overflow-y-auto" : ""
                                                                //         } justify-start`}
                                                                //     >
                                                                //         {selectedDateTimes
                                                                //             .filter((_, index) => index % 2 === 0)
                                                                //             .map((item, index) => (
                                                                //                 <Button
                                                                //                     key={index}
                                                                //                     className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[30px] mb-[10px]`}
                                                                //                 >
                                                                //                     {`${item.date.toLocaleDateString("it-IT", {
                                                                //                         weekday: "long",
                                                                //                     }).charAt(0).toUpperCase() +
                                                                //                     item.date
                                                                //                         .toLocaleDateString("it-IT", {weekday: "long"})
                                                                //                         .slice(1)} ${item.date.getDate()} ${
                                                                //                         item.date
                                                                //                             .toLocaleDateString("it-IT", {month: "long"})
                                                                //                             .charAt(0)
                                                                //                             .toUpperCase() +
                                                                //                         item.date
                                                                //                             .toLocaleDateString("it-IT", {month: "long"})
                                                                //                             .slice(1)
                                                                //                     } alle ${item.time}`}
                                                                //                 </Button>
                                                                //             ))}
                                                                //     </div>
                                                                //
                                                                //     {/* Colonna Destra */}
                                                                //     <div
                                                                //         className={`flex flex-col max-h-[300px] ${
                                                                //             selectedDateTimes.length > 1 ? "overflow-y-auto" : ""
                                                                //         } justify-start`}
                                                                //     >
                                                                //         {selectedDateTimes
                                                                //             .filter((_, index) => index % 2 !== 0)
                                                                //             .map((item, index) => (
                                                                //                 <Button
                                                                //                     key={index}
                                                                //                     className={`font-semibold rounded-md text-left bg-[#${activeColor}] text-white hover:bg-[#1E88E5] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[10px] mb-[10px]`}
                                                                //                 >
                                                                //                     {`${item.date.toLocaleDateString("it-IT", {
                                                                //                         weekday: "long",
                                                                //                     }).charAt(0).toUpperCase() +
                                                                //                     item.date
                                                                //                         .toLocaleDateString("it-IT", {weekday: "long"})
                                                                //                         .slice(1)} ${item.date.getDate()} ${
                                                                //                         item.date
                                                                //                             .toLocaleDateString("it-IT", {month: "long"})
                                                                //                             .charAt(0)
                                                                //                             .toUpperCase() +
                                                                //                         item.date
                                                                //                             .toLocaleDateString("it-IT", {month: "long"})
                                                                //                             .slice(1)
                                                                //                     } alle ${item.time}`}
                                                                //                 </Button>
                                                                //             ))}
                                                                //     </div>
                                                                // </>
                                                                <div
                                                                    className={`flex flex-col s:mt-[20px] lg:mt-[0px] lg:max-h-[300px] lg:overflow-y-auto s:overflow-y-hidden justify-start pr-[20px]`}
                                                                >
                                                                    {selectedDateTimes.map((item, index) => (
                                                                        <Button
                                                                            key={index}
                                                                            className={`font-semibold rounded-md text-left bg-[#66BB6A] text-white hover:bg-[#66BB6A] cursor-not-allowed pointer-events-none w-[240px] h-[40px] ml-[30px] mb-[10px]`}
                                                                        >
                                                                            {`${item.date.toLocaleDateString("it-IT", {
                                                                                weekday: "long",
                                                                            }).charAt(0).toUpperCase() +
                                                                            item.date
                                                                                .toLocaleDateString("it-IT", {weekday: "long"})
                                                                                .slice(1)} ${item.date.getDate()} ${
                                                                                item.date
                                                                                    .toLocaleDateString("it-IT", {month: "long"})
                                                                                    .charAt(0)
                                                                                    .toUpperCase() +
                                                                                item.date
                                                                                    .toLocaleDateString("it-IT", {month: "long"})
                                                                                    .slice(1)
                                                                            } alle ${item.time}`}
                                                                        </Button>
                                                                    ))}
                                                                </div>

                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="s:h-[10px] md:h-[10px]"></div>
                                        {/*<AlertDialogFooter className={`flex s:flex-row md:flex-col`}>*/}
                                        <AlertDialogFooter
                                            className={`flex flex-row justify-center items-center w-full`}>
                                            <AlertDialogCancel
                                                className={`w-[150px] mt-0`}
                                                onClick={handleAnnullaSlots}>Annulla</AlertDialogCancel>
                                            <div className="w-[20px]"></div>
                                            <AlertDialogAction
                                                className={`bg-[#43A047] w-[150px] mt-0`}
                                                onClick={handleConfirmSetSlots}>Conferma</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {/*conferma proposta in ricezione*/}
                            {/*{reservationProposals.length > 0 && selectedDateTimes.length === 0 &&*/}
                            {/*    reservationData.reservation_proposal_user_type_id !== userType &&*/}
                            {/*    (<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                            {/*        <Button*/}
                            {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"*/}
                            {/*            onClick={() => handleReservationProposalConfirm()}*/}
                            {/*            type="submit"*/}
                            {/*            disabled={selectedProposal === null && reservationProposals.length > 0}*/}
                            {/*        >*/}
                            {/*            {'Conferma1'}*/}
                            {/*        </Button>*/}
                            {/*    </div>)*/}
                            {/*}*/}

                            {/*{reservationProposals.length > 0 && selectedDateTimes.length === 0 &&*/}
                            {/*reservationData.reservation_proposal_user_type_id !== userType && reservationData.reservation_proposal_id  && (isFutureReservationDatetime || !reservationData.reservation_datetime_datetime) && (<div>*/}
                            {reservationData.reservation_proposal_user_type_id !== userType && reservationProposals.length > 0 && isAllPastProposalDatetime === false && selectedDateTimes.length === 0 && (<div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <div
                                                className="absolute s:right-[40px] sm:bottom-[20px] s:bottom-[80px] md:bottom-[20px] space-x-4">

                                                <Button
                                                    className="s:hidden md:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-[#ffffff] h-[35px] w-[140px]"
                                                    // type="button"
                                                    type="submit"
                                                    // onClick={handleProceedClick}
                                                    disabled={selectedProposal === null && reservationProposals.length > 0}
                                                >
                                                    {/*{'Conferma1'}*/}
                                                    {'Conferma'}
                                                </Button>
                                                <Button
                                                    className={`md:hidden s:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#2E7D32] text-[#ffffff] h-[60px] w-[60px] flex items-center justify-center`}
                                                    // type="button"
                                                    type="submit"
                                                    disabled={selectedProposal === null && reservationProposals.length > 0}
                                                >
                                                    <MdOutlineUpload size={24} className="text-[#ffffff]"/>
                                                </Button>
                                            </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent
                                            className={`flex flex-col justify-center md:w-[62vw] lg:w-[35vw] items-center s:overflow-y-auto md:overflow-y-hidden overflow-x-hidden`}>
                                            <AlertDialogHeader className={`flex items-center justify-center`}>
                                                <AlertDialogTitle
                                                    className={`text-center mb-[20px]`}>{`Conferma prenotazione`}</AlertDialogTitle>
                                                <AlertDialogDescription
                                                    className={`flex w-[80vw] leading-[25px] items-center justify-center text-center`}>
                                                    {`Sei sicuro di voler confermare l'orario selezionato?`}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="h-[10px]"></div>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel
                                                    className={`s:w-[120px] md:w-[150px]`}>Annulla</AlertDialogCancel>
                                                <div className="w-[20px]"></div>
                                                <AlertDialogAction
                                                    className={`bg-[#43A047] s:w-[120px] md:w-[150px]`}
                                                    onClick={() => handleReservationProposalConfirm()}
                                                >
                                                    Conferma
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>)}

                            {/*conferma invio proposte*/}
                            {/*{selectedSendDateTimes.length > 0 &&*/}
                            {/*    (<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                            {/*        <Button*/}
                            {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"*/}
                            {/*            onClick={() => sendReservationProposal()}*/}
                            {/*            type="submit"*/}
                            {/*            // disabled={selectedProposal === null && reservationProposals.length > 0}*/}
                            {/*        >*/}
                            {/*            {'Conferma2'}*/}
                            {/*        </Button>*/}
                            {/*    </div>)*/}
                            {/*}*/}
                            {selectedSendDateTimes.length > 0 && (<div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <div
                                            className="absolute right-[30px] sm:bottom-[20px] s:bottom-[80px] md:bottom-[20px] space-x-4">
                                            <Button
                                                className="s:hidden md:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"
                                                // onClick={() => sendReservationProposal()}
                                                type="submit"
                                                // disabled={selectedProposal === null && reservationProposals.length > 0}
                                            >
                                                {'Invia'}
                                            </Button>
                                            <Button
                                                className={`md:hidden s:block shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-[#ffffff] h-[60px] w-[60px] flex items-center justify-center`}
                                                // type="button"
                                                type="submit"
                                            >
                                                <MdOutlineUpload size={24} className="text-[#ffffff]"/>
                                            </Button>
                                        </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader className={`flex items-center justify-center`}>
                                            <AlertDialogTitle
                                                className={`text-center mb-[20px]`}>{`Cambio Prenotazione`}</AlertDialogTitle>
                                            <AlertDialogDescription
                                                className={`s:w-[80vw] md:w-[40vw] leading-[25px] text-center`}>
                                                Sei sicuro di voler inviare il cambio di prenotazione?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="h-[10px]"></div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className={`s:w-[120px] md:w-[150px]`}>Annulla</AlertDialogCancel>
                                            <div className="w-[20px]"></div>
                                            <AlertDialogAction
                                                className={`bg-[#43A047] s:w-[120px] md:w-[150px]`}
                                                onClick={() => sendReservationProposal()}
                                            >
                                                Conferma
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>)}

                            {/*/!*conferma data*!/*/}
                            {/*{(reservationProposals.length === 0 && selectedDateTimes.length === 0) && !isReservationConfirm &&*/}
                            {/*    (<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                            {/*        <Button*/}
                            {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"*/}
                            {/*            // onClick={() => handleReservationConfirm()}*/}
                            {/*            onClick={() => handleReservationProposalConfirm()}*/}
                            {/*            type="submit"*/}
                            {/*            // disabled={(selectedProposal === null && reservationProposals.length > 0) || (state.userType === 2 && !isReservationValid)}*/}
                            {/*            disabled={!isReservationConfirm && state.userType === 2}*/}
                            {/*        >*/}
                            {/*            {state.userType === 2 && !isReservationConfirm ? 'In attesa' : 'Conferma3' + state.userType}*/}
                            {/*        </Button>*/}
                            {/*    </div>)*/}
                            {/*}*/}

                            {/*{(reservationProposals.length === 0 && selectedDateTimes.length === 0) && !isReservationValid && state.userType === 2 &&*/}
                            {/*    (<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                            {/*        <Button*/}
                            {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"*/}
                            {/*            // onClick={() => handleReservationValidation()}*/}
                            {/*            type="submit"*/}
                            {/*            disabled={!isReservationValid && state.userType === 2}*/}
                            {/*        >*/}
                            {/*            {'In attesa'}*/}
                            {/*        </Button>*/}
                            {/*    </div>)*/}
                            {/*}*/}

                            {/*{isReservationValid === false && userType === 1 && !isEdit ?*/}
                            {/*    <div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                            {/*        <Button*/}
                            {/*            className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"*/}
                            {/*            onClick={isConfirmedChangeDateSlots && selectedDateTimes.length > 0 ? () => sendReservationProposal() : () => handleReservationValidation()}*/}
                            {/*            type="submit"*/}
                            {/*            disabled={selectedProposal === null && reservationProposals.length > 0} >{isConfirmedChangeDateSlots && selectedDateTimes.length > 0 ? 'Invia' : 'Conferma'}*/}
                            {/*        </Button>*/}
                            {/*    </div> : <div></div>*/}
                            {/*}*/}

                            {/*<Link href={`/prenotazione/${params.restaurant}/email`} prefetch={true}>*/}
                            {/*<div className="absolute right-[30px] bottom-[20px] space-x-4 shadow-2xl">*/}
                            {/*    <Button*/}
                            {/*        className="shadow-md font-sans font-semibold py-2 px-4 rounded-md bg-[#43A047] text-white h-[35px] w-[140px]"*/}
                            {/*        onClick={isReservationValid === false && userType === 'reservation_business_url' ? () => handleReservationValidation() : () => handleModifica()}*/}
                            {/*        type="submit">{isReservationValid === false && userType === 'reservation_business_url' ? 'Conferma' : 'Modifica'}*/}
                            {/*    </Button>*/}
                            {/*</div>*/}
                            {/*</Link>*/}

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

    // // business
    // if(userType === 'reservation_business_url'){
    //     if(isReservationValid === true){
    //         return (<p>aa</p>);
    //     }
    //     else {
    //         return (<p>ab</p>);
    //     }
    // }
    // //customer
    // else if(userType === 'reservation_user_url'){
    //     if (!isPhoneValid) {}
    //     else {
    //         // if (isReservationValid === true) {
    //         //     return (<p>ba</p>);
    //         // }
    //         // else {
    //         //     return (<p>bb</p>);
    //         // }
    //     }
    // }
    // return <ReservationPage restaurantData={restaurantData/*restaurants*/} />;
}

