/**
 * ==============================================================================
 * SPESIAL UNTUK DITASALSAAZZAHRA - 21st BIRTHDAY INTERACTIVE SCRIPT
 * Version: 2.0.1 (Fixed Loading Bug)
 * Architecture: Object-Oriented, ES6+, Canvas API, Web Audio API Fallbacks
 * ==============================================================================
 */

'use strict';

// ==============================================================================
// 1. CONFIGURATION & CONSTANTS
// ==============================================================================
const APP_CONFIG = {
    TYPING_SPEED: 100,
    EVASION_SPEED: 300,
    CONFETTI_COUNT: 250,
    CONFETTI_COLORS: [
        '#ff4b6e', '#ff758f', '#ff9a9e', '#d4af37', '#ffffff', '#fec5bb'
    ],
    AUDIO_SRC: 'lagu.mp3',
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

// ==============================================================================
// 2. CONFETTI PHYSICS ENGINE (CANVAS API)
// ==============================================================================
class ConfettiEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.animationId = null;
        this.isActive = false;

        this.initCanvas();
        this.bindEvents();
    }

    initCanvas() {
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.w = window.innerWidth;
            this.h = window.innerHeight;
            this.canvas.width = this.w;
            this.canvas.height = this.h;
        });
    }

    createParticles(count = APP_CONFIG.CONFETTI_COUNT) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h - this.h,
                r: Math.random() * 6 + 4,
                dx: Math.random() * 2 - 1,
                dy: Math.random() * 3 + 2,
                color: APP_CONFIG.CONFETTI_COLORS[Math.floor(Math.random() * APP_CONFIG.CONFETTI_COLORS.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0,
                shape: Math.random() > 0.5 ? 'circle' : 'rect'
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.w, this.h);
        
        this.particles.forEach((p, index) => {
            p.tiltAngle += p.tiltAngleIncrement;
            p.y += (Math.cos(p.tiltAngle) + p.dy + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle) * 2 + p.dx;
            p.x += 0.5;

            this.ctx.beginPath();
            this.ctx.lineWidth = p.r;
            this.ctx.strokeStyle = p.color;
            this.ctx.moveTo(p.x + p.tilt + p.r, p.y);
            this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            this.ctx.stroke();

            if (p.y > this.h + 20 || p.x > this.w + 20 || p.x < -20) {
                if (this.isActive) {
                    p.x = Math.random() * this.w;
                    p.y = -20;
                    p.tilt = Math.floor(Math.random() * 10) - 10;
                } else {
                    this.particles.splice(index, 1);
                }
            }
        });

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(this.draw.bind(this));
        } else {
            this.stop();
        }
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.createParticles();
        this.draw();
        
        setTimeout(() => {
            this.isActive = false;
        }, 10000);
    }

    triggerBurst(x, y) {
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: x,
                y: y,
                r: Math.random() * 5 + 3,
                dx: (Math.random() - 0.5) * 15,
                dy: (Math.random() - 0.5) * 15 - 5,
                color: APP_CONFIG.CONFETTI_COLORS[Math.floor(Math.random() * APP_CONFIG.CONFETTI_COLORS.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }
        if (!this.animationId) {
            this.draw();
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.particles = [];
    }
}

// ==============================================================================
// 3. MAIN APPLICATION LOGIC
// ==============================================================================
class BirthdayApp {
    constructor() {
        this.elements = {
            body: document.body,
            loader: document.getElementById('loader-wrapper'),
            welcomeSection: document.getElementById('section-welcome'),
            messageSection: document.getElementById('section-message'),
            btnYes: document.getElementById('btn-yes'),
            btnNo: document.getElementById('btn-no'),
            interactiveArea: document.querySelector('.interactive-area'),
            typeTarget: document.querySelector('.typing-effect'),
            reasonItems: document.querySelectorAll('.reason-item'),
            candleTrigger: document.getElementById('candle-trigger'),
            btnReplay: document.getElementById('btn-replay'),
            bgMusic: document.getElementById('bg-music')
        };

        this.state = {
            isLoaded: false,
            isMessageRevealed: false,
            isCandleBlown: false,
            evasionCount: 0
        };

        this.confetti = new ConfettiEngine('confetti-canvas');

        this.handleBtnNoHover = this.handleBtnNoHover.bind(this);
        this.revealMessage = this.revealMessage.bind(this);
        this.blowCandle = this.blowCandle.bind(this);
        this.resetApp = this.resetApp.bind(this);
        
        this.init();
    }

    init() {
        const startApp = () => {
            setTimeout(() => {
                this.removeLoader();
                this.startTypingEffect();
                this.setupEventListeners();
                this.setupIntersectionObserver();
            }, 1500);
        };

        // FIX: Cek apakah halaman sudah selesai dimuat agar tidak stuck di loading
        if (document.readyState === 'complete') {
            startApp();
        } else {
            window.addEventListener('load', startApp);
        }
    }

    removeLoader() {
        if (!this.elements.loader) return;
        this.elements.loader.classList.add('fade-out');
        this.elements.body.classList.remove('loading-state');
        this.state.isLoaded = true;
        
        setTimeout(() => {
            this.elements.loader.style.display = 'none';
        }, 800);
    }

    startTypingEffect() {
        const target = this.elements.typeTarget;
        if (!target) return;

        const text = target.innerText;
        target.innerText = ''; 
        target.style.opacity = '1';

        let index = 0;
        const typeChar = () => {
            if (index < text.length) {
                target.innerText += text.charAt(index);
                index++;
                setTimeout(typeChar, APP_CONFIG.TYPING_SPEED);
            } else {
                setTimeout(() => {
                    target.classList.add('typing-done');
                }, 1000);
            }
        };

        typeChar();
    }

    setupEventListeners() {
        if (this.elements.btnNo) {
            this.elements.btnNo.addEventListener('mouseover', this.handleBtnNoHover);
            this.elements.btnNo.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleBtnNoHover();
            }, { passive: false });
        }

        if (this.elements.btnYes) {
            this.elements.btnYes.addEventListener('click', this.revealMessage);
        }

        if (this.elements.candleTrigger) {
            this.elements.candleTrigger.addEventListener('click', this.blowCandle);
            this.elements.candleTrigger.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.blowCandle();
            }, { passive: false });
        }

        if (this.elements.btnReplay) {
            this.elements.btnReplay.addEventListener('click', this.resetApp);
        }
        
        document.addEventListener('click', () => this.initAudio(), { once: true });
        document.addEventListener('touchstart', () => this.initAudio(), { once: true });
    }

    handleBtnNoHover() {
        if (!this.elements.btnNo || !this.elements.interactiveArea) return;

        this.state.evasionCount++;
        
        const btn = this.elements.btnNo;
        const container = this.elements.interactiveArea;

        btn.style.position = 'absolute';
        btn.style.transition = `all ${APP_CONFIG.EVASION_SPEED}ms cubic-bezier(0.68, -0.55, 0.26, 1.55)`;

        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        const padding = 10;
        const maxX = containerRect.width - btnRect.width - padding;
        const maxY = containerRect.height - btnRect.height - padding;

        let randomnessX = Math.random();
        let randomnessY = Math.random();

        const newX = Math.max(padding, Math.floor(randomnessX * maxX));
        const newY = Math.max(padding, Math.floor(randomnessY * maxY));

        btn.style.left = `${newX}px`;
        btn.style.top = `${newY}px`;

        if (this.state.evasionCount === 3) {
            btn.querySelector('.btn-text').innerText = "Susah kan? 😝";
        } else if (this.state.evasionCount === 6) {
            btn.querySelector('.btn-text').innerText = "Pilih 'Mau Banget' aja!";
        } else if (this.state.evasionCount > 10) {
            btn.querySelector('.btn-text').innerText = "Nyaho wleee 🤪";
        }
    }

    revealMessage() {
        if (this.state.isMessageRevealed) return;
        this.state.isMessageRevealed = true;

        this.elements.welcomeSection.classList.remove('active-section');
        this.elements.welcomeSection.classList.add('hidden-section');
        
        setTimeout(() => {
            this.elements.welcomeSection.style.display = 'none';
            this.elements.messageSection.style.display = 'block';
            
            requestAnimationFrame(() => {
                this.elements.messageSection.classList.remove('hidden-section');
                this.elements.messageSection.classList.add('active-section');
                
                this.confetti.start();
                this.initAudio();
                
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }, 800);
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, options);

        this.elements.reasonItems.forEach(item => {
            observer.observe(item);
        });
    }

    blowCandle() {
        if (this.state.isCandleBlown) return;
        this.state.isCandleBlown = true;

        const trigger = this.elements.candleTrigger;
        trigger.classList.add('blown-out');
        
        const rect = trigger.getBoundingClientRect();
        const burstX = rect.left + (rect.width / 2);
        const burstY = rect.top;

        this.confetti.triggerBurst(burstX, burstY);

        const textHint = trigger.parentElement.previousElementSibling;
        if (textHint && textHint.classList.contains('micro-text')) {
            textHint.innerText = "(Yeaaay! Make a wish sayang 💖)";
            textHint.style.color = 'var(--clr-primary)';
            textHint.style.fontWeight = 'bold';
        }
    }

    initAudio() {
        const audio = this.elements.bgMusic;
        if (!audio) return;

        if (!audio.src || audio.src === window.location.href) {
            audio.src = APP_CONFIG.AUDIO_SRC;
            audio.volume = 0.4;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Auto-play prevented by browser. Waiting for explicit user interaction.", error);
            });
        }
    }

    resetApp() {
        window.scrollTo(0, 0);
        window.location.reload();
    }
}

// ==============================================================================
// 4. INITIALIZATION BOOTSTRAP
// ==============================================================================
(function bootstrap() {
    if (window.BirthdayAppInstance) return;

    console.log(
        "%c Happy 21st Birthday Ditasalsaazzahra! 💖",
        "color: #ff4b6e; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 0 #ff9a9e;"
    );
    console.log("Developed with ❤️ specially for you.");

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.BirthdayAppInstance = new BirthdayApp();
        });
    } else {
        window.BirthdayAppInstance = new BirthdayApp();
    }
})();