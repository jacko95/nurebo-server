"use client"
import React, {useEffect, useState, useRef} from 'react'
// import Listing from './Listing'
// import {toast} from 'sonner';
import GoogleMapSection from './GoogleMapSection';
import {Bath, BedDouble, MapPin, Ruler, Search, X, Store, Filter, ChevronDown, Check, Sliders} from 'lucide-react'
import Image from 'next/image'
import {useRouter} from "next/navigation";


function ListingMapView({type}) {
    const router = useRouter();
    const [listing, setListing] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [coordinates, setCoordinates] = useState();
    const [showMap, setShowMap] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // Nuovo stato per la ricerca
    // Nuovi stati per i filtri
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        category: [],
        priceRange: { min: 0, max: 1000 },
        stock: 'all', // all, inStock, lowStock
        rating: 0,
    });
    const filtersRef = useRef(null);
    const mockListingData = [
        {
            id: 1,
            productName: "Adidas Uomo Essentials Linear Single Jersey Tee",
            brandName: "Adidas",
            storeName: "Liberty Abbigliamento Uomo",
            storeAddress: "Piazza Prealpi, 2, Milano",
            productDescription: "",
            price: 13.99,
            stock: 25,
            category: "Abbigliamento",
            rating: 4.8,
            productType: "abbigliamento",
            active: true,
            lat: 45.4680,
            lng: 9.1920,
            productImages: [{ url: "https://m.media-amazon.com/images/I/61l7HqCOMPL._AC_SX522_.jpg" }]
        },
        {
            id: 2,
            productName: "JACK & JONES T-Shirt 3-Pack Logo O-Neck T-Shirt",
            brandName: "JACK & JONES",
            storeName: "Manganini Abbigliamento",
            storeAddress: "Via Alessandro Astesani, 8, Milano",
            productDescription: "Confezione da 3 T-shirt con logo stampato",
            price: 54.49,
            stock: 12,
            category: "Abbigliamento",
            rating: 4.7,
            productType: "abbigliamento",
            active: true,
            lat: 41.9100,
            lng: 12.4760,
            productImages: [{ url: "https://m.media-amazon.com/images/I/51Kx7p87+BL._AC_SY679_.jpg" }]
        },
        {
            id: 3,
            productName: "Ariasana Aero 360° deumidificatore ricaricabile",
            brandName: "Ariasana",
            storeName: "Happy Casa",
            storeAddress: "Via Arquà, 3, Milano",
            productDescription: "Deumidificatore ricaricabile non elettrico, assorbi umidità contro condensa e muffa, 1 dispositivo e 1 ricarica Tab lavanda da 450g",
            price: 18.92,
            stock: 8,
            category: "Climatizzazione e riscaldamento",
            rating: 4.6,
            productType: "Deumidificatori",
            active: true,
            lat: 45.493337697348075,
            lng: 9.228019527724712,
            productImages: [{ url: "https://m.media-amazon.com/images/I/81L+T0ve0AL._AC_SL1500_.jpg" }]
        },
        {
            id: 4,
            productName: "Libraton Sbavatore di Attrezzi Set con 11 Lame di Ricambio",
            brandName: "Libraton",
            storeName: "Ferramenta Casati & Galli",
            storeAddress: "Via Porta Ronca, 90, Rho",
            productDescription: "Set di sbavatori con 11 lame di ricambio per metallo, plastica, legno, PVC, alluminio",
            price: 95.59,
            stock: 15,
            category: "Strumenti da taglio",
            rating: 4.9,
            productType: "Tagliatori per sbavatura",
            active: true,
            lat: 45.53022660309111,
            lng: 9.03497399639004,
            productImages: [{ url: "https://m.media-amazon.com/images/I/81XbvgvJMML._SL1500_.jpg" }]
        },
        {
            id: 5,
            productName: "NAME IT Nitbamgo Reg/R TwiCa Noos Pantaloni",
            brandName: "NAME IT",
            storeName: "Matia's Fashion Outlet",
            storeAddress: "Via Antonio Canova, 2, Nerviano",
            productDescription: "Pantaloni da uomo in tessuto tecnico elasticizzato",
            price: 12.75,
            stock: 7,
            category: "Abbigliamento",
            rating: 4.5,
            productType: "Pantaloni",
            active: true,
            lat: 40.8350,
            lng: 14.2480,
            productImages: [{ url: "https://m.media-amazon.com/images/I/712PNAMrnwL._AC_SY550_.jpg" }]
        },
        {
            id: 6,
            productName: "HOMCA Cuscino Cervicale Ergonomico in Memory Foam",
            brandName: "HOMCA",
            storeName: "Ortopedia Podologia Rensi",
            storeAddress: "Via de' Tornabuoni 73, Firenze",
            productDescription: "Cuscino ortopedico per collo e spalle in memory foam",
            price: 49.24,
            stock: 3,
            category: "Ortopedia",
            rating: 4.8,
            productType: "Ortopedia",
            active: true,
            lat: 45.49994705297507,
            lng: 9.106330496095865,
            productImages: [{ url: "https://m.media-amazon.com/images/I/71Fi4kvlsYL._AC_SX569_.jpg" }]
        },
        {
            id: 7,
            productName: "Imetec Scaldasonno Adapto singolo 150 x 80 cm",
            brandName: "Imetec",
            storeName: "Le Cose Di Casa",
            storeAddress: "Via Carlo Rota, 20, Monza",
            productDescription: "Coperta elettrica con tecnologia Adapto per un calore personalizzato",
            price: 29.15,
            stock: 5,
            category: "Casa",
            rating: 4.9,
            productType: "Coperte e trapunte",
            active: true,
            lat: 45.59911021360016,
            lng: 9.287190476853596,
            productImages: [{ url: "https://m.media-amazon.com/images/I/71mghsLVb0L._AC_SY300_SX300_QL70_ML2_.jpg" }]
        },
        {
            id: 8,
            productName: "Decqle Adattatore Universale da Viaggio con 2 USB-C",
            brandName: "Decqle",
            storeName: "Telefonia Bronzetti",
            storeAddress: "Corso Buenos Aires 42, Milano",
            productDescription: "Adattatore da viaggio universale con 2 porte USB-C PD 20W",
            price: 24.86,
            stock: 18,
            category: "Elettronica",
            rating: 4.8,
            productType: "Accessori di alimentazione elettrica",
            active: true,
            lat: 45.4790,
            lng: 9.2100,
            productImages: [{ url: "https://m.media-amazon.com/images/I/61jD5viM+AL._AC_UL480_FMwebp_QL65_.jpg" }]
        },
        {
            id: 9,
            productName: "Dweyka Pistola per Colla a Caldo",
            brandName: "Dweyka",
            storeName: "Ferramenta Marzi",
            storeAddress: "Piazza Gae Aulenti 12, Milano",
            productDescription: "Pistola per colla a caldo professionale con 10 bastoncini di colla inclusi",
            price: 9.9,
            stock: 22,
            category: "Fai da te",
            rating: 4.7,
            productType: "Utensili elettrici",
            active: true,
            lat: 45.4830,
            lng: 9.1890,
            productImages: [{ url: "https://m.media-amazon.com/images/I/61gDSV4q-cL._AC_SL1200_.jpg" }]
        },
        {
            id: 10,
            productName: "Pepe Jeans Izabel Turtleneck Maglieria Donna",
            brandName: "Pepe Jeans",
            storeName: "Vestistock",
            storeAddress: "Via del Corso 88, Roma",
            productDescription: "Sneakers classiche bianco/verde",
            price: 9,
            stock: 35,
            category: "Abbigliamento",
            rating: 4.5,
            productType: "Maglioni",
            active: true,
            lat: 41.9050,
            lng: 12.4800,
            productImages: [{ url: "https://m.media-amazon.com/images/I/41a332Js50L._AC_SX522_.jpg" }]
        },
        {
            id: 11,
            productName: "Dyson Airwrap Complete",
            storeName: "Sephora Napoli",
            storeAddress: "Via Toledo 156, Napoli",
            productDescription: "Styler multi-funzione per capelli",
            price: 549,
            stock: 6,
            category: "Bellezza",
            rating: 4.6,
            productType: "bellezza",
            active: true,
            lat: 40.8360,
            lng: 14.2470,
            productImages: [{ url: "https://images.unsplash.com/photo-1591370871779-8b446a82e7c9" }]
        },
        {
            id: 12,
            productName: "Kindle Paperwhite Signature",
            storeName: "Mondadori Bookstore Firenze",
            storeAddress: "Piazza della Repubblica 12, Firenze",
            productDescription: "E-reader 32GB con ricarica wireless",
            price: 189,
            stock: 28,
            category: "Elettronica",
            rating: 4.8,
            productType: "elettronica",
            active: true,
            lat: 43.7715,
            lng: 11.2540,
            productImages: [{ url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7" }]
        },
        {
            id: 13,
            productName: "Ray-Ban Wayfarer Classic",
            storeName: "Ottica Salmoiraghi & Viganò Bologna",
            storeAddress: "Via Ugo Bassi 23, Bologna",
            productDescription: "Occhiali da sole nero lucido",
            price: 169,
            stock: 42,
            category: "Accessori",
            rating: 4.4,
            productType: "accessori",
            active: true,
            lat: 44.4950,
            lng: 11.3400,
            productImages: [{ url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f" }]
        },
        {
            id: 14,
            productName: "JBL Flip 6 Speaker",
            storeName: "Trony Torino",
            storeAddress: "Corso Giulio Cesare 156, Torino",
            productDescription: "Speaker Bluetooth waterproof 12h batteria",
            price: 129,
            stock: 19,
            category: "Audio",
            rating: 4.6,
            productType: "elettronica",
            active: true,
            lat: 45.0780,
            lng: 7.6950,
            productImages: [{ url: "https://images.unsplash.com/photo-1602524209221-5dbed1805d42" }]
        },
        {
            id: 15,
            productName: "The North Face Borealis Backpack",
            storeName: "The North Face Store Venezia",
            storeAddress: "Campo San Bartolomeo 5237, Venezia",
            productDescription: "Zaino 28L nero/grigio, ergonomico",
            price: 119,
            stock: 15,
            category: "Accessori",
            rating: 4.7,
            productType: "accessori",
            active: true,
            lat: 45.4370,
            lng: 12.3360,
            productImages: [{ url: "https://images.unsplash.com/photo-1622560480654-d96214fdc383" }]
        },
        {
            id: 16,
            productName: "Fitbit Charge 6",
            storeName: "Decathlon Milano Cairoli",
            storeAddress: "Largo Cairoli 18, Milano",
            productDescription: "Fitness tracker con GPS e monitoraggio salute",
            price: 159,
            stock: 31,
            category: "Fitness",
            rating: 4.5,
            productType: "fitness",
            active: true,
            lat: 45.4680,
            lng: 9.1820,
            productImages: [{ url: "https://images.unsplash.com/photo-1576678927484-cc907e5e3c6a" }]
        },
        {
            id: 17,
            productName: "Fitbit Charge 7",
            storeName: "Decathlon Milano Cairoli",
            storeAddress: "Largo Cairoli 18, Milano",
            productDescription: "Fitness tracker con GPS e monitoraggio salute",
            price: 19,
            stock: 3,
            category: "Fitness",
            rating: 4.5,
            productType: "fitness",
            active: true,
            lat: 45.4680,
            lng: 9.1820,
            productImages: [{ url: "https://images.unsplash.com/photo-1576678927484-cc907e5e3c6a" }]
        }
    ];

    // Effect per chiudere i filtri quando si clicca fuori
    useEffect(() => {
        function handleClickOutside(event) {
            if (filtersRef.current && !filtersRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setListing(mockListingData);
    }, []);

    const handleSearchClick = async () => {
        try {
            const searchTerm = searchQuery.toLowerCase().trim();

            if (!searchTerm) {
                setListing(mockListingData);
                return;
            }

            const filteredData = mockListingData.filter(item =>
                item.productName.toLowerCase().includes(searchTerm) ||
                item.storeName.toLowerCase().includes(searchTerm) ||
                item.storeAddress.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.productType.toLowerCase().includes(searchTerm)
            );

            setListing(filteredData);
        } catch (error) {
            console.error('❌ Errore ricerca:', error);
        }
    }

    const handleMarkerClick = (property) => {
        setCoordinates({ lat: property.lat, lng: property.lng })
        setSelectedProperty(property.id)
    }

    // Funzioni per gestire i filtri
    const toggleCategory = (category) => {
        setSelectedFilters(prev => ({
            ...prev,
            category: prev.category.includes(category)
                ? prev.category.filter(c => c !== category)
                : [...prev.category, category]
        }));
    };

    const applyFilters = () => {
        let filteredData = mockListingData;

        // Filtro per categorie
        if (selectedFilters.category.length > 0) {
            filteredData = filteredData.filter(item =>
                selectedFilters.category.includes(item.category)
            );
        }

        // Filtro per prezzo
        filteredData = filteredData.filter(item =>
            item.price >= selectedFilters.priceRange.min &&
            item.price <= selectedFilters.priceRange.max
        );

        // Filtro per stock
        if (selectedFilters.stock === 'inStock') {
            filteredData = filteredData.filter(item => item.stock > 0);
        } else if (selectedFilters.stock === 'lowStock') {
            filteredData = filteredData.filter(item => item.stock > 0 && item.stock <= 5);
        }

        // Filtro per rating
        if (selectedFilters.rating > 0) {
            filteredData = filteredData.filter(item => item.rating >= selectedFilters.rating);
        }

        setListing(filteredData);
        setShowFilters(false);
    };

    const resetFilters = () => {
        setSelectedFilters({
            category: [],
            priceRange: { min: 0, max: 1000 },
            stock: 'all',
            rating: 0,
        });
        setListing(mockListingData);
        setShowFilters(false);
    };

    // Estrai tutte le categorie uniche
    const allCategories = [...new Set(mockListingData.map(item => item.category))];

    useEffect(() => {
        // Mostra TUTTI i prodotti all'avvio
        setListing(mockListingData);
        console.log('📦 Caricati TUTTI i prodotti:', mockListingData.length);
    }, []);


    return (
        <div className='min-h-screen'>
            {/* 🔥 HEADER CON BARRA DI RICERCA CENTRATA E GRANDE */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">

                        {/* Barra di ricerca e bottone filtri */}
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="flex items-center gap-4 mb-2">
                                {/* Barra di ricerca */}
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-32 py-3.5 text-base border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm"
                                        placeholder="Cerca prodotto, negozio, marca o categoria..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                                    />

                                    {/* X per cancellare */}
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setListing(mockListingData);
                                            }}
                                            className="absolute right-28 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            type="button"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}

                                    <button
                                        onClick={handleSearchClick}
                                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg text-sm transition-all shadow-md hover:shadow-lg"
                                    >
                                        Cerca
                                    </button>
                                </div>

                                {/* Bottone Filtri */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-3.5 border rounded-xl font-medium transition-all ${
                                        showFilters || selectedFilters.category.length > 0 || selectedFilters.stock !== 'all' || selectedFilters.rating > 0
                                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    <Sliders className="h-5 w-5" />
                                    <span className="hidden sm:inline">Filtri</span>
                                    {(selectedFilters.category.length > 0 || selectedFilters.stock !== 'all' || selectedFilters.rating > 0) && (
                                        <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {selectedFilters.category.length + (selectedFilters.stock !== 'all' ? 1 : 0) + (selectedFilters.rating > 0 ? 1 : 0)}
                                        </span>
                                    )}
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Pannello Filtri che si espande sotto la barra di ricerca */}
                            {showFilters && (
                                <div className="w-full bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                                        {/* Colonna 1: Categorie */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3 text-sm">Categorie</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                {allCategories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => toggleCategory(cat)}
                                                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg text-left"
                                                    >
                                                        <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                                                            selectedFilters.category.includes(cat)
                                                                ? 'bg-blue-600 border-blue-600'
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {selectedFilters.category.includes(cat) && (
                                                                <Check className="h-3 w-3 text-white" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-700 flex-1">{cat}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Colonna 2: Prezzo */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3 text-sm">Prezzo</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Intervallo di prezzo</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="1000"
                                                            value={selectedFilters.priceRange.min}
                                                            onChange={(e) => setSelectedFilters(prev => ({
                                                                ...prev,
                                                                priceRange: { ...prev.priceRange, min: parseInt(e.target.value) || 0 }
                                                            }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="Min"
                                                        />
                                                        <span className="text-gray-400">-</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="1000"
                                                            value={selectedFilters.priceRange.max}
                                                            onChange={(e) => setSelectedFilters(prev => ({
                                                                ...prev,
                                                                priceRange: { ...prev.priceRange, max: parseInt(e.target.value) || 1000 }
                                                            }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            placeholder="Max"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Colonna 3: Disponibilità */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3 text-sm">Disponibilità</h4>
                                            <div className="space-y-3">
                                                {[
                                                    { value: 'all', label: 'Tutti i prodotti' },
                                                    { value: 'inStock', label: 'Solo disponibili' },
                                                    { value: 'lowStock', label: 'Scorte basse (≤ 5)' }
                                                ].map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setSelectedFilters(prev => ({ ...prev, stock: option.value }))}
                                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg w-full"
                                                    >
                                                        <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                                                            selectedFilters.stock === option.value
                                                                ? 'border-blue-600 bg-blue-600'
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {selectedFilters.stock === option.value && (
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{option.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Colonna 4: Valutazione */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3 text-sm">Valutazione</h4>
                                            <div className="space-y-3">
                                                {[
                                                    { value: 0, label: 'Tutte le valutazioni' },
                                                    { value: 3, label: '3+ ⭐ e oltre' },
                                                    { value: 4, label: '4+ ⭐ e oltre' },
                                                    { value: 4.5, label: '4.5+ ⭐ e oltre' }
                                                ].map(rating => (
                                                    <button
                                                        key={rating.value}
                                                        onClick={() => setSelectedFilters(prev => ({ ...prev, rating: rating.value }))}
                                                        className={`flex items-center gap-3 w-full p-2 rounded-lg ${
                                                            selectedFilters.rating === rating.value
                                                                ? 'bg-blue-50 border border-blue-200'
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className={`w-5 h-5 flex items-center justify-center ${
                                                            selectedFilters.rating === rating.value
                                                                ? 'text-blue-600'
                                                                : 'text-gray-400'
                                                        }`}>
                                                            {selectedFilters.rating === rating.value ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                <div className="w-3 h-3 border border-gray-400 rounded"></div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{rating.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Bottoni Azione */}
                                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                                        <button
                                            onClick={resetFilters}
                                            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all text-sm"
                                        >
                                            Resetta tutto
                                        </button>
                                        <button
                                            onClick={applyFilters}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all text-sm"
                                        >
                                            Applica filtri
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resto del codice rimane invariato... */}
            <div className='flex flex-col lg:flex-row gap-8 px-8 py-6'>
                {/* SEZIONE MAPPA MOBILE */}
                <div className="lg:hidden mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">Mappa</h3>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                        >
                            {showMap ? 'Nascondi' : 'Mostra'} Mappa
                        </button>
                    </div>
                    {showMap && (
                        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-300 my-10">
                            <GoogleMapSection
                                listing={mockListingData}
                                coordinates={coordinates}
                                selectedPropertyId={selectedProperty}
                                onMarkerClick={handleMarkerClick}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Contenuto principale (resto del tuo codice rimane uguale) */}
            <div className='flex flex-col lg:flex-row gap-8 px-8 py-6'>
                {/* SEZIONE MAPPA MOBILE - Sempre visibile in cima */}
                <div className="lg:hidden mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">Mappa</h3>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                        >
                            {showMap ? 'Nascondi' : 'Mostra'} Mappa
                        </button>
                    </div>
                    {showMap && (
                        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-300 my-10">
                            <GoogleMapSection
                                listing={mockListingData}
                                coordinates={coordinates}
                                selectedPropertyId={selectedProperty}
                                onMarkerClick={handleMarkerClick}
                            />
                        </div>
                    )}
                </div>

                {/* SEZIONE LISTING - Sempre visibile */}
                <div className="lg:w-3/4 xl:w-9/12">
                    <div>
                        {/*<FilterSection*/}
                        {/*    setBathCount={setBathCount}*/}
                        {/*    setBedCount={setBedCount}*/}
                        {/*    setParkingCount={setParkingCount}*/}
                        {/*    setHomeType={setHomeType}*/}
                        {/*/>*/}

                        {/*{address&&<div className='px-3 my-5'>*/}
                        {/*    <h2 className='text-xl'>*/}
                        {/*        Found  <span className='font-bold'>{listing?.length}</span> Result in <span className='text-primary font-bold'>{address?.label}</span></h2>*/}

                        {/*</div>}*/}
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            {listing.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`p-3 rounded-lg cursor-pointer ${
                                        selectedProperty === item.id ? 'border-2 border-blue-500 ' : 'border border-gray-200'
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/storeNureboProduct');
                                    }}
                                >
                                    <Image
                                        src={item?.productImages?.[0]?.url || '/placeholder.svg'}
                                        width={800}
                                        height={150}
                                        className='rounded-lg h-[170px] object-contain w-full'
                                        alt={`Image for ${item.productName}`}
                                    />
                                    <div className='flex mt-6 flex-col gap-2'>
                                        <h3 className='flex gap-1 text-sm font-semibold text-gray-600'>{item.brandName}</h3>
                                        <h3 className='font-semibold text-lg'>{item.productName}</h3>
                                        <h2 className='flex gap-2 text-sm text-blue-900 font-semibold'>
                                            <Store className='h-4 w-4'/>
                                            {item.storeName}
                                        </h2>
                                        <h2 className='flex gap-2 text-sm text-gray-500 font-normal'>
                                            <MapPin className='h-4 w-4'/>
                                            {item.storeAddress}
                                        </h2>
                                        <h2 className='font-bold text-xl text-blue-700 mt-2 flex justify-start items-end'>€{Number(item?.price).toLocaleString('it-IT', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}</h2>
                                        {/*<div className='flex gap-2 mt-2 justify-between'>*/}
                                        {/*    <h2 className='flex gap-2 text-sm bg-slate-200 rounded-md p-2 w-full text-gray-500 justify-center items-center'>*/}
                                        {/*        📦 {item?.stock || 0}*/}
                                        {/*    </h2>*/}
                                        {/*    <h2 className='flex gap-2 text-sm bg-slate-200 rounded-md p-2 w-full text-gray-500 justify-center items-center'>*/}
                                        {/*        ⭐ {item?.rating || 'N/A'}*/}
                                        {/*    </h2>*/}
                                        {/*    <h2 className='flex gap-2 w-full text-sm bg-slate-200 rounded-md p-2 text-gray-500 justify-center items-center'>*/}
                                        {/*        🏷️ {item?.category}*/}
                                        {/*    </h2>*/}
                                        {/*</div>*/}
                                        <button
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm mt-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("📍 Click prodotto:", item)
                                                setCoordinates({ lat: item.lat, lng: item.lng })
                                                setSelectedProperty(item.id)
                                                setSelectedItem(item)
                                            }}

                                        >
                                            Vedi nella mappa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SEZIONE MAPPA DESKTOP - Lato destro */}
                <div
                    className="hidden lg:block lg:w-1/2 xl:w-1/8 sticky top-24 h-[calc(100vh-120px)] rounded-3xl overflow-hidden border border-gray-300 shadow-lg">
                    <GoogleMapSection
                        listing={listing} // ORA PASSA 'listing' FILTRATO invece di tutti i mock
                        coordinates={coordinates}
                        selectedPropertyId={selectedProperty}
                        item={selectedItem}
                        onMarkerClick={handleMarkerClick}
                    />
                </div>
            </div>
        </div>
    )
}

export default ListingMapView;