import React from 'react';

export default function Slider2() {
    const images = [
        '/images/bird-colorful-logo-gradient-vector-removebg-preview.png',
        '/images/cosmetic-beauty-spa-massage-wedding-logo-letter-l_68880-1749-removebg-preview.png',
        '/images/dk-letter-logo-initial-colorful-gradient_343694-1303-removebg-preview.png',
        '/images/indonesian-halal-logo-new-branding-2022_17005-1495-removebg-preview.png',
        '/images/logo3-removebg-preview (1).png',
        '/images/bird-colorful-logo-gradient-vector-removebg-preview.png',
        '/images/cosmetic-beauty-spa-massage-wedding-logo-letter-l_68880-1749-removebg-preview.png',
        '/images/dk-letter-logo-initial-colorful-gradient_343694-1303-removebg-preview.png',
        '/images/indonesian-halal-logo-new-branding-2022_17005-1495-removebg-preview.png',
        '/images/logo3-removebg-preview (1).png',
        '/images/bird-colorful-logo-gradient-vector-removebg-preview.png',
        '/images/cosmetic-beauty-spa-massage-wedding-logo-letter-l_68880-1749-removebg-preview.png',
        '/images/dk-letter-logo-initial-colorful-gradient_343694-1303-removebg-preview.png',
        '/images/indonesian-halal-logo-new-branding-2022_17005-1495-removebg-preview.png',
        '/images/logo3-removebg-preview (1).png',
    ];

    return (
        <>
            <style>
                {`
          @keyframes anuj {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .anuj {
            animation: anuj 10s linear infinite;
          }
        `}
            </style>

            <div className="overflow-hidden py-8 ">
                <div className="relative w-full">
                    <div className="flex anuj gap-5 whitespace-nowrap w-full ">
                        {images.concat(images).map((src, index) => (
                            <img key={index} src={src} alt="" className="w-[150px] h-auto object-contain" />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
