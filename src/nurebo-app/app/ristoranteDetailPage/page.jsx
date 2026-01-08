'use client';

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  BookOpenIcon,
  CameraIcon,
  ShareIcon,
  HandThumbUpIcon,
  InformationCircleIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon
} from '@heroicons/react/24/solid';
import {
  Search,
  MapPin,
  CalendarIcon,
  User,
  Utensils,
  CalendarDays,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Table,
  Chair,
  Plate,
  CalendarCheck,
  ChefHat,
  Chopsticks,
  Salad,
  Pizza,
  Smartphone,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { UnderlinedOTP } from "@/components/ui/underlined-otp"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {format, isValid} from "date-fns";
import { it } from "date-fns/locale"
import {InputOtp} from "@heroui/input-otp";
import Lightbox from "@/components/ui/lightbox";


const FXMilanoPage = () => {
  const restaurant = {
    name: 'FX Milano Ristorante italiano',
    rating: 4.5,
    reviews: 1287,
    image: 'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg?w=2500&h=1250',
    breadcrumbs: [
      {label: 'Ristoranti', href: '/'},
      {label: 'Milano', href: '/milano'},
      {label: 'Porta Venezia', href: '/milano/porta-venezia'},
    ],
    social: {
      whatsapp: '+393331234567',
      instagram: 'https://instagram.com/fxmilanoristorante',
      facebook: 'https://facebook.com/fxmilanoristorante',
      googleMaps: 'https://maps.app.goo.gl/m6Dy8jS8EvgmvMKL6',
      email: 'info@fxmilanoristorante.it',
      website: "https://www.fxmilanoristorante.it",
      glovo: "https://glovoapp.com/it/it/milano/chicken-burger-mil/",
      deliveroo: "https://deliveroo.it/it/menu/Milano/porta-ticinese-porta-vittoria/burger-king-mi-tibaldi-26630",
    },
    cuisine: ['Italiana', 'Pizza'],
    phone: '+390243416607',
    address: ['Viale Tunisia 1', 'Milano 20124'],
    location: "Milano, Lombardia",
    hours: [
      {day: 'lunedì', open: '06:30', close: '00:00'},
      {day: 'martedì', open: '06:30', close: '00:00'},
      {day: 'mercoledì', open: '06:30', close: '00:00'},
      {day: 'giovedì', open: '06:30', close: '00:00'},
      {day: 'venerdì', open: '06:30', close: '03:00'},
      {day: 'sabato', open: '08:00', close: '00:00'},
      {day: 'domenica', open: '11:00', close: '22:00'},
    ],
    menuHighlights: {
      Antipasti: [
        {
          name: 'Bruschetta al pomodoro',
          price: '€8.50',
          photo: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg' // Bruschetta croccante
        },
        {
          name: 'Carpaccio di manzo con scaglie di grana',
          price: '€12.00',
          photo: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg' // Carpaccio con scaglie
        },
        {
          name: 'Frittura mista di mare',
          price: '€15.00',
          photo: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg' // Frittura di calamari
        },
        {
          name: 'Insalata Caprese',
          price: '€10.00',
          photo: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg' // Mozzarella e pomodori
        }
      ],
      Primi: [
        {
          name: 'Risotto alla milanese con ossobuco',
          price: '€18.00',
          photo: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' // Risotto giallo cremoso
        },
        {
          name: 'Tagliatelle al tartufo nero',
          price: '€16.50',
          photo: 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg' // Tagliatelle al tartufo
        },
        {
          name: 'Gnocchi alla sorrentina',
          price: '€14.00',
          photo: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg' // Gnocchi al pomodoro
        },
        {
          name: 'Lasagna al forno',
          price: '€15.00',
          photo: 'https://images.pexels.com/photos/5949885/pexels-photo-5949885.jpeg' // Lasagna stratificata
        }
      ],
      Secondi: [
        {
          name: 'Cotoletta alla milanese',
          price: '€22.00',
          photo: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' // Cotoletta impanata
        },
        {
          name: 'Branzino al sale con verdure',
          price: '€28.00',
          photo: 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg' // Pesce intero al sale
        },
        {
          name: 'Tagliata di manzo con rucola e grana',
          price: '€25.00',
          photo: 'https://images.pexels.com/photos/18048715/pexels-photo-18048715/free-photo-of-tagliata-di-manzo-con-patate.jpeg' // Tagliata sanguigna
        },
        {
          name: 'Grigliata mista di carne',
          price: '€32.00',
          photo: 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg' // Grigliata fumante
        }
      ],
      Pizze: [
        {
          name: 'Margherita DOC',
          price: '€10.00',
          photo: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg' // Pizza margherita classica
        },
        {
          name: 'Diavola con salame piccante',
          price: '€12.00',
          photo: 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg' // Pizza con salame
        },
        {
          name: 'Quattro stagioni',
          price: '€13.50',
          photo: 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg' // Pizza divisa in quadranti
        },
        {
          name: 'Pizza ai frutti di mare',
          price: '€16.00',
          photo: 'https://images.pexels.com/photos/5905613/pexels-photo-5905613.jpeg' // Pizza con frutti di mare
        }
      ],
      Contorni: [
        {
          name: 'Patate al forno',
          price: '€5.00',
          photo: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg' // Patate croccanti
        },
        {
          name: 'Verdure grigliate',
          price: '€6.00',
          photo: 'https://images.pexels.com/photos/1438540/pexels-photo-1438540.jpeg' // Zucchine e peperoni
        },
        {
          name: 'Insalata mista',
          price: '€5.50',
          photo: 'https://images.pexels.com/photos/2862154/pexels-photo-2862154.jpeg' // Insalata colorata
        }
      ],
      Dolci: [
        {
          name: 'Tiramisù classico',
          price: '€7.00',
          photo: 'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg' // Tiramisù in bicchiere
        },
        {
          name: 'Panna cotta ai frutti di bosco',
          price: '€6.50',
          photo: 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg' // Panna cotta con frutti
        },
        {
          name: 'Sorbetto al limone',
          price: '€5.00',
          photo: 'https://images.pexels.com/photos/890515/pexels-photo-890515.jpeg' // Sorbetto in coppetta
        },
        {
          name: 'Cannolo siciliano',
          price: '€6.00',
          photo: 'https://images.pexels.com/photos/4198199/pexels-photo-4198199.jpeg' // Cannolo con ricotta
        }
      ],
      // Vini: [
      //   {
      //     name: 'Barolo DOCG (bicchiere)',
      //     price: '€9.00',
      //     photo: 'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg' // Bicchiere vino rosso
      //   },
      //   {
      //     name: 'Chianti Classico (bottiglia)',
      //     price: '€35.00',
      //     photo: 'https://images.pexels.com/photos/2897385/pexels-photo-2897385.jpeg' // Bottiglia Chianti
      //   },
      //   {
      //     name: 'Prosecco Brut (bottiglia)',
      //     price: '€25.00',
      //     photo: 'https://images.pexels.com/photos/6001373/pexels-photo-6001373.jpeg' // Prosecco in flute
      //   },
      //   {
      //     name: 'Pinot Grigio (bottiglia)',
      //     price: '€28.00',
      //     photo: 'https://images.pexels.com/photos/57008/pexels-photo-57008.jpeg' // Bottiglia su tavolo
      //   }
      // ],
      Bibite: [
        {
          name: 'Acqua naturale/frizzante',
          price: '€3.00',
          photo: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg' // Bottiglia acqua
        },
        {
          name: 'Coca-Cola',
          price: '€4.00',
          photo: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg' // Lattina Coca
        },
        {
          name: 'Succo di frutta fresco',
          price: '€5.00',
          photo: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg' // Succo in bicchiere
        },
        {
          name: 'Birra artigianale',
          price: '€6.00',
          photo: 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg' // Bicchiere birra
        }
      ],
      // Caffetteria: [
      //   {
      //     name: 'Espresso',
      //     price: '€1.50',
      //     photo: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg' // Tazzina caffè
      //   },
      //   {
      //     name: 'Cappuccino',
      //     price: '€3.00',
      //     photo: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg' // Cappuccino schiuma
      //   },
      //   {
      //     name: 'Tè caldo/freddo',
      //     price: '€4.00',
      //     photo: 'https://images.pexels.com/photos/2290078/pexels-photo-2290078.jpeg' // Teiera e tazza
      //   }
      // ]
    },
    photos: [
      'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?w=1260&h=750',
      'https://images.pexels.com/photos/541216/pexels-photo-541216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1819669/pexels-photo-1819669.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1537635/pexels-photo-1537635.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    ],
    reviewsList: [
      {
        user: "Giulia B.",
        rating: 4,
        date: "2024-02-10",
        comment: "Atmosfera piacevole e servizio veloce. La cotoletta alla milanese era ottima, forse un po' troppo croccante per i miei gusti. Dessert eccellenti!"
      },
      {
        user: "Luca F.",
        rating: 5,
        date: "2024-03-22",
        comment: "Miglior risotto alla milanese che abbia mai mangiato! Personale gentilissimo e location curata nei dettagli. Tornerò sicuramente!"
      },
      {
        user: "Sofia R.",
        rating: 4.5,
        date: "2024-04-15",
        comment: "Esperienza molto positiva. Menù vario e materie prime di qualità. Unico appunto: lista vini un po' limitata."
      },
      {
        user: "Alessio M.",
        rating: 3.5,
        date: "2024-05-10",
        comment: "Buono ma non eccezionale per il prezzo. Le portate sono arrivate con tempistiche un po' disordinate. Pizza comunque ottima."
      },
      {
        user: "Chiara V.",
        rating: 5,
        date: "2024-06-01",
        comment: "Cena perfetta per un'occasione speciale! Servizio attento senza essere invadente. Consiglio il branzino al sale, divino!"
      }
    ],
    dishPhotos: [
      'https://images.pexels.com/photos/1251198/pexels-photo-1251198.jpeg',
      'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
      'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg'
      // Aggiungi altre foto
    ],
  };

  const tabsConfig = [
    { id: 'info', icon: <InformationCircleIcon className="h-5 w-5" />, label: 'Info' },
    // { id: 'orari', icon: <ClockIcon className="h-5 w-5" />, label: 'Orari' },
    // { id: 'social', icon: <ShareIcon className="h-5 w-5" />, label: 'Social' },
    { id: 'foto', icon: <CameraIcon className="h-5 w-5" />, label: 'Foto' },
    { id: 'menu', icon: <BookOpenIcon className="h-5 w-5" />, label: 'Menu' },
    // { id: 'recensioni', icon: <StarIcon className="h-5 w-5" />, label: 'Recensioni' },
  ];

  const [activeTab, setActiveTab] = useState('info');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [isScrolled, setIsScrolled] = useState(false);
  const [manualScroll, setManualScroll] = useState(false);
  const headerRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState("Milano");
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300) // 5 minuti in secondi
  const [isAvailable, setIsAvailable] = useState(false)
  // const [lightboxImages, setLightboxImages] = useState([]);
  // const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0
  })

  const openLightbox = (images, initialIndex = 0, showNavigation = false) => {
    setLightboxState({
      isOpen: true,
      images,
      initialIndex,
      showNavigation // Aggiunto parametro per la navigazione
    })
  }

  // useEffect(() => {
  //   if (isLightboxOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = 'unset';
  //   }
  // }, [isLightboxOpen]);

  useEffect(() => {
    if (isDialogOpen && !isOtpSent) {
      setTimeout(() => setIsAvailable(true), 3000)
    }

    if (timeLeft > 0 && isOtpSent) {
      const timer = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isDialogOpen, isOtpSent, timeLeft])

  const handleOtpRequest = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsOtpSent(true)
    setIsLoading(false)
  }

  const handleOtpVerification = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsDialogOpen(false)
    setIsLoading(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
    //
    // const sendOTP = async (data) => {
    //     // if (otpSent) return; // Evita invii multipli
    //     // setOtpSent(true);
    //     try {
    //         console.log('vfdggdbbgbgbgggfgg')
    //         console.log(data)
    //         console.log(reservationData)
    //         // // const localDateTime = new Date(dateObject.getTime() - dateObject.getTimezoneOffset() * 60000).toISOString();
    //         // const localDateTime = new Date(dateObject.getTime()).toISOString();
    //         // console.log('Local datetime:', localDateTime);
    //
    //         const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${data.reservation_id}/send_otp`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
    //
    //             },
    //             // next: {revalidate: 10},
    //             credentials: "include",
    //             body: JSON.stringify({
    //                 // ...restaurantData,
    //                 // ...reservationData,
    //                 ...data,
    //                 user_type_id: reservation === data.reservation_business_url ? 1 : reservation === data.reservation_user_url ? 2 : null,
    //                 reservation_email: data.reservation_email,
    //                 reservation_phone: data.reservation_phone,
    //             }),
    //             cache: 'no-store',
    //         });
    //
    //         const resdata = await response.json();
    //         console.log('data55522115')
    //         console.log(resdata)
    //         console.log(resdata.message)
    //
    //         if (response.ok) {
    //             console.log('Risposta dal server00000000000:', resdata);
    //             console.log('resdata.auth_id');
    //             console.log(resdata.auth_id);
    //             setAuthId(resdata.auth_id);
    //         } else if (response.status === 429) {
    //             setShowWarning1(true)
    //             setShowWarningMessage1(resdata.message)
    //         } else {
    //             console.error('Errore durante la richiesta:', response.statusText);
    //         }
    //     } catch (error) {
    //         console.error('Errore durante il fetch:', error);
    //     }
    // };
    // // sendOTP();
    // // }, []);
    //
    // const handleSubmitOTP = async () => {
    //     // const otpCode = otp.join('');
    //     console.log('Codice OTP:', otp/*Code*/);
    //     // const localDateTime = new Date(dateObject.getTime()).toISOString();
    //
    //     console.log('vbggggggggggggggggggggggg555000')
    //     console.log(state.userType)
    //     console.log(userType)
    //
    //     if (otp/*Code*/.length === 6) {
    //         // setIsOTPValid(true)
    //         try {
    //             // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${state.reservationId}/verify_otp`, {
    //             const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reservation/${reservationData.reservation_id}/verify_otp`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'Timezone-Offset': -(new Date().getTimezoneOffset()) / 60,
    //                 },
    //                 credentials: 'include',
    //                 body: JSON.stringify({
    //                     ...restaurantData,
    //                     ...reservationData,
    //                     // reservation_phone: state.reservationPhone,
    //                     // // business_phone: restaurantData.business_phone,
    //                     // reservation_name: state.reservationName,
    //                     // // business_name: restaurantData.name,
    //                     // // business_id: "osteria-serafina-milano",
    //                     // business_id: `${/*params.restaurant*/restaurantData.business_id}`,
    //                     // quantity: state.reservationQty,
    //                     // phone: state.reservationPhone,
    //                     // datetime: localDateTime,
    //                     // reservation_datetime: state.reservationDatetime,
    //                     // // business_email: restaurantData.business_email,
    //                     // reservation_email: state.reservationEmail,
    //                     // user_type_id: userType,
    //                     // user_type_id: state.userType,
    //                     user_type_id: reservation === reservationData.reservation_business_url ? 1 : reservation === reservationData.reservation_user_url ? 2 : null,
    //                     auth_id: authId,
    //                     action: 'access_auth',
    //                     otp: otp,
    //                 }),
    //                 cache: 'no-store',
    //             });
    //
    //             // const result = await response.json();
    //             const data = (await response.json());
    //
    //             console.log('Risultato777777777888:', data);
    //             console.log(response);
    //             console.log(response.status);
    //             console.log('result.success:', data.success);
    //             // console.log('result[0].success:', result[0].success);
    //             setOtp('')
    //
    //             if (data.success === 1) {
    //                 const formattedDate = formatDate(new Date(data.reservation_datetime_datetime)); // Passa l'oggetto Date alla funzione di formattazione
    //                 setDateString(formattedDate);
    //                 setReservationData({
    //                     reservation_id: data.reservation_id,
    //                     reservation_name: data.reservation_name,
    //                     reservation_datetime_datetime: data.reservation_datetime_datetime/*formattedDate*/,
    //                     reservation_datetime_created_at: data.reservation_datetime_created_at,
    //                     reservation_datetime_id: data.reservation_datetime_id,
    //                     reservation_email: data.reservation_email,
    //                     reservation_user_url: data.reservation_user_url,
    //                     reservation_business_url: data.reservation_business_url,
    //                     reservation_phone: data.reservation_phone,
    //                     reservation_quantity: data.reservation_quantity,
    //                     reservation_created_at: data.reservation_created_at,
    //                     reservation_proposal_id: data.reservation_proposal_id,
    //                     reservation_proposal_user_type_id: data.reservation_proposal_user_type_id,
    //                     reservation_proposal_is_declined: data.reservation_proposal_is_declined,
    //                     reservation_proposal_datetime_id: data.reservation_proposal_datetime_id,
    //                     reservation_proposal_created_at: data.reservation_proposal_created_at,
    //                     reservation_validation_id: data.reservation_validation_id,
    //                     reservation_validation_created_at: data.reservation_validation_created_at,
    //                     reservation_cancel_id: data.reservation_cancel_id,
    //                     reservation_cancel_user_type_id: data.reservation_cancel_user_type_id,
    //                     reservation_cancel_created_at: data.reservation_cancel_created_at,
    //                 });
    //
    //                 setIsOTPValid(true)
    //                 // await handleProceedClick();
    //                 setOpen(true)
    //                 setShowWarning(false)
    //                 setIsTokenSuccess(true)
    //                 window.location.reload();
    //             } else {
    //                 setIsOTPValid(false)
    //                 setShowWarning(true)
    //                 setIsTokenSuccess(false)
    //
    //             }
    //         } catch (error) {
    //             console.error('Errore nella richiesta:', error);
    //         }
    //     }
    //
    // };

  useEffect(() => {
    const handleScroll = () => {
      const sections = tabsConfig.map(tab => document.getElementById(tab.id));
      const scrollPosition = window.scrollY + 200; // Offset per l'header sticky

      sections.forEach(section => {
        if (section) {
          const top = section.offsetTop;
          const bottom = top + section.offsetHeight;

          if (scrollPosition >= top && scrollPosition < bottom) {
            setActiveTab(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight + 20; // Aggiungi 20px di margine
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [isScrolled]);

  useEffect(() => {
    const sections = tabsConfig.map(tab => document.getElementById(tab.id));
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !manualScroll) {
          const visibleSection = entry.target.id;
          setActiveTab(visibleSection);
        }
      });
    }, options);

    sections.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      if (observer) observer.disconnect();
    };
  }, [manualScroll]);

  const handleTabClick = (tab) => {
    const section = document.getElementById(tab);
    if (section) {
      const offset = 120; // Altezza esatta dell'header sticky
      window.scrollTo({
        top: section.offsetTop - offset,
        behavior: 'smooth'
      });
      setActiveTab(tab);
    }
  };

  return (
      <>
        <Head>
          <title>{restaurant.name} | Nurebo</title>
        </Head>

        {/*<header className="bg-white shadow">*/}
        {/*  <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">*/}
        {/*    <Link href="/">*/}
        {/*      <span className="text-2xl font-bold text-yellow-500">Quandoo</span>*/}
        {/*    </Link>*/}

        {/*    <div className="flex space-x-2 items-center grow max-w-2xl">*/}
        {/*      <input*/}
        {/*        placeholder="Prova ristoranti o cucine"*/}
        {/*        className="border rounded px-3 py-1 w-full max-w-[300px]"*/}
        {/*      />*/}
        {/*      <input*/}
        {/*        defaultValue="Milano"*/}
        {/*        readOnly*/}
        {/*        className="border rounded px-3 py-1 w-32 hidden lg:block"*/}
        {/*      />*/}
        {/*      <button className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800">*/}
        {/*        Trova*/}
        {/*      </button>*/}
        {/*    </div>*/}

        {/*    <nav className="flex space-x-4 text-sm items-center">*/}
        {/*      <Link href="#" className="hover:text-gray-600">Per ristoranti</Link>*/}
        {/*      <Link href="#" className="hover:text-gray-600">Registrati</Link>*/}
        {/*      <Link href="#" className="hover:text-gray-600">Login</Link>*/}
        {/*      <span className="cursor-pointer">IT ▼</span>*/}
        {/*    </nav>*/}
        {/*  </div>*/}
        {/*</header>*/}
        {/*<header*/}
        {/*    className="bg-white dark:bg-gray-800 mt-4 mb-4 py-4 px-6 flex items-center justify-between w-2/3 mx-auto rounded-lg shadow-md">*/}
        {/*  /!* Logo TheFork *!/*/}
        {/*  <Link href="/ristoranteHomePage">*/}
        {/*    <span className="text-2xl font-bold text-yellow-500">Nurebo</span>*/}
        {/*  </Link>*/}

        {/*  /!* Input di ricerca *!/*/}
        {/*  <div className="flex-grow flex items-center gap-2 max-w-xl mx-4">*/}
        {/*    <div className="flex items-center gap-2">*/}
        {/*      <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400"/>*/}
        {/*      <Select onValueChange={setSelectedCity} value={selectedCity}>*/}
        {/*        <SelectTrigger className="w-[180px]">*/}
        {/*          <SelectValue placeholder="Città"/>*/}
        {/*        </SelectTrigger>*/}
        {/*        <SelectContent>*/}
        {/*          <SelectItem value="Milano">Milano</SelectItem>*/}
        {/*          <SelectItem value="Roma">Roma</SelectItem>*/}
        {/*          <SelectItem value="Torino">Torino</SelectItem>*/}
        {/*          <SelectItem value="Napoli">Napoli</SelectItem>*/}
        {/*        </SelectContent>*/}
        {/*      </Select>*/}
        {/*    </div>*/}
        {/*    <Input*/}
        {/*        type="text"*/}
        {/*        // placeholder="Tipo di cucina, nome del ristorante..."*/}
        {/*        placeholder="Cerca nome del ristorante..."*/}
        {/*        className="w-full"*/}
        {/*    />*/}
        {/*    <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">*/}
        {/*      <Search className="w-5 h-5 mr-2"/>*/}
        {/*      Cerca*/}
        {/*    </Button>*/}
        {/*  </div>*/}

        {/*  /!* Link di accesso *!/*/}
        {/*  <a href="#"*/}
        {/*     className="text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yello-400 transition-colors flex items-center gap-2">*/}
        {/*    <User className="w-5 h-5"/>*/}
        {/*    Accedi*/}
        {/*  </a>*/}
        {/*</header>*/}
        <header className="bg-white sticky top-0 z-50 border-b shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">Nurebo</span>
              </Link>

              {/* Navigazione Destra */}
              <nav className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                  <Link href="/ristoranti" className="hover:text-primary transition-colors">
                    Ristoranti
                  </Link>
                  <Link href="/esperienze" className="hover:text-primary transition-colors">
                    Esperienze
                  </Link>
                </div>

                <div className="flex items-center gap-4 border-l pl-4">
                  <Select defaultValue="it">
                    <SelectTrigger className="w-[80px] border-0 shadow-none">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="en">EN</SelectItem>
                      <SelectItem value="es">ES</SelectItem>
                    </SelectContent>
                  </Select>

                  <Link href="#" className="text-gray-600 hover:text-primary transition-colors">
                    <User className="w-5 h-5"/>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </header>

        <header
            ref={headerRef}
            className={`bg-white shadow-sm sticky top-0 z-50 transition-all ${isScrolled ? 'py-4' : 'py-6'}`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`font-bold ${isScrolled ? 'text-2xl' : 'text-3xl'}`}>{restaurant.name}</h1>
                <div className="flex items-center mt-1">
                  {/*<StarRating rating={restaurant.rating}/>*/}
                  {/*<span className="ml-2 text-gray-600 text-sm">({restaurant.reviews} recensioni)</span>*/}
                  <MapPinIcon className="h-5 w-5 text-gray-500 ml-0"/>
                  <span className="ml-1 text-gray-600">{restaurant.location}</span>
                </div>
              </div>
              <button
                  className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark hidden lg:flex items-center">
                Prenota ora
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Widget Prenotazione (Mobile First) */}
            <div className="md:w-2/5 relative order-1 md:order-2">
              <div
                  className="md:sticky md:top-[calc(var(--header-height)-10px)] bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                {/*<h2 className="text-2xl font-bold mb-6">Prenota un tavolo</h2>*/}
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  {/*<Table className="h-6 w-6 text-primary transform rotate-12"/>*/}
                  {/*<CalendarCheck className="h-6 w-6 text-primary" />*/}
                  {/*<ChefHat className="h-6 w-6 text-primary"/>*/}
                  {/*<svg*/}
                  {/*    xmlns="http://www.w3.org/2000/svg"*/}
                  {/*    width="24"*/}
                  {/*    height="24"*/}
                  {/*    viewBox="0 0 24 24"*/}
                  {/*    fill="none"*/}
                  {/*    stroke="currentColor"*/}
                  {/*    strokeWidth="2"*/}
                  {/*    className="h-6 w-6 text-primary"*/}
                  {/*>*/}
                  {/*  <path d="M3 9h18M5 9v8M19 9v8M8 15h8M3 5h18M3 19h18"/>*/}
                  {/*</svg>*/}
                  Prenota un tavolo
                </h2>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-600"/>
                      <label className="block text-sm font-medium">Persone</label>
                    </div>
                    <div className="flex items-center border rounded-lg">
                      <button
                          onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                          className="p-3 border-r hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center">{peopleCount}</span>
                      <button
                          onClick={() => setPeopleCount(peopleCount + 1)}
                          className="p-3 border-l hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/*<div>*/}
                  {/*  <label className="block text-sm font-medium mb-2">Data</label>*/}
                  {/*  <DatePicker*/}
                  {/*      selected={selectedDate}*/}
                  {/*      onChange={setSelectedDate}*/}
                  {/*      minDate={new Date()}*/}
                  {/*      dateFormat="dd/MM/yyyy"*/}
                  {/*      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"*/}
                  {/*  />*/}
                  {/*</div>*/}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {/*<CalendarDays className="h-4 w-4 text-gray-600"/>*/}
                      <label className="block text-sm font-medium">Data</label>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-12 px-4 w-full max-w-[280px] text-left justify-start rounded-lg border-gray-300 hover:bg-gray-50"
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-gray-600"/>
                          {selectedDate ? (
                              <span className="font-medium text-gray-800">
                                  {format(selectedDate, "EEEE dd MMMM yyyy", {locale: it})}
                              </span>
                          ) : (
                              <span className="text-gray-400">Seleziona data</span>
                          )}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                          className="w-auto p-4"
                          align="start"
                          sideOffset={5}
                      >
                        <Calendar
                            // style={{
                            //   width: '250px',
                            //   height: '300px',
                            // }}
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            // fromDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                            // toDate={new Date().setMonth(new Date().getMonth() + 1)}
                            disabled={(date) => date < new Date()}
                            locale={it}
                            classNames={{
                              // months: "p-2",
                              // month: "space-y-2",
                              // caption: "relative px-2",
                              // caption_label: "text-sm font-medium text-left",
                              // nav: "gap-1",
                              // nav_button: "h-8 w-8 p-1",
                              // head_cell: "text-xs text-gray-500 w-9 font-normal text-left",
                              // cell: "text-left text-sm p-0",
                              // day: "h-9 w-9 p-0 font-medium rounded-md hover:bg-gray-100 text-left justify-start",
                              // day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                              // day_today: "bg-gray-100 font-semibold"
                            }}
                            className="transform s:scale-[1] md:scale-[1.1] rounded-md"
                            // components={{
                            // IconLeft: ({...props}) => <ChevronLeft className="h-5 w-5 ml-1"/>,
                            // IconRight: ({...props}) => <ChevronRight className="h-5 w-5 mr-1"/>
                            //}}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-600 animate-spin-slow"/>
                      <label className="block text-sm font-medium">Ora</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2 h-[144px] mb-2 pr-4 pb-1 overflow-y-auto scrollbar-hide">
                      {[
                        '18:00', '18:30', '19:00', '19:30',
                        '20:00', '20:30', '21:00', '21:30',
                        '22:00', '22:30', '23:00', '23:30'
                      ].map(time => (
                          <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`h-10 p-2 rounded-lg border ${
                                  selectedTime === time
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'hover:border-gray-400'
                              }`}
                          >
                            {time}
                          </button>
                      ))}
                    </div>
                  </div>

                  {/*<button*/}
                  {/*    className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary-dark font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg"*/}
                  {/*>*/}
                  {/*</button>*/}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                          className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary-dark font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg"
                      >
                        Verifica disponibilità
                      </button>
                    </DialogTrigger>

                    <DialogContent className="rounded-xl max-w-[95vw] sm:max-w-[500px] p-6">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-3">
                          {isAvailable ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600"/>
                          ) : (
                              <AlertCircle className="h-6 w-6 text-yellow-600"/>
                          )}
                          {isAvailable ? 'Disponibile!' : 'Verifica in corso...'}
                        </DialogTitle>
                      </DialogHeader>

                      {isAvailable && (
                          <div className="bg-green-50 p-4 rounded-lg mb-4">
                            <p className="text-green-700 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5"/>
                              Tavolo disponibile! Conferma entro {formatTime(timeLeft)}
                            </p>
                          </div>
                      )}

                      <form onSubmit={isOtpSent ? handleOtpVerification : handleOtpRequest}>
                        <div className="grid gap-5 py-4">
                          {!isOtpSent ? (
                              <>
                                <div className="space-y-3">
                                  <Label className="block text-lg font-medium">
                                    <Smartphone className="inline-block mr-2 h-5 w-5"/>
                                    Numero di cellulare *
                                  </Label>
                                  <Input
                                      type="tel"
                                      required
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      placeholder="+39 123 456789"
                                      className="h-14 text-lg px-4 rounded-xl"
                                  />
                                </div>

                                <div className="space-y-3">
                                  <Label className="block text-lg font-medium">
                                    <Mail className="inline-block mr-2 h-5 w-5"/>
                                    Email (opzionale)
                                  </Label>
                                  <Input
                                      type="email"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      placeholder="nome@esempio.com"
                                      className="h-14 text-lg px-4 rounded-xl"
                                  />
                                </div>
                              </>
                          ) : (
                              <div className="space-y-4">
                                <Label className="block text-lg font-medium text-center">
                                  Inserisci il codice OTP di 6 cifre ricevuto
                                </Label>
                                <div className="flex justify-center gap-3">
                                  {/*<InputOTP*/}
                                  {/*    maxLength={6}*/}
                                  {/*    value={otp}*/}
                                  {/*    onChange={setOtp}*/}
                                  {/*>*/}
                                  {/*  <InputOTPGroup className="flex justify-center">*/}
                                  {/*    /!* Prime 3 cifre *!/*/}
                                  {/*    {[...Array(3)].map((_, index) => (*/}
                                  {/*        <InputOTPSlot*/}
                                  {/*            key={index}*/}
                                  {/*            index={index}*/}
                                  {/*            className="w-10 h-10 font-sans bg-white text-2xl font-bold text-primary md:w-12 md:h-12 lg:w-14 lg:h-14"*/}
                                  {/*        />*/}
                                  {/*    ))}*/}

                                  {/*    /!* Separatore tra 3a e 4a cifra *!/*/}
                                  {/*    <InputOTPSeparator className="mx-2"/>*/}

                                  {/*    /!* Ultime 3 cifre *!/*/}
                                  {/*    {[...Array(3)].map((_, index) => (*/}
                                  {/*        <InputOTPSlot*/}
                                  {/*            key={index + 3}*/}
                                  {/*            index={index + 3}*/}
                                  {/*            className="w-10 h-10 font-sans bg-white text-2xl font-bold text-primary md:w-12 md:h-12 lg:w-14 lg:h-14"*/}
                                  {/*        />*/}
                                  {/*    ))}*/}
                                  {/*  </InputOTPGroup>*/}
                                  {/*</InputOTP>*/}
                                  <UnderlinedOTP
                                      value={otp}
                                      onValueChange={setOtp}
                                  />
                                </div>
                                <p className="text-center text-gray-500 mt-2">
                                  Ti abbiamo inviato un codice via SMS.
                                </p>
                              </div>
                          )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg rounded-xl gap-3 mt-4"
                            disabled={isLoading}
                            // onClick={() => }
                        >
                          {isLoading ? (
                              <Loader2 className="h-6 w-6 animate-spin"/>
                          ) : isOtpSent ? (
                              'Conferma'
                          ) : (
                              'Invia'
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <div className="text-center text-sm text-gray-500 mt-4">
                    Non addebiteremo nessun costo
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-3/5 order-2 md:order-1">
              {/* Immagine principale */}
              <div className="relative w-full h-96 rounded-xl overflow-hidden mb-8">
                <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                    priority
                />
              </div>

              <div
                  className={`flex border-b sticky ${isScrolled ? 'top-[92px]' : 'top-[172px]'} bg-white z-40 shadow-sm`}>
                {tabsConfig.map(({id, icon, label}) => (
                    <button
                        key={id}
                        onClick={() => handleTabClick(id)}
                        className={`px-4 py-4 flex items-center gap-2 text-sm font-medium flex-1 ${
                            activeTab === id
                                ? 'border-b-2 border-black text-black'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {icon}
                      <span className="hidden sm:inline">{label.toUpperCase()}</span>
                    </button>
                ))}
              </div>

              <section id="info" className="mt-0 space-y-6">
                <div className="bg-white p-6 ">
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 text-gray-600">
                      <div className="w-full">
                        <div className="mt-4 w-full h-96 rounded-lg overflow-hidden">
                          <iframe
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.address.join(', '))}&output=embed`}
                              width="100%"
                              height="100%"
                              style={{border: 0}}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white px-12 pb-8">
                  <div className="space-y-2">
                    {restaurant.hours.map((h, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span className="capitalize">{h.day}</span>
                          <span>{h.open} – {h.close}</span>
                        </div>
                    ))}
                  </div>
                </div>
              </section>

              {/*<section id="orari" className="mt-0 space-y-6">*/}
              {/*  <div className="bg-white p-6">*/}
              {/*    <div className="space-y-2">*/}
              {/*      {restaurant.hours.map((h, i) => (*/}
              {/*          <div key={i} className="flex justify-between py-2 border-b">*/}
              {/*            <span className="capitalize">{h.day}</span>*/}
              {/*            <span>{h.open} – {h.close}</span>*/}
              {/*          </div>*/}
              {/*      ))}*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*</section>*/}

              {/*<section id="social" className="mt-6 bg-white p-6">*/}
              {/*  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">*/}
              {/*    <svg*/}
              {/*        className="w-8 h-8 text-blue-600 animate-spin-slow"*/}
              {/*        fill="none"*/}
              {/*        stroke="currentColor"*/}
              {/*        strokeWidth="2"*/}
              {/*        viewBox="0 0 24 24"*/}
              {/*    >*/}
              {/*      <path strokeLinecap="round" strokeLinejoin="round"*/}
              {/*            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>*/}
              {/*    </svg>*/}
              {/*    Connettiti con noi*/}
              {/*  </h2>*/}

              {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">*/}
              {/*    /!* WhatsApp *!/*/}
              {/*    <a href={`https://wa.me/${restaurant.social.whatsapp}`}*/}
              {/*       className="text-gray-600 hover:text-green-600 underline-effect">*/}
              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-green-100 p-3 rounded-full transition-transform duration-300 hover:rotate-12">*/}
              {/*          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">*/}
              {/*            <path*/}
              {/*                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">WhatsApp</h3>*/}
              {/*          {restaurant.social.whatsapp}*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    /!* Telefono Fisso *!/*/}
              {/*    <a href={`tel:${restaurant.phone}`} className="text-gray-600 hover:text-blue-600">*/}
              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-blue-100 p-3 rounded-full transition-transform duration-300 hover:rotate-12">*/}
              {/*          <PhoneIcon className="w-8 h-8 text-blue-600"/>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Telefono</h3>*/}
              {/*          {restaurant.phone}*/}

              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={restaurant.social.instagram} className="text-gray-600 hover:text-pink-600">*/}
              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-pink-100 p-3 rounded-full transition-transform duration-300 hover:-rotate-12">*/}
              {/*          <svg className="w-8 h-8 text-pink-600" fill="currentColor" viewBox="0 0 24 24">*/}
              {/*            <path*/}
              {/*                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Instagram</h3>*/}
              {/*          @fxmilanoristorante*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={restaurant.social.facebook} className="text-gray-600 hover:text-blue-600">*/}

              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-blue-100 p-3 rounded-full transition-transform duration-300 hover:rotate-12">*/}
              {/*          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">*/}
              {/*            <path*/}
              {/*                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Facebook</h3>*/}
              {/*          fxmilanoristorante*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={restaurant.social.deliveroo} className="text-gray-600 hover:text-blue-600">*/}
              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-blue-100 p-3 rounded-full transition-transform duration-300 hover:rotate-12">*/}
              {/*          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">*/}
              {/*            <path d="M16.861 0l-1.127 10.584L13.81 1.66 7.777 2.926v9.112..."/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Deliveroo</h3>*/}
              {/*          Ordina adesso*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={restaurant.social.glovo} className="text-gray-600 hover:text-orange-600">*/}
              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div*/}
              {/*            className="bg-orange-100 p-3 rounded-full transition-transform duration-300 hover:-rotate-12">*/}
              {/*          <svg className="w-8 h-8 text-orange-600" viewBox="0 0 24 24" fill="currentColor">*/}
              {/*            <path d="M21.096 6.111h-7.465V4.16c0-1.324-1.119-2.4-2.5-2.4..."/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Glovo</h3>*/}
              {/*          Ordina ora*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={restaurant.social.website} className="text-gray-600 hover:text-indigo-600">*/}
              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-indigo-100 p-3 rounded-full transition-transform duration-300 hover:rotate-90">*/}
              {/*          <svg*/}
              {/*              className="w-8 h-8 text-indigo-600"*/}
              {/*              fill="none"*/}
              {/*              stroke="currentColor"*/}
              {/*              strokeWidth="2"*/}
              {/*              viewBox="0 0 24 24"*/}
              {/*          >*/}
              {/*            <path strokeLinecap="round" strokeLinejoin="round"*/}
              {/*                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Sito Web</h3>*/}
              {/*          {restaurant.social.website}*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={restaurant.social.googleMaps} className="text-gray-600 hover:text-red-600">*/}

              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-red-100 p-3 rounded-full transition-transform duration-300 hover:rotate-12">*/}
              {/*          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">*/}
              {/*            <path d="M12 0C8.1 0 4.8 2.5 3.2 6.1L12 12l8.8-5.9C19.2 2.5..."/>*/}
              {/*          </svg>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Google Maps</h3>*/}
              {/*          Vedi su Maps*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*    <a href={`mailto:${restaurant.social.email}`} className="text-gray-600 hover:text-purple-600">*/}

              {/*      <div*/}
              {/*          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">*/}
              {/*        <div className="bg-purple-100 p-3 rounded-full transition-transform duration-300 hover:rotate-12">*/}
              {/*          <EnvelopeIcon className="w-8 h-8 text-purple-600"/>*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <h3 className="font-semibold">Email</h3>*/}
              {/*          {restaurant.social.email}*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </a>*/}

              {/*  </div>*/}
              {/*</section>*/}

              <section id="foto" className="mt-0 bg-white p-6">
                <h2 className="text-2xl font-bold mb-8 text-gray-800">Il nostro locale</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 max-w-3xl mx-auto px-2">
                  {restaurant.photos.map((src, idx) => (
                      <div
                          key={idx}
                          className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                          // onClick={() => {
                          //   // setLightboxImages(restaurant.photos);
                          //   // setCurrentImageIndex(idx);
                          //   // setIsLightboxOpen(true);
                          // }}
                          onClick={() => openLightbox(restaurant.photos, idx, true)}
                      >
                        <div className="relative w-full h-64">
                          <Image
                              src={src}
                              alt={`Foto ${idx + 1}`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
                              quality={85}
                          />
                        </div>
                      </div>
                  ))}
                </div>
              </section>

              <section id="menu" className="mt-2 bg-white p-6 ">
                <h2 className="text-2xl font-bold mb-8 text-gray-800">Il nostro menu</h2>

                {Object.entries(restaurant.menuHighlights).map(([category, items]) => (
                    <div key={category} className="mb-10">
                      <h3 className="text-lg font-sans font-semibold mb-5 text-primary border-b pb-2">
                        {category}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-start justify-between p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => openLightbox(items.map(i => i.photo), index, false)}
                            >
                              <div className="flex-1 pr-4">
                                <h4 className="font-sans font-bold text-gray-800 text-lg">{item.name}</h4>
                                <p className="font-sans text-primary mt-2">{item.price}</p>
                              </div>
                              <div className="w-24 h-24 relative rounded-lg overflow-hidden border">
                                <Image
                                    src={item.photo}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100px, 200px"
                                    quality={85}
                                />
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                ))}

                {/*<button*/}
                {/*    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark mt-8 transition-colors">*/}
                {/*  Visualizza menu completo*/}
                {/*</button>*/}
              </section>

              {/*<section id="recensioni" className="mt-8 bg-white p-6 rounded-lg shadow-sm">*/}
              {/*  <div className="flex items-center justify-between mb-8">*/}
              {/*    <h2 className="text-2xl font-bold">Recensioni</h2>*/}
              {/*    <div className="flex items-center gap-4">*/}
              {/*      <div className="text-3xl font-bold text-primary">{restaurant.rating}</div>*/}
              {/*      <div>*/}
              {/*        <StarRating rating={restaurant.rating}/>*/}
              {/*        <div className="text-sm text-gray-600 mt-1">{restaurant.reviews} recensioni verificate</div>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </div>*/}

              {/*  <div className="space-y-8">*/}
              {/*    {restaurant.reviewsList.map((review, index) => (*/}
              {/*        <div key={index} className="border-b pb-8 last:border-0 group">*/}
              {/*          <div className="flex items-center justify-between mb-3">*/}
              {/*            <div>*/}
              {/*              <h4 className="font-semibold text-lg">{review.user}</h4>*/}
              {/*              <div*/}
              {/*                  className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('it-IT')}</div>*/}
              {/*            </div>*/}
              {/*            <StarRating rating={review.rating}/>*/}
              {/*          </div>*/}
              {/*          <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">*/}
              {/*            {review.comment}*/}
              {/*          </p>*/}
              {/*          <div className="mt-4 flex gap-2">*/}
              {/*            <button className="text-sm text-primary hover:text-primary-dark flex items-center">*/}
              {/*              <HandThumbUpIcon className="h-4 w-4 mr-1"/> Utile*/}
              {/*            </button>*/}
              {/*            <button className="text-sm text-gray-500 hover:text-gray-700 ml-4">*/}
              {/*              Segnala*/}
              {/*            </button>*/}
              {/*          </div>*/}
              {/*        </div>*/}
              {/*    ))}*/}
              {/*  </div>*/}

              {/*  <button className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark mt-8">*/}
              {/*    Carica altre recensioni*/}
              {/*  </button>*/}
              {/*</section>*/}

            </div>
          </div>
        </main>

        {/*{isLightboxOpen && (*/}
        {/*    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"*/}
        {/*         onClick={() => setIsLightboxOpen(false)}>*/}
        {/*      <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full"*/}
        {/*           onClick={(e) => e.stopPropagation()}>*/}
        {/*        <button onClick={() => setIsLightboxOpen(false)}*/}
        {/*                className="absolute top-4 right-4 text-white text-4xl z-50 hover:text-gray-300">*/}
        {/*          &times;*/}
        {/*        </button>*/}

        {/*        <div className="relative w-full h-full">*/}
        {/*          <Image*/}
        {/*              src={lightboxImages[currentImageIndex]}*/}
        {/*              alt="Lightbox image"*/}
        {/*              fill*/}
        {/*              className="object-contain"*/}
        {/*              quality={100}*/}
        {/*              unoptimized // Rimuovi questa riga se vuoi l'ottimizzazione*/}
        {/*              priority*/}
        {/*          />*/}
        {/*        </div>*/}

        {/*        /!* Aggiungi le frecce di navigazione *!/*/}
        {/*        {lightboxImages.length > 1 && (*/}
        {/*            <>*/}
        {/*              <button*/}
        {/*                  onClick={(e) => {*/}
        {/*                    e.stopPropagation();*/}
        {/*                    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));*/}
        {/*                  }}*/}
        {/*                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl z-50 hover:text-gray-300">*/}
        {/*                &#10094;*/}
        {/*              </button>*/}
        {/*              <button*/}
        {/*                  onClick={(e) => {*/}
        {/*                    e.stopPropagation();*/}
        {/*                    setCurrentImageIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : prev));*/}
        {/*                  }}*/}
        {/*                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl z-50 hover:text-gray-300">*/}
        {/*                &#10095;*/}
        {/*              </button>*/}
        {/*            </>*/}
        {/*        )}*/}

        {/*        <div*/}
        {/*            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">*/}
        {/*          {currentImageIndex + 1} / {lightboxImages.length}*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*)}*/}

        <Lightbox
            isOpen={lightboxState.isOpen}
            onClose={() => setLightboxState(prev => ({...prev, isOpen: false}))}
            images={lightboxState.images}
            initialIndex={lightboxState.initialIndex}
            showNavigation={lightboxState.showNavigation}
        />

        <footer className="bg-gray-900 text-white py-10 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
            <div>
              <h4 className="font-semibold mb-2">Note legali</h4>
              <ul className="text-sm space-y-1">
                <li>Informazioni legali</li>
                <li>Privacy</li>
                <li>Termini e condizioni di utilizzo</li>
                <li>Impostazioni cookie</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Su di noi</h4>
              <ul className="text-sm space-y-1">
                <li>Punti Fedeltà</li>
                <li>Blog</li>
                <li>Contatti</li>
                <li>Mappa del Sito</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Paesi e Regioni</h4>
              <ul className="text-sm space-y-1">
                <li>Austria</li>
                <li>Italia</li>
                <li>Regno Unito</li>
                <li>Germania</li>
                <li>Svizzera</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Seguici</h4>
              <div className="flex space-x-4">
                <button className="hover:text-gray-400">Facebook</button>
                <button className="hover:text-gray-400">Instagram</button>
                <button className="hover:text-gray-400">Twitter</button>
              </div>
              <h4 className="font-semibold mt-4 mb-2">App</h4>
              <div className="flex space-x-2">
                <button className="hover:text-gray-400">Google Play</button>
                <button className="hover:text-gray-400">App Store</button>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            ©2025 Nurebo GmbH. Tutti i diritti riservati
          </p>
        </footer>
      </>
  );
};

const StarRating = ({rating}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="relative">
              <StarIcon
                  className={`h-5 w-5 ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}
              />
              {hasHalfStar && i === fullStars && (
                  <div className="absolute inset-0 overflow-hidden" style={{width: '50%'}}>
                    <StarIcon className="h-5 w-5 text-yellow-400"/>
                  </div>
              )}
            </div>
        ))}
      </div>
  );
};

export default FXMilanoPage;


