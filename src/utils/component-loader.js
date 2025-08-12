/**
 * TrevID Component Loader
 * Lazy loading and performance optimization for components
 */

class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.loadingPromises = new Map();
        this.componentRegistry = new Map();
        this.observers = new Map();
        
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.preloadCriticalComponents();
    }

    /**
     * Register a component for lazy loading
     */
    register(name, config) {
        this.componentRegistry.set(name, {
            cssPath: config.css,
            jsPath: config.js,
            dependencies: config.dependencies || [],
            critical: config.critical || false,
            ...config
        });
    }

    /**
     * Load a component and its dependencies
     */
    async load(componentName) {
        if (this.loadedComponents.has(componentName)) {
            return Promise.resolve();
        }

        if (this.loadingPromises.has(componentName)) {
            return this.loadingPromises.get(componentName);
        }

        const config = this.componentRegistry.get(componentName);
        if (!config) {
            throw new Error(`Component "${componentName}" not registered`);
        }

        const loadPromise = this.loadComponent(componentName, config);
        this.loadingPromises.set(componentName, loadPromise);

        try {
            await loadPromise;
            this.loadedComponents.add(componentName);
            this.loadingPromises.delete(componentName);
            
            // Dispatch loaded event
            this.dispatchComponentLoaded(componentName);
            
            return Promise.resolve();
        } catch (error) {
            this.loadingPromises.delete(componentName);
            throw error;
        }
    }

    /**
     * Load component with dependencies
     */
    async loadComponent(name, config) {
        // Load dependencies first
        if (config.dependencies.length > 0) {
            await Promise.all(
                config.dependencies.map(dep => this.load(dep))
            );
        }

        // Load CSS and JS in parallel
        const promises = [];
        
        if (config.cssPath) {
            promises.push(this.loadCSS(config.cssPath));
        }
        
        if (config.jsPath) {
            promises.push(this.loadJS(config.jsPath));
        }

        await Promise.all(promises);
        
        // Run initialization if provided
        if (config.init && typeof config.init === 'function') {
            config.init();
        }
    }

    /**
     * Load CSS file
     */
    loadCSS(path) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${path}"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Failed to load CSS: ${path}`));
            
            document.head.appendChild(link);
        });
    }

    /**
     * Load JavaScript file
     */
    loadJS(path) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${path}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = path;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load JS: ${path}`));
            
            document.head.appendChild(script);
        });
    }

    /**
     * Preload critical components
     */
    async preloadCriticalComponents() {
        const criticalComponents = Array.from(this.componentRegistry.entries())
            .filter(([name, config]) => config.critical)
            .map(([name]) => name);

        if (criticalComponents.length > 0) {
            try {
                await Promise.all(criticalComponents.map(name => this.load(name)));
                console.log('Critical components loaded:', criticalComponents);
            } catch (error) {
                console.error('Failed to load critical components:', error);
            }
        }
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const componentName = element.dataset.lazyComponent;
                    
                    if (componentName) {
                        this.load(componentName).catch(error => {
                            console.error(`Failed to lazy load component ${componentName}:`, error);
                        });
                        
                        this.intersectionObserver.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
    }

    /**
     * Observe element for lazy loading
     */
    observeElement(element, componentName) {
        if (this.intersectionObserver) {
            element.dataset.lazyComponent = componentName;
            this.intersectionObserver.observe(element);
        } else {
            // Fallback: load immediately
            this.load(componentName);
        }
    }

    /**
     * Preload component (without executing)
     */
    async preload(componentName) {
        const config = this.componentRegistry.get(componentName);
        if (!config) return;

        // Preload CSS and JS files
        const promises = [];
        
        if (config.cssPath) {
            promises.push(this.preloadResource(config.cssPath, 'style'));
        }
        
        if (config.jsPath) {
            promises.push(this.preloadResource(config.jsPath, 'script'));
        }

        await Promise.all(promises);
    }

    /**
     * Preload resource using link rel="preload"
     */
    preloadResource(href, as) {
        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = href;
            link.as = as;
            link.onload = resolve;
            link.onerror = resolve; // Don't fail on preload errors
            
            document.head.appendChild(link);
        });
    }

    /**
     * Get loading status
     */
    getStatus(componentName) {
        if (this.loadedComponents.has(componentName)) {
            return 'loaded';
        }
        if (this.loadingPromises.has(componentName)) {
            return 'loading';
        }
        return 'not-loaded';
    }

    /**
     * Dispatch component loaded event
     */
    dispatchComponentLoaded(componentName) {
        const event = new CustomEvent('componentLoaded', {
            detail: { componentName }
        });
        document.dispatchEvent(event);
    }

    /**
     * Load multiple components
     */
    async loadMultiple(componentNames) {
        return Promise.all(componentNames.map(name => this.load(name)));
    }

    /**
     * Unload component (remove from DOM)
     */
    unload(componentName) {
        const config = this.componentRegistry.get(componentName);
        if (!config) return;

        // Remove CSS
        if (config.cssPath) {
            const link = document.querySelector(`link[href="${config.cssPath}"]`);
            if (link) link.remove();
        }

        // Remove JS (note: this doesn't unload the script from memory)
        if (config.jsPath) {
            const script = document.querySelector(`script[src="${config.jsPath}"]`);
            if (script) script.remove();
        }

        // Run cleanup if provided
        if (config.cleanup && typeof config.cleanup === 'function') {
            config.cleanup();
        }

        this.loadedComponents.delete(componentName);
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            totalRegistered: this.componentRegistry.size,
            totalLoaded: this.loadedComponents.size,
            currentlyLoading: this.loadingPromises.size,
            loadedComponents: Array.from(this.loadedComponents),
            loadingComponents: Array.from(this.loadingPromises.keys())
        };
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            componentLoadTimes: new Map(),
            totalLoadTime: 0,
            errors: []
        };
        
        this.init();
    }

    init() {
        // Monitor component loading
        document.addEventListener('componentLoaded', (e) => {
            this.recordComponentLoad(e.detail.componentName);
        });

        // Monitor page load performance
        if ('performance' in window) {
            window.addEventListener('load', () => {
                this.recordPageLoadMetrics();
            });
        }
    }

    recordComponentLoad(componentName) {
        const loadTime = performance.now();
        this.metrics.componentLoadTimes.set(componentName, loadTime);
        
        // Log slow components
        if (loadTime > 1000) {
            console.warn(`Slow component load: ${componentName} took ${loadTime.toFixed(2)}ms`);
        }
    }

    recordPageLoadMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.totalLoadTime = navigation.loadEventEnd - navigation.fetchStart;
            
            console.log('Page Load Metrics:', {
                totalTime: this.metrics.totalLoadTime,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                firstPaint: this.getFirstPaint(),
                largestContentfulPaint: this.getLCP()
            });
        }
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    getLCP() {
        return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry.startTime);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // Timeout after 10 seconds
                setTimeout(() => resolve(null), 10000);
            } else {
                resolve(null);
            }
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            componentCount: this.metrics.componentLoadTimes.size,
            averageComponentLoadTime: this.getAverageLoadTime()
        };
    }

    getAverageLoadTime() {
        const times = Array.from(this.metrics.componentLoadTimes.values());
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }
}

// Initialize global instances
const componentLoader = new ComponentLoader();
const performanceMonitor = new PerformanceMonitor();

// Register core components
componentLoader.register('design-tokens', {
    css: 'src/components/design-system/tokens.css',
    critical: true
});

componentLoader.register('buttons', {
    css: 'src/components/shared/button-component.css',
    js: 'src/components/shared/button-component.js',
    dependencies: ['design-tokens'],
    critical: true
});

componentLoader.register('forms', {
    css: 'src/components/shared/form-components.css',
    dependencies: ['design-tokens'],
    critical: true
});

componentLoader.register('badges', {
    css: 'src/components/shared/status-badges.css',
    dependencies: ['design-tokens'],
    critical: true
});

componentLoader.register('cards', {
    css: 'src/components/shared/card-components.css',
    dependencies: ['design-tokens'],
    critical: true
});

componentLoader.register('toast', {
    js: 'src/components/shared/toast-system.js',
    dependencies: ['design-tokens'],
    critical: true
});

componentLoader.register('data-table', {
    js: 'src/components/shared/data-table.js',
    dependencies: ['design-tokens', 'buttons', 'forms', 'badges']
});

componentLoader.register('expense-modal', {
    css: 'src/components/pages/expense-form-modal.css',
    js: 'src/components/pages/expense-form-modal.js',
    dependencies: ['design-tokens', 'buttons', 'forms', 'badges', 'toast']
});

componentLoader.register('receipt-scanner', {
    css: 'css/receipt-scanner.css',
    js: 'js/receipt-scanner.js',
    dependencies: ['design-tokens', 'buttons', 'forms']
});

// Export for global use
window.ComponentLoader = ComponentLoader;
window.PerformanceMonitor = PerformanceMonitor;
window.componentLoader = componentLoader;
window.performanceMonitor = performanceMonitor;

// Utility functions
window.loadComponent = (name) => componentLoader.load(name);
window.loadComponents = (names) => componentLoader.loadMultiple(names);
window.getComponentMetrics = () => ({
    loader: componentLoader.getMetrics(),
    performance: performanceMonitor.getMetrics()
});