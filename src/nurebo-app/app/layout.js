'use client';

import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
// import { usePathname } from "next/navigation"; // Importa usePathname
import Home from "./page";

// import {usePathname} from "next/navigation";
import {AppProvider} from "@/app/AppContext"; // Assicurati di usare il percorso corretto


// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

// export const metadata = {
//   // title: "Nurebo Restaurant",
//   description: "Benvenuti al ristorante Nurebo.",
// };

export default function RootLayout({children}) {
    // const pathname = usePathname(); // Ottieni la rotta attuale
    return (
        <html lang="en">
        <head>
            <link rel="icon"
                  // href="./favicon.ico"
                  href="https://nurebo-public.s3.eu-central-1.amazonaws.com/images/nJYfhTRcsnmzg0ewGEYo+(1).png"
                  type="image/x-icon"
            />
            <title>Nurebo Restaurant</title>
            {/*<meta name="viewport" content="width=1024"/>*/}
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>


            {/* <script type="application/ld+json">{"@context":"https:\/\/schema.org","@type":"Organization","name":"Weblink srl","url":"https:\/\/www.weblink.it","logo":"https:\/\/www.weblink.it\/wp-content\/uploads\/2019\/07\/favicon.png","sameAs":["https:\/\/www.facebook.com\/weblink.it","https:\/\/twitter.com\/https:\/\/twitter.com\/WeblinkSrl","https:\/\/instagram.com\/weblinksrl\/","https:\/\/www.youtube.com\/user\/Evergreentownitalia","https:\/\/www.linkedin.com\/company\/weblink"],"contactPoint":[{"@type":"ContactPoint","telephone":"+39 0332239546","contactOption":"TollFree","contactType":"sales"}]}</script> */}
            {/*<script type="application/ld+json">*/}
            {/*    {`{*/}
            {/*        "@context": "https://schema.org/",*/}
            {/*        "@type": "Product",*/}
            {/*        "name": "Amazon.it: Google liquido. Verso una nuova Internet - Taverniti, Giorgio - Libri",*/}
            {/*        "description": "Compra Google liquido. Verso una nuova Internet. SPEDIZIONE GRATUITA su ordini idonei",*/}
            {/*        "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "48"},*/}
            {/*        "offers": {*/}
            {/*            "@type": "Offer",*/}
            {/*            "price": "20.8",*/}
            {/*            "priceCurrency": "EUR",*/}
            {/*            "availability": "https://schema.org/InStock"*/}
            {/*        }*/}
            {/*    }`}*/}
            {/*</script>*/}

            <meta name="dc.title" content="Web Agency Varese Realizzazione siti web e-commerce e app" />
            <meta name="dc.description" content="Creazione siti web, realizzazione e-commerce, sviluppo app e custom software, Weblink Web Agency Varese opera in ambito digital da oltre vent&#039;anni." />
            <meta name="dc.relation" content="https://www.weblink.it/" />
            <meta name="dc.source" content="https://www.weblink.it/" />
            <meta name="dc.language" content="it_IT" />

            <meta name="twitter:card" content="summary_large_image"/>
            <meta name="twitter:domain" content="https://www.searchon.it"/>
            <meta name="twitter:site" content="@gtmasterclub"/>
            <meta name="twitter:creator" content="@gtmasterclub"/>
            <meta name='twitter:image:src' content="https://www.searchon.it/images/gt-idea-share-fb-02.png"/>
            <meta name="twitter:description" content="Find how our consultants can make your business grow | Take part to every event all over Italy and online | Get all the information and stay tuned on our network."/>
            <meta name="twitter:title" content="Web Agency Varese Realizzazione siti web e-commerce e app" />
            <meta name="twitter:image" content="https://www.weblink.it/wp-content/uploads/2020/01/weblink-web-agency-varese-1-1030x543.jpg" />

            <meta property="fb:admins" content="1354628317"/>
            <meta property="fb:pages" content="441879665843032" />

            <meta property='og:title' content="Search On Media Group: We share ideas and knowledge about digital marketing" />
            <meta property='og:description' content="Find how our consultants can make your business grow | Take part to every event all over Italy and online | Get all the information and stay tuned on our network." />
            <meta property='og:url' content='https://www.searchon.it/en/' />
            <meta property='og:site_name' content="gt idea" />
            <meta property='og:type' content="website" />
            <meta property='og:image' content="https://www.searchon.it/images/gt-idea-share-fb-02.png" />
            <meta property="og:locale" content="it_IT" />
            <meta property="og:locale:alternate" content="en_US" />
            <meta property="og:description" content="Creazione siti web, realizzazione e-commerce, sviluppo app e custom software, Weblink Web Agency Varese opera in ambito digital da oltre vent&#039;anni." />
            <meta property="og:image:secure_url" content="https://www.weblink.it/wp-content/uploads/2020/01/weblink-web-agency-varese-1.jpg" />
            <meta property="og:image:width" content="1500" />
            <meta property="og:image:height" content="791" />
            <meta property="og:image:alt" content="Weblink Web Agency a Varese" />

            <link rel="alternate" href="https://www.searchon.it/es/" hrefLang="es" />
            <link rel="alternate" href="https://www.searchon.it/en/" hrefLang="en" />
            <link rel="alternate" href="https://www.searchon.it" hrefLang="it" />
            <link rel="alternate" hrefLang="en" href="https://www.weblink.it/en/" />
            <link rel="alternate" hrefLang="it" href="https://www.weblink.it" />
            <link rel="alternate" hrefLang="x-default" href="https://www.weblink.it" />
            <link rel="alternate" href="https://uk.indeed.com/" hrefLang="en-gb"/>
            <link rel="alternate" href="https://gr.indeed.com/" hrefLang="el-gr"/>
            <link rel="alternate" href="https://hu.indeed.com/" hrefLang="hu-hu"/>
            <link rel="alternate" href="https://ie.indeed.com/" hrefLang="en-ie"/>
            <link rel="alternate" href="https://il.indeed.com/" hrefLang="iw-il"/>
            <link rel="alternate" hrefLang="fr-BE" href="https://fr.tennis-point.be/chaussures-de-tennis/" />
            <link rel="alternate" hrefLang="de-CH" href="https://www.tennis-point.ch/tennisschuhe/" />
            <link rel="alternate" hrefLang="fr-CH" href="https://fr.tennis-point.ch/chaussures-de-tennis/" />

            <meta name="referrer" content="origin-when-cross-origin"/>

            <link rel="license" href="https://creativecommons.org/licenses/by-sa/3.0/"/>

            <meta name="format-detection" content="telephone=no"/>

            <link rel="mask-icon" href="https://www.tennis-point.it/on/demandware.static/Sites-TPO-IT-Site/-/default/dwa51ffbdb/images/favicons/safari-pinned-tab.svg" color="#ffed00" />

            <meta name="google" content="notranslate"/>

            <meta name="p:domain_verify" content="eed8abd75641e89930e293770e1a608d"/>

            <meta name="keywords" content="Scarpe, tennis, compra, online, Tennis-Point" />

            {/*<link rel='preload' as='script' href='https://www.weblink.it/wp-content/cache/asset-cleanup/js/body-613dddc934e513b3ec696fe6bd78410d3e8b140a.js' data-wpacu-preload-js='1'>*/}

            <meta name="robots" content="index, follow" />
            <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
            <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

            <link rel="canonical" href="https://www.searchon.it/en/" />

            <link rel="dns-prefetch" href="//fonts.gstatic.com" />
            <link rel="dns-prefetch" href="//www.google-analytics.com" />
            <link rel="dns-prefetch" href="//fonts.googleapis.com" />
            {/*<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700;900&display=swap" rel="stylesheet">*/}
            <link rel='dns-prefetch' href='//maxcdn.bootstrapcdn.com' />

            <link href='https://fonts.gstatic.com' crossOrigin={`true`} rel='preconnect' />
            <link rel="alternate" type="application/rss+xml" title="Web Agency Varese &raquo; Feed" href="https://www.weblink.it/feed/" />
            <link rel="alternate" type="application/rss+xml" title="Web Agency Varese &raquo; Feed dei commenti" href="https://www.weblink.it/comments/feed/" />

            <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png"/>
            <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png"/>
            <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png"/>
            <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png"/>
            <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png"/>
            <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png"/>
            <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png"/>
            <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png"/>
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png"/>

            <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png"/>
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>

            <link rel="shortcut icon" href="/favicon.ico"/>

            {/*<link rel="manifest" href="../manifest.json"/>*/}

            <meta name="msapplication-TileColor" content="#ffffff"/>
            <meta name="msapplication-TileImage" content="/ms-icon-144x144.png"/>

            {/*<meta name="theme-color" content="#ffffff">*/}

            {/*<link rel='stylesheet' id='wpacu-combined-css-head-1' href='https://www.weblink.it/wp-content/cache/asset-cleanup/css/head-560c3bbb0a276868faab26b1ac4066369d229866.css' type='text/css' media='all' />*/}

            {/*<script type='text/javascript' id='wpacu-combined-js-head-group-1' src='https://www.weblink.it/wp-content/cache/asset-cleanup/js/head-b3ab9ca6750abe2fbd94a7da378f470f43a8c193.js'></script>*/}

            <link rel="https://api.w.org/" href="https://www.weblink.it/wp-json/" />
            <link rel="alternate" type="application/json" href="https://www.weblink.it/wp-json/wp/v2/pages/1462" />
            <link rel="EditURI" type="application/rsd+xml" title="RSD" href="https://www.weblink.it/xmlrpc.php?rsd" />

            <link rel="wlwmanifest" type="application/wlwmanifest+xml" href="https://www.weblink.it/wp-includes/wlwmanifest.xml" />
            <meta name="generator" content="WordPress 6.1.1" />
            <link rel='shortlink' href='https://www.weblink.it/' />
            <link rel="alternate" type="application/json+oembed" href="https://www.weblink.it/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fwww.weblink.it%2F" />
            <link rel="alternate" type="text/xml+oembed" href="https://www.weblink.it/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fwww.weblink.it%2F&#038;format=xml" />
            <meta name="generator" content="WPML ver:4.5.14 stt:1,27;" />

            {/*Cookie script*/}
            {/*<script type="text/javascript" charset="UTF-8" src="//cdn.cookie-script.com/s/e185c8d23355e8892649dedabee8f199.js"></script>*/}
            {/*<!-- End Cookie script*/}

            {/*Facebook Pixel Code */}
            {/*<script>*/}
            {/*    {`{!function (f, b, e, v, n, t, s) {*/}
            {/*        if (f.fbq) return;*/}
            {/*        n = f.fbq = function () {*/}
            {/*        n.callMethod ?*/}
            {/*        n.callMethod.apply(n, arguments) : n.queue.push(arguments)*/}
            {/*    };*/}
            {/*        if (!f._fbq) f._fbq = n;*/}
            {/*        n.push = n;*/}
            {/*        n.loaded = !0;*/}
            {/*        n.version = '2.0';*/}
            {/*        n.queue = [];*/}
            {/*        t = b.createElement(e);*/}
            {/*        t.async = !0;*/}
            {/*        t.src = v;*/}
            {/*        s = b.getElementsByTagName(e)[0];*/}
            {/*        s.parentNode.insertBefore(t, s)*/}
            {/*    }(window, document, 'script',*/}
            {/*        'https://connect.facebook.net/en_US/fbevents.js');*/}
            {/*        fbq('init', '1599466346905446');*/}
            {/*        fbq('track', 'PageView');}`}*/}
            {/*</script>*/}
            {/*<noscript><img height="1" width="1" alt="fb" style="display:none" src="https://www.facebook.com/tr?id=1599466346905446&ev=PageView&noscript=1" /></noscript>*/}
            {/*End Facebook Pixel Code*/}

            <link rel="profile" href="https://gmpg.org/xfn/11" />
            <link rel="alternate" type="application/rss+xml" title="Web Agency Varese RSS2 Feed" href="https://www.weblink.it/feed/" />
            <link rel="pingback" href="https://www.weblink.it/xmlrpc.php" />

            {/*<script type="text/javascript">{`{'use strict';var avia_is_mobile=!1;if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&'ontouchstart' in document.documentElement){avia_is_mobile=!0;document.documentElement.className+=' avia_mobile '}else{document.documentElement.className+=' avia_desktop '};document.documentElement.className+=' js_active ';(function(){var e=['-webkit-','-moz-','-ms-',''],n='',o=!1,a=!1;for(var t in e){if(e[t]+'transform' in document.documentElement.style){o=!0;n=e[t]+'transform'};if(e[t]+'perspective' in document.documentElement.style){a=!0}};if(o){document.documentElement.className+=' avia_transform '};if(a){document.documentElement.className+=' avia_transform3d '};if(typeof document.getElementsByClassName=='function'&&typeof document.documentElement.getBoundingClientRect=='function'&&avia_is_mobile==!1){if(n&&window.innerHeight>0){setTimeout(function(){var e=0,o={},a=0,t=document.getElementsByClassName('av-parallax'),i=window.pageYOffset||document.documentElement.scrollTop;for(e=0;e<t.length;e++){t[e].style.top='0px';o=t[e].getBoundingClientRect();a=Math.ceil((window.innerHeight+i-o.top)*0.3);t[e].style[n]='translate(0px, '+a+'px)';t[e].style.top='auto';t[e].className+=' enabled-parallax '}},50)}}})();}`}</script>*/}

        </head>
        {/*<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>*/}
        <body className={`antialiased`}>
        {/*<Home>{children}</Home>*/}
        {/*{children}*/}
        {/*<Home></Home>*/}
        <AppProvider>{children}</AppProvider>
        </body>
        </html>
    );
}
