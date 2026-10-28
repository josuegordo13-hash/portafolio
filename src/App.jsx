import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { Projects } from './components/Projects'
import { About } from './components/About'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { GamesHub } from './components/GamesHub'
import { useEffect, useState } from 'react'

function App() {
  const [activeView, setActiveView] = useState(() =>
    window.location.hash === '#juegos' ? 'games' : 'portfolio'
  );

  const navigateToGames = () => {
    setActiveView('games');
    window.history.pushState(null, '', '#juegos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPortfolio = (hash = '#hero') => {
    setActiveView('portfolio');
    window.history.pushState(null, '', hash);
    setTimeout(() => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#juegos') {
        setActiveView('games');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
      <Header
        activeView={activeView}
        onNavigatePortfolio={navigateToPortfolio}
        onNavigateGames={navigateToGames}
      />
      <main>
        {activeView === 'games' ? (
          <GamesHub onBackToPortfolio={() => navigateToPortfolio('#hero')} />
        ) : (
          <>
            <Hero />
            <Services />
            <Projects />
            <About />
            <Contact />
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

export default App
