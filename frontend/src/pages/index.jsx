import Head from 'next/head'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import CatalogPreview from '@/components/CatalogPreview'
import DealsKanban from '@/components/DealsKanban'
import AIInbox from '@/components/AIInbox'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Head>
        <title>Mancrel - AI-Powered CRM for Modern Teams</title>
        <meta name="description" content="Transform your customer relationships with AI-powered insights, automation, and intelligent workflows." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Features />
          <CatalogPreview />
          <DealsKanban />
          <AIInbox />
        </main>
        <Footer />
      </div>
    </>
  )
}