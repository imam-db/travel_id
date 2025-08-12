/**
 * Receipt Scanner Component
 * Handles camera capture, file upload, and OCR processing
 */

class ReceiptScanner {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1920,
            ...options
        };
        
        this.ocrProcessor = new OCRProcessor();
        this.currentStream = null;
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="receipt-scanner">
                <div class="scanner-header">
                    <h3><i class="fas fa-camera"></i> Scan Receipt</h3>
                    <p>Take a photo or upload an image to extract expense details</p>
                </div>

                <div class="scanner-modes">
                    <button class="mode-btn active" data-mode="upload">
                        <i class="fas fa-upload"></i>
                        <span>Upload Image</span>
                    </button>
                    <button class="mode-btn" data-mode="camera">
                        <i class="fas fa-camera"></i>
                        <span>Take Photo</span>
                    </button>
                </div>

                <div class="scanner-content">
                    <!-- Upload Mode -->
                    <div class="upload-area active" id="upload-mode">
                        <div class="upload-dropzone" id="dropzone">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <div class="upload-text">
                                <p><strong>Drop your receipt here</strong></p>
                                <p>or <button class="upload-btn" id="file-select-btn">browse files</button></p>
                                <small>Supports JPG, PNG, WebP (max 10MB)</small>
                            </div>
                            <input type="file" id="file-input" accept="image/*" style="display: none;">
                        </div>
                    </div>

                    <!-- Camera Mode -->
                    <div class="camera-area" id="camera-mode">
                        <div class="camera-container">
                            <video id="camera-video" autoplay playsinline></video>
                            <canvas id="camera-canvas" style="display: none;"></canvas>
                            <div class="camera-overlay">
                                <div class="viewfinder"></div>
                                <div class="camera-hint">
                                    <p>Position receipt within the frame</p>
                                    <small>Ensure good lighting and focus</small>
                                </div>
                            </div>
                        </div>
                        <div class="camera-controls">
                            <button class="camera-btn" id="capture-btn">
                                <i class="fas fa-camera"></i>
                                <span>Capture</span>
                            </button>
                            <button class="camera-btn secondary" id="switch-camera-btn">
                                <i class="fas fa-sync-alt"></i>
                                <span>Switch</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Preview & Processing -->
                <div class="preview-section" id="preview-section" style="display: none;">
                    <div class="preview-header">
                        <h4>Preview & Process</h4>
                        <button class="btn-close" id="close-preview">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="preview-content">
                        <div class="image-preview">
                            <img id="preview-image" alt="Receipt preview">
                            <div class="image-actions">
                                <button class="action-btn" id="rotate-btn">
                                    <i class="fas fa-undo"></i> Rotate
                                </button>
                                <button class="action-btn" id="enhance-btn">
                                    <i class="fas fa-magic"></i> Enhance
                                </button>
                            </div>
                        </div>
                        
                        <div class="processing-panel">
                            <div class="processing-status" id="processing-status">
                                <div class="status-icon">
                                    <i class="fas fa-cog fa-spin"></i>
                                </div>
                                <div class="status-text">
                                    <p>Processing receipt...</p>
                                    <div class="progress-bar">
                                        <div class="progress-fill" id="progress-fill"></div>
                                    </div>
                                    <small id="progress-text">Initializing OCR...</small>
                                </div>
                            </div>

                            <div class="extraction-results" id="extraction-results" style="display: none;">
                                <h5>Extracted Information</h5>
                                <div class="extracted-fields">
                                    <div class="field-group">
                                        <label>Merchant</label>
                                        <input type="text" id="extracted-merchant" class="form-input">
                                        <div class="confidence-indicator" id="merchant-confidence"></div>
                                    </div>
                                    
                                    <div class="field-row">
                                        <div class="field-group">
                                            <label>Date</label>
                                            <input type="date" id="extracted-date" class="form-input">
                                            <div class="confidence-indicator" id="date-confidence"></div>
                                        </div>
                                        <div class="field-group">
                                            <label>Time</label>
                                            <input type="time" id="extracted-time" class="form-input">
                                        </div>
                                    </div>

                                    <div class="field-row">
                                        <div class="field-group">
                                            <label>Total Amount</label>
                                            <input type="number" id="extracted-amount" class="form-input" step="0.01">
                                            <div class="confidence-indicator" id="amount-confidence"></div>
                                        </div>
                                        <div class="field-group">
                                            <label>Currency</label>
                                            <select id="extracted-currency" class="form-input">
                                                <option value="IDR">IDR</option>
                                                <option value="USD">USD</option>
                                                <option value="SGD">SGD</option>
                                                <option value="MYR">MYR</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="field-group">
                                        <label>Tax Amount</label>
                                        <input type="number" id="extracted-tax" class="form-input" step="0.01">
                                    </div>

                                    <div class="field-group">
                                        <label>Category</label>
                                        <select id="extracted-category" class="form-input">
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
                                </div>

                                <div class="raw-text-section">
                                    <details>
                                        <summary>Raw OCR Text</summary>
                                        <textarea id="raw-ocr-text" readonly rows="6"></textarea>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="preview-actions">
                        <button class="btn secondary" id="retake-btn">
                            <i class="fas fa-redo"></i> Retake
                        </button>
                        <button class="btn primary" id="use-data-btn" disabled>
                            <i class="fas fa-check"></i> Use This Data
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Mode switching
        this.container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // File upload
        const fileInput = this.container.querySelector('#file-input');
        const fileSelectBtn = this.container.querySelector('#file-select-btn');
        const dropzone = this.container.querySelector('#dropzone');

        fileSelectBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileSelect(file);
        });

        // Camera controls
        this.container.querySelector('#capture-btn').addEventListener('click', () => this.capturePhoto());
        this.container.querySelector('#switch-camera-btn').addEventListener('click', () => this.switchCamera());

        // Preview controls
        this.container.querySelector('#close-preview').addEventListener('click', () => this.closePreview());
        this.container.querySelector('#rotate-btn').addEventListener('click', () => this.rotateImage());
        this.container.querySelector('#enhance-btn').addEventListener('click', () => this.enhanceImage());
        this.container.querySelector('#retake-btn').addEventListener('click', () => this.retake());
        this.container.querySelector('#use-data-btn').addEventListener('click', () => this.useExtractedData());
    }

    switchMode(mode) {
        // Update active mode button
        this.container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Get mode elements
        const uploadMode = this.container.querySelector('#upload-mode');
        const cameraMode = this.container.querySelector('#camera-mode');
        
        // Smooth transition: hide current mode first
        const currentActive = this.container.querySelector('.upload-area.active, .camera-area.active');
        if (currentActive) {
            currentActive.style.opacity = '0';
            currentActive.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                // Remove active class from all modes
                uploadMode.classList.remove('active');
                cameraMode.classList.remove('active');
                
                // Add active class to selected mode
                if (mode === 'upload') {
                    uploadMode.classList.add('active');
                } else {
                    cameraMode.classList.add('active');
                }
                
                // Reset transform for smooth entrance
                setTimeout(() => {
                    const newActive = this.container.querySelector('.upload-area.active, .camera-area.active');
                    if (newActive) {
                        newActive.style.opacity = '1';
                        newActive.style.transform = 'translateY(0)';
                    }
                }, 50);
            }, 150);
        } else {
            // First time initialization
            uploadMode.classList.toggle('active', mode === 'upload');
            cameraMode.classList.toggle('active', mode === 'camera');
        }

        // Handle camera/upload specific logic
        if (mode === 'camera') {
            setTimeout(() => this.startCamera(), 200);
        } else {
            this.stopCamera();
            // Reset file input when switching back to upload mode
            const fileInput = this.container.querySelector('#file-input');
            if (fileInput) {
                fileInput.value = '';
            }
        }
        
        // Ensure scanner content is visible when switching modes
        this.container.querySelector('.scanner-content').style.display = 'block';
        this.container.querySelector('#preview-section').style.display = 'none';
        
        // Clear any error messages when switching modes
        const errorEl = this.container.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    async startCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = this.container.querySelector('#camera-video');
            video.srcObject = this.currentStream;
        } catch (error) {
            console.error('Camera access failed:', error);
            this.showError('Camera access denied or not available');
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    async switchCamera() {
        // Implementation for switching between front/back camera
        this.stopCamera();
        // Toggle facing mode and restart camera
        await this.startCamera();
    }

    capturePhoto() {
        const video = this.container.querySelector('#camera-video');
        const canvas = this.container.querySelector('#camera-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], 'receipt-capture.jpg', { type: 'image/jpeg' });
            this.handleFileSelect(file);
        }, 'image/jpeg', this.options.quality);
    }

    async handleFileSelect(file) {
        if (!file) return;

        if (!this.validateFile(file)) return;

        try {
            const processedFile = await this.preprocessImage(file);
            this.showPreview(processedFile);
            await this.processWithOCR(processedFile);
        } catch (error) {
            console.error('File processing failed:', error);
            this.showError('Failed to process image');
        }
    }

    validateFile(file) {
        if (file.size > this.options.maxFileSize) {
            this.showError('File size too large. Maximum 10MB allowed.');
            return false;
        }

        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return false;
        }

        return true;
    }

    async preprocessImage(file) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                const maxWidth = this.options.maxWidth;
                const maxHeight = this.options.maxHeight;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(resolve, 'image/jpeg', this.options.quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    showPreview(file) {
        const previewSection = this.container.querySelector('#preview-section');
        const previewImage = this.container.querySelector('#preview-image');
        
        previewImage.src = URL.createObjectURL(file);
        previewSection.style.display = 'block';
        
        // Hide scanner content
        this.container.querySelector('.scanner-content').style.display = 'none';
        this.stopCamera();
    }

    async processWithOCR(file) {
        const statusEl = this.container.querySelector('#processing-status');
        const resultsEl = this.container.querySelector('#extraction-results');
        const progressFill = this.container.querySelector('#progress-fill');
        const progressText = this.container.querySelector('#progress-text');

        statusEl.style.display = 'block';
        resultsEl.style.display = 'none';
        this.isProcessing = true;

        // Clear any previous errors
        const existingError = this.container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        try {
            progressText.textContent = 'Initializing OCR engine...';
            progressFill.style.width = '0%';

            const result = await this.ocrProcessor.processReceipt(file, (progress) => {
                progressFill.style.width = `${progress}%`;
                
                if (progress < 20) {
                    progressText.textContent = 'Loading OCR engine...';
                } else if (progress < 50) {
                    progressText.textContent = 'Analyzing image...';
                } else if (progress < 90) {
                    progressText.textContent = `Extracting text... ${progress}%`;
                } else {
                    progressText.textContent = 'Processing results...';
                }
            });

            if (result.success && result.rawText.trim().length > 0) {
                this.displayExtractionResults(result);
                statusEl.style.display = 'none';
                resultsEl.style.display = 'block';
                this.container.querySelector('#use-data-btn').disabled = false;
            } else if (result.success && result.rawText.trim().length === 0) {
                throw new Error('No text detected in the image. Please ensure the receipt is clear and well-lit.');
            } else {
                throw new Error(result.error || 'OCR processing failed');
            }
        } catch (error) {
            console.error('OCR processing error:', error);
            
            let errorMessage = 'Failed to extract text from image.';
            
            if (error.message.includes('Failed to load')) {
                errorMessage = 'Failed to load OCR engine. Please check your internet connection.';
            } else if (error.message.includes('No text detected')) {
                errorMessage = error.message;
            } else if (error.message.includes('Invalid image')) {
                errorMessage = 'Invalid image format. Please use JPG, PNG, or WebP.';
            }
            
            this.showError(errorMessage + ' You can still manually enter the expense details.');
            statusEl.style.display = 'none';
            
            // Show empty results form for manual entry
            this.showManualEntryForm();
            
        } finally {
            this.isProcessing = false;
        }
    }

    showManualEntryForm() {
        const resultsEl = this.container.querySelector('#extraction-results');
        resultsEl.style.display = 'block';
        
        // Clear all fields for manual entry
        this.setFieldValue('extracted-merchant', '');
        this.setFieldValue('extracted-date', '');
        this.setFieldValue('extracted-time', '');
        this.setFieldValue('extracted-amount', '');
        this.setFieldValue('extracted-currency', 'IDR');
        this.setFieldValue('extracted-tax', '');
        this.setFieldValue('extracted-category', '');
        this.setFieldValue('raw-ocr-text', 'OCR processing failed. Please enter details manually.');
        
        // Hide confidence indicators
        this.container.querySelectorAll('.confidence-indicator').forEach(indicator => {
            indicator.style.display = 'none';
        });
        
        // Enable the use data button for manual entry
        this.container.querySelector('#use-data-btn').disabled = false;
        this.container.querySelector('#use-data-btn').innerHTML = '<i class="fas fa-edit"></i> Use Manual Entry';
    }

    displayExtractionResults(result) {
        const { extractedData, rawText, confidence } = result;

        // Fill extracted fields
        this.setFieldValue('extracted-merchant', extractedData.merchant?.name || '');
        this.setFieldValue('extracted-date', extractedData.date?.parsed || '');
        this.setFieldValue('extracted-time', extractedData.time?.parsed || '');
        this.setFieldValue('extracted-amount', extractedData.totalAmount?.numeric || '');
        this.setFieldValue('extracted-currency', extractedData.totalAmount?.currency || 'IDR');
        this.setFieldValue('extracted-tax', extractedData.taxAmount?.numeric || '');
        this.setFieldValue('raw-ocr-text', rawText);

        // Show confidence indicators
        this.showConfidence('merchant-confidence', extractedData.merchant?.confidence || 0);
        this.showConfidence('date-confidence', extractedData.date?.confidence || 0);
        this.showConfidence('amount-confidence', extractedData.totalAmount?.confidence || 0);

        // Auto-suggest category based on merchant
        this.suggestCategory(extractedData.merchant?.name || '');
    }

    setFieldValue(fieldId, value) {
        const field = this.container.querySelector(`#${fieldId}`);
        if (field) field.value = value;
    }

    showConfidence(indicatorId, confidence) {
        const indicator = this.container.querySelector(`#${indicatorId}`);
        if (!indicator) return;

        const percentage = Math.round(confidence * 100);
        let className = 'low';
        
        if (percentage >= 80) className = 'high';
        else if (percentage >= 60) className = 'medium';

        indicator.className = `confidence-indicator ${className}`;
        indicator.textContent = `${percentage}%`;
        indicator.title = `Confidence: ${percentage}%`;
    }

    suggestCategory(merchantName) {
        const categoryField = this.container.querySelector('#extracted-category');
        if (!categoryField || !merchantName) return;

        const merchant = merchantName.toLowerCase();
        let suggestedCategory = '';

        if (merchant.includes('restaurant') || merchant.includes('cafe') || merchant.includes('food')) {
            suggestedCategory = 'meals';
        } else if (merchant.includes('hotel') || merchant.includes('inn')) {
            suggestedCategory = 'accommodation';
        } else if (merchant.includes('taxi') || merchant.includes('uber') || merchant.includes('grab')) {
            suggestedCategory = 'transport';
        } else if (merchant.includes('shell') || merchant.includes('pertamina') || merchant.includes('gas')) {
            suggestedCategory = 'fuel';
        }

        if (suggestedCategory) {
            categoryField.value = suggestedCategory;
        }
    }

    rotateImage() {
        const img = this.container.querySelector('#preview-image');
        const currentRotation = parseInt(img.dataset.rotation || '0');
        const newRotation = (currentRotation + 90) % 360;
        
        img.style.transform = `rotate(${newRotation}deg)`;
        img.dataset.rotation = newRotation;
    }

    enhanceImage() {
        // Simple image enhancement using CSS filters
        const img = this.container.querySelector('#preview-image');
        const currentFilter = img.style.filter;
        
        if (!currentFilter) {
            img.style.filter = 'contrast(1.2) brightness(1.1) saturate(0.9)';
        } else {
            img.style.filter = '';
        }
    }

    closePreview() {
        this.container.querySelector('#preview-section').style.display = 'none';
        this.container.querySelector('.scanner-content').style.display = 'block';
        this.container.querySelector('#use-data-btn').disabled = true;
        
        // Clean up preview image URL to prevent memory leaks
        const previewImage = this.container.querySelector('#preview-image');
        if (previewImage && previewImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage.src);
            previewImage.src = '';
        }
    }

    retake() {
        this.closePreview();
        // Reset file input and clear any uploaded image state
        const fileInput = this.container.querySelector('#file-input');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Reset dropzone state
        const dropzone = this.container.querySelector('#dropzone');
        if (dropzone) {
            dropzone.classList.remove('dragover');
        }
        
        // Clear any error messages
        const errorEl = this.container.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    useExtractedData() {
        const extractedData = this.getExtractedFormData();
        
        // Dispatch custom event with extracted data
        const event = new CustomEvent('receiptProcessed', {
            detail: extractedData
        });
        
        this.container.dispatchEvent(event);
        this.closePreview();
    }

    getExtractedFormData() {
        return {
            merchant: this.container.querySelector('#extracted-merchant').value,
            date: this.container.querySelector('#extracted-date').value,
            time: this.container.querySelector('#extracted-time').value,
            amount: parseFloat(this.container.querySelector('#extracted-amount').value) || 0,
            currency: this.container.querySelector('#extracted-currency').value,
            tax: parseFloat(this.container.querySelector('#extracted-tax').value) || 0,
            category: this.container.querySelector('#extracted-category').value,
            rawText: this.container.querySelector('#raw-ocr-text').value
        };
    }

    showError(message) {
        // Create or update error message
        let errorEl = this.container.querySelector('.error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            this.container.insertBefore(errorEl, this.container.firstChild);
        }
        
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button class="close-error"><i class="fas fa-times"></i></button>
        `;
        
        errorEl.querySelector('.close-error').addEventListener('click', () => {
            errorEl.remove();
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorEl.parentNode) errorEl.remove();
        }, 5000);
    }

    destroy() {
        this.stopCamera();
        this.ocrProcessor.cleanup();
    }
}

// Export for use in other modules
window.ReceiptScanner = ReceiptScanner;