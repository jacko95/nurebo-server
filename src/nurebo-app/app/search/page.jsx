import Image from "next/image";
import ListingMapView from "@/components/ListingMapView";
// import Header from "@/app/components/Header";

export default function Home() {
    return (
        <div className="w-full h-full">
            {/*<Header />*/}
            <ListingMapView type='Sell' />
        </div>
    );
}
