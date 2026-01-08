'use client'

import React, {useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link'
import {Button} from "@/components/ui/button";
import {
    MapPin, ChevronDown, X, Star, Utensils, // Per il tipo cucina
    Clock,    // Per gli orari
    Heart     // Per i preferiti
} from "lucide-react";

const CITIES = ['Milano', 'Roma', 'Firenze', 'Torino', 'Napoli', 'Bologna', 'Venezia', 'Palermo', 'Genova', 'Bari', 'Catania', 'Verona', 'Padova', 'Trieste', 'Perugia', 'Parma', 'Modena', 'Reggio Calabria', 'Cagliari', 'Livorno', 'Rimini', 'Matera', 'Siracusa', 'Bergamo', 'Brescia', 'Ferrara', 'Ravenna', 'Trento', 'Bolzano'];

const MOCK_RESULTS = [
    {
        id: 1,
        name: 'Ristorante Gourmet',
        address: 'Via Monte Napoleone, 5, Milano',
        image: 'https://images.pexels.com/photos/1267321/pexels-photo-1267321.jpeg',
        price: 65,
        currency: '€',
        cuisine: 'Italiana contemporanea',
        rating: 4.8,
        isOpen: true
    },
    {
        id: 2,
        name: 'Trattoria Tipica',
        address: 'Piazza Navona, 12, Roma',
        image: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg',
        price: 35,
        currency: '€',
        cuisine: 'Cucina romana',
        rating: 4.3,
        isOpen: true
    },
    {
        id: 3,
        name: 'Sushi Palace',
        address: 'Via della Spiga, 30, Milano',
        image: 'https://images.pexels.com/photos/1058093/pexels-photo-1058093.jpeg',
        price: 55,
        currency: '€',
        cuisine: 'Giapponese',
        rating: 4.6,
        isOpen: false
    },
    {
        id: 4,
        name: 'Pizzeria Napoli',
        address: 'Via dei Tribunali, 12, Napoli',
        image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg',
        price: 12,
        currency: '€',
        cuisine: 'Pizza napoletana',
        rating: 4.7,
        isOpen: true
    },
    {
        id: 5,
        name: 'Osteria del Ponte',
        address: 'Via Ponte Vecchio, 55R, Firenze',
        image: 'https://images.pexels.com/photos/6591877/pexels-photo-6591877.jpeg',
        price: 28,
        currency: '€',
        cuisine: 'Toscana',
        rating: 4.4,
        isOpen: true
    },
    {
        id: 6,
        name: 'Bistrot Français',
        address: 'Via del Corso, 200, Roma',
        image: 'https://images.pexels.com/photos/373639/pexels-photo-373639.jpeg',
        price: 48,
        currency: '€',
        cuisine: 'Francese',
        rating: 4.5,
        isOpen: true
    },
    {
        id: 7,
        name: 'Steakhouse Argentino',
        address: 'Corso Vittorio Emanuele II, 4, Torino',
        image: 'https://images.pexels.com/photos/65174/pexels-photo-65174.jpeg',
        price: 75,
        currency: '€',
        cuisine: 'Carni argentine',
        rating: 4.9,
        isOpen: true
    },
    {
        id: 8,
        name: 'Ramen Ya',
        address: 'Via Paolo Sarpi, 8, Milano',
        image: 'https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg',
        price: 18,
        currency: '€',
        cuisine: 'Ramen',
        rating: 4.2,
        isOpen: true
    },
    {
        id: 9,
        name: 'Trattoria Romana',
        address: 'Via della Croce, 76, Roma',
        image: 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg',
        price: 25,
        currency: '€',
        cuisine: 'Lazio',
        rating: 4.1,
        isOpen: false
    },
    {
        id: 10,
        name: 'Hostaria dei Vespri',
        address: 'Piazza dei Vespri, 6, Palermo',
        image: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg',
        price: 42,
        currency: '€',
        cuisine: 'Siciliana',
        rating: 4.7,
        isOpen: true
    },
    {
        id: 11,
        name: 'Ristorante Panoramico',
        address: 'Piazzale Michelangelo, 1, Firenze',
        image: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg',
        price: 95,
        currency: '€',
        cuisine: 'Gourmet',
        rating: 4.9,
        isOpen: true
    },
    {
        id: 12,
        name: 'Pescheria da Marco',
        address: 'Via San Gregorio Armeno, 15, Napoli',
        image: 'https://images.pexels.com/photos/8436551/pexels-photo-8436551.jpeg',
        price: 38,
        currency: '€',
        cuisine: 'Pesce',
        rating: 4.6,
        isOpen: true
    },
    {
        id: 13,
        name: 'Il Vegetariano',
        address: 'Via dei Giubbonari, 21, Roma',
        image: 'https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg',
        price: 22,
        currency: '€',
        cuisine: 'Vegetariano',
        rating: 4.0,
        isOpen: true
    },
    {
        id: 14,
        name: 'Tapas Bar Español',
        address: 'Corso Como, 10, Milano',
        image: 'https://images.pexels.com/photos/4666858/pexels-photo-4666858.jpeg',
        price: 20,
        currency: '€',
        cuisine: 'Spagnola',
        rating: 4.3,
        isOpen: true
    }
];

const restaurantImages = ['https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?h=1080&w=1920', // Tacos gourmet
    'https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?h=1080&w=1920',    // Sushi premium
    'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?h=1080&w=1920',   // Pasta fresca
    'https://images.pexels.com/photos/323682/pexels-photo-323682.jpeg?h=1080&w=1920',    // Dessert al cioccolato
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?h=1080&w=1920',     // Interno ristorante elegante
    'https://images.pexels.com/photos/704982/pexels-photo-704982.jpeg?h=1080&w=1920',     // Hamburger artigianale
    'https://images.pexels.com/photos/3338491/pexels-photo-3338491.jpeg?h=1080&w=1920',   // Tagliere formaggi
    'https://images.pexels.com/photos/5491337/pexels-photo-5491337.jpeg?h=1080&w=1920',   // Cucina open-space
    'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?h=1080&w=1920',     // Cocktail bar
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?h=1080&w=1920',   // Pizza tradizionale
    'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?h=1080&w=1920',   // Piatti fusion
    'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?h=1080&w=1920'    // Brunch
];


const TheForkHomePage = () => {
    const [selectedCity, setSelectedCity] = useState('');
    const [inputWidth, setInputWidth] = useState(200);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const carouselRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [hoverStates, setHoverStates] = useState({});
    const router = useRouter();


    const handlePrenotaDiretta = (restaurantId) => {
        // router.push(`/ristorante/${restaurantId}`)
        router.push(`/prenotazione/crosta-d-oro-corsico`)
        // window.location.href = `/ristorante/${restaurantId}`

    }

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isHovered && carouselRef.current) {
                const nextIndex = (currentIndex + 1) % MOCK_RESULTS.length;
                const scrollPosition = nextIndex * 320;

                carouselRef.current.scrollTo({
                    left: scrollPosition, behavior: 'smooth'
                });
                setCurrentIndex(nextIndex);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentIndex, isHovered]);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const cardWidth = 320;
            const scrollAmount = direction === 'next' ? currentIndex * cardWidth + cardWidth : currentIndex * cardWidth - cardWidth;

            carouselRef.current.scrollTo({
                left: scrollAmount, behavior: 'smooth'
            });

            setCurrentIndex(prev => Math.max(0, Math.min(MOCK_RESULTS.length - 1, direction === 'next' ? prev + 1 : prev - 1)))
        }
    };

    useEffect(() => {
        if (inputRef.current) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
                context.font = getComputedStyle(inputRef.current).font;
                const text = selectedCity || 'Seleziona città';
                const textWidth = context.measureText(text).width;
                setInputWidth(Math.max(200, textWidth + 40));
            }
        }
    }, [selectedCity]);

    // useEffect(() => {
    //     const handleClickOutside = (event) => {
    //         const isLink = event.target.closest('a') // Rileva se il click è su un Link
    //         const isButton = event.target.closest('button') // Rileva se il click è su un Button
    //
    //         if (
    //             dropdownRef.current &&
    //             !dropdownRef.current.contains(event.target) &&
    //             !isLink && // Ignora click su Link
    //             !isButton // Ignora click su Button
    //         ) {
    //             setIsDropdownOpen(false)
    //             setShowResults(false)
    //         }
    //     }
    //
    //     document.addEventListener('mousedown', handleClickOutside)
    //     return () => document.removeEventListener('mousedown', handleClickOutside)
    // }, [dropdownRef])

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setIsDropdownOpen(false);
        setShowResults(true);
    };

    return (<div className="bg-white">
        <header
            className="py-4 px-6 flex items-center justify-between border-b border-gray-200 animate-[fade-in_0.5s_ease-out,slide-down_0.5s_ease-out]">
            <div className="flex items-center gap-2">
                <a href="/" className="text-xl font-bold text-green-600">Nurebo</a>
            </div>
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="hover:animate-scale-in"
                >
                    Scarica l app
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Accedi</Button>
            </div>
        </header>

        <main className="relative">
            <div className="mx-4 mt-6 md:mt-8 lg:mt-10 rounded-2xl border-0 shadow-xl">
                <div className="relative s:h-[320px] md:h-[400px] lg:h-[420px] rounded-2xl overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1513104890138-7c749659a591"
                        alt="Restaurant Table"
                        // className="absolute inset-0 w-full h-full object-cover"
                        className="absolute inset-0 w-full h-full object-cover animate-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                    <div className="absolute inset-0 flex items-start justify-center pt-14 md:pt-16">
                        <div className="text-center text-white relative z-10 space-y-12">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold px-4 tracking-tight animate-[fade-in-up_0.8s_ease-out,slide-up_0.8s_ease-out]">
                                Scopri sapori <br/> indimenticabili
                            </h1>
                        </div>
                    </div>
                </div>

                <div
                    className="absolute inset-x-0 s:top-[200px] md:top-[250px] lg:top-[280px] transform -translate-y-1/2 z-50">
                    <div className="flex flex-col items-center gap-4 w-full px-4 mx-auto container">
                        <div className="relative group s:w-[90%] sm:w-[80%] md:w-[50%] lg:w-[35%] xl:w-[25%]"
                             ref={dropdownRef}>
                            {/*<div*/}
                            {/*    className="flex items-center bg-white rounded-full shadow-xl transition-all duration-300 group-hover:shadow-2xl focus-within:shadow-2xl overflow-hidden">*/}
                            <div
                                className="flex items-center bg-white rounded-full shadow-xl transition-all duration-300 group-hover:shadow-2xl focus-within:shadow-2xl overflow-hidden">
                                <div className="flex items-center flex-1 pl-4 pr-2">
                                    <MapPin className="w-6 h-6 text-green-500 shrink-0"/>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center justify-between w-full px-4 py-4 gap-2"
                                    >
                                        <span ref={inputRef}
                                              className="text-gray-700 truncate text-lg font-medium flex-1 text-left"
                                              style={{width: inputWidth}}
                                        >
                                            {selectedCity || 'Seleziona città'}
                                        </span>
                                        <ChevronDown
                                            className={`w-6 h-6 text-gray-500 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''} shrink-0`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {isDropdownOpen && (<div
                                    className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl z-[9999] max-h-[60vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {CITIES.map((city) => (<button
                                            key={city}
                                            onClick={() => handleCitySelect(city)}
                                            // className="w-full px-8 py-4 text-left hover:bg-green-50 transition-colors border-b last:border-b-0 text-gray-700 text-lg font-medium"
                                            className="w-full px-8 py-4 text-left hover:bg-green-50 hover:text-green-500 transition-colors border-b last:border-b-0 text-gray-700 text-lg font-medium"
                                        >
                                            {city}
                                        </button>))}
                                </div>)}
                        </div>
                    </div>
                </div>
            </div>

            {showResults && !isDropdownOpen && (<div
                className="absolute s:top-[105%] md:top-[98%] left-1/2 -translate-x-1/2 -translate-y-[20%] w-full max-w-2xl z-[9999] px-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[60vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {MOCK_RESULTS.length} risultati per {selectedCity}
                        </h3>
                        <X
                            className="w-6 h-6 text-gray-500 cursor-pointer hover:text-red-500 animate-pulse-slow"
                            onClick={() => setShowResults(false)}
                        />
                    </div>

                    <div className="divide-y">
                        {MOCK_RESULTS.map((result, index) => (
                            <Link
                                key={result.name}
                                // href={`/ristorante/${result.name}`}
                                // href={`/prenotazione/crosta-d-oro-corsico`}
                                // href={`/ristorante1`}
                                href={`/ristoranteDetailPage`}
                                // className="block px-6 py-4 hover:bg-green-50 transition-colors"
                            >
                                {/*<div*/}
                                {/*    key={result.id}*/}
                                {/*    className="group px-6 py-4 hover:bg-green-50 transition-colors cursor-pointer"*/}
                                {/*>*/}
                                {/*    <img*/}
                                {/*        src={result.image}*/}
                                {/*        alt={result.name}*/}
                                {/*        className="w-full h-48 object-cover rounded-lg mb-4 shadow-md"*/}
                                {/*    />*/}
                                {/*    <div className="flex justify-between items-center">*/}
                                {/*        <div>*/}
                                {/*            <h4 className="text-lg font-medium text-gray-900 group-hover:text-green-500 transition-colors">*/}
                                {/*                {result.name}*/}
                                {/*            </h4>*/}
                                {/*            <div className="flex items-center gap-2 mt-1">*/}
                                {/*                <div*/}
                                {/*                    className="flex items-center gap-1 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">*/}
                                {/*                    <MapPin*/}
                                {/*                        className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors"/>*/}
                                {/*                    <span className="group-hover:text-green-600">{result.address}</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*        <Link*/}
                                {/*            href="/prenotazione/crosta-d-oro-corsico"*/}
                                {/*            className="text-green-700 hover:text-green-800"*/}
                                {/*        >*/}
                                {/*            <Button*/}
                                {/*                size="sm"*/}
                                {/*                className="bg-green-600 hover:bg-green-700"*/}
                                {/*                onClick={(e) => {*/}
                                {/*                    //     e.stopPropagation()*/}
                                {/*                    //     handlePrenotaDiretta(result.name)*/}
                                {/*                }}>*/}
                                {/*                Prenota*/}
                                {/*            </Button>*/}
                                {/*        </Link>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                                {/**/}
                                {/*<div*/}
                                {/*    key={result.id}*/}
                                {/*    className="group flex gap-4 px-6 py-4 hover:bg-green-50 transition-colors cursor-pointer"*/}
                                {/*>*/}
                                {/*    /!* Immagine a sinistra *!/*/}
                                {/*    <img*/}
                                {/*        src={result.image}*/}
                                {/*        alt={result.name}*/}
                                {/*        className="w-16 h-16 object-cover rounded-lg shadow-md"*/}
                                {/*    />*/}

                                {/*    /!* Contenuto con pulsante allineato al centro *!/*/}
                                {/*    <div className="flex-1 flex items-center justify-between">*/}
                                {/*        <div>*/}
                                {/*            <h4 className="text-lg font-medium text-gray-900 group-hover:text-green-500 transition-colors">*/}
                                {/*                {result.name}*/}
                                {/*            </h4>*/}
                                {/*            <div className="flex items-center gap-2 mt-1">*/}
                                {/*                <div*/}
                                {/*                    className="flex items-center gap-1 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">*/}
                                {/*                    <MapPin*/}
                                {/*                        className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors"/>*/}
                                {/*                    <span className="group-hover:text-green-600">{result.address}</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}

                                {/*        /!* Pulsante centrato verticalmente *!/*/}
                                {/*        <div className="h-full flex items-center pr-2">*/}
                                {/*            <Link*/}
                                {/*                href="/prenotazione/crosta-d-oro-corsico"*/}
                                {/*                className="text-green-700 hover:text-green-800"*/}
                                {/*            >*/}
                                {/*                <Button*/}
                                {/*                    size="sm"*/}
                                {/*                    className="bg-green-600 hover:bg-green-700"*/}
                                {/*                    onClick={(e) => {*/}
                                {/*                        //     e.stopPropagation()*/}
                                {/*                        //     handlePrenotaDiretta(result.name)*/}
                                {/*                    }}>*/}
                                {/*                    Prenota*/}
                                {/*                </Button>*/}
                                {/*            </Link>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                                <div
                                    key={result.id}
                                    className="group flex gap-4 px-6 py-4 hover:bg-green-50 transition-colors cursor-pointer"
                                >
                                    {/* Immagine a sinistra */}
                                    <img
                                        src={result.image}
                                        alt={result.name}
                                        className="w-16 h-16 object-cover rounded-lg shadow-md"
                                    />

                                    {/* Contenuto con pulsante allineato al centro */}
                                    <div className="flex-1 flex justify-between">
                                        {/* Testo allineato in alto */}
                                        <div className="flex flex-col justify-start">
                                            <h4 className="text-lg font-medium text-gray-900 group-hover:text-green-500 transition-colors">
                                                {result.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div
                                                    className="flex items-center gap-1 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                                                    <MapPin
                                                        className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors"/>
                                                    <span className="group-hover:text-green-600">{result.address}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pulsante centrato verticalmente */}
                                        <div className="h-full flex items-center pl-4">
                                            <Link
                                                href="/prenotazione/crosta-d-oro-corsico"
                                                className="text-green-700 hover:text-green-800"
                                            >
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={(e) => {
                                                        //     e.stopPropagation()
                                                        //     handlePrenotaDiretta(result.name)
                                                    }}>
                                                    Prenota
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>)}
        </main>

        <section className="py-16 px-4 relative">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 px-4 text-center">
                    Scopri i nostri ristoranti
                </h2>

                <div className="relative group">
                    {/* Navigazione */}
                    <div className="absolute inset-y-0 -left-4 z-20 flex items-center">
                        <button
                            onClick={() => scroll('prev')}
                            className="p-3 bg-white/90 hover:bg-white rounded-full shadow-xl transform -translate-y-1/2 transition-all hover:scale-110"
                        >
                            <ChevronDown className="w-6 h-6 text-gray-700 rotate-90"/>
                        </button>
                    </div>

                    <div className="absolute inset-y-0 -right-4 z-20 flex items-center">
                        <button
                            onClick={() => scroll('next')}
                            className="p-3 bg-white/90 hover:bg-white rounded-full shadow-xl transform -translate-y-1/2 transition-all hover:scale-110"
                        >
                            <ChevronDown className="w-6 h-6 text-gray-700 -rotate-90"/>
                        </button>
                    </div>

                    {/* Carousel con scrollbar nascosta */}

                    <div
                        ref={carouselRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth gap-4 px-4 pb-4"
                        style={{
                            scrollbarWidth: 'none', msOverflowStyle: 'none', '&::-webkit-scrollbar': {display: 'none'}
                        }}
                    >
                        {MOCK_RESULTS.map((restaurant, index) => (<div
                                key={restaurant.id}
                                className="relative flex-shrink-0 w-64 h-80 snap-start overflow-hidden rounded-xl shadow-md transition-shadow duration-300 cursor-pointer"
                                onMouseEnter={() => setHoverStates(prev => ({...prev, [restaurant.id]: true}))}
                                onMouseLeave={() => setHoverStates(prev => ({...prev, [restaurant.id]: false}))}
                            >
                                {/* Immagine con overlay dinamico */}
                                <div className="relative h-full">
                                    <img
                                        src={restaurantImages[index % restaurantImages.length]}
                                        alt={restaurant.name}
                                        className={`w-full h-full object-cover transition-transform duration-500 ease-out ${hoverStates[restaurant.id] ? 'scale-110' : 'scale-100'}`}
                                        loading="lazy"
                                    />

                                    {/* Overlay scurimento */}
                                    <div
                                        // className={`absolute inset-0 bg-black/0 transition-all duration-300 ${hoverStates[restaurant.id] ? 'bg-black/30' : ''
                                        className={`absolute inset-0 transition-all duration-300 bg-black/10`}>
                                    </div>
                                </div>

                                {/* Contenuto sovrapposto */}
                                <div className="absolute inset-0 flex flex-col justify-between p-4">
                                    {/* Badge categoria */}
                                    <div
                                        className="bg-white/90 pl-2 pr-3 py-1 rounded-full text-sm font-medium shadow-sm w-fit">
                                        {'⭐ Top Rated'}
                                    </div>

                                    {/* Card trasparente */}
                                    <div className="bg-white/90 p-4 rounded-lg shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-800 truncate">{restaurant.name}</h3>
                                        <div className="flex items-center mt-1 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 mr-1 flex-shrink-0 text-green-500"/>
                                            <span className="truncate">{restaurant.address}</span>
                                        </div>

                                        <Button
                                            size="sm"
                                            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Prenota
                                        </Button>
                                    </div>
                                </div>
                            </div>))}
                    </div>
                </div>
            </div>
        </section>

        <footer className="border-t bg-gray-50 mt-0 animate-[fade-in_0.5s_ease-out]">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-green-600">Nurebo</h3>
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
    </div>);
};

export default TheForkHomePage;