import { useEffect } from 'react';

interface AdsterraSocialBarProps {
  publisherId: string;
  adKey: string;
}

const AdsterraSocialBar = ({ publisherId, adKey }: AdsterraSocialBarProps) => {
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector(`script[data-adsterra="${adKey}"]`);
    if (existingScript) return;

    // Create and inject the Adsterra Social Bar script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
    script.async = true;
    script.setAttribute('data-adsterra', adKey);
    
    // Error handling
    script.onerror = () => {
      console.error('Failed to load Adsterra Social Bar script');
    };

    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.querySelector(`script[data-adsterra="${adKey}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [adKey, publisherId]);

  return null; // Social Bar renders itself via the script
};

export default AdsterraSocialBar;
