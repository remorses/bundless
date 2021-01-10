import { Box, DarkMode, Flex, HStack, Image, Progress } from '@chakra-ui/react'
import { Faded } from 'baby-i-am-faded'
import {
    Button,
    CodeSnippet,
    Divider,
    Feature,
    Footer,
    Heading,
    Hero,
    LandingProvider,
    Link,
    NavBar,
    PageContainer,
    PatternBackground,
    SectionTitle,
    Stack,
} from 'landing-blocks/src'
import codeTheme from 'prism-react-renderer/themes/vsDark'
import { FiMaximize, FiPackage, FiSmile, FiZap } from 'react-icons/fi'
import { GITHUB_LINK } from '../constants'
import GradientBgImg from '../public/gradient-bg.svg'

const heroCode = `

npm i -g @bundless/cli
bundless dev

`

const Page = () => {
    return (
        <DarkMode>
            <LandingProvider
                position='relative'
                bg='#000'
                color='#fff'
                dark
                // minH='100%'
                minH='100%'
                black='#333'
                primary='#812959'
                // color='#444'
            >
                <MyNavbar />
                <Box
                    opacity={0.7}
                    mt='0px !important'
                    position='absolute'
                    // width='100vw'
                    alignSelf='center'
                    top='0px'
                    zIndex={0}
                    as={GradientBgImg}
                />
                <Hero
                    bullet='Bundless 0.0'
                    heading={
                        <Heading>
                            Next gen <br />
                            development server <br /> and bundler
                        </Heading>
                    }
                    subheading={
                        <Box lineHeight='1.6em'>
                            Build and ship your applications faster
                        </Box>
                    }
                    cta={
                        <a target='_blank' href={'/docs'}>
                            <Button>Quick Start</Button>
                        </a>
                    }
                    // image={<Image h='200px' w='300px' src='/robot.svg' />}
                    image={
                        <PatternBackground
                            pattern='diagonalLinesSm'
                            color='#bbb'
                            scatter={-20}
                        >
                            {/* <Box cursor='pointer' width='160px' as={PlayButton} /> */}
                            <CodeSnippet
                                fontSize='1.1em'
                                minH='0'
                                language='bash'
                                dark
                                px='20'
                                pl='10'
                                code={heroCode.trim()}
                                theme={codeTheme}
                            />
                        </PatternBackground>
                    }
                    // cta={<Button>Try Genql in 5 minutes</Button>}
                    // fingerprint='Already using Genql? Sign in'
                />
                <Divider heading='application bundler and dev server' />
                <Features alignSelf='center' />
                {/* <TestimonialsLogos
            animate
            // heading='Works everywhere'
            // subheading='browser and node environments'
            testimonials={[
                <Box size='80px' as={ReactIcon} />,
                <Box size='90px' as={AngularIcon} />,
                <Box size='90px' as={NodeIcon} />,
                <Box size='90px' as={AngularIcon} />,

                // <Box size='90px' as={OtherIcon} />,
            ]}
        /> */}
                <Stack spacing='20' position='relative' align='stretch'>
                    <Box
                        opacity={0.3}
                        mt='0px !important'
                        position='absolute'
                        width='100%'
                        bottom='0px'
                        zIndex={-1}
                        transform='scaleY(-1) scaleX(-1)'
                        as={GradientBgImg}
                    />

                    <SectionTitle
                        heading='10x faster than other bundlers'
                        subheading='Most productive way to experiment, showcase your components'
                    />
                    {/* <Benchmark
                        spacing='14'
                        benchmarks={[
                            { name: 'Bundless', value: 2.3 },
                            { name: 'Webpack', value: 20 },
                            { name: 'Parcel', value: 24 },
                        ]}
                    /> */}
                </Stack>

                <Feature
                    flip
                    heading='Fastest dev server'
                    subheading='Bundless uses esbuild under the hook, making it the fastest application bundler available'
                    image={
                        <Benchmark
                            benchmarks={[
                                { name: 'Bundless', value: 2.3 },
                                { name: 'Webpack', value: 20 },
                                { name: 'Parcel', value: 24 },
                            ]}
                        />
                    }
                />

                <Feature
                    heading='Fastest build speed'
                    subheading='Bundless uses esbuild under the hook, making it the fastest application bundler available'
                    image={
                        <Benchmark
                            primaryColor='teal'
                            flip
                            benchmarks={[
                                { name: 'Bundless', value: 2.3 },
                                { name: 'Webpack', value: 20 },
                                { name: 'Parcel', value: 24 },
                            ]}
                        />
                    }
                />

                {/* <Section degree={0} zIndex={1} bg='white'>
            <Banner
                //
                heading='Want to use the cli instead?'
                bullet='cli is cool too'
                subheading='You can generate the client locally based on an endpoint or a local graphql schema.'
                bg='transparent'
                image={
                    <Image
                        ml='-60px'
                        minW='300px'
                        width='500px'
                        src='/banner.jpg'
                    />
                }
                cta={
                    <a href='/docs'>
                        <Button>Read the Docs</Button>
                    </a>
                }
            />
        </Section> */}
                <MyFooter />
            </LandingProvider>
        </DarkMode>
    )
}

export function MyFooter({ ...rest }) {
    return (
        <Footer
            businessName='Bundless'
            columns={{
                Resources: [
                    <Link href={GITHUB_LINK}>Github</Link>,
                    <Link href={'/docs'}>Docs</Link>,
                ],
                'Find Me': [
                    <Link href='https://twitter.com/__morse'>Twitter</Link>,
                    <Link href='https://github.com/remorses/'>Github</Link>,
                ],
                'Who made this?': [
                    <Link href='https://twitter.com/__morse'>My Twitter</Link>,
                    <Link href='https://github.com/remorses/'>My Github</Link>,
                ],
                // 'Proudly sponsored by Vercel': [
                //     <Box as={PoweredByVercel} alignSelf='center' />,
                // ],
            }}
            {...rest}
        />
    )
}

export function Benchmark({
    benchmarks,
    primaryColor = 'pink',
    spacing = '8',
    flip = false,
    secondaryColor = 'gray',
}) {
    const max = Math.max(...benchmarks.map((x) => x.value))
    return (
        <PageContainer pageWidth='570px'>
            <Stack spacing={spacing}>
                {benchmarks.map((x, i) => {
                    return (
                        <Stack
                            align={flip ? 'flex-end' : 'flex-start'}
                            spacing='2'
                        >
                            <Box
                                // color={
                                //     i === 0
                                //         ? primaryColor + '.50'
                                //         : secondaryColor + '.50'
                                // }
                                color='white'
                                fontWeight='medium'
                                fontSize='22px'
                            >
                                {x.name}
                            </Box>

                            <Progress
                                transform={flip ? 'scaleX(-1)' : 'none'}
                                // bg='transparent'
                                width='100%'
                                max={max}
                                min={0}
                                hasStripe
                                isAnimated
                                colorScheme={
                                    i === 0 ? primaryColor : secondaryColor
                                }
                                opacity={i === 0 ? 1 : 0.7}
                                borderRadius='4px'
                                value={x.value}
                            />

                            <Box color={'gray.400'} fontWeight='medium'>
                                {x.value.toFixed(1)} seconds
                            </Box>
                        </Stack>
                    )
                })}
            </Stack>
        </PageContainer>
    )
}

export function MyNavbar({ ...rest }) {
    const navs = [
        <Link isExternal href={GITHUB_LINK}>
            Github
        </Link>,
        <Link isExternal href={'/docs'}>
            Docs
        </Link>,
    ]
    return (
        <NavBar
            logo={
                <Box opacity={0.8} fontSize='26px' fontWeight='semibold'>
                    Bundless
                </Box>
            }
            navs={navs}
            {...rest}
        />
    )
}

export default Page

// FEATURES

export const Features = ({ ...rest }) => {
    return (
        <PageContainer>
            <Flex
                as={Faded}
                width='100%'
                // spacing='10'
                fontWeight='600'
                letterSpacing='0.06em'
                fontSize='1.3em'
                justify='space-between'
                align='center'
                flexWrap='wrap'
                {...rest}
            >
                {[
                    { heading: 'simple', icon: FiMaximize },
                    { heading: 'fast', icon: FiZap },
                    { heading: 'small', icon: FiPackage },
                    { heading: 'just works', icon: FiSmile },
                ].map((x) => (
                    <Stack
                        w={['100%', null, 'auto']}
                        mx={'10'}
                        my='12'
                        align='center'
                        spacing='10'
                    >
                        <Box fontWeight='100' h='50px' w='50px' as={x.icon} />
                        <Box>{x.heading.toUpperCase()}</Box>
                    </Stack>
                ))}
            </Flex>
        </PageContainer>
    )
}
