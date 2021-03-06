import {
    AspectRatio,
    Box,
    DarkMode,
    Flex,
    HStack,
    Progress,
} from '@chakra-ui/react'
import { Faded } from 'baby-i-am-faded'
import devServerImage from '../public/browser_image.jpg'
import buildSpeedImage from '../public/vscode_image.jpg'
import benchSpeedImage from '../public/benchmarks_cli.png'
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
    Image as ChakraImage,
} from 'landing-blocks/src'
import Image from 'next/image'
import codeTheme from 'prism-react-renderer/themes/vsDark'
import { FiMaximize, FiPackage, FiSmile, FiZap } from 'react-icons/fi'
import { GITHUB_LINK } from '../constants'
import { GradientBg } from '../components/GradientBg'
// import GradientBgImg from '../public/gradient-bg.svg'

// TODO easy to debug code directly on browser, support for super fast HMR with react refresh, take advantage of esbuild for super fast production builds,

const heroCode = `

npm i -g @bundless/cli
bundless quickstart ./my-app

`

const benchmarks = `
server ready (without any cache), less is better

  ▇▇▇▇▇▇▇▇▇▇▇▇▇           [19.075 secs] - yarn snowpack dev --reload
  ▇▇▇▇▇▇▇▇                [12.201 secs] - yarn cross-env BROWSER=none craco start
  ▇▇▇                     [3.763 secs] - yarn vite --force
  ▇▇                      [3.552 secs] - yarn bundless dev --force

server ready (with cache), less is better

  ▇                       [0.719 secs] - yarn bundless dev
  ▇                       [0.641 secs] - yarn snowpack dev
  ▇                       [0.465 secs] - yarn vite

static build, less is better

  ▇▇▇▇▇▇▇▇▇               [14.058 secs] - yarn craco build
  ▇▇▇▇▇▇▇▇                [12.599 secs] - yarn vite build
  ▇▇▇▇▇▇▇                 [10.461 secs] - yarn snowpack build
  ▇▇▇                     [3.967 secs] - yarn bundless build

browser first page refresh, less is better

  ▇▇▇▇                    [5.446 secs] - yarn snowpack dev --port 9070
  ▇▇▇                     [5.174 secs] - yarn bundless dev --port 9070
  ▇▇▇                     [3.858 secs] - yarn vite --port 9070
  ▇                       [1.220 secs] - yarn cross-env BROWSER=none PORT=9070 craco start

browser second page refresh, less is better

  ▇▇                      [2.902 secs] - yarn vite --port 9070
  ▇▇                      [2.889 secs] - yarn snowpack dev --port 9070
  ▇▇                      [2.469 secs] - yarn bundless dev --port 9070
  ▇                       [1.122 secs] - yarn cross-env BROWSER=none PORT=9070 craco start
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
                primary='#9e0057'
                // color='#444'
            >
                <MyNavbar />
                <Box
                    // opacity={0.7}
                    mt='0px !important'
                    position='absolute'
                    // width='100vw'
                    alignSelf='center'
                    top='0px'
                    zIndex={0}
                    as={GradientBg}
                />
                <Hero
                    bullet='Bundless v0.0'
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

                <Feature
                    flip
                    bullet='dev server'
                    heading='Super fast dev server experience'
                    cta={<Link href='/docs'>Read the docs</Link>}
                    image={
                        <PatternBackground
                            pattern='diagonalLinesSm'
                            color='#888'
                            scatter={-30}
                        >
                            <ChakraImage
                                shadow='lg'
                                borderRadius='md'
                                maxHeight={['370px']}
                                src={devServerImage}
                            />
                        </PatternBackground>
                    }
                    subheading='Bundless uses esbuild under the hood, making it the fastest application dev server available'
                />

                <Feature
                    bullet='bundler'
                    heading='Fastest build speed'
                    cta={<Link href='/docs'>Read the docs</Link>}
                    image={
                        <PatternBackground
                            pattern='diagonalLinesSm'
                            color='#888'
                            scatter={-40}
                        >
                            <ChakraImage
                                shadow='lg'
                                borderRadius='md'
                                maxHeight={['400px']}
                                src={buildSpeedImage}
                            />
                        </PatternBackground>
                    }
                    subheading='Bundless builds your web application 20 times faster in average compared to other bundlers like Webpack'
                />
                <Stack spacing='10' position='relative' align='stretch'>
                    <Box
                        // opacity={0.6}
                        mt='0px !important'
                        position='absolute'
                        width='100%'
                        bottom='0px'
                        // zIndex={-1}
                        transform='scaleY(-1) scaleX(-1)'
                        as={GradientBg}
                    />

                    <SectionTitle
                        heading='Fast at any scale'
                        subheading='Bundless has been built with performance and scale in mind'
                    />
                    <Box m='6' />
                    <PatternBackground
                        pattern='diagonalLinesSm'
                        color='#888'
                        scatter={-30}
                        alignSelf='center'
                        minWidth={['400px', null, null, '600px']}
                        position='relative'
                    >
                        <Stack p='12' pb='6' bg='#111' borderRadius='md'>
                            <Box as='pre'>{benchmarks}</Box>
                            <Box m='8' />
                            <Box alignSelf='center' fontSize='18px'>
                                <Link
                                    target='_blank'
                                    href='https://github.com/remorses/bundless-benchmark'
                                >
                                    Benchmarks available on Github
                                </Link>
                            </Box>
                        </Stack>
                    </PatternBackground>
                    {/* <ChakraImage
                        position='relative'
                        alignSelf='center'
                        src={benchSpeedImage}
                        maxHeight={['500px']}
                    /> */}
                </Stack>

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
                            key={i}
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
                                bg='transparent'
                                width='100%'
                                size='sm'
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
                cascade={true}
                damping={0.6}
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
                ].map((x, i) => (
                    <Stack
                        key={i}
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
