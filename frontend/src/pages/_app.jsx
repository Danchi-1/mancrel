import '../styles/globals.css'
import { Inter, Sora } from 'next/font/google'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'], display: 'swap' })
const sora = Sora({ subsets: ['latin'], weight: ['600','700','800'], display: 'swap' })

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <main className={`${inter.className} ${sora.className}`}>
        <Component {...pageProps} />
      </main>
    </>
  )
}