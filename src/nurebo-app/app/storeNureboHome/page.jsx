'use client'

import {Search, User, Clock, MapPin, Phone, Euro, CreditCard, ShoppingCart} from 'lucide-react';
import {Button} from '@/components/ui/button';
import Link from "next/link";
import Image from "next/image";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {cn} from "@/lib/utils";
import {MdCheck} from "react-icons/md";
import {Checkbox} from "@/components/ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Badge} from "@/components/ui/badge";
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {Star, ChevronDown, CheckCircle, Percent, ShoppingBag, X} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {Slider} from "@/components/ui/slider"


const prodotti = [
    {
        id: '1',
        nome: 'Forno Pizza Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61tBOvfc9XL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'MagoChef',
        modello: 'FX-PRO2023',
        categoria: 'Elettrodomestici',
        prezzo: 599.99,
        disponibilita: 15,
        garanzia: '2 anni',
        offerte: ['Spedizione Gratuita']
    },
    {
        id: '2',
        nome: 'Pietra refrattaria per Pizza',
        immagine: 'https://m.media-amazon.com/images/I/81+UTyWIZJL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'SmeraldoSmeraldoSmeraldoSmeraldoSmeraldoSmeraldo',
        modello: 'StonePro',
        categoria: 'Utensili da Cucina',
        prezzo: 39.90,
        disponibilita: 45,
        materiale: 'Cordierite'
    },
    {
        id: '3',
        nome: 'Set Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi Professionale',
        immagine: 'https://m.media-amazon.com/images/I/81c7+-CrSuL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'YamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawa',
        modello: 'SUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PRO',
        categoria: 'Utensili da Cucina',
        prezzo: 89.99,
        disponibilita: 10,
        inclusi: ['Mattarello', 'Coltello', 'Stuoia']
    },
    {
        id: '4',
        nome: 'Coltello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per Affettato',
        immagine: 'https://m.media-amazon.com/images/I/713xqVlrZQL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'GranChef',
        modello: 'CarpaccioX',
        categoria: 'Coltelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli Professionali',
        prezzo: 129.99,
        disponibilita: 7,
        offerte: ['20% di sconto su accessori']
    },
    {
        id: '5',
        nome: 'Kit Preparazione Poke Bowl',
        immagine: 'https://m.media-amazon.com/images/I/7133o2yPwOL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'HealthyLife',
        modello: 'POKE-KIT2024',
        categoria: 'Utensili da Cucina',
        prezzo: 49.90,
        disponibilita: 22,
        accessori: ['4 Ciotole', 'Misurini']
    },
    {
        id: '6',
        nome: 'Grill Elettrico per Hamburger',
        immagine: 'https://m.media-amazon.com/images/I/61a1nbUgjgL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'OldWest',
        modello: 'GrillMaster',
        categoria: 'Elettrodomestici',
        prezzo: 159.00,
        disponibilita: 12,
        potenza: '2000W'
    },
    {
        id: '7',
        nome: 'Piastra per Piadine Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61MqeQo6n9L._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'PiadaPro',
        modello: 'SteelGrill',
        categoria: 'Utensili da Cucina',
        prezzo: 79.50,
        disponibilita: 18,
        diametro: '30 cm'
    },
    {
        id: '8',
        nome: 'Forno Pizza Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61tBOvfc9XL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'MagoChef',
        modello: 'FX-PRO2023',
        categoria: 'Elettrodomestici',
        prezzo: 599.99,
        disponibilita: 15,
        garanzia: '2 anni',
        offerte: ['Spedizione Gratuita']
    },
    {
        id: '9',
        nome: 'Pietra refrattaria per Pizza',
        immagine: 'https://m.media-amazon.com/images/I/81+UTyWIZJL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'SmeraldoSmeraldoSmeraldoSmeraldoSmeraldoSmeraldo',
        modello: 'StonePro',
        categoria: 'Utensili da Cucina',
        prezzo: 39.90,
        disponibilita: 45,
        materiale: 'Cordierite'
    },
    {
        id: '10',
        nome: 'Set Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi Professionale',
        immagine: 'https://m.media-amazon.com/images/I/81c7+-CrSuL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'YamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawa',
        modello: 'SUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PRO',
        categoria: 'Utensili da Cucina',
        prezzo: 89.99,
        disponibilita: 10,
        inclusi: ['Mattarello', 'Coltello', 'Stuoia']
    },
    {
        id: '11',
        nome: 'Coltello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per Affettato',
        immagine: 'https://m.media-amazon.com/images/I/713xqVlrZQL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'GranChef',
        modello: 'CarpaccioX',
        categoria: 'Coltelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli Professionali',
        prezzo: 129.99,
        disponibilita: 7,
        offerte: ['20% di sconto su accessori']
    },
    {
        id: '12',
        nome: 'Kit Preparazione Poke Bowl',
        immagine: 'https://m.media-amazon.com/images/I/7133o2yPwOL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'HealthyLife',
        modello: 'POKE-KIT2024',
        categoria: 'Utensili da Cucina',
        prezzo: 49.90,
        disponibilita: 22,
        accessori: ['4 Ciotole', 'Misurini']
    },
    {
        id: '13',
        nome: 'Grill Elettrico per Hamburger',
        immagine: 'https://m.media-amazon.com/images/I/61a1nbUgjgL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'OldWest',
        modello: 'GrillMaster',
        categoria: 'Elettrodomestici',
        prezzo: 159.00,
        disponibilita: 12,
        potenza: '2000W'
    },
    {
        id: '14',
        nome: 'Piastra per Piadine Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61MqeQo6n9L._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'PiadaPro',
        modello: 'SteelGrill',
        categoria: 'Utensili da Cucina',
        prezzo: 79.50,
        disponibilita: 18,
        diametro: '30 cm'
    }, {
        id: '1',
        nome: 'Forno Pizza Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61tBOvfc9XL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'MagoChef',
        modello: 'FX-PRO2023',
        categoria: 'Elettrodomestici',
        prezzo: 599.99,
        disponibilita: 15,
        garanzia: '2 anni',
        offerte: ['Spedizione Gratuita']
    },
    {
        id: '2',
        nome: 'Pietra refrattaria per Pizza',
        immagine: 'https://m.media-amazon.com/images/I/81+UTyWIZJL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'SmeraldoSmeraldoSmeraldoSmeraldoSmeraldoSmeraldo',
        modello: 'StonePro',
        categoria: 'Utensili da Cucina',
        prezzo: 39.90,
        disponibilita: 45,
        materiale: 'Cordierite'
    },
    {
        id: '3',
        nome: 'Set Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi Professionale',
        immagine: 'https://m.media-amazon.com/images/I/81c7+-CrSuL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'YamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawa',
        modello: 'SUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PRO',
        categoria: 'Utensili da Cucina',
        prezzo: 89.99,
        disponibilita: 10,
        inclusi: ['Mattarello', 'Coltello', 'Stuoia']
    },
    {
        id: '4',
        nome: 'Coltello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per Affettato',
        immagine: 'https://m.media-amazon.com/images/I/713xqVlrZQL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'GranChef',
        modello: 'CarpaccioX',
        categoria: 'Coltelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli Professionali',
        prezzo: 129.99,
        disponibilita: 7,
        offerte: ['20% di sconto su accessori']
    },
    {
        id: '5',
        nome: 'Kit Preparazione Poke Bowl',
        immagine: 'https://m.media-amazon.com/images/I/7133o2yPwOL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'HealthyLife',
        modello: 'POKE-KIT2024',
        categoria: 'Utensili da Cucina',
        prezzo: 49.90,
        disponibilita: 22,
        accessori: ['4 Ciotole', 'Misurini']
    },
    {
        id: '6',
        nome: 'Grill Elettrico per Hamburger',
        immagine: 'https://m.media-amazon.com/images/I/61a1nbUgjgL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'OldWest',
        modello: 'GrillMaster',
        categoria: 'Elettrodomestici',
        prezzo: 159.00,
        disponibilita: 12,
        potenza: '2000W'
    },
    {
        id: '7',
        nome: 'Piastra per Piadine Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61MqeQo6n9L._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'PiadaPro',
        modello: 'SteelGrill',
        categoria: 'Utensili da Cucina',
        prezzo: 79.50,
        disponibilita: 18,
        diametro: '30 cm'
    },
    {
        id: '8',
        nome: 'Forno Pizza Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61tBOvfc9XL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'MagoChef',
        modello: 'FX-PRO2023',
        categoria: 'Elettrodomestici',
        prezzo: 599.99,
        disponibilita: 15,
        garanzia: '2 anni',
        offerte: ['Spedizione Gratuita']
    },
    {
        id: '9',
        nome: 'Pietra refrattaria per Pizza',
        immagine: 'https://m.media-amazon.com/images/I/81+UTyWIZJL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'SmeraldoSmeraldoSmeraldoSmeraldoSmeraldoSmeraldo',
        modello: 'StonePro',
        categoria: 'Utensili da Cucina',
        prezzo: 39.90,
        disponibilita: 45,
        materiale: 'Cordierite'
    },
    {
        id: '10',
        nome: 'Set Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi ProfessionaleSet Sushi Professionale',
        immagine: 'https://m.media-amazon.com/images/I/81c7+-CrSuL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'YamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawaYamakawa',
        modello: 'SUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PROSUSHI-PRO',
        categoria: 'Utensili da Cucina',
        prezzo: 89.99,
        disponibilita: 10,
        inclusi: ['Mattarello', 'Coltello', 'Stuoia']
    },
    {
        id: '11',
        nome: 'Coltello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per AffettatoColtello Professionale per Affettato',
        immagine: 'https://m.media-amazon.com/images/I/713xqVlrZQL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'GranChef',
        modello: 'CarpaccioX',
        categoria: 'Coltelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli ProfessionaliColtelli Professionali',
        prezzo: 129.99,
        disponibilita: 7,
        offerte: ['20% di sconto su accessori']
    },
    {
        id: '12',
        nome: 'Kit Preparazione Poke Bowl',
        immagine: 'https://m.media-amazon.com/images/I/7133o2yPwOL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'HealthyLife',
        modello: 'POKE-KIT2024',
        categoria: 'Utensili da Cucina',
        prezzo: 49.90,
        disponibilita: 22,
        accessori: ['4 Ciotole', 'Misurini']
    },
    {
        id: '13',
        nome: 'Grill Elettrico per Hamburger',
        immagine: 'https://m.media-amazon.com/images/I/61a1nbUgjgL._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'OldWest',
        modello: 'GrillMaster',
        categoria: 'Elettrodomestici',
        prezzo: 159.00,
        disponibilita: 12,
        potenza: '2000W'
    },
    {
        id: '14',
        nome: 'Piastra per Piadine Professionale',
        immagine: 'https://m.media-amazon.com/images/I/61MqeQo6n9L._AC_UL480_FMwebp_QL65_.jpg',
        marca: 'PiadaPro',
        modello: 'SteelGrill',
        categoria: 'Utensili da Cucina',
        prezzo: 79.50,
        disponibilita: 18,
        diametro: '30 cm'
    },
];
const importoMinimoOptions = [
    {value: '10', label: '€ 10'},
    {value: '20', label: '€ 20'},
    {value: '30', label: '€ 30'},
    {value: '50', label: '€ 50'},
    {value: '100', label: '€ 100'},
];

const valutazioneOptions = [
    {value: 1, label: '★'},
    {value: 2, label: '★★'},
    {value: 3, label: '★★★'},
    {value: 4, label: '★★★★'},
    {value: 5, label: '★★★★★'},
];

const esigenzeAlimentariOptions = [
    {value: 'vegetariano', label: 'Vegetariano'},
    {value: 'vegano', label: 'Vegano'},
    {value: 'senza_glutine', label: 'Senza Glutine'},
    {value: 'senza_lattosio', label: 'Senza Lattosio'},
    {value: 'nessuna', label: 'Nessuna'},
];

const DeliverooPage = () => {
    const [itemsToShow, setItemsToShow] = useState(6);
    const sentinelRef = useRef(null);
    const [filtroApertoOra, setFiltroApertoOra] = useState(false);
    const [filtroNuovo, setFiltroNuovo] = useState(false);
    const [filtroConsegnaGratuita, setFiltroConsegnaGratuita] = useState(false);
    const [filtroImportoMinimo, setFiltroImportoMinimo] = useState(null);
    const [filtroValutazione, setFiltroValutazione] = useState(null);
    const [filtroOfferte, setFiltroOfferte] = useState(false);
    const [filtroCartaFedelta, setFiltroCartaFedelta] = useState(false);
    const [filtroEsigenzeAlimentari, setFiltroEsigenzeAlimentari] = useState(null);
    const [cerca, setCerca] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [ordinamento, setOrdinamento] = useState('migliore');
    const [showMostraTutti, setShowMostraTutti] = useState(false);
    const [prezzoRange, setPrezzoRange] = useState([0, 100]);
    const filtri = [
        {label: 'Aperto Ora', state: filtroApertoOra, setState: setFiltroApertoOra},
        {label: 'Nuovo', state: filtroNuovo, setState: setFiltroNuovo},
        {label: 'Consegna Gratuita', state: filtroConsegnaGratuita, setState: setFiltroConsegnaGratuita},
        {label: 'Offerte', state: filtroOfferte, setState: setFiltroOfferte},
        {label: 'Carta Fedeltà', state: filtroCartaFedelta, setState: setFiltroCartaFedelta},
    ];

    const handlePrezzoChange = useCallback(
        (value) => {
            setPrezzoRange(value);
        },
        [],
    );

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
            // const sections = tabsConfig.map(tab => document.getElementById(tab.id));
            const scrollPosition = window.scrollY + 200;

            // sections.forEach(section => {
            //     if (section) {
            //         const top = section.offsetTop;
            //         const bottom = top + section.offsetHeight;
            //
            //         if (scrollPosition >= top && scrollPosition < bottom) {
            //             // setActiveTab(section.id);
            //         }
            //     }
            // });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const prodottiFiltrati = prodotti.filter(prodotto => {
        const soddisfaApertoOra = !filtroApertoOra ||
            ((prodotto.tempoConsegnaMin || 0) >= 0 && (prodotto.tempoConsegnaMax || Infinity) <= 60);

        const soddisfaNuovo = !filtroNuovo || prodotto.nuovo;
        const soddisfaConsegnaGratuita = !filtroConsegnaGratuita || prodotto.consegnaGratuita;

        const soddisfaImportoMinimo = !filtroImportoMinimo ||
            (filtroImportoMinimo === 'fino-10' &&
                (!prodotto.costoConsegna || parseFloat((prodotto.costoConsegna || '').toString().replace('€', '')) <= 10) ||
                (filtroImportoMinimo === 'fino-15' &&
                    (!prodotto.costoConsegna || parseFloat((prodotto.costoConsegna || '').toString().replace('€', '')) <= 15)));

        const soddisfaValutazione = !filtroValutazione || (prodotto.valutazione || 0) >= filtroValutazione;
        const soddisfaOfferte = !filtroOfferte || (prodotto.offerte && prodotto.offerte.length > 0);
        const soddisfaCartaFedelta = !filtroCartaFedelta || prodotto.cartaFedelta;

        const soddisfaEsigenzeAlimentari = !filtroEsigenzeAlimentari ||
            (filtroEsigenzeAlimentari === 'halal' &&
                (prodotto.tipologia || '').toLowerCase().includes('halal'));

        const soddisfaRicerca = !cerca ||
            (prodotto.nome || '').toLowerCase().includes(cerca.toLowerCase());

        return soddisfaApertoOra &&
            soddisfaNuovo &&
            soddisfaConsegnaGratuita &&
            soddisfaImportoMinimo &&
            soddisfaValutazione &&
            soddisfaOfferte &&
            soddisfaCartaFedelta &&
            soddisfaEsigenzeAlimentari &&
            soddisfaRicerca;
    });

    const prodottiOrdinati = prodottiFiltrati.slice().sort((a, b) => {
        if (ordinamento === 'nome') {
            return a.nome.localeCompare(b.nome)
        }
        return (b.valutazione || b.prezzo) - (a.valutazione || a.prezzo)
    })

    const prodottiMostrati = prodottiOrdinati.slice(0, itemsToShow);

    const importoMinimoOptions = [
        {label: "Fino a 10,00 €", value: "fino-10"},
        {label: "Fino a 15,00 €", value: "fino-15"},
    ];

    const valutazioneOptions = [
        {label: "4 stelle", value: 4},
        {label: "4.5 stelle", value: 4.5},
        {label: "5 stelle", value: 5},
    ];
    const esigenzeAlimentariOptions = [
        // {label: "Nessuno", value: " "},
        {label: "Halal", value: "halal"},
        // Aggiungi altre opzioni qui
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && itemsToShow < prodottiOrdinati.length) {
                    setItemsToShow((prev) => Math.min(prev + 6, prodottiOrdinati.length));
                }
            },
            {threshold: 1.0}
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [itemsToShow, prodottiOrdinati.length]);

    useEffect(() => {
        setItemsToShow(6);
    }, [cerca, ordinamento, filtroApertoOra, filtroNuovo, filtroConsegnaGratuita,
        filtroImportoMinimo, filtroValutazione, filtroOfferte, filtroCartaFedelta,
        filtroEsigenzeAlimentari, prezzoRange]);

    const [isLoading, setIsLoading] = useState(false)

    const handleScroll = useCallback(() => {
        const scrollPosition = window.innerHeight + document.documentElement.scrollTop
        const pageHeight = document.documentElement.offsetHeight
        const triggerPosition = pageHeight * 0.8 // Trigger a 80% della pagina

        if (scrollPosition >= triggerPosition && !isLoading && itemsToShow < prodotti.length) {
            setIsLoading(true)
            setTimeout(() => { // Simula ritardo di rete
                setItemsToShow(prev => Math.min(prev + 6, prodotti.length))
                setIsLoading(false)
            }, 500)
        }
    }, [isLoading, itemsToShow])

    useEffect(() => {
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    useEffect(() => {
        setItemsToShow(12) // Resetta al cambiamento dei filtri
    }, [/* Aggiungi dipendenze dei filtri qui */])

    return (
        <div className="bg-white min-h-screen">

            {/*<header className="fixed top-0 w-full bg-white border-b z-50">*/}
            {/*    <div className="container mx-auto px-4 py-3 flex items-center justify-between">*/}
            {/*        <Link href="/" className="flex-1 flex justify-center">*/}
            {/*            <Image*/}
            {/*                // src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"*/}
            {/*                src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/nurebo_logo_blue_ai.png"*/}
            {/*                // src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/nurebo_logo_ai.png"*/}
            {/*                alt="Logo"*/}
            {/*                width={120}*/}
            {/*                height={28}*/}
            {/*                className="h-7 w-auto"*/}
            {/*            />*/}
            {/*        </Link>*/}
            {/*        <div className="flex-1 max-w-2xl">*/}
            {/*            <div className="relative">*/}
            {/*                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>*/}
            {/*                <input*/}
            {/*                    type="text"*/}
            {/*                    placeholder="Cerca prodotti o categorie..."*/}
            {/*                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-transparent*/}
            {/*                 focus:bg-white focus:border-teal-500 focus:ring-0 text-sm"*/}
            {/*                />*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*        <div className="flex-1 flex justify-end">*/}
            {/*            <Button variant="ghost" className="text-gray-600 hover:bg-gray-50">*/}
            {/*                <User className="w-5 h-5"/>*/}
            {/*            </Button>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</header>*/}

            <header className="bg-white sticky top-0 z-50 border-b shadow-sm">
                {/*<div className="container max-w-7xl py-5 flex items-center justify-center gap-4"> */}
                <div className="py-5 flex items-center justify-center"> {/* Allineamento con l'immagine */}
                    <Link href="/" className="w-[120px]"> {/* Larghezza fissa logo */}
                        <Image
                            src="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/nurebo_logo_blue_ai.png"
                            alt="Logo"
                            width={120}
                            height={28}
                            className="h-7 w-auto object-contain"
                        />
                    </Link>

                    {/*<div className="flex-1 max-w-[600px] mx-4"> /!* Margine centrale controllato *!/*/}
                    {/*    <div className="relative">*/}
                    {/*        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>*/}
                    {/*        <input*/}
                    {/*            type="text"*/}
                    {/*            placeholder="Cerca prodotti o categorie..."*/}
                    {/*            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-transparent*/}
                    {/*        focus:bg-white focus:border-teal-500 focus:ring-0 text-sm"*/}
                    {/*        />*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {/*<div className="w-[40px] flex justify-end"> /!* Larghezza fissa icona *!/*/}
                    {/*    <Button variant="ghost" className="text-gray-600 hover:bg-gray-50 p-2">*/}
                    {/*        <User className="w-5 h-5"/>*/}
                    {/*    </Button>*/}
                    {/*</div>*/}
                </div>
            </header>

            <header className={`bg-white shadow-sm sticky top-0 z-50 transition-all ${isScrolled ? 'py-4' : 'py-6'}`}>
                <div className="max-w-7xl s:ml-[20px] lg:ml-[5vw] xl:ml-[12vw] pl-[0vw]">
                    <div className="">
                        <div className="">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 line-clamp-4">Ferramenta Milani</h1>
                            <div className="flex flex-wrap gap-2">
                                {['🔧 Attrezzi professionali', '🏭 Prodotti industriali', '🛠️ Assistenza tecnica'].map((tag) => (
                                    <span key={tag}
                                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <section className="pt-8 px-6 pb-8">
                <div className="max-w-6xl mx-auto">
                    <div className="md:grid md:grid-cols-3 gap-8">

                        <div className="hidden md:block md:col-span-1">
                            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                                <img
                                    src="https://images.pexels.com/photos/1087727/pexels-photo-1087727.jpeg"
                                    alt="Negozio"
                                    className="object-cover w-full h-full"
                                />
                            </div>

                            <div className="mt-6 bg-white p-4 rounded-xl border">
                                <h3 className="text-lg font-semibold mb-3">Orari di apertura</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Lunedì - Venerdì</span>
                                        <span className="font-medium text-gray-900">8:00 - 19:00</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Sabato</span>
                                        <span className="font-medium text-gray-900">9:00 - 13:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Domenica</span>
                                        <span className="font-medium text-red-500">Chiuso</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            {/*<div className="border-b pb-6">*/}
                            {/*    <h1 className="text-3xl font-bold text-gray-900 mb-2">Ferramenta Milani</h1>*/}
                            {/*    <div className="flex flex-wrap gap-2">*/}
                            {/*        {['🔧 Attrezzi professionali', '🏭 Prodotti industriali', '🛠️ Assistenza tecnica'].map((tag) => (*/}
                            {/*            <span key={tag}*/}
                            {/*                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{tag}</span>*/}
                            {/*        ))}*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            <div className="md:hidden mb-6">
                                <div className="aspect-square xs:aspect-[8/3] sm:aspect-[8/2] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                                    <img
                                        src="https://images.pexels.com/photos/1087727/pexels-photo-1087727.jpeg"
                                        alt="Negozio"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>

                            <div className="md:hidden bg-white p-4 rounded-xl border mb-6">
                                <h3 className="text-lg font-semibold mb-3">Orari di apertura</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Lunedì - Venerdì</span>
                                        <span className="font-medium text-gray-900">8:00 - 19:00</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Sabato</span>
                                        <span className="font-medium text-gray-900">9:00 - 13:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Domenica</span>
                                        <span className="font-medium text-red-500">Chiuso</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        icon: Phone,
                                        title: "Contatti",
                                        value: "+39 123 456789",
                                        extra: "WhatsApp disponibile"
                                    },
                                    {
                                        icon: Euro,
                                        title: "Pagamenti",
                                        value: "Carta · Contanti · Satispay",
                                        icon2: CreditCard
                                    },
                                    {
                                        icon: Clock,
                                        title: "Tempi di Consegna",
                                        value: "20-40 min",
                                        range: "Zona di consegna: 3km"
                                    },
                                    {
                                        icon: CreditCard,
                                        title: "Ordine Minimo",
                                        value: "€ 10,00",
                                        delivery: "Consegna gratuita sopra € 15"
                                    }
                                ].map((item, index) => (
                                    <div key={index}
                                         className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <item.icon className="w-6 h-6 text-gray-400 mt-1"/>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h4>
                                                <p className="text-base text-gray-800 font-medium">{item.value}</p>
                                                {item.extra &&
                                                    <p className="text-sm text-teal-600 mt-1">{item.extra}</p>}
                                                {item.range &&
                                                    <p className="text-xs text-teal-600 mt-1">{item.range}</p>}
                                                {item.delivery &&
                                                    <p className="text-xs text-teal-600 mt-1">{item.delivery}</p>}
                                            </div>
                                            {item.icon2 && <item.icon2 className="w-5 h-5 text-gray-400 mt-1"/>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 rounded-xl overflow-hidden shadow-lg border">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44788.9089371933!2d9.079495748632812!3d45.443473200000014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786c3ea92c84c07%3A0xee462d139e8d2580!2sFerramenta%20Milani!5e0!3m2!1sit!2sit!4v1745532506186!5m2!1sit!2sit"
                                    width="100%"
                                    height="300"
                                    style={{border: 0}}
                                    allowFullScreen
                                    loading="lazy"
                                    className="rounded-xl"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t mt-12"></div>
            </section>

            <div className="container mx-auto px-4 md:px-6 pb-8 max-w-[90vw]">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <div
                        className="flex flex-col gap-4 w-full s:ml-[-50vw] xs:ml-0 md:w-64 max-[375px]:w-screen max-[375px]:px-4 max-[375px]:-mx-4">
                        {/* Versione Mobile - Accordion unico */}
                        <div className="md:hidden">
                            <Accordion type="multiple" collapsible>
                                <AccordionItem value="filtri" className="">
                                    <AccordionTrigger
                                        className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                        <h2 className="text-lg font-semibold">Filtri</h2>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 space-y-4">
                                        {/* Contenuto filtri mobile */}
                                        {/* Filtri Attivi - Versione originale con aggiustamento larghezza */}
                                        <AccordionItem value="filtri-attivi">
                                            <AccordionTrigger>Filtri Attivi</AccordionTrigger>
                                            <AccordionContent className="space-y-4">
                                                {filtri.map((filtro) => (
                                                    <div key={filtro.label}>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => filtro.setState(!filtro.state)}
                                                            className={cn(
                                                                "bg-gray-100 text-gray-800 hover:bg-gray-300 transition-colors",
                                                                filtro.state && "bg-gray-600 text-white hover:bg-gray-700"
                                                            )}
                                                        >
                                                            <MdCheck
                                                                className={cn("mr-2 h-4 w-4", !filtro.state && "hidden")}
                                                            />
                                                            {filtro.label}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* Sezione Prezzo - Dimensione originale */}
                                        <AccordionItem value="prezzo" className={`space-y-2`}>
                                            <AccordionTrigger>Prezzo</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-4">
                                                    {[
                                                        {label: "€0 - €50", min: 0, max: 50},
                                                        {label: "€51 - €100", min: 51, max: 100},
                                                        {label: "€101 - €150", min: 101, max: 150},
                                                        {label: "€151 - €200", min: 151, max: 200}
                                                    ].map((range) => (
                                                        <div key={range.label} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={range.label}
                                                                checked={prezzoRange.some(r => r.min === range.min && r.max === range.max)}
                                                                onCheckedChange={(checked) => {
                                                                    setPrezzoRange(prev => checked
                                                                        ? [...prev, range]
                                                                        : prev.filter(r => r.min !== range.min || r.max !== range.max))
                                                                }}
                                                            />
                                                            <label htmlFor={range.label}
                                                                   className="text-sm hover:text-gray-400 cursor-pointer">
                                                                {range.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* Importo Minimo - Larghezza controllata */}
                                        <AccordionItem value="importo-minimo" className={`space-y-2`}>
                                            <AccordionTrigger>Importo minimo</AccordionTrigger>
                                            <AccordionContent>
                                                <Select
                                                    onValueChange={(value) =>
                                                        setFiltroImportoMinimo(value === "seleziona-reset" ? null : value)
                                                    }
                                                    value={filtroImportoMinimo || "seleziona-reset"}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleziona"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="seleziona-reset"
                                                            className="[&[data-state=checked]]:hidden"
                                                        >
                                                            Seleziona
                                                        </SelectItem>
                                                        {importoMinimoOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* Sezione Valutazione */}
                                        <AccordionItem value="valutazione" className={`space-y-2`}>
                                            <AccordionTrigger>Valutazione</AccordionTrigger>
                                            <AccordionContent>
                                                <Select
                                                    onValueChange={(value) =>
                                                        setFiltroValutazione(value === "seleziona-reset" ? null : parseInt(value, 10))
                                                    }
                                                    value={filtroValutazione?.toString() || "seleziona-reset"}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleziona"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="seleziona-reset"
                                                            className="[&[data-state=checked]]:hidden"
                                                        >
                                                            Seleziona
                                                        </SelectItem>
                                                        {valutazioneOptions.map((option) => (
                                                            <SelectItem key={option.value}
                                                                        value={option.value.toString()}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* Sezione Esigenze alimentari */}
                                        <AccordionItem value="esigenze-alimentari" className={`space-y-2`}>
                                            <AccordionTrigger>Esigenze alimentari</AccordionTrigger>
                                            <AccordionContent>
                                                <Select
                                                    onValueChange={(value) =>
                                                        setFiltroEsigenzeAlimentari(value === "seleziona-reset" ? null : value)
                                                    }
                                                    value={filtroEsigenzeAlimentari || "seleziona-reset"}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleziona"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="seleziona-reset"
                                                            className="[&[data-state=checked]]:hidden"
                                                        >
                                                            Seleziona
                                                        </SelectItem>
                                                        {esigenzeAlimentariOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        {/* Versione Desktop - Layout originale */}
                        <div className="hidden md:block">
                            <h2 className="text-lg font-semibold border-b-2 pb-2">Filtri</h2>

                            <div className="space-y-2 mt-2">

                                {/* Sezioni Accordion desktop */}
                                <Accordion
                                    type="multiple"
                                    defaultValue={["prezzo", "importo-minimo", "valutazione", "esigenze-alimentari"]}
                                    className="space-y-2"
                                >
                                    {/* Filtri Attivi - Versione originale con aggiustamento larghezza */}
                                    <AccordionItem value="filtri-attivi">
                                        <AccordionTrigger>Filtri Attivi</AccordionTrigger>
                                        <AccordionContent className="space-y-2">
                                            {filtri.map((filtro) => (
                                                <div key={filtro.label}>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => filtro.setState(!filtro.state)}
                                                        className={cn(
                                                            "bg-gray-100 text-gray-800 hover:bg-gray-300 transition-colors",
                                                            filtro.state && "bg-gray-600 text-white hover:bg-gray-700"
                                                        )}
                                                    >
                                                        <MdCheck
                                                            className={cn("mr-2 h-4 w-4", !filtro.state && "hidden")}
                                                        />
                                                        {filtro.label}
                                                    </Button>
                                                </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Sezione Prezzo - Dimensione originale */}
                                    <AccordionItem value="prezzo">
                                        <AccordionTrigger>Prezzo</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2">
                                                {[
                                                    {label: "€0 - €50", min: 0, max: 50},
                                                    {label: "€51 - €100", min: 51, max: 100},
                                                    {label: "€101 - €150", min: 101, max: 150},
                                                    {label: "€151 - €200", min: 151, max: 200}
                                                ].map((range) => (
                                                    <div key={range.label} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={range.label}
                                                            checked={prezzoRange.some(r => r.min === range.min && r.max === range.max)}
                                                            onCheckedChange={(checked) => {
                                                                setPrezzoRange(prev => checked
                                                                    ? [...prev, range]
                                                                    : prev.filter(r => r.min !== range.min || r.max !== range.max))
                                                            }}
                                                        />
                                                        <label htmlFor={range.label}
                                                               className="text-sm hover:text-gray-400 cursor-pointer">
                                                            {range.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Importo Minimo - Larghezza controllata */}
                                    <AccordionItem value="importo-minimo">
                                        <AccordionTrigger>Importo minimo</AccordionTrigger>
                                        <AccordionContent>
                                            <Select
                                                onValueChange={(value) =>
                                                    setFiltroImportoMinimo(value === "seleziona-reset" ? null : value)
                                                }
                                                value={filtroImportoMinimo || "seleziona-reset"}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleziona"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value="seleziona-reset"
                                                        className="[&[data-state=checked]]:hidden"
                                                    >
                                                        Seleziona
                                                    </SelectItem>
                                                    {importoMinimoOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Sezione Valutazione */}
                                    <AccordionItem value="valutazione">
                                        <AccordionTrigger>Valutazione</AccordionTrigger>
                                        <AccordionContent>
                                            <Select
                                                onValueChange={(value) =>
                                                    setFiltroValutazione(value === "seleziona-reset" ? null : parseInt(value, 10))
                                                }
                                                value={filtroValutazione?.toString() || "seleziona-reset"}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleziona"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value="seleziona-reset"
                                                        className="[&[data-state=checked]]:hidden"
                                                    >
                                                        Seleziona
                                                    </SelectItem>
                                                    {valutazioneOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value.toString()}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Sezione Esigenze alimentari */}
                                    <AccordionItem value="esigenze-alimentari">
                                        <AccordionTrigger>Esigenze alimentari</AccordionTrigger>
                                        <AccordionContent>
                                            <Select
                                                onValueChange={(value) =>
                                                    setFiltroEsigenzeAlimentari(value === "seleziona-reset" ? null : value)
                                                }
                                                value={filtroEsigenzeAlimentari || "seleziona-reset"}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleziona"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value="seleziona-reset"
                                                        className="[&[data-state=checked]]:hidden"
                                                    >
                                                        Seleziona
                                                    </SelectItem>
                                                    {esigenzeAlimentariOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div
                            className="flex flex-col sm:flex-row gap-4 mb-6 sm:justify-end px-4 s:ml-[-50vw] xs:ml-0">
                            <Input
                                type="text"
                                placeholder="Cerca un prodotto..."
                                value={cerca}
                                onChange={(e) => setCerca(e.target.value)}
                                className="w-full max-[375px]:min-w-[280px] sm:w-[500px] md:w-[600px] h-12 text-lg px-4"
                            />
                            <Select onValueChange={(value) => setOrdinamento(value)} value={ordinamento}>
                                <SelectTrigger className="w-full max-[375px]:min-w-[180px] sm:w-[200px] h-12 text-sm">
                                    <SelectValue placeholder="Ordina per"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="migliore">Risultato migliore</SelectItem>
                                    <SelectItem value="nome">Nome</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative p-1 sm:p-2">
                            <div
                                className="flex flex-wrap justify-center gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-3">
                                {prodottiMostrati.map((prodotto) => (
                                    <Link
                                        key={prodotto.id}
                                        // href={`/ristorante/${result.name}`}
                                        // href={`/prenotazione/crosta-d-oro-corsico`}
                                        // href={`/ristorante1`}
                                        href={`/storeNureboProduct`}
                                    >
                                        <div
                                            key={prodotto.id}
                                            className="w-full min-w-[265px] max-w-[340px] bg-white border rounded-lg shadow-sm flex flex-col sm:min-w-0 sm:max-w-none"
                                        >
                                            <div className="relative aspect-square">
                                                <img
                                                    src={prodotto.immagine}
                                                    alt={prodotto.nome}
                                                    className="object-contain w-full h-full p-3"
                                                />
                                                {prodotto.nuovo && (
                                                    <div
                                                        className="absolute top-2 right-2 bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center space-x-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                                        </svg>
                                                        <span>Nuovo</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 flex flex-col flex-1">
                                                <div
                                                    className="flex items-center gap-2 mb-4 bg-gray-100 rounded-full pr-3 pl-2 py-1 w-fit max-w-[90%] min-w-0">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className="w-4 h-4 flex-shrink-0"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              d="M6 6h.008v.008H6V6z"/>
                                                    </svg>
                                                    <span
                                                        className="text-sm font-medium text-gray-600 truncate whitespace-nowrap">
            {prodotto.categoria}
        </span>
                                                </div>

                                                <h3 className="text-lg font-semibold mb-2 leading-tight line-clamp-2">
                                                    {prodotto.nome}
                                                </h3>

                                                <div className="space-y-2 text-sm text-gray-700 mb-4">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4 flex-shrink-0 text-gray-500"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                                                        </svg>
                                                        <span className="truncate">{prodotto.marca}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4 flex-shrink-0 text-gray-500"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"/>
                                                        </svg>
                                                        <span className="line-clamp-1">{prodotto.modello}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4 flex-shrink-0 text-gray-500"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                                                        </svg>
                                                        <span>Disponibili: {prodotto.disponibilita}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-sans font-medium">Totale</span>
                                                        <span
                                                            className="text-lg font-bold font-sans text-gray-800">€{prodotto.prezzo.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {isLoading && (
                                <div className="flex justify-center py-8">
                                    <div
                                        className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-transparent"/>
                                </div>
                            )}

                            {!isLoading && itemsToShow >= prodotti.length && (
                                <div className="text-center py-8 text-gray-500">
                                    Hai raggiunto la fine dei risultati
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/*<div className="h-[1000px]"></div>*/}

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
        </div>
    );
};

export default DeliverooPage;