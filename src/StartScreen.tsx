import { useState, useEffect } from "react";
import "./StartScreen.css";

interface StartScreenProps {
  onStart: () => void;
  onAbout: () => void;
  onExit?: () => void;
}

export default function StartScreen({ onStart, onAbout, onExit }: StartScreenProps) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Simulate intro animation delay
    const timer = setTimeout(() => {
      setShowMenu(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    onStart();
  };

  const handleAbout = () => {
    onAbout();
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
      return;
    }

    // For Tauri
    window.close();
  };

  return (
    <div className="start-container">
      {/* Background */}
      <div className="background" />

      {/* Overlay Glow */}
      <div className="overlay" />

      {/* Title */}
      <h1 className="game-title">Color Wars</h1>

      {/* Menu */}
      {showMenu && (
        <div className="menu">
          <button onClick={handleStart}>Start</button>
          <button onClick={handleAbout}>About</button>
          <button onClick={handleExit}>Exit</button>
        </div>
      )}
    </div>
  );
}
