import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useMobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  useEffect(function cloeOnResize() {
    const handleResize = () => {
      setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(
    function closeOnPathChange() {
      setIsOpen(false);
    },
    [path],
  );

  const toggle = () => {
    setIsOpen((isOpen) => !isOpen);
  };

  return {
    isOpen,
    toggle,
  };
};
