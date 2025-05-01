
import * as React from "react"
import { useState, useEffect } from 'react'; // Import useEffect

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize state to undefined to detect server render vs client render
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    // This effect only runs on the client
    const checkDevice = () => {
       setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    };

     checkDevice(); // Initial check

     const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
     mql.addEventListener("change", checkDevice);

     // Cleanup listener on unmount
     return () => mql.removeEventListener("change", checkDevice);
  }, []); // Empty dependency array ensures this runs once on mount

  // Return undefined on server or before first client render,
  // then return the actual boolean value
  return isMobile;
}
