import '../styles/globals.css'
import { Inter, Sora } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'], display: 'swap' })
const sora = Sora({ subsets: ['latin'], weight: ['600','700','800'], display: 'swap' })

export default function App({ Component, pageProps }) {
  return (
    <main className={`${inter.className} ${sora.className}`}>
      <Component {...pageProps} />
    </main>
  )
}