// hero ke neeche ki pahadiyan, farmhouse aur ped (sirf SVG, koi image file nahi)
export default function HeroScene() {
    return (
        <svg
            className="hm-scene"
            viewBox="0 0 1440 320"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
        >
            {/* door ki pahadi */}
            <path
                d="M0 210 C 240 140, 480 240, 720 190 S 1200 130, 1440 200 L1440 320 L0 320 Z"
                fill="#8ccf9b"
                opacity="0.65"
            />

            {/* beech ki pahadi */}
            <path
                d="M0 245 C 300 185, 560 285, 860 235 S 1260 195, 1440 245 L1440 320 L0 320 Z"
                fill="#4ea36a"
            />

            {/* ped */}
            <g>
                <rect x="170" y="228" width="8" height="34" fill="#6b4a2f" />
                <circle cx="174" cy="222" r="26" fill="#2b6b45" />
                <rect x="250" y="236" width="7" height="28" fill="#6b4a2f" />
                <circle cx="253" cy="230" r="20" fill="#34805a" />
                <rect x="1240" y="224" width="8" height="34" fill="#6b4a2f" />
                <circle cx="1244" cy="218" r="27" fill="#2b6b45" />
                <rect x="1310" y="232" width="7" height="28" fill="#6b4a2f" />
                <circle cx="1313" cy="226" r="20" fill="#34805a" />
            </g>

            {/* farmhouse */}
            <g transform="translate(880 168)">
                <rect x="68" y="4" width="10" height="26" fill="#8c4330" />
                <rect x="0" y="30" width="92" height="56" fill="#fff7e6" />
                <polygon points="-8,32 46,-8 100,32" fill="#b5523b" />
                <rect x="37" y="52" width="18" height="34" fill="#7a4a2b" />
                <rect x="9" y="44" width="17" height="17" rx="2" fill="#9ad1e8" />
                <rect x="66" y="44" width="17" height="17" rx="2" fill="#9ad1e8" />
            </g>

            {/* samne ki pahadi (page ke rang jaisi, taaki hero page mein ghul jaye) */}
            <path
                d="M0 285 C 360 245, 700 320, 1040 280 S 1320 268, 1440 288 L1440 320 L0 320 Z"
                fill="#f7f5ef"
            />
        </svg>
    );
}