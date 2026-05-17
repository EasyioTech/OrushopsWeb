// ============= Theme Management =============
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.body = document.body;
        this.init();
    }

    init() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            this.body.classList.add('dark-mode');
        }
        this.themeToggle.addEventListener('click', () => this.toggle());
    }

    toggle() {
        this.body.classList.toggle('dark-mode');
        const isDarkMode = this.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
}

// ============= Mobile Navigation =============
class MobileNav {
    constructor() {
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.init();
    }

    init() {
        this.navToggle.addEventListener('click', () => this.toggle());
        this.navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.close());
        });
    }

    toggle() {
        this.navMenu.classList.toggle('active');
        this.navToggle.classList.toggle('active');
        this.navToggle.setAttribute('aria-expanded', this.navMenu.classList.contains('active'));
    }

    close() {
        this.navMenu.classList.remove('active');
        this.navToggle.classList.remove('active');
        this.navToggle.setAttribute('aria-expanded', 'false');
    }
}

// ============= Scroll Animations =============
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                    observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        document.querySelectorAll('.feature-card, .persona-card, section h2, .section-subtitle').forEach(el => {
            el.style.opacity = '0';
            observer.observe(el);
        });
    }
}

// ============= Utilities =============
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function handleDownload(event) {
    event.preventDefault();
    alert('Play Store link coming soon! Join our waitlist for early access.');
}

// ============= Keyboard Navigation =============
function initKeyboardNav() {
    document.querySelectorAll('.feature-card, .persona-card').forEach(card => {
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

// ============= Initialize on DOM Ready =============
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new MobileNav();
    new ScrollAnimations();
    initKeyboardNav();
});
