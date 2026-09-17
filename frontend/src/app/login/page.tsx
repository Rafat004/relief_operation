"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./umbrella.css";

export default function LoginPage() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Drag logic
  const [currentY, setCurrentY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const PULL_THRESHOLD = 50;

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (!isOpen) {
        setCurrentY(0);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.clientY - startY.current;
      handleDragMoveDelta(deltaY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const deltaY = e.touches[0].clientY - startY.current;
      handleDragMoveDelta(deltaY);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
    };
  }, [isOpen]);

  const handleDragMoveDelta = (deltaY: number) => {
    if (deltaY > 0 && deltaY < PULL_THRESHOLD) {
      setCurrentY(deltaY);
    } else if (deltaY >= PULL_THRESHOLD) {
      isDragging.current = false;
      setCurrentY(0);
      setIsOpen(true);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isOpen) return;
    isDragging.current = true;
    startY.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
  };

  const handleClickSwitch = () => {
    if (currentY > 10 && !isOpen) {
      setCurrentY(0);
      return;
    }
    
    setIsOpen(!isOpen);
    
    if (isOpen) {
      // If we are closing, wait and switch back to login view
      setTimeout(() => {
        setIsLoginView(true);
        setError(null);
        setSuccess(null);
      }, 500);
    }
    setCurrentY(0);
  };

  // Form Submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
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
    } else {
      setSuccess("Account created! You can now log in.");
      setIsLoginView(true);
    }
    setLoading(false);
  };

  // Generate rain drops statically to avoid hydration mismatch, or use effect
  const [drops, setDrops] = useState<{ left: string; duration: string; delay: string; opacity: number }[]>([]);
  useEffect(() => {
    const newDrops = Array.from({ length: 40 }).map(() => ({
      left: `${Math.random() * 100}vw`,
      duration: `${Math.random() * 0.8 + 0.4}s`,
      delay: `${Math.random() * 2}s`,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setDrops(newDrops);
  }, []);

  return (
    <div className="umbrella-page">
      <div className="rain">
        {drops.map((drop, i) => (
          <div
            key={i}
            className="drop"
            style={{
              left: drop.left,
              animationDuration: drop.duration,
              animationDelay: drop.delay,
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
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onClick={handleClickSwitch}
                style={{
                  transform: `translateX(-50%) translateY(${currentY}px)`,
                  transition: isDragging.current ? "none" : (isOpen ? "top 1s cubic-bezier(0.68, -0.2, 0.265, 1.3)" : "transform 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.3)")
                }}
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
            <div className={`form-box login-box ${isLoginView ? "active" : ""}`}>
              <h2>Welcome Back</h2>
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="error-message" style={{ color: '#4ade80' }}>{success}</p>}
                <p className="toggle-text">
                  Don't have an account?{" "}
                  <span onClick={() => { setIsLoginView(false); setError(null); setSuccess(null); }}>
                    Sign up
                  </span>
                </p>
              </form>
            </div>

            {/* Sign Up Form */}
            <div className={`form-box signup-box ${!isLoginView ? "active" : ""}`}>
              <h2>Create Account</h2>
              <form onSubmit={handleSignup}>
                <div className="input-group">
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
                {error && <p className="error-message">{error}</p>}
                <p className="toggle-text">
                  Already have an account?{" "}
                  <span onClick={() => { setIsLoginView(true); setError(null); setSuccess(null); }}>
                    Login
                  </span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
