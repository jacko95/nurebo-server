import React, { useEffect, useRef, useState } from 'react';
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function GoogleMapSection({ coordinates, listing = [], selectedPropertyId, onMarkerClick, item }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const [isMapReady, setIsMapReady] = useState(false);

    console.log('listing')
    console.log(listing)
    console.log('item')
    console.log(item)

    // Aggiungi questo useEffect IN CIMA al tuo componente GoogleMapSection
    useEffect(() => {
        // Funzione che blocca TUTTO lo scroll quando il mouse è su un popup
        const globalScrollBlocker = (e) => {
            const target = e.target;
            const isPopup = target.closest('.maplibregl-popup') ||
                target.closest('.custom-maplibre-popup');

            if (isPopup && (e.type === 'wheel' || e.type === 'touchmove')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        };

        // Aggiungi listener globali
        document.addEventListener('wheel', globalScrollBlocker, { passive: false, capture: true });
        document.addEventListener('touchmove', globalScrollBlocker, { passive: false, capture: true });

        return () => {
            document.removeEventListener('wheel', globalScrollBlocker, { capture: true });
            document.removeEventListener('touchmove', globalScrollBlocker, { capture: true });
        };
    }, []);

    useEffect(() => {
        // Inietta gli stili per nascondere la X di MapLibre
        const style = document.createElement('style');
        style.textContent = `
        /* Nascondi la X di default di MapLibre (quella che fa schifo) */
        .maplibregl-popup-close-button {
            display: none !important;
        }
        
        /* Il nostro bottone custom */
        .custom-close-btn {
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            width: 24px !important;
            height: 24px !important;
            background: white !important;
            border-radius: 50% !important;
            border: 1px solid #e5e7eb !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            z-index: 1000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 0 !important;
            color: #6b7280 !important;
            transition: all 0.2s ease !important;
        }
        
        .custom-close-btn:hover {
            background: #f3f4f6 !important;
            color: #374151 !important;
            border-color: #d1d5db !important;
        }
        
        .custom-close-btn svg {
            width: 14px !important;
            height: 14px !important;
            stroke-width: 2.5px !important;
        }
        
        .custom-maplibre-popup .maplibregl-popup-content {
            padding: 0 !important;
            background: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
        }
        
        .maplibregl-popup-tip {
            display: none !important;
        }
    `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Pulisci i marker esistenti
        markersRef.current.forEach(marker => marker?.remove());
        markersRef.current = [];

        const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

        if (!apiKey) {
            console.error('NEXT_PUBLIC_MAPTILER_KEY mancante');
            return;
        }

        try {
            // Imposta dimensioni fisse per evitare problemi di rendering
            mapContainer.current.style.width = '100%';
            mapContainer.current.style.height = '100%';
            mapContainer.current.style.minHeight = '500px';

            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: `https://api.maptiler.com/maps/019bc2b1-292b-7ce9-94a4-ae70d6032bcd/style.json?key=${apiKey}`,
                center: [9.191, 45.464],
                zoom: 12,
                attributionControl: true,
            });

            // Aggiungi controlli di navigazione
            map.current.addControl(new maplibregl.NavigationControl(), "top-right");

            // Gestisci il caricamento
            map.current.once("load", () => {
                setIsMapReady(true);
                console.log('✅ Mappa pronta');
            });

        } catch (error) {
            console.error('Errore inizializzazione mappa:', error);
        }

        return () => {
            if (map.current) {
                markersRef.current.forEach(marker => marker?.remove());
                markersRef.current = [];
                // map.current.remove();
                map.current = null;
            }
            setIsMapReady(false);
        };
    }, []);

    // Sostituisci l'ultimo useEffect che gestisce le coordinate con questo:
    useEffect(() => {
        if (map.current && coordinates?.lng && coordinates?.lat) {
            console.log('📍 Sposto mappa a:', coordinates);
            map.current.flyTo({
                center: [coordinates.lng, coordinates.lat],
                zoom: 15,
                // duration: 1000
            });

            // Evidenzia il marker della proprietà selezionata
            markersRef.current.forEach(marker => {
                const markerLngLat = marker.getLngLat();
                if (markerLngLat.lng === coordinates.lng && markerLngLat.lat === coordinates.lat) {
                    marker.remove(); // Rimuovi il vecchio marker verde
                    const newMarker = new maplibregl.Marker({
                        color: "#FF0000",
                        scale: 1.5
                    })
                        .setLngLat([coordinates.lng, coordinates.lat])
                        .addTo(map.current);

                    // Sostituisci nel markersRef
                    const index = markersRef.current.indexOf(marker);
                    markersRef.current[index] = newMarker;
                }
            });
        }
    }, [coordinates])

    // In ListingMapView.js, aggiungi questo useEffect
    useEffect(() => {
        // Inietta gli stili minimi necessari per i popup
        const style = document.createElement('style');
        style.textContent = `
        .custom-maplibre-popup .maplibregl-popup-content {
            padding: 0 !important;
            background: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
        }
        .maplibregl-popup-tip {
            display: none !important;
        }
    `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // 🔥 UNICO useEffect PER I MARKER - CON GESTIONE CLICK E POPUP
    useEffect(() => {
        if (!isMapReady || !map.current || !listing.length) return;

        console.log('🔄 Creazione marker per:', listing.length, 'proprietà');

        // 1. Rimuovi tutti i marker precedenti
        markersRef.current.forEach(marker => marker?.remove());
        markersRef.current = [];

        // Variabile per tenere traccia del popup aperto
        let currentPopup = null;

        // Funzione per calcolare il centro con offset
        const getOffsetCenter = (lng, lat, offsetPixels = 120) => {
            if (!map.current) return [lng, lat];

            try {
                // Converte le coordinate in pixel sulla mappa
                const point = map.current.project([lng, lat]);

                // Aggiunge offset verticale (positivo = verso il basso)
                point.y += offsetPixels;

                // Converte di nuovo in coordinate geografiche
                const offsetLngLat = map.current.unproject(point);

                return [offsetLngLat.lng, offsetLngLat.lat];
            } catch (error) {
                console.error('Errore nel calcolo offset:', error);
                return [lng, lat];
            }
        };

        // 2. Crea marker per ogni proprietà
        listing.forEach((item, index) => {
            try {
                const lng = item.lng;
                const lat = item.lat;

                if (!lng || !lat) {
                    console.warn(`⚠️ Coordinate mancanti per:`, item);
                    return;
                }

                const isSelected = selectedPropertyId === item.id;

                const marker = new maplibregl.Marker({
                    color: isSelected ? "#FF0000" : "#4aef44",
                    scale: isSelected ? 1.5 : 1.0,
                    draggable: false
                })
                    .setLngLat([Number(lng), Number(lat)])
                    .addTo(map.current);

                // POPUP CON SOLO DETTAGLI DEL NEGOZIO (il tuo codice HTML)
                const popup = new maplibregl.Popup({
                    offset: 50,
                    closeButton: true,
                    closeOnClick: false,
                    className: 'custom-maplibre-popup',
                    // Aggiungi un offset al popup per spostarlo leggermente sopra il marker
                    anchor: 'bottom' // L'ancora è in basso, così il popup sta sopra il marker
                }).setHTML(`
    <div class="bg-white rounded-xl shadow-xl overflow-hidden min-w-[280px] border border-gray-200 relative">
        <!-- Header con badge tipo negozio -->
        <div class="p-4 border-b border-gray-100">
            <div class="flex items-center justify-between mb-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    item.storeType === 'elettronica' ? 'bg-blue-100 text-blue-800' :
                        item.storeType === 'abbigliamento' ? 'bg-green-100 text-green-800' :
                            item.storeType === 'lusso' ? 'bg-yellow-100 text-yellow-800' :
                                item.storeType === 'alimentari' ? 'bg-red-100 text-red-800' :
                                    item.storeType === 'sport' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                }">
                    ${item.storeType || 'Negozio'}
                </span>
                <button class="custom-close-btn" onclick="this.closest('.maplibregl-popup').querySelector('.maplibregl-popup-close-button')?.click()">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M15 5L5 15M5 5l10 10"/>
                    </svg>
                </button>
            </div>
            <h3 class="font-bold text-gray-900 text-base leading-tight line-clamp-2">${item.storeName}</h3>
            <p class="text-sm text-gray-600 mt-1">Negozio</p>
        </div>
        
        <!-- Corpo con dettagli del negozio -->
        <div class="p-4">
            <!-- Indirizzo -->
            <div class="flex items-start mb-3">
                <span class="text-gray-500 mr-2 mt-0.5">📍</span>
                <div>
                    <p class="text-gray-600 text-sm leading-snug font-medium">${item.storeAddress}</p>
                    <p class="text-gray-500 text-xs mt-1">${item.storeCity || ''} ${item.storeZip || ''}</p>
                </div>
            </div>
            
            <!-- Orari di apertura -->
            <div class="mb-3">
                <div class="flex items-center mb-1">
                    <span class="text-gray-500 mr-2">🕒</span>
                    <span class="text-gray-700 text-sm font-medium">Orari di apertura</span>
                </div>
                <p class="text-gray-600 text-sm ml-6">${item.storeHours || 'Lun-Ven: 9:00-19:00'}</p>
            </div>
          
            
            <!-- Informazioni aggiuntive -->
            <div class="flex flex-wrap gap-2 mb-4">
                ${item.storeServices ? `
                <div class="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span class="mr-2">🔧</span>
                    <span class="font-medium text-gray-700 text-xs">${item.storeServices}</span>
                </div>` : ''}
                
                ${item.parkingAvailable ? `
                <div class="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span class="mr-2">🅿️</span>
                    <span class="font-medium text-gray-700 text-xs">Parcheggio</span>
                </div>` : ''}
                
                ${item.wifiAvailable ? `
                <div class="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span class="mr-2">📶</span>
                    <span class="font-medium text-gray-700 text-xs">WiFi</span>
                </div>` : ''}
            </div>
            
            <!-- Bottone per vedere il negozio -->
<!--            <button class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm">-->
<!--                Vedi negozio-->
<!--            </button>-->
            <a href="/storeNureboHome" class="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm text-center">
            Vedi negozio
        </a>
        </div>
        
        <!-- Freccia inferiore -->
        <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-200 rotate-45"></div>
    </div>
`);

                // GESTIONE CLICK SUL MARKER
                marker.getElement().addEventListener('click', (e) => {
                    e.stopPropagation();

                    // Chiudi il popup attualmente aperto
                    if (currentPopup && currentPopup.isOpen()) {
                        currentPopup.remove();
                    }

                    // Apri questo popup
                    try {
                        marker.togglePopup();
                    } catch (e) {
                        console.log(e)
                    }
                    currentPopup = popup;

                    // Chiama la callback per aggiornare la gridview
                    if (onMarkerClick) {
                        onMarkerClick(item);
                    }

                    // Sposta la mappa con offset (il marker sarà più in alto)
                    const offsetCenter = getOffsetCenter(lng, lat, -120); // 120 pixel di offset

                    map.current.flyTo({
                        center: offsetCenter,
                        zoom: 14,
                        duration: 800,
                        essential: true
                    });
                });

                marker.setPopup(popup);

                // ✅ FIX: Aggiungi controllo di sicurezza per il popup
                const popupInstance = marker.getPopup();
                if (popupInstance) {
                    popupInstance.on('open', () => {
                        const popupElement = popupInstance.getElement();
                        if (popupElement) {
                            // Impedisce lo scroll della mappa quando si scrolla nel popup
                            popupElement.addEventListener('wheel', (e) => {
                                e.stopPropagation();
                                const { scrollTop, scrollHeight, clientHeight } = popupElement;
                                const isAtTop = scrollTop === 0;
                                const isAtBottom = scrollHeight - scrollTop <= clientHeight + 1;

                                if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
                                    e.preventDefault();
                                }
                            }, { passive: false });

                            // Previeni touch scroll mobile
                            popupElement.addEventListener('touchmove', (e) => {
                                e.stopPropagation();
                            }, { passive: false });
                        }
                    });
                } else {
                    console.warn('⚠️ Popup non disponibile per il marker:', item.storeName);
                }

                // Se è selezionato dalla gridview, apri popup
                if (isSelected) {
                    setTimeout(() => {
                        // Chiudi altri popup
                        if (currentPopup && currentPopup.isOpen()) {
                            currentPopup.remove();
                        }

                        try {
                            marker.togglePopup();
                        } catch (e) {
                            console.log(e)
                        }

                        currentPopup = popup;

                        // Sposta mappa con offset
                        const offsetCenter = getOffsetCenter(lng, lat, -120);

                        map.current.flyTo({
                            center: offsetCenter,
                            zoom: 14,
                            duration: 1000,
                            essential: true
                        });
                    }, 300);
                }

                markersRef.current.push(marker);

            } catch (error) {
                console.error(`❌ Errore marker ${index}:`, error);
            }
        });

        console.log(`🎯 Totale marker creati: ${markersRef.current.length}`);

    }, [isMapReady, listing, selectedPropertyId, onMarkerClick]);

    return (
        <div className="relative w-full h-full">
            <div
                ref={mapContainer}
                className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-gray-300 shadow-xl"
            />

            {/* Badge visibile sempre */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-20">
                <div className="w-3 h-3 rounded-full bg-[#4aef44]"></div>
                <span className="font-medium text-gray-800 text-sm">
        {listing?.length || 0} negozi
    </span>
            </div>
        </div>
    );
}

export default GoogleMapSection;