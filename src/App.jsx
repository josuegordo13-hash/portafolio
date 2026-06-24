import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { Projects } from './components/Projects'
import { About } from './components/About'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { useEffect } from 'react'

function App() {
  // Mobile Menu Logic
  useEffect(() => {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const headerRight = document.getElementById('headerRight');
    const header = document.getElementById('header');

    if (mobileToggle && navMenu && headerRight) {
      const toggleMenu = () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        headerRight.classList.toggle('active');
      };
      mobileToggle.addEventListener('click', toggleMenu);

      return () => {
        mobileToggle.removeEventListener('click', toggleMenu);
      }
    }
  }, []);

  // Header Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById('header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Projects />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App
