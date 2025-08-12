/**
 * TrevID Expense Form Modal Component
 * Advanced modal component for adding/editing expenses
 */

class ExpenseFormModal {
    constructor(options = {}) {
        this.options = {
            title: 'Add New Expense',
            mode: 'create', // 'create' or 'edit'
            expenseData: null,
            onSave: null,
            onCancel: null,
            enableOCR: true,
            ...options
        };
        
        this.modal = null;
        this.form = null;
        this.isVisible = false;
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
        if (this.options.expenseData) {
            this.populateForm(this.options.expenseData);
        }
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'expense-modal-overlay';
        this.modal.innerHTML = this.getModalHTML();
        document.body.appendChild(this.modal);
        
        this.form = this.modal.querySelector('.expense-form');
    }

    getModalHTML() {
        return `
            <div class="expense-modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <div class="expense-modal__header">
                    <h2 id="modal-title" class="expense-modal__title">
                        <i class="fas fa-receipt"></i>
                        ${this.options.title}
                    </h2>
                    <button class="expense-modal__close" aria-label="Close modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Progress Indicator -->
                <div class="expense-modal__progress">
                    <div class="progress-steps">
                        <div class="progress-step active" data-step="1">
                            <div class="step-number">1</div>
                            <div class="step-label">Basic Info</div>
                        </div>
                        <div class="progress-step" data-step="2">
                            <div class="step-number">2</div>
                            <div class="step-label">Receipt</div>
                        </div>
                        <div class="progress-step" data-step="3">
                            <div class="step-number">3</div>
                            <div class="step-label">Review</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 33.33%"></div>
                    </div>
                </div>

                <div class="expense-modal__body">
                    <form class="expense-form trevid-form">
                        <!-- Step 1: Basic Information -->
                        <div class="form-step active" data-step="1">
                            <div class="trevid-form__section">
                                <h3 class="trevid-form__section-title">Basic Information</h3>
                                
                                <div class="form-row">
                                    <div class="trevid-form-group">
                                        <label class="trevid-form-label trevid-form-label--required">Date</label>
                                        <input type="date" name="date" class="trevid-input" required>
                                    </div>
                                    <div class="trevid-form-group">
                                        <label class="trevid-form-label">Time</label>
                                        <input type="time" name="time" class="trevid-input">
                                    </div>
                                </div>

                                <div class="trevid-form-group">
                                    <label class="trevid-form-label trevid-form-label--required">Merchant</label>
                                    <div class="trevid-input-wrapper">
                                        <i class="trevid-input-icon fas fa-store"></i>
                                        <input type="text" name="merchant" class="trevid-input" 
                                               placeholder="Enter merchant name" required>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="trevid-form-group">
                                        <label class="trevid-form-label trevid-form-label--required">Amount</label>
                                        <div class="trevid-input-wrapper">
                                            <i class="trevid-input-icon fas fa-dollar-sign"></i>
                                            <input type="number" name="amount" class="trevid-input" 
                                                   placeholder="0.00" step="0.01" required>
                                        </div>
                                    </div>
                                    <div class="trevid-form-group">
                                        <label class="trevid-form-label">Currency</label>
                                        <select name="currency" class="trevid-select">
                                            <option value="IDR">IDR</option>
                                            <option value="USD">USD</option>
                                            <option value="SGD">SGD</option>
                                            <option value="MYR">MYR</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="trevid-form-group">
                                    <label class="trevid-form-label trevid-form-label--required">Category</label>
                                    <select name="category" class="trevid-select" required>
                                        <option value="">Select category...</option>
                                        <option value="meals">Meals & Entertainment</option>
                                        <option value="transport">Transportation</option>
                                        <option value="accommodation">Accommodation</option>
                                        <option value="fuel">Fuel</option>
                                        <option value="parking">Parking</option>
                                        <option value="office">Office Supplies</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div class="trevid-form-group">
                                    <label class="trevid-form-label">Description</label>
                                    <textarea name="description" class="trevid-textarea" 
                                              placeholder="Optional description or notes" rows="3"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Receipt Upload -->
                        <div class="form-step" data-step="2">
                            <div class="trevid-form__section">
                                <h3 class="trevid-form__section-title">Receipt & Documentation</h3>
                                
                                <div class="receipt-upload-section">
                                    <div class="upload-options">
                                        <button type="button" class="upload-option active" data-method="file">
                                            <i class="fas fa-upload"></i>
                                            <span>Upload File</span>
                                        </button>
                                        <button type="button" class="upload-option" data-method="camera">
                                            <i class="fas fa-camera"></i>
                                            <span>Take Photo</span>
                                        </button>
                                        <button type="button" class="upload-option" data-method="ocr">
                                            <i class="fas fa-magic"></i>
                                            <span>Scan Receipt</span>
                                        </button>
                                    </div>

                                    <div class="upload-area" id="file-upload">
                                        <div class="trevid-file-upload">
                                            <input type="file" name="receipt" accept="image/*" multiple>
                                            <div class="trevid-file-upload__icon">
                                                <i class="fas fa-cloud-upload-alt"></i>
                                            </div>
                                            <div class="trevid-file-upload__text">
                                                <p><strong>Drop receipt images here</strong></p>
                                                <p>or click to browse files</p>
                                                <small>Supports JPG, PNG, WebP (max 10MB each)</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="uploaded-files" id="uploaded-files"></div>
                                </div>

                                <div class="trevid-form-group">
                                    <label class="trevid-form-label">Tax Amount</label>
                                    <div class="trevid-input-wrapper">
                                        <i class="trevid-input-icon fas fa-percentage"></i>
                                        <input type="number" name="tax" class="trevid-input" 
                                               placeholder="0.00" step="0.01">
                                    </div>
                                    <div class="trevid-form-help">
                                        Tax amount will be auto-calculated if detected from receipt
                                    </div>
                                </div>

                                <div class="trevid-form-group">
                                    <label class="trevid-form-label">Project/Cost Center</label>
                                    <select name="project" class="trevid-select">
                                        <option value="">Select project...</option>
                                        <option value="proj-001">Project Alpha</option>
                                        <option value="proj-002">Project Beta</option>
                                        <option value="dept-sales">Sales Department</option>
                                        <option value="dept-marketing">Marketing Department</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Review & Submit -->
                        <div class="form-step" data-step="3">
                            <div class="trevid-form__section">
                                <h3 class="trevid-form__section-title">Review & Submit</h3>
                                
                                <div class="expense-summary">
                                    <div class="summary-card">
                                        <div class="summary-header">
                                            <h4>Expense Summary</h4>
                                            <span class="summary-amount">Rp 0</span>
                                        </div>
                                        <div class="summary-details">
                                            <div class="summary-row">
                                                <span>Merchant:</span>
                                                <span class="summary-merchant">-</span>
                                            </div>
                                            <div class="summary-row">
                                                <span>Date:</span>
                                                <span class="summary-date">-</span>
                                            </div>
                                            <div class="summary-row">
                                                <span>Category:</span>
                                                <span class="summary-category">-</span>
                                            </div>
                                            <div class="summary-row">
                                                <span>Tax:</span>
                                                <span class="summary-tax">Rp 0</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="policy-check">
                                        <h4>Policy Compliance</h4>
                                        <div class="policy-results" id="policy-results">
                                            <div class="policy-item policy-item--checking">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                <span>Checking policy compliance...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="trevid-form-group">
                                    <div class="trevid-checkbox">
                                        <input type="checkbox" id="confirm-accuracy" name="confirm_accuracy" required>
                                        <label for="confirm-accuracy">
                                            I confirm that the information provided is accurate and complete
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="expense-modal__footer">
                    <div class="modal-actions">
                        <button type="button" class="trevid-btn trevid-btn--secondary" id="prev-btn" style="display: none;">
                            <i class="fas fa-arrow-left"></i>
                            Previous
                        </button>
                        <button type="button" class="trevid-btn trevid-btn--tertiary" id="cancel-btn">
                            Cancel
                        </button>
                        <button type="button" class="trevid-btn trevid-btn--primary" id="next-btn">
                            Next
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <button type="submit" class="trevid-btn trevid-btn--primary" id="submit-btn" style="display: none;">
                            <i class="fas fa-save"></i>
                            Save Expense
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Close modal
        this.modal.querySelector('.expense-modal__close').addEventListener('click', () => this.hide());
        this.modal.querySelector('#cancel-btn').addEventListener('click', () => this.hide());
        
        // Navigation
        this.modal.querySelector('#next-btn').addEventListener('click', () => this.nextStep());
        this.modal.querySelector('#prev-btn').addEventListener('click', () => this.prevStep());
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Upload methods
        this.modal.querySelectorAll('.upload-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchUploadMethod(e.target.dataset.method));
        });
        
        // File upload
        const fileInput = this.modal.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Form field changes
        this.form.addEventListener('input', () => this.updateSummary());
        this.form.addEventListener('change', () => this.updateSummary());
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    show() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.isVisible = true;
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Set default date to today
        const dateInput = this.modal.querySelector('input[name="date"]');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    hide() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.isVisible = false;
        
        if (this.options.onCancel) {
            this.options.onCancel();
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
                
                if (this.currentStep === 3) {
                    this.checkPolicyCompliance();
                }
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Update progress steps
        this.modal.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 <= this.currentStep);
            step.classList.toggle('completed', index + 1 < this.currentStep);
        });
        
        // Update progress bar
        const progressFill = this.modal.querySelector('.progress-fill');
        progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
        
        // Update form steps
        this.modal.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        // Update buttons
        const prevBtn = this.modal.querySelector('#prev-btn');
        const nextBtn = this.modal.querySelector('#next-btn');
        const submitBtn = this.modal.querySelector('#submit-btn');
        
        prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        nextBtn.style.display = this.currentStep < this.totalSteps ? 'flex' : 'none';
        submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
    }

    validateCurrentStep() {
        const currentStepElement = this.modal.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        return isValid;
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.trevid-form-group');
        formGroup.classList.add('trevid-form-group--error');
        
        let errorElement = formGroup.querySelector('.trevid-form-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'trevid-form-error';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    }

    clearFieldError(field) {
        const formGroup = field.closest('.trevid-form-group');
        formGroup.classList.remove('trevid-form-group--error');
        
        const errorElement = formGroup.querySelector('.trevid-form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    switchUploadMethod(method) {
        this.modal.querySelectorAll('.upload-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });
        
        // Handle different upload methods
        switch (method) {
            case 'camera':
                this.openCamera();
                break;
            case 'ocr':
                this.openOCRScanner();
                break;
            default:
                // File upload is default
                break;
        }
    }

    openCamera() {
        window.trevIDToast.info('Camera functionality will open receipt scanner');
        // In real implementation, this would open camera
    }

    openOCRScanner() {
        window.location.href = 'receipt-scanner-demo.html';
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        const uploadedFilesContainer = this.modal.querySelector('#uploaded-files');
        
        files.forEach(file => {
            if (this.validateFile(file)) {
                this.displayUploadedFile(file, uploadedFilesContainer);
            }
        });
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (file.size > maxSize) {
            window.trevIDToast.error('File size too large. Maximum 10MB allowed.');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            window.trevIDToast.error('Invalid file type. Please use JPG, PNG, or WebP.');
            return false;
        }
        
        return true;
    }

    displayUploadedFile(file, container) {
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.innerHTML = `
            <div class="file-preview">
                <img src="${URL.createObjectURL(file)}" alt="Receipt preview">
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="file-remove" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(fileElement);
        window.trevIDToast.success(`File "${file.name}" uploaded successfully!`);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateSummary() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        // Update summary display
        this.modal.querySelector('.summary-amount').textContent = 
            data.amount ? this.formatCurrency(data.amount, data.currency) : 'Rp 0';
        this.modal.querySelector('.summary-merchant').textContent = data.merchant || '-';
        this.modal.querySelector('.summary-date').textContent = 
            data.date ? new Date(data.date).toLocaleDateString() : '-';
        this.modal.querySelector('.summary-category').textContent = 
            this.getCategoryLabel(data.category) || '-';
        this.modal.querySelector('.summary-tax').textContent = 
            data.tax ? this.formatCurrency(data.tax, data.currency) : 'Rp 0';
    }

    checkPolicyCompliance() {
        const policyResults = this.modal.querySelector('#policy-results');
        
        // Simulate policy checking
        setTimeout(() => {
            policyResults.innerHTML = `
                <div class="policy-item policy-item--success">
                    <i class="fas fa-check-circle"></i>
                    <span>Amount within per-diem limits</span>
                </div>
                <div class="policy-item policy-item--success">
                    <i class="fas fa-check-circle"></i>
                    <span>Category matches expense type</span>
                </div>
                <div class="policy-item policy-item--warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Receipt required for amounts over Rp 100,000</span>
                </div>
            `;
        }, 1500);
    }

    formatCurrency(amount, currency = 'IDR') {
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return formatter.format(amount);
    }

    getCategoryLabel(category) {
        const categories = {
            'meals': 'Meals & Entertainment',
            'transport': 'Transportation',
            'accommodation': 'Accommodation',
            'fuel': 'Fuel',
            'parking': 'Parking',
            'office': 'Office Supplies',
            'other': 'Other'
        };
        return categories[category];
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
        this.updateSummary();
    }

    handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateCurrentStep()) {
            return;
        }
        
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        // Show loading state
        const submitBtn = this.modal.querySelector('#submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            if (this.options.onSave) {
                this.options.onSave(data);
            }
            
            window.trevIDToast.success('Expense saved successfully!');
            this.hide();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        document.body.style.overflow = '';
    }
}

// Export for use
window.ExpenseFormModal = ExpenseFormModal;