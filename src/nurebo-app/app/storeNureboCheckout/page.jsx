'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2, ChevronLeft, XCircle, Minus, Plus, ShoppingBag, Bike } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MdOutlineCreditCard } from 'react-icons/md';
import Image from 'next/image';

const CheckoutPage = () => {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [selectedTab, setSelectedTab] = useState('delivery');
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
    const [checkoutStep, setCheckoutStep] = useState('details');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const pickupPoints = [
        {id: 1, name: 'Negozio Centrale', address: 'Via Roma 123, Milano'},
        {id: 2, name: 'Filiale Nord', address: 'Viale Monza 45, Milano'},
    ];

    // Aggiunta elementi di esempio nel carrello
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        } else {
            // Carrello di esempio per dimostrazione
            const sampleCart = [
                {
                    id: '1',
                    name: 'Trapano Avvitatore a Batteria',
                    price: 189.99,
                    quantity: 1,
                    image: 'https://m.media-amazon.com/images/I/51ww6o-9-rL._AC_SL1200_.jpg'
                },
                {
                    id: '2',
                    name: 'Set di Utensili Professionali',
                    price: 89.50,
                    quantity: 2,
                    image: 'https://m.media-amazon.com/images/I/71KwgK07OTL._AC_SL1500_.jpg'
                }
            ];
            setCart(sampleCart);
            localStorage.setItem('cart', JSON.stringify(sampleCart));
        }
    }, []);

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

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
            setCheckoutStep('confirm');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 min-h-screen">
            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="mr-2 h-4 w-4"/>
                    Torna indietro
                </Button>

                <h1 className="flex items-center justify-center text-3xl font-bold mb-6">Checkout</h1>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sezione Carrello */}
                <div className="lg:sticky lg:top-20 h-fit bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold mb-6">Il tuo ordine</h2>

                    <div className="space-y-4 mb-8">
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Il carrello è vuoto
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-md">
                                            <div className="relative w-16 h-16 overflow-hidden">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-medium line-clamp-1">{item.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {item.quantity} x €{item.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-medium">
                                        €{(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Totale provvisorio:</span>
                            <span className="font-medium">€{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                            <span>Spese di spedizione:</span>
                            <span>{selectedTab === 'delivery' ? '€0.00' : 'Gratis'}</span>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <span className="font-bold text-lg">Totale:</span>
                            <span className="font-bold text-lg">€{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Sezione Checkout */}
                <div>

                    {checkoutStep === 'details' ? (
                        <div className="space-y-6">
                            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="w-full bg-gray-100">
                        <TabsTrigger
                            value="delivery"
                            className={cn(
                                "flex-1 flex items-center gap-2 font-medium text-sm",
                                selectedTab === 'delivery' ? 'bg-white text-primary shadow-lg' : 'bg-transparent text-gray-700'
                            )}
                        >
                            <Bike className="w-4 h-4"/>
                            Consegna
                        </TabsTrigger>
                        <TabsTrigger
                            value="takeaway"
                            className={cn(
                                "flex-1 flex items-center gap-2 font-medium text-sm",
                                selectedTab === 'takeaway' ? 'bg-white text-primary shadow-lg' : 'bg-transparent text-gray-700'
                            )}
                        >
                            <ShoppingBag className="w-4 h-4"/>
                            Ritiro
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Nome</Label>
                                    <Input
                                        value={customerData.firstName}
                                        onChange={(e) => setCustomerData({...customerData, firstName: e.target.value})}
                                        error={formErrors.firstName}
                                    />
                                </div>
                                <div>
                                    <Label>Cognome</Label>
                                    <Input
                                        value={customerData.lastName}
                                        onChange={(e) => setCustomerData({...customerData, lastName: e.target.value})}
                                        error={formErrors.lastName}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={customerData.email}
                                        onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                                        error={formErrors.email}
                                    />
                                </div>
                                <div>
                                    <Label>Telefono</Label>
                                    <Input
                                        type="tel"
                                        value={customerData.phone}
                                        onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                                        error={formErrors.phone}
                                    />
                                </div>
                            </div>

                            {selectedTab === 'delivery' ? (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Indirizzo</Label>
                                            <Input
                                                value={customerData.address}
                                                onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                                                error={formErrors.address}
                                            />
                                        </div>
                                        <div>
                                            <Label>Città</Label>
                                            <Input
                                                value={customerData.city}
                                                onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                                                error={formErrors.city}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>CAP</Label>
                                                <Input
                                                    value={customerData.zip}
                                                    onChange={(e) => setCustomerData({...customerData, zip: e.target.value})}
                                                    error={formErrors.zip}
                                                />
                                            </div>
                                            <div>
                                                <Label>Provincia</Label>
                                                <Input
                                                    value={customerData.province}
                                                    onChange={(e) => setCustomerData({...customerData, province: e.target.value})}
                                                    error={formErrors.province}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <Label>Punto di ritiro</Label>
                                    <Select
                                        value={customerData.pickupLocation}
                                        onValueChange={(value) => setCustomerData({...customerData, pickupLocation: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleziona un punto ritiro"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pickupPoints.map(point => (
                                                <SelectItem key={point.id} value={point.id.toString()}>
                                                    {point.name} - {point.address}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-4">
                                <Label>Data consegna/ritiro</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full text-left justify-start"
                                        >
                                            <CalendarIcon className="mr-3 h-5 w-5"/>
                                            {selectedDate ?
                                                format(selectedDate, "EEEE dd MMMM yyyy", {locale: it}) :
                                                "Seleziona data"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            disabled={(date) => date < new Date()}
                                            locale={it}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Button
                                size="lg"
                                className="w-full py-6 text-lg bg-primary hover:bg-primary-700"
                                onClick={handleCheckout}
                            >
                                <MdOutlineCreditCard className="mr-2 h-5 w-5"/>
                                Conferma ordine
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                            <h2 className="text-2xl font-bold mb-2">Ordine confermato!</h2>
                            <p className="text-gray-600 mb-6">
                                Riceverai una email di conferma all indirizzo<br/>
                                <span className="font-medium">{customerData.email}</span>
                            </p>
                            <Button onClick={() => router.push('/')}>
                                Torna alla home
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;