"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Kept for UI, but Supabase auth primarily uses email
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rainDrops, setRainDrops] = useState<{ id: number; left: number; duration: number; delay: number; opacity: number }[]>([]);

  // Refs for drag logic
  const pullSwitchRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const PULL_THRESHOLD = 50;

  useEffect(() => {
    // Generate Rain
    const dropCount = 40;
    const drops = [];
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        id: i,
        left: Math.random() * 100,
        duration: Math.random() * 0.8 + 0.4,
        delay: Math.random() * 2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setRainDrops(drops);

    // Global event listeners for drag
    const handleGlobalMouseMove = (e: MouseEvent) => dragMove(e);
    const handleGlobalTouchMove = (e: TouchEvent) => dragMove(e);
    const handleGlobalMouseUp = () => dragEnd();
    const handleGlobalTouchEnd = () => dragEnd();

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isOpen]);

  const dragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isOpen) return;
    isDragging.current = true;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    if (pullSwitchRef.current) {
      pullSwitchRef.current.style.transition = "none";
    }
  };

  const dragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    currentY.current = clientY - startY.current;
    
    if (currentY.current > 0 && currentY.current < PULL_THRESHOLD) {
      if (pullSwitchRef.current) {
        pullSwitchRef.current.style.transform = `translateX(-50%) translateY(${currentY.current}px)`;
      }
    } else if (currentY.current >= PULL_THRESHOLD) {
      triggerOpen();
    }
  };

  const dragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (!isOpen) {
      if (pullSwitchRef.current) {
        pullSwitchRef.current.style.transition = "transform 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.3)";
        pullSwitchRef.current.style.transform = `translateX(-50%) translateY(0)`;
      }
    }
  };

  const triggerOpen = () => {
    isDragging.current = false;
    if (pullSwitchRef.current) {
      pullSwitchRef.current.style.transform = `translateX(-50%) translateY(0)`;
      pullSwitchRef.current.style.transition = "top 1s cubic-bezier(0.68, -0.2, 0.265, 1.3)";
    }
    setIsOpen(true);
  };

  const handleSwitchClick = () => {
    if (currentY.current > 10 && !isOpen) {
      currentY.current = 0;
      return;
    }
    setIsOpen(!isOpen);
    if (isOpen) {
      setTimeout(() => {
        setActiveForm("login");
        setError(null);
      }, 500);
    }
    currentY.current = 0;
  };

  // Auth Logic
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // If email confirmation is required, handle it here, otherwise just log them in/redirect
      router.push("/");
    }
  };

  return (
    <div className="login-body">
      <div className="rain">
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className="drop"
            style={{
              left: `${drop.left}vw`,
              animationDuration: `${drop.duration}s`,
              animationDelay: `${drop.delay}s`,
              opacity: drop.opacity,
            }}
          />
        ))}
      </div>

      <div className={`scene ${isOpen ? "open" : ""}`} id="scene">
        {/* Left Side: Umbrella */}
        <div className="left-panel">
          <div className="umbrella" id="umbrella">
            {/* The Canopy Structure */}
            <div className="canopy"></div>
            
            {/* The Shaft Structure */}
            <div className="shaft">
              {/* Interactive Pull Switch */}
              <div 
                className="runner-wrapper" 
                id="switch" 
                ref={pullSwitchRef}
                onMouseDown={dragStart}
                onTouchStart={dragStart}
                onClick={handleSwitchClick}
              >
                <div className="runner"></div>
                <p className="pull-text">PULL DOWN</p>
              </div>
            </div>
            
            {/* The Handle */}
            <div className="handle"></div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="right-panel">
          <div className="form-container">
            
            {/* Login Form */}
            <div className={`form-box login-box ${activeForm === "login" ? "active" : ""}`}>
              <h2>Welcome Back</h2>
              <form onSubmit={handleLogin}>
                {error && <p style={{color: '#ff5e62', textAlign: 'center', marginBottom: '10px', fontSize: '14px'}}>{error}</p>}
                <div className="input-group">
                  <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input-group">
                  <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Login"}
                </button>
                <p className="toggle-text">Don't have an account? <span onClick={() => {setActiveForm("signup"); setError(null);}}>Sign up</span></p>
              </form>
            </div>
            
            {/* Sign Up Form */}
            <div className={`form-box signup-box ${activeForm === "signup" ? "active" : ""}`}>
              <h2>Create Account</h2>
              <form onSubmit={handleSignup}>
                {error && <p style={{color: '#ff5e62', textAlign: 'center', marginBottom: '10px', fontSize: '14px'}}>{error}</p>}
                <div className="input-group">
                  <input type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="input-group">
                  <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input-group">
                  <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Sign Up"}
                </button>
                <p className="toggle-text">Already have an account? <span onClick={() => {setActiveForm("login"); setError(null);}}>Login</span></p>
              </form>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
