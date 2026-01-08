'use client';

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect, useState, useRef} from 'react';
import {
    StarIcon,
    MapPinIcon,
    TruckIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    CameraIcon,
    InformationCircleIcon,
    WrenchScrewdriverIcon, ShoppingBagIcon, CreditCardIcon
} from '@heroicons/react/24/solid';
import {
    Search,
    MapPin,
    User,
    Package,
    Factory,
    Clock,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Ruler,
    Weight,
    ShoppingCart,
    CheckCircle2,
    AlertCircle, Heart, CalendarIcon, AlertTriangle, Bike, ShoppingBag, Minus, Plus, XCircle
} from "lucide-react"
import {Label} from "@/components/ui/label"
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Lightbox from "@/components/ui/lightbox";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {format} from "date-fns";
import {it} from "date-fns/locale";
import {Calendar} from "@/components/ui/calendar";
import {AnimatePresence, motion} from "framer-motion";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {cn} from "@/lib/utils";
import {MdCreditCard, MdOutlineCreditCard} from "react-icons/md";
import { useRouter } from "next/navigation";


const ProductPage = () => {
    const router = useRouter();
    const initialCart = [];

    const cartItemVariants = {
        hidden: {opacity: 0, x: 50, scale: 0.8},
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20
            }
        },
        exit: {
            opacity: 0,
            x: -50,
            scale: 0.8,
            transition: {duration: 0.2}
        }
    };

    const product = {
        name: 'Trapano Avvitatore a Batteria Professionale',
        brand: 'Bosch Professional',
        sku: 'BOSCH-GSB-18V-55',
        model: 'BOSCH-GSB-18V-55',
        stock: 16,
        rating: 4.7,
        reviews: 892,
        price: 189.00,
        image: 'https://m.media-amazon.com/images/I/51ww6o-9-rL._AC_SL1200_.jpg',
        description: `Scarpe sportive premium per corsa e allenamento, combinano comfort e stile. La tecnologia di ammortizzazione avanzata offre supporto durante ogni movimento, mentre la tomaia traspirante mantiene i piedi freschi. Ideali per atleti professionisti e appassionati di fitness.`,
        features: [
            'Potenza 18V - Coppia max 55 Nm',
            'Batteria Li-Ion 4.0Ah inclusa',
            '2 velocità + modalità impulso',
            'LED integrato',
            'Giro vuoto 0-400 / 0-1500 rpm',
            'Peso 1.4 kg'
        ],
        details: {
            material: "Pelle scamosciata e mesh traspirante",
            sole: "Gomma antiscivolo",
            weight: "320g (per scarpa)",
            sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44],
            features: [
                "Ammortizzazione responsive",
                "Suola in gomma ad alta trazione",
                "Tomaia traspirante",
                "Plantare ortopedico estraibile",
                "Design ergonomico"
            ]
        },
        specifications: {
            'Dettagli Tecnici': [
                {label: 'Tensione', value: '18V DC'},
                {label: 'Capacità batteria', value: '4.0Ah'},
                {label: 'Coppia massima', value: '55 Nm'},
                {label: 'Velocità a vuoto', value: '0-400/0-1500 rpm'},
                {label: 'Peso', value: '1.4 kg'}
            ],
            // 'Incluso nella confezione': [
            //     'Trapano avvitatore',
            //     '2 batterie Li-Ion',
            //     'Caricabatterie rapido',
            //     'Cofano portautensili',
            //     'Manuale di istruzioni'
            // ]
        },
        photos: [
            'https://m.media-amazon.com/images/I/71KwgK07OTL._AC_SL1500_.jpg',
            'https://m.media-amazon.com/images/I/61tnEX2zFQL._AC_SL1500_.jpg',
            'https://m.media-amazon.com/images/I/71SD1PAG7tL._AC_SL1500_.jpg',
            'https://m.media-amazon.com/images/I/71jS31R5J4L._AC_SL1500_.jpg'
        ],
        reviewsList: [
            {
                user: "Marco R.",
                rating: 5,
                date: "2024-03-15",
                comment: "Strumento professionale, batteria dura tantissimo. Ottimo rapporto qualità/prezzo"
            },
            {
                user: "Laura B.",
                rating: 4,
                date: "2024-04-02",
                comment: "Potente e leggero, lo uso tutto il giorno senza affaticarmi"
            }
        ],
        relatedProducts: [
            {
                name: 'Sega circolare 20VSega circolare 20VSega circolare 20VSega circolare 20V',
                price: '€159.99',
                image: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg'
            },
            {
                name: 'Avvitatore impattante',
                price: '€219.99',
                image: 'https://images.pexels.com/photos/221027/pexels-photo-221027.jpeg'
            },
            {
                name: 'Sega circolare 20V',
                price: '€159.99',
                image: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg'
            },
            {
                name: 'Avvitatore impattante2',
                price: '€219.99',
                image: 'https://images.pexels.com/photos/221027/pexels-photo-221027.jpeg'
            },
            {
                name: 'Sega circolare 20V2',
                price: '€159.99',
                image: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg'
            },
            {
                name: 'Avvitatore impattante3',
                price: '€219.99',
                image: 'https://images.pexels.com/photos/221027/pexels-photo-221027.jpeg'
            },
            {
                name: 'Sega circolare 20V3',
                price: '€159.99',
                image: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg'
            },
            {
                name: 'Avvitatore impattante4',
                price: '€219.99',
                image: 'https://images.pexels.com/photos/221027/pexels-photo-221027.jpeg'
            },
        ],
        deliveryOptions: [
            {type: 'standard', price: 'Gratis', time: '3-5 giorni'},
            {type: 'express', price: '€9,99', time: '24h'}
        ]
    };

    const tabsConfig = [
        {id: 'descrizione', icon: <InformationCircleIcon className="h-5 w-5"/>, label: 'Descrizione'},
        {id: 'specifiche', icon: <DocumentTextIcon className="h-5 w-5"/>, label: 'Specifiche'},
        {id: 'foto', icon: <CameraIcon className="h-5 w-5"/>, label: 'Foto'},
        {id: 'recensioni', icon: <StarIcon className="h-5 w-5"/>, label: 'Recensioni'},
    ];

    const [cart, setCart] = useState(initialCart);
    const [selectedTab, setSelectedTab] = useState('delivery');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const addToCart = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.name === item.name);
            return existingItem
                ? prevCart.map(cartItem => cartItem.name === item.name ? {
                    ...cartItem,
                    quantity: cartItem.quantity + 1
                } : cartItem)
                : [...prevCart, {
                    ...item,
                    id: crypto.randomUUID(),
                    quantity: 1,
                    image: item.image || '/placeholder-food.jpg'
                }];
        });
        setIsCartOpen(true);
    };

    const cartActions = {
        removeFromCart: (itemId) => setCart(prev => prev.filter(item => item.id !== itemId)),
        increaseQuantity: (itemId) => setCart(prev => prev.map(item =>
            item.id === itemId ? {...item, quantity: item.quantity + 1} : item
        )),
        decreaseQuantity: (itemId) => setCart(prev => prev.map(item =>
            item.id === itemId && item.quantity > 1 ? {...item, quantity: item.quantity - 1} : item
        ))
    };

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    useEffect(() => {
        addToCart({
            name: 'Smartwatch Fitness',
            price: 89.99,
            image: 'https://m.media-amazon.com/images/I/71HA+BgM+HL._AC_SX679_.jpg'
        });
        addToCart({
            name: 'Cuffie Wireless',
            price: 129.99,
            image: 'https://m.media-amazon.com/images/I/71nEAXE7ygL._AC_UL480_FMwebp_QL65_.jpg'
        });
        addToCart({
            name: 'Zaino Antifurto',
            price: 49.99,
            image: 'https://m.media-amazon.com/images/I/61jxWksagCL._AC_UL480_FMwebp_QL65_.jpg'
        });
        addToCart({
            name: 'Lampada da Scrivania LED',
            price: 34.50,
            image: 'https://m.media-amazon.com/images/I/51E+5A8ADrL._AC_UL480_FMwebp_QL65_.jpg'
        });
        addToCart({
            name: 'Maglietta Basic Cotton',
            price: 19.99,
            image: 'https://m.media-amazon.com/images/I/61QLdtYbxYL._AC_UL480_FMwebp_QL65_.jpg'
        });
        addToCart({
            name: 'Scarpe Running',
            price: 75.00,
            image: 'https://m.media-amazon.com/images/I/61-wzFjokhL._AC_UL480_FMwebp_QL65_.jpg'
        });
    }, []);
    const [activeTab, setActiveTab] = useState('descrizione');
    const [quantity, setQuantity] = useState(1);
    const [selectedDelivery, setSelectedDelivery] = useState('standard');
    const [isScrolled, setIsScrolled] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const allImages = [product.image, ...product.photos];
    const [lightboxState, setLightboxState] = useState({
        isOpen: false,
        images: [],
        initialIndex: 0
    });

    const [itemsPerView, setItemsPerView] = useState(4);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 480) { // Mobile
                setItemsPerView(1);
            } else if (width < 768) { // Tablet piccolo
                setItemsPerView(2);
            } else if (width < 1024) { // Tablet grande
                setItemsPerView(3);
            } else if (width < 1280) { // Desktop
                setItemsPerView(4);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const openLightbox = (images, initialIndex = 0, showNavigation = true) => {
        setLightboxState({
            isOpen: true,
            images,
            // images: allImages, // Usa direttamente l'array allImages
            initialIndex,
            showNavigation // Aggiunto parametro per la navigazione
        })
    }

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
            const sections = tabsConfig.map(tab => document.getElementById(tab.id));
            const scrollPosition = window.scrollY + 200;

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

    const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'details', 'confirm'
    const [customerData, setCustomerData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        province: '',
        pickupLocation: '',
    });
    const [formErrors, setFormErrors] = useState({});

    const pickupPoints = [
        {id: 1, name: 'Negozio Centrale', address: 'Via Roma 123, Milano'},
        {id: 2, name: 'Filiale Nord', address: 'Viale Monza 45, Milano'},
    ];

    const validateForm = () => {
        const errors = {};
        const requiredFields = ['firstName', 'lastName', 'email', 'phone'];

        if (selectedTab === 'delivery') {
            requiredFields.push('address', 'city', 'zip', 'province');
        } else {
            requiredFields.push('pickupLocation');
        }

        requiredFields.forEach(field => {
            if (!customerData[field]) {
                errors[field] = 'Campo obbligatorio';
            }
        });

        if (!/\S+@\S+\.\S+/.test(customerData.email)) {
            errors.email = 'Email non valida';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCheckout = () => {
        if (validateForm()) {
            // Simulazione invio dati
            console.log('Dati inviati:', {
                customer: customerData,
                order: cart,
                total: cartTotal
            });
            setCheckoutStep('confirm');
        }
    };

    return (
        <>
            <Head>
                <title>{product.name} | Ferramenta Online</title>
            </Head>

            {/* Header */}
            <header className="bg-white sticky top-0 z-80 border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
                    {/* Logo Centrato */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <Link href="/" className="w-[120px] block">
                            <Image
                                src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/nurebo_logo_blue_ai.png"
                                alt="Logo"
                                width={120}
                                height={28}
                                className="h-7 w-auto object-contain"
                            />
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-4 border-l pl-4 mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            className="h-12 px-4 hover:bg-gray-50 rounded-lg relative group"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="ml-2 hidden lg:inline font-medium text-gray-600 group-hover:text-primary transition-colors">
                                        Carrello
                                </span>
                                <div className="relative">
                                    <ShoppingCart
                                        className="h-8 w-8 text-gray-600 group-hover:text-primary transition-colors"/>
                                    {cart.length > 0 && (
                                        <span
                                            className="absolute -top-3 -right-4 bg-primary text-white text-xs font-medium p-1 rounded-full flex items-center justify-center">
                                            {cart.reduce((total, item) => total + item.quantity, 0)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Button>
                    </div>
                </div>
            </header>

            <header className={`bg-white shadow-sm sticky top-0 z-50 transition-all ${isScrolled ? 'py-4' : 'py-6'}`}>
                <div className={`${!isCartOpen ? 'max-w-7xl xl:mx-auto' : ''} px-6`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`pr-4 font-bold ${isScrolled ? 'text-2xl' : 'text-3xl'}`}>{product.name}</h1>
                            <div className="mt-1">
                                <div className="flex flex-col xs:flex-row md:items-center">
                                    <span className="text-gray-600">{product.brand}</span>
                                    <span className="hidden xs:inline mx-2">•</span>
                                    <span className="text-gray-600 xs:mt-0 mt-1">{product.sku}</span>
                                </div>
                            </div>
                        </div>
                        {/*<button*/}
                        {/*    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 hidden lg:flex items-center">*/}
                        {/*    Acquista a {product.price}*/}
                        {/*</button>*/}

                        {/*<nav className="flex items-center">*/}
                        {/*    <div className="flex items-center gap-4 border-l pl-4">*/}
                        {/*        <Button*/}
                        {/*            variant="ghost"*/}
                        {/*            onClick={() => setIsCartOpen(!isCartOpen)}*/}
                        {/*            className="h-12 px-4 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors relative"*/}
                        {/*        >*/}
                        {/*            <div className="flex items-center gap-4">*/}
                        {/*                <span className="hidden lg:inline font-medium text-[16px]">Carrello</span>*/}
                        {/*                <div className="relative">*/}
                        {/*                    <ShoppingCart className="h-8 w-8"/>*/}
                        {/*                    {cart.length > 0 && (*/}
                        {/*                        <span*/}
                        {/*                            className="absolute -top-3 h-6 w-6 -right-4 bg-primary text-white text-xs font-medium p-1 rounded-full flex items-center justify-center">*/}
                        {/*                            {cart.reduce((total, item) => total + item.quantity, 0)}*/}
                        {/*                        </span>*/}
                        {/*                    )}*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        </Button>*/}
                        {/*    </div>*/}
                        {/*</nav>*/}
                    </div>
                </div>
            </header>

            <motion.div
                initial={{width: 0}}
                animate={{width: isCartOpen ? 384 : 0}}
                transition={{type: 'spring', stiffness: 300, damping: 30}}
                className="fixed bottom-0 right-0 h-full bg-white shadow-xl z-40 border-l border-gray-200 overflow-hidden dark:bg-gray-800"
            >
                <nav className="sticky top-0 flex justify-center mr-4 mt-2">
                    <div className="flex items-center gap-4 border-l pl-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            className="h-12 px-4 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors relative"
                        >
                            <div className="flex items-center gap-4">
                                <span className="hidden lg:inline font-medium text-[16px]">Carrello</span>
                                <div className="relative">
                                    <ShoppingCart className="h-8 w-8"/>
                                    {cart.length > 0 && (
                                        <span
                                            className="absolute -top-3 h-6 w-6 -right-4 bg-primary text-white text-xs font-medium p-1 rounded-full flex items-center justify-center">
                                                    {cart.reduce((total, item) => total + item.quantity, 0)}
                                                </span>
                                    )}
                                </div>
                            </div>
                        </Button>
                    </div>
                </nav>
                {isCartOpen && (
                    <motion.div
                        initial={{x: '100%'}}
                        animate={{x: 0}}
                        exit={{x: '100%'}}
                        transition={{type: 'spring', stiffness: 300, damping: 25}}
                        className="fixed bottom-0 right-0 h-[calc(100vh-11rem)] w-full md:w-96 bg-white dark:bg-gray-800 shadow-xl z-30 border-l border-gray-200 dark:border-gray-700 flex flex-col"
                    >
                        <AnimatePresence mode="wait">
                            {(
                                <motion.div
                                    key="cart"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                    className="flex flex-col h-full"
                                >
                                    <div
                                        className="sticky top-0 z-10 bg-white dark:bg-gray-800 pt-4 pb-3 px-6 border-b border-gray-200 dark:border-gray-700">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            {/*<ShoppingCart className="h-6 w-6 text-primary"/>*/}
                                            Carrello
                                        </h2>
                                        {/*<Tabs value={selectedTab} onValueChange={setSelectedTab}>*/}
                                        {/*    <TabsList className="w-full bg-gray-100 dark:bg-gray-700">*/}
                                        {/*        <TabsTrigger*/}
                                        {/*            value="delivery"*/}
                                        {/*            className={cn(*/}
                                        {/*                "flex-1 flex items-center gap-2 font-medium text-sm",*/}
                                        {/*                selectedTab === 'delivery'*/}
                                        {/*                    ? 'bg-white dark:bg-gray-800 text-primary shadow-lg'*/}
                                        {/*                    : 'bg-transparent text-gray-700 dark:text-gray-300'*/}
                                        {/*            )}*/}
                                        {/*        >*/}
                                        {/*            <Bike className="w-4 h-4"/>*/}
                                        {/*            Consegna*/}
                                        {/*        </TabsTrigger>*/}
                                        {/*        <TabsTrigger*/}
                                        {/*            value="takeaway"*/}
                                        {/*            className={cn(*/}
                                        {/*                "flex-1 flex items-center gap-2 font-medium text-sm",*/}
                                        {/*                selectedTab === 'takeaway'*/}
                                        {/*                    ? 'bg-white dark:bg-gray-800 text-primary shadow-lg'*/}
                                        {/*                    : 'bg-transparent text-gray-700 dark:text-gray-300'*/}
                                        {/*            )}*/}
                                        {/*        >*/}
                                        {/*            <ShoppingBag className="w-4 h-4"/>*/}
                                        {/*            Ritiro*/}
                                        {/*        </TabsTrigger>*/}
                                        {/*    </TabsList>*/}
                                        {/*</Tabs>*/}
                                    </div>

                                    {/* Lista prodotti */}
                                    <div className="flex-1 overflow-y-auto px-6 py-4">
                                        <AnimatePresence mode="popLayout">
                                            {cart.length === 0 ? (
                                                <motion.div
                                                    initial={{opacity: 0}}
                                                    animate={{opacity: 1}}
                                                    className="h-full flex flex-col items-center justify-center py-8"
                                                >
                                                    <ShoppingCart className="w-16 h-16 mb-4 text-gray-400"/>
                                                    <p className="text-lg text-gray-500">Il carrello è vuoto</p>
                                                </motion.div>
                                            ) : (
                                                cart.map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        layout
                                                        variants={cartItemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-2"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div
                                                                className="relative w-20 h-20 rounded-lg overflow-hidden">
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                                    €{item.price.toFixed(2)}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => cartActions.decreaseQuantity(item.id)}
                                                                        className="h-8 w-8 rounded-lg"
                                                                    >
                                                                        <Minus className="w-4 h-4"/>
                                                                    </Button>
                                                                    <span
                                                                        className="w-8 text-center font-medium text-gray-900 dark:text-white">
                                                            {item.quantity}
                                                        </span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => cartActions.increaseQuantity(item.id)}
                                                                        className="h-8 w-8 rounded-lg"
                                                                    >
                                                                        <Plus className="w-4 h-4"/>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => cartActions.removeFromCart(item.id)}
                                                            className="ml-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <XCircle className="w-5 h-5"/>
                                                        </Button>
                                                    </motion.div>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {cart.length > 0 && (
                                        <div
                                            className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                            <Button
                                                size="lg"
                                                className="w-full py-4 bg-primary hover:bg-primary-700"
                                                // onClick={() => setCheckoutStep('details')}
                                                onClick={() => router.push("/storeNureboCheckout")}
                                            >
                                                <MdOutlineCreditCard className="mr-2 h-5 w-5"/>
                                                Procedi al Pagamento
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </motion.div>

            <main
                className="max-w-7xl mx-auto px-4 py-6 transition-all duration-300 mt-8"
                style={{
                    marginLeft: isCartOpen ? '0' : 'auto',
                    marginRight: isCartOpen ? '384px' : 'auto'
                }}
            >
                <div className="flex flex-col justify-center md:flex-row gap-8">
                    <div className="xl:w-3/5 order-1 md:order-1">
                        <div className="mb-8">
                            <div className="relative w-full h-96 rounded-xl overflow-hidden cursor-pointer mb-4"
                                 onClick={() => openLightbox(allImages, 0, true)}>
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {allImages.map((src, index) => (
                                    <div
                                        key={index}
                                        className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent cursor-pointer hover:border-primary transition-all"
                                        onClick={() => openLightbox(allImages, index, true)}>
                                        <Image
                                            src={src}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="xl:hidden mb-6">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <div className="space-y-5">
                                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                        <ShoppingBagIcon className="h-6 w-6 text-primary"/>
                                        Prenota ora
                                    </h2>

                                    <div className={`flex items-center gap-3 text-sm p-3 rounded-lg border ${
                                        product.stock <= 5
                                            ? 'bg-red-50 border-red-100'
                                            : product.stock <= 15
                                                ? 'bg-orange-50 border-orange-100'
                                                : 'bg-green-50 border-green-100'
                                    }`}>
                                        <div className={`shrink-0 ${
                                            product.stock <= 5
                                                ? 'text-red-600'
                                                : product.stock <= 15
                                                    ? 'text-orange-600'
                                                    : 'text-green-600'
                                        }`}>
                                            {product.stock <= 5 ? (
                                                <AlertCircle className="h-5 w-5"/>
                                            ) : product.stock <= 15 ? (
                                                <AlertCircle className="h-5 w-5"/>
                                            ) : (
                                                <CheckCircle2 className="h-5 w-5"/>
                                            )}
                                        </div>
                                        <div>
                            <span className={`block font-medium ${
                                product.stock <= 5
                                    ? 'text-red-700'
                                    : product.stock <= 15
                                        ? 'text-orange-700'
                                        : 'text-green-700'
                            }`}>
                                {product.stock <= 5
                                    ? `Solo ${product.stock} pezzi disponibili`
                                    : product.stock <= 15
                                        ? `Solo ${product.stock} pezzi disponibili`
                                        : 'Disponibile in magazzino'}
                            </span>
                                            <span className={`text-xs ${
                                                product.stock <= 5
                                                    ? 'text-red-600'
                                                    : product.stock <= 15
                                                        ? 'text-orange-600'
                                                        : 'text-green-600'
                                            }`}>
                                {product.stock <= 5
                                    ? 'Affrettati, ultimi pezzi!'
                                    : product.stock <= 15
                                        ? 'Scorte limitate'
                                        : 'Tempi di consegna 24/48h'}
                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-4 w-4 text-gray-600"/>
                                            <label className="block text-sm font-medium">Quantità</label>
                                        </div>
                                        <div className="flex items-center border rounded-lg">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="p-3 border-r hover:bg-gray-50"
                                            >
                                                -
                                            </button>
                                            <span className="flex-1 text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="p-3 border-l hover:bg-gray-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/*<div className="space-y-2">*/}
                                    {/*    <div className="flex items-center gap-2">*/}
                                    {/*        <label className="block text-sm font-medium">Data</label>*/}
                                    {/*    </div>*/}
                                    {/*    <Popover>*/}
                                    {/*        <PopoverTrigger asChild>*/}
                                    {/*            <Button*/}
                                    {/*                variant="outline"*/}
                                    {/*                className="h-12 px-4 w-full max-w-[280px] text-left justify-start rounded-lg border-gray-300 hover:bg-gray-50"*/}
                                    {/*            >*/}
                                    {/*                <CalendarIcon className="mr-3 h-5 w-5 text-gray-600"/>*/}
                                    {/*                {selectedDate ? (*/}
                                    {/*                    <span className="font-medium text-gray-800">*/}
                                    {/*                        {format(selectedDate, "EEEE dd MMMM yyyy", {locale: it})}*/}
                                    {/*                    </span>*/}
                                    {/*                ) : (*/}
                                    {/*                    <span className="text-gray-400">Seleziona data</span>*/}
                                    {/*                )}*/}
                                    {/*            </Button>*/}
                                    {/*        </PopoverTrigger>*/}
                                    {/*        <PopoverContent className="w-auto p-4" align="start" sideOffset={5}>*/}
                                    {/*            <Calendar*/}
                                    {/*                mode="single"*/}
                                    {/*                selected={selectedDate}*/}
                                    {/*                onSelect={setSelectedDate}*/}
                                    {/*                disabled={(date) => date < new Date()}*/}
                                    {/*                locale={it}*/}
                                    {/*                className="transform s:scale-[1] md:scale-[1.1] rounded-md"*/}
                                    {/*            />*/}
                                    {/*        </PopoverContent>*/}
                                    {/*    </Popover>*/}
                                    {/*</div>*/}

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between border-t pt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">Totale:</span>
                                                <span className="text-sm text-gray-500">(IVA inclusa)</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-primary-600">
                                    € {(product.price * quantity).toFixed(2).replace('.', ',')}
                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 text-right">
                                            {quantity} {quantity > 1 ? 'articoli' : 'articolo'} ×
                                            €{product.price.toFixed(2).replace('.', ',')}
                                        </div>
                                    </div>

                                    <Button className="w-full py-6 text-lg bg-gray-700 hover:bg-primary-700">
                                        <ShoppingCart className="mr-2 h-5 w-5 "/>
                                        Aggiungi al carrello
                                    </Button>

                                    <div className="text-center text-sm text-gray-500 pt-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <ShieldCheckIcon className="h-5 w-5 text-primary"/>
                                            <span>Prenotazione 100% gratuita</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 pt-2">
                                            <CreditCardIcon className="h-5 w-5 text-primary"/>
                                            <span>Importo da pagare al momento del ritiro</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <section id="descrizione" className="mt-0 space-y-4">
                            <div className="bg-white p-6">
                                <h2 className="text-2xl font-bold mb-4">Descrizione prodotto</h2>
                                <div className="prose max-w-none">
                                    <p className="text-lg text-gray-700 mb-4">
                                        {product.description}
                                    </p>
                                    <div className="space-y-2 mt-8">
                                        <h4 className="text-lg font-semibold">Caratteristiche Principali</h4>
                                        <ul className="list-disc pl-6 space-y-2">
                                            {product.details.features.map((feature, i) => (
                                                <li key={i} className="text-gray-700">{feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="specifiche" className="mt-0 bg-white p-6">
                            <h2 className="text-2xl font-bold mb-6">Specifiche tecniche</h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Package className="w-6 h-6 text-primary"/>
                                    <div>
                                        <div className="font-semibold">Materiale</div>
                                        <div className="text-gray-600">{product.details.material}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Ruler className="w-6 h-6 text-primary"/>
                                    <div>
                                        <div className="font-semibold">Peso</div>
                                        <div className="text-gray-600">{product.details.weight}</div>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold mb-4">Dettagli tecnici</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(product.specifications).map(([category, items]) => (
                                    <div key={category} className="bg-gray-50 p-4 rounded-lg">
                                        <dl className="space-y-2">
                                            {items.map((item, i) => (
                                                typeof item === 'object' ? (
                                                    <div key={i} className="flex justify-between border-b pb-1">
                                                        <dt className="text-gray-600">{item.label}</dt>
                                                        <dd className="font-medium">{item.value}</dd>
                                                    </div>
                                                ) : (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600"/>
                                                        <span>{item}</span>
                                                    </div>
                                                )
                                            ))}
                                        </dl>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="hidden xl:block md:w-2/5 relative order-2 md:order-2">
                        <div className="md:sticky md:top-28 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <div className="space-y-5">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <ShoppingBagIcon className="h-6 w-6 text-primary"/>
                                    Acquista ora
                                </h2>

                                <div className={`flex items-center gap-3 text-sm p-3 rounded-lg border ${
                                    product.stock <= 5
                                        ? 'bg-red-50 border-red-100'
                                        : product.stock <= 15
                                            ? 'bg-orange-50 border-orange-100'
                                            : 'bg-green-50 border-green-100'
                                }`}>
                                    <div className={`shrink-0 ${
                                        product.stock <= 5
                                            ? 'text-red-600'
                                            : product.stock <= 15
                                                ? 'text-orange-600'
                                                : 'text-green-600'
                                    }`}>
                                        {product.stock <= 5 ? (
                                            <AlertCircle className="h-5 w-5"/>
                                        ) : product.stock <= 15 ? (
                                            <AlertCircle className="h-5 w-5"/>
                                        ) : (
                                            <CheckCircle2 className="h-5 w-5"/>
                                        )}
                                    </div>
                                    <div>
                        <span className={`block font-medium ${
                            product.stock <= 5
                                ? 'text-red-700'
                                : product.stock <= 15
                                    ? 'text-orange-700'
                                    : 'text-green-700'
                        }`}>
                            {product.stock <= 5
                                ? `Solo ${product.stock} pezzi disponibili`
                                : product.stock <= 15
                                    ? `Solo ${product.stock} pezzi disponibili`
                                    : 'Disponibile in magazzino'}
                        </span>
                                        <span className={`text-xs ${
                                            product.stock <= 5
                                                ? 'text-red-600'
                                                : product.stock <= 15
                                                    ? 'text-orange-600'
                                                    : 'text-green-600'
                                        }`}>
                            {product.stock <= 5
                                ? 'Affrettati, ultimi pezzi!'
                                : product.stock <= 15
                                    ? 'Scorte limitate'
                                    : 'Tempi di consegna 24/48h'}
                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-4 w-4 text-gray-600"/>
                                        <label className="block text-sm font-medium">Quantità</label>
                                    </div>
                                    <div className="flex items-center border rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-3 border-r hover:bg-gray-50"
                                        >
                                            -
                                        </button>
                                        <span className="flex-1 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="p-3 border-l hover:bg-gray-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/*<div className="space-y-2">*/}
                                {/*    <div className="flex items-center gap-2">*/}
                                {/*        <label className="block text-sm font-medium">Data</label>*/}
                                {/*    </div>*/}
                                {/*    <Popover>*/}
                                {/*        <PopoverTrigger asChild>*/}
                                {/*            <Button*/}
                                {/*                variant="outline"*/}
                                {/*                className="h-12 px-4 w-full max-w-[280px] text-left justify-start rounded-lg border-gray-300 hover:bg-gray-50"*/}
                                {/*            >*/}
                                {/*                <CalendarIcon className="mr-3 h-5 w-5 text-gray-600"/>*/}
                                {/*                {selectedDate ? (*/}
                                {/*                    <span className="font-medium text-gray-800">*/}
                                {/*        {format(selectedDate, "EEEE dd MMMM yyyy", {locale: it})}*/}
                                {/*    </span>*/}
                                {/*                ) : (*/}
                                {/*                    <span className="text-gray-400">Seleziona data</span>*/}
                                {/*                )}*/}
                                {/*            </Button>*/}
                                {/*        </PopoverTrigger>*/}
                                {/*        <PopoverContent className="w-auto p-4" align="start" sideOffset={5}>*/}
                                {/*            <Calendar*/}
                                {/*                mode="single"*/}
                                {/*                selected={selectedDate}*/}
                                {/*                onSelect={setSelectedDate}*/}
                                {/*                disabled={(date) => date < new Date()}*/}
                                {/*                locale={it}*/}
                                {/*                className="transform s:scale-[1] md:scale-[1.1] rounded-md"*/}
                                {/*            />*/}
                                {/*        </PopoverContent>*/}
                                {/*    </Popover>*/}
                                {/*</div>*/}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">Totale:</span>
                                            <span className="text-sm text-gray-500">(IVA inclusa)</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary-600">
                                € {(product.price * quantity).toFixed(2).replace('.', ',')}
                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 text-right">
                                        {quantity} {quantity > 1 ? 'articoli' : 'articolo'} ×
                                        €{product.price.toFixed(2).replace('.', ',')}
                                    </div>
                                </div>

                                <Button className="w-full py-6 text-lg bg-gray-700 hover:bg-primary-700">
                                    <ShoppingCart className="mr-2 h-5 w-5"/>
                                    Aggiungi al carrello
                                </Button>

                                <div className="text-center text-sm text-gray-500 pt-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <ShieldCheckIcon className="h-5 w-5 text-primary"/>
                                        <span>Prenotazione 100% gratuita</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <CreditCardIcon className="h-5 w-5 text-primary"/>
                                        <span>Importo da pagare al momento del ritiro</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="mt-12 relative px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Prodotti Correlati</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                                    className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-md hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft className="h-6 w-6 text-gray-700 stroke-[1.5]"/>
                                </button>
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-md hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={currentIndex >= Math.ceil(product.relatedProducts.length / itemsPerView)}
                                >
                                    <ChevronRight className="h-6 w-6 text-gray-700 stroke-[1.5]"/>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-hidden">
                            <div className="flex transition-transform duration-300 ease-in-out gap-4"
                                 style={{transform: `translateX(-${currentIndex * 100}%)`}}>
                                {product.relatedProducts.map((item, index) => (
                                    <Link
                                        key={item.name}
                                        href={`/storeNureboProduct`}
                                        className="block flex-shrink-0 w-full sm:w-[calc(100%-16px)] md:w-[calc(50%-16px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-16px)]"
                                    >
                                        <div className="h-full border rounded-lg p-4 transition-shadow flex flex-col hover:shadow-lg">
                                            <div className="relative h-48 mb-4">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover rounded-lg"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <h3 className="font-semibold text-lg line-clamp-2 mb-2">{item.name}</h3>
                                                <p className="text-blue-600 font-medium mb-4">{item.price}</p>
                                                <Button className="mt-auto w-full" variant="outline">
                                                    <ShoppingCart className="mr-2 h-4 w-4"/>
                                                    Acquista ora
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Lightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({...prev, isOpen: false}))}
                images={lightboxState.images}
                initialIndex={lightboxState.initialIndex}
                showNavigation={lightboxState.showNavigation}
            />

            <footer className="border-t bg-gray-50 mt-0 animate-[fade-in_0.5s_ease-out]">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-600">Nurebo</h3>
                            <p className="text-sm text-gray-600">
                                Scopri i migliori ristoranti e prenota il tuo tavolo in pochi click
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900">Company</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-sm text-gray-600 hover:text-green-600">Chi siamo</a>
                                </li>
                                <li><a href="#" className="text-sm text-gray-600 hover:text-green-600">Blog</a></li>
                                <li><a href="#" className="text-sm text-gray-600 hover:text-green-600">Lavora con
                                    noi</a></li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-sm text-gray-600 hover:text-green-600">Privacy
                                    Policy</a></li>
                                <li><a href="#" className="text-sm text-gray-600 hover:text-green-600">Termini e
                                    condizioni</a></li>
                                <li><a href="#" className="text-sm text-gray-600 hover:text-green-600">Cookie Policy</a>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900">Scarica l app</h4>
                            <div className="flex flex-col items-start space-y-2">
                                <a href="#" className="max-w-[160px]">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                                        className="h-8 w-full object-contain"
                                        alt="App Store"
                                    />
                                </a>
                                <a href="#" className="max-w-[160px]">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                        className="h-8 w-full object-contain"
                                        alt="Google Play"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t pt-8">
                        <p className="text-xs text-gray-600 text-center">
                            © {new Date().getFullYear()} Nurebo. Tutti i diritti riservati.
                        </p>
                    </div>
                </div>
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

export default ProductPage;