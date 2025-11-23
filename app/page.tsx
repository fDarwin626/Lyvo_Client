import AboutSummary from "@/app/sections/landing/AboutSummary";
import Hero from "@/app/sections/landing/Hero";
import Navbar from "@/components/Navbar";
import About from "./sections/landing/About";
import Services from "./sections/landing/Services";
import Footer from "./sections/landing/Footer";

export default function Home(){
  return (
    <>
    <Navbar/>
    <Hero/>
    <AboutSummary/>
    <About/>
    <Services/>
    <Footer/>
    </>
  )
}