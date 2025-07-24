/**
 * Floating Icons Generator
 * Creates animated background icons for O-EASY-TA website
 */

class FloatingIcons {
    constructor() {
        this.icons = [
            'fas fa-graduation-cap',
            'fas fa-book',
            'fas fa-pencil-alt',
            'fas fa-calculator',
            'fas fa-flask',
            'fas fa-microscope',
            'fas fa-atom',
            'fas fa-dna',
            'fas fa-chart-line',
            'fas fa-trophy',
            'fas fa-medal',
            'fas fa-star',
            'fas fa-lightbulb',
            'fas fa-brain',
            'fas fa-puzzle-piece',
            'fas fa-cog',
            'fas fa-rocket',
            'fas fa-globe',
            'fas fa-compass',
            'fas fa-map',
            'fas fa-bookmark',
            'fas fa-clipboard',
            'fas fa-calendar',
            'fas fa-clock',
            'fas fa-hourglass',
            'fas fa-stopwatch',
            'fas fa-bell',
            'fas fa-bullhorn',
            'fas fa-flag',
            'fas fa-target'
        ];
        
        this.init();
    }

    init() {
        this.createFloatingContainer();
        this.generateIcons();
    }

    createFloatingContainer() {
        // Check if container already exists
        if (document.querySelector('.floating-icons')) {
            return;
        }

        const container = document.createElement('div');
        container.className = 'floating-icons';
        document.body.appendChild(container);
    }

    generateIcons() {
        const container = document.querySelector('.floating-icons');
        if (!container) return;

        // Clear existing icons
        container.innerHTML = '';

        // Determine number of icons based on screen size
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        let iconCount = 20;
        if (isMobile) iconCount = 15;
        if (isSmallMobile) iconCount = 10;

        for (let i = 0; i < iconCount; i++) {
            const iconElement = document.createElement('i');
            const randomIcon = this.icons[Math.floor(Math.random() * this.icons.length)];
            
            iconElement.className = `floating-icon ${randomIcon}`;
            
            // Random positioning
            iconElement.style.top = Math.random() * 100 + '%';
            iconElement.style.left = Math.random() * 100 + '%';
            
            // Random animation delay
            iconElement.style.animationDelay = Math.random() * 6 + 's';
            
            // Random animation duration
            iconElement.style.animationDuration = (4 + Math.random() * 4) + 's';
            
            container.appendChild(iconElement);
        }
    }

    // Regenerate icons on window resize
    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.generateIcons();
        }, 250);
    }

    // Start the floating icons system
    start() {
        window.addEventListener('resize', () => this.handleResize());
        
        // Regenerate icons periodically for variety
        setInterval(() => {
            this.generateIcons();
        }, 30000); // Every 30 seconds
    }

    // Stop the floating icons system
    stop() {
        const container = document.querySelector('.floating-icons');
        if (container) {
            container.remove();
        }
        
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize floating icons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only add floating icons to pages that don't have their own background animations
    const hasCustomBackground = document.querySelector('.login-container, .main-container');
    
    if (hasCustomBackground) {
        const floatingIcons = new FloatingIcons();
        floatingIcons.start();
    }
});

// Export for manual initialization if needed
window.FloatingIcons = FloatingIcons;
