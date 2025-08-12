/**
 * TrevID Button Component
 * Reusable button component with consistent styling and behavior
 */

class TrevIDButton {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            variant: 'primary',
            size: 'medium',
            loading: false,
            disabled: false,
            icon: null,
            iconPosition: 'left',
            ...options
        };
        
        this.init();
    }

    init() {
        this.setupClasses();
        this.setupAttributes();
        this.setupEventListeners();
        this.render();
    }

    setupClasses() {
        const baseClasses = ['trevid-btn'];
        const variantClass = `trevid-btn--${this.options.variant}`;
        const sizeClass = `trevid-btn--${this.options.size}`;
        
        this.element.className = [...baseClasses, variantClass, sizeClass].join(' ');
    }

    setupAttributes() {
        if (this.options.disabled) {
            this.element.setAttribute('disabled', '');
            this.element.setAttribute('aria-disabled', 'true');
        }
        
        if (this.options.loading) {
            this.element.setAttribute('aria-busy', 'true');
        }
    }

    setupEventListeners() {
        this.element.addEventListener('click', (e) => {
            if (this.options.disabled || this.options.loading) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Add ripple effect
            this.addRippleEffect(e);
        });
    }

    render() {
        const content = this.buildContent();
        this.element.innerHTML = content;
    }

    buildContent() {
        const { icon, iconPosition, loading } = this.options;
        const text = this.element.textContent || this.element.getAttribute('data-text') || '';
        
        let content = '';
        
        if (loading) {
            content = `
                <span class="trevid-btn__spinner" aria-hidden="true">
                    <svg class="trevid-btn__spinner-icon" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </span>
                <span class="trevid-btn__text">${text}</span>
            `;
        } else if (icon) {
            const iconElement = `<i class="trevid-btn__icon ${icon}" aria-hidden="true"></i>`;
            const textElement = `<span class="trevid-btn__text">${text}</span>`;
            
            if (iconPosition === 'right') {
                content = `${textElement}${iconElement}`;
            } else {
                content = `${iconElement}${textElement}`;
            }
        } else {
            content = `<span class="trevid-btn__text">${text}</span>`;
        }
        
        return content;
    }

    addRippleEffect(event) {
        const button = this.element;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'trevid-btn__ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // Public methods
    setLoading(loading) {
        this.options.loading = loading;
        this.setupAttributes();
        this.render();
    }

    setDisabled(disabled) {
        this.options.disabled = disabled;
        this.setupAttributes();
        
        if (disabled) {
            this.element.classList.add('trevid-btn--disabled');
        } else {
            this.element.classList.remove('trevid-btn--disabled');
        }
    }

    setText(text) {
        this.element.setAttribute('data-text', text);
        this.render();
    }

    setIcon(icon, position = 'left') {
        this.options.icon = icon;
        this.options.iconPosition = position;
        this.render();
    }

    destroy() {
        // Clean up event listeners and DOM
        this.element.className = '';
        this.element.innerHTML = this.element.getAttribute('data-text') || '';
    }
}

// Auto-initialize buttons with data attributes
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('[data-trevid-button]');
    
    buttons.forEach(button => {
        const options = {
            variant: button.dataset.variant || 'primary',
            size: button.dataset.size || 'medium',
            icon: button.dataset.icon || null,
            iconPosition: button.dataset.iconPosition || 'left',
            loading: button.hasAttribute('data-loading'),
            disabled: button.hasAttribute('disabled')
        };
        
        new TrevIDButton(button, options);
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrevIDButton;
}

// Global assignment
window.TrevIDButton = TrevIDButton;