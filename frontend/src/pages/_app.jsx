import '../styles/globals.css'
import { Inter, Sora } from 'next/font/google'
import Head from 'next/head'

import { GoogleOAuthProvider } from '@react-oauth/google'

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'], display: 'swap' })
const sora = Sora({ subsets: ['latin'], weight: ['600','700','800'], display: 'swap' })

export default function App({ Component, pageProps }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "missing-client-id"
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <main className={`${inter.className} ${sora.className}`}>
        <Component {...pageProps} />
      </main>
    </GoogleOAuthProvider>
  )
}