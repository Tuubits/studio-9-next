import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const MultiLinkBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const links = [
    {
      text: "Check out our upcoming adventures...",
      url: undefined
    },
    {
      text: "Riders on the Midnight Storm: Rolling in this Summer",
      url: "https://www.backerkit.com/call_to_action/5d338461-3785-4b67-84b3-09c66c0d276f/landing"
    },
    {
      text: "101 Dungeon Encounters: Adventuring this Fall",
      url: "https://www.backerkit.com/call_to_action/de1f7231-1efc-4736-83fe-1a7f7e9b631f/landing"
    }
  ];

  // Auto-rotate through links
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % links.length);
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const goToPrevious = (e:any) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + links.length) % links.length);
  };

  const goToNext = (e:any) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % links.length);
  };

  if (!isVisible) return null;

  return (
    <div className="relative">
      {/* Mobile Banner - Carousel Style */}
      <div className="md:hidden bg-success text-white text-xl">
        <a 
          href={links[currentIndex].url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 transition-colors"
        >
          <button
            onClick={goToPrevious}
            className="p-1 rounded"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 text-center px-2">
            <p className="font-bold text-xl">{links[currentIndex].text}</p>
          </div>
          
          <button
            onClick={goToNext}
            className="p-1 rounded"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </a>
        
        {/* Dots indicator */}
        <div className="flex justify-center pb-2 gap-1">
          {links.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-accent'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Banner - All Links Visible */}
      <div className="hidden md:block bg-success text-white text-xl">
        <div className="flex items-center">
          <div className="flex-1 flex">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 p-3 text-center border-r border-neutral last:border-r-0"
              >
                <p className="font-bold text-base lg:text-lg">{link.text}</p>
              </a>
            ))}
          </div>
          
          {/* Close button */}
          {/* <button
            onClick={() => setIsVisible(false)}
            className="p-3 hover:bg-green-700 transition-colors"
            aria-label="Close banner"
          >
            <X size={20} />
          </button> */}
        </div>
      </div>
    </div>
  );
};

// Alternative: Rotating Text Banner
const RotatingTextBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const links = [
    {
      text: "Check out our upcoming adventures...",
      url: undefined
    },
    {
      text: "Riders on the Midnight Storm: Rolling in this Summer",
      url: "https://www.backerkit.com/call_to_action/5d338461-3785-4b67-84b3-09c66c0d276f/landing"
    },
    {
      text: "101 Dungeon Encounters: Adventuring this Fall",
      url: "https://www.backerkit.com/call_to_action/de1f7231-1efc-4736-83fe-1a7f7e9b631f/landing"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % links.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <a 
      href={links[currentIndex].url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="p-3 bg-success transition-colors">
        <div className={`text-center transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <p className="font-bold text-white text-xl md:text-base">
            {links[currentIndex].text}
          </p>
        </div>
      </div>
    </a>
  );
};

// Simple Stacked Version
const StackedBanner = () => {
  const links = [
    {
      text: "Check out our upcoming adventures!",
      url: "https://www.backerkit.com/c/projects/studio-9-games/into-the-dark",
      highlight: true
    },
    {
      text: "Riders on the Midnight Storm: Rolling in this Summer",
      url: "https://www.backerkit.com/call_to_action/5d338461-3785-4b67-84b3-09c66c0d276f/landing"
    },
    {
      text: "101 Dungeon Encounters: Adventuring this Fall",
      url: "https://www.backerkit.com/call_to_action/de1f7231-1efc-4736-83fe-1a7f7e9b631f/landing"
    }
  ];

  return (
    <div className="bg-accent">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block p-2 text-center transition-colors ${
            index > 0 ? 'border-t border-success' : ''
          }`}
        >
          <p className={`font-bold text-white text-xl md:text-base ${
            link.highlight ? 'text-lg' : ''
          }`}>
            {link.text}
          </p>
        </a>
      ))}
    </div>
  );
};

// Export the main component (you can switch between them)
export default MultiLinkBanner;