import React from 'react'

export function GradientBg(props) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='2069'
            height='896'
            viewBox='0 0 2069 896'
            {...props}
        >
            <defs>
                <linearGradient
                    id='gradient-bg-a'
                    x1='-3.555%'
                    x2='113.386%'
                    y1='47.884%'
                    y2='44.716%'
                >
                    <stop
                        offset='0%'
                        stopColor='#FF87CA'
                        stopOpacity='0.5'
                    ></stop>
                    <stop
                        offset='100%'
                        stopColor='#8E74FF'
                        stopOpacity='0.5'
                    ></stop>
                </linearGradient>
                <linearGradient
                    id='gradient-bg-b'
                    x1='40.946%'
                    x2='10.946%'
                    y1='23.071%'
                    y2='104.634%'
                >
                    <stop offset='0%' stopColor='#0086ED'></stop>
                    <stop
                        offset='88%'
                        stopColor='#00051a'
                        stopOpacity='0'
                    ></stop>
                </linearGradient>
            </defs>
            <g fill='none' fillRule='evenodd'>
                <path
                    fill='url(#gradient-bg-a)'
                    d='M1242 0c-38.865 83.27-71.693 180.235-98.483 290.9-40.186 165.995-194.7 194.583-305.246 169.64-110.546-24.942-386.11 13.506-476.947 90.035C270.488 627.103 132.961 829.943 0 899.843V0h1242z'
                    transform='translate(-1 -153)'
                ></path>
                <path
                    fill='url(#gradient-bg-b)'
                    d='M2070 0c-220.942 126.097-378.483 236.446-472.623 331.046-245.902 247.104-235.34 553.99-496.712 587.543-125.767 16.145-140.903-117.595-295.597-151.593-103.129-22.665-367.21 71.273-792.246 281.815H2070V0z'
                    transform='translate(-1 -153)'
                ></path>
            </g>
        </svg>
    )
}
