document.addEventListener('DOMContentLoaded', () => {
  // Generate Background Rain
  const rainContainer = document.querySelector('.rain');
  const dropCount = 40;
  
  for (let i = 0; i < dropCount; i++) {
    const drop = document.createElement('div');
    drop.classList.add('drop');
    drop.style.left = `${Math.random() * 100}vw`;
    drop.style.animationDuration = `${Math.random() * 0.8 + 0.4}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.opacity = Math.random() * 0.5 + 0.2;
    rainContainer.appendChild(drop);
  }

  // UI Elements
  const pullSwitch = document.getElementById('switch');
  const scene = document.getElementById('scene');
  const toSignup = document.getElementById('to-signup');
  const toLogin = document.getElementById('to-login');
  const loginBox = document.querySelector('.login-box');
  const signupBox = document.querySelector('.signup-box');
  
  // Toggle forms
  toSignup.addEventListener('click', () => {
    loginBox.classList.remove('active');
    signupBox.classList.add('active');
  });

  toLogin.addEventListener('click', () => {
    signupBox.classList.remove('active');
    loginBox.classList.add('active');
  });

  // Pull down logic
  let isDragging = false;
  let startY = 0;
  let currentY = 0;
  const PULL_THRESHOLD = 50;

  // Touch / Mouse events for the switch
  pullSwitch.addEventListener('mousedown', dragStart);
  pullSwitch.addEventListener('touchstart', dragStart, { passive: true });

  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: false });

  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (scene.classList.contains('open')) return;
    isDragging = true;
    startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    pullSwitch.style.transition = 'none';
  }

  function dragMove(e) {
    if (!isDragging) return;
    
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    currentY = clientY - startY;
    
    // Only allow pulling down
    if (currentY > 0 && currentY < PULL_THRESHOLD) {
      pullSwitch.style.transform = `translateX(-50%) translateY(${currentY}px)`;
    } else if (currentY >= PULL_THRESHOLD) {
      // Threshold reached, trigger open
      triggerOpen();
    }
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    // Reset if it didn't reach threshold
    if (!scene.classList.contains('open')) {
      pullSwitch.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.2, 0.265, 1.3)';
      pullSwitch.style.transform = `translateX(-50%) translateY(0)`;
    }
  }

  function triggerOpen() {
    isDragging = false;
    pullSwitch.style.transform = `translateX(-50%) translateY(0)`;
    pullSwitch.style.transition = 'top 1s cubic-bezier(0.68, -0.2, 0.265, 1.3)';
    scene.classList.add('open');
  }

  // Also support clicking to toggle (useful if already open and want to close)
  pullSwitch.addEventListener('click', (e) => {
    // If we just dragged, don't trigger click
    if (currentY > 10 && !scene.classList.contains('open')) {
      currentY = 0;
      return;
    }
    
    scene.classList.toggle('open');
    
    if (!scene.classList.contains('open')) {
      // reset form to login when closing
      setTimeout(() => {
        signupBox.classList.remove('active');
        loginBox.classList.add('active');
      }, 500);
    }
    currentY = 0;
  });
});
