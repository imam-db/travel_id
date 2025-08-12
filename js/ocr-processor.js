/**
 * OCR Receipt Processor
 * Uses Tesseract.js for client-side OCR processing
 */

class OCRProcessor {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Check if Tesseract is already loaded globally
            if (typeof Tesseract !== 'undefined') {
                this.worker = await Tesseract.createWorker('eng');
            } else {
                // Load Tesseract.js from CDN
                await this.loadTesseractScript();
                this.worker = await Tesseract.createWorker('eng');
            }
            
            await this.worker.setParameters({
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-/() ',
                tessedit_pageseg_mode: '6', // Uniform block of text
            });
            
            this.isInitialized = true;
            console.log('OCR Worker initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OCR worker:', error);
            throw new Error('OCR initialization failed: ' + error.message);
        }
    }

    async loadTesseractScript() {
        return new Promise((resolve, reject) => {
            if (typeof Tesseract !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = () => {
                console.log('Tesseract.js loaded successfully');
                // Wait a bit for Tesseract to fully initialize
                setTimeout(resolve, 500);
            };
            script.onerror = () => {
                // Try alternative CDN
                const altScript = document.createElement('script');
                altScript.src = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js';
                altScript.onload = () => {
                    console.log('Tesseract.js loaded from alternative CDN');
                    setTimeout(resolve, 500);
                };
                altScript.onerror = () => {
                    reject(new Error('Failed to load Tesseract.js from all CDNs'));
                };
                document.head.appendChild(altScript);
            };
            document.head.appendChild(script);
        });
    }

    async processReceipt(imageFile, progressCallback = null) {
        try {
            if (!this.isInitialized) {
                if (progressCallback) progressCallback(10);
                await this.initialize();
            }

            if (!this.isValidImageFile(imageFile)) {
                throw new Error('Invalid image file format');
            }

            if (progressCallback) progressCallback(20);

            // Process image with progress tracking
            const result = await this.worker.recognize(imageFile, {
                logger: progressCallback ? (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(20 + (m.progress * 70)); // 20-90%
                        progressCallback(progress);
                    }
                } : undefined
            });

            if (progressCallback) progressCallback(95);

            const extractedData = this.parseReceiptText(result.data.text);
            
            if (progressCallback) progressCallback(100);
            
            return {
                success: true,
                rawText: result.data.text,
                extractedData,
                confidence: result.data.confidence
            };
        } catch (error) {
            console.error('OCR processing failed:', error);
            return {
                success: false,
                error: error.message,
                rawText: '',
                extractedData: null,
                confidence: 0
            };
        }
    }

    parseReceiptText(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const extractedData = {
            merchant: this.extractMerchant(lines),
            date: this.extractDate(lines),
            time: this.extractTime(lines),
            amounts: this.extractAmounts(lines),
            totalAmount: null,
            taxAmount: null,
            items: this.extractItems(lines),
            confidence: {
                merchant: 0,
                date: 0,
                amount: 0
            }
        };

        // Find most likely total amount
        if (extractedData.amounts.length > 0) {
            extractedData.totalAmount = this.findTotalAmount(extractedData.amounts, lines);
        }

        // Extract tax if present
        extractedData.taxAmount = this.extractTax(lines);

        return extractedData;
    }

    extractMerchant(lines) {
        // Look for merchant name in first few lines
        const merchantPatterns = [
            /^[A-Z][A-Z\s&]{2,30}$/,  // All caps company names
            /^[A-Za-z][A-Za-z\s&\.]{3,25}$/  // Mixed case names
        ];

        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            for (const pattern of merchantPatterns) {
                if (pattern.test(line) && !this.isDateLine(line) && !this.isAmountLine(line)) {
                    return {
                        name: line,
                        confidence: 0.8,
                        lineIndex: i
                    };
                }
            }
        }

        return {
            name: lines[0] || '',
            confidence: 0.3,
            lineIndex: 0
        };
    }

    extractDate(lines) {
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // DD/MM/YYYY or MM/DD/YYYY
            /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD
            /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i,
            /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{2,4})/i
        ];

        for (const line of lines) {
            for (const pattern of datePatterns) {
                const match = line.match(pattern);
                if (match) {
                    return {
                        raw: match[0],
                        parsed: this.parseDate(match[0]),
                        confidence: 0.9,
                        line: line
                    };
                }
            }
        }

        return {
            raw: '',
            parsed: null,
            confidence: 0,
            line: ''
        };
    }

    extractTime(lines) {
        const timePattern = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i;
        
        for (const line of lines) {
            const match = line.match(timePattern);
            if (match) {
                return {
                    raw: match[0],
                    parsed: match[0],
                    confidence: 0.8,
                    line: line
                };
            }
        }

        return {
            raw: '',
            parsed: '',
            confidence: 0,
            line: ''
        };
    }

    extractAmounts(lines) {
        const amountPatterns = [
            /(?:Rp\.?\s*)?(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/g,  // Indonesian Rupiah
            /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,  // US Dollar
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|SGD|MYR)/gi  // Other currencies
        ];

        const amounts = [];
        
        lines.forEach((line, lineIndex) => {
            amountPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const rawAmount = match[1];
                    const numericAmount = this.parseAmount(rawAmount);
                    
                    if (numericAmount > 0) {
                        amounts.push({
                            raw: match[0],
                            numeric: numericAmount,
                            line: line,
                            lineIndex: lineIndex,
                            currency: this.detectCurrency(match[0])
                        });
                    }
                }
            });
        });

        return amounts.sort((a, b) => b.numeric - a.numeric); // Sort by amount descending
    }

    extractItems(lines) {
        const items = [];
        const itemPattern = /^(.+?)\s+(?:Rp\.?\s*)?(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)$/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(itemPattern);
            
            if (match && !this.isHeaderLine(line) && !this.isTotalLine(line)) {
                const itemName = match[1].trim();
                const amount = this.parseAmount(match[2]);
                
                if (itemName.length > 2 && amount > 0) {
                    items.push({
                        name: itemName,
                        amount: amount,
                        line: line,
                        lineIndex: i
                    });
                }
            }
        }

        return items;
    }

    findTotalAmount(amounts, lines) {
        // Look for total indicators
        const totalKeywords = ['total', 'grand total', 'amount', 'jumlah', 'total bayar'];
        
        for (const amount of amounts) {
            const line = amount.line.toLowerCase();
            if (totalKeywords.some(keyword => line.includes(keyword))) {
                return {
                    ...amount,
                    confidence: 0.9,
                    type: 'total'
                };
            }
        }

        // If no explicit total found, assume largest amount is total
        return amounts.length > 0 ? {
            ...amounts[0],
            confidence: 0.6,
            type: 'assumed_total'
        } : null;
    }

    extractTax(lines) {
        const taxPatterns = [
            /(?:tax|ppn|pajak)\s*:?\s*(?:Rp\.?\s*)?(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)/gi,
            /(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*(?:tax|ppn|pajak)/gi
        ];

        for (const line of lines) {
            for (const pattern of taxPatterns) {
                const match = line.match(pattern);
                if (match) {
                    return {
                        raw: match[0],
                        numeric: this.parseAmount(match[1]),
                        line: line,
                        confidence: 0.8
                    };
                }
            }
        }

        return null;
    }

    // Helper methods
    parseAmount(amountStr) {
        if (!amountStr) return 0;
        
        // Remove currency symbols and spaces
        let cleaned = amountStr.replace(/[Rp\$\s]/g, '');
        
        // Handle different decimal separators
        if (cleaned.includes(',') && cleaned.includes('.')) {
            // Assume comma is thousands separator, dot is decimal
            cleaned = cleaned.replace(/,/g, '');
        } else if (cleaned.includes(',')) {
            // Could be decimal separator (European style)
            const parts = cleaned.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
                cleaned = cleaned.replace(',', '.');
            } else {
                cleaned = cleaned.replace(/,/g, '');
            }
        }

        return parseFloat(cleaned) || 0;
    }

    parseDate(dateStr) {
        try {
            // Try different date formats
            const formats = [
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
                /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
            ];

            for (const format of formats) {
                const match = dateStr.match(format);
                if (match) {
                    let [, part1, part2, part3] = match;
                    
                    // Convert 2-digit year to 4-digit
                    if (part3.length === 2) {
                        part3 = '20' + part3;
                    }
                    
                    // Try DD/MM/YYYY format first
                    const date = new Date(part3, part2 - 1, part1);
                    if (date.getFullYear() == part3) {
                        return date.toISOString().split('T')[0];
                    }
                }
            }

            return new Date(dateStr).toISOString().split('T')[0];
        } catch (error) {
            return null;
        }
    }

    detectCurrency(amountStr) {
        if (amountStr.includes('Rp') || amountStr.includes('IDR')) return 'IDR';
        if (amountStr.includes('$') || amountStr.includes('USD')) return 'USD';
        if (amountStr.includes('SGD')) return 'SGD';
        if (amountStr.includes('MYR')) return 'MYR';
        return 'IDR'; // Default to IDR
    }

    isValidImageFile(file) {
        return file && this.supportedFormats.includes(file.type);
    }

    isDateLine(line) {
        return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line);
    }

    isAmountLine(line) {
        return /(?:Rp\.?\s*)?\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?/.test(line);
    }

    isHeaderLine(line) {
        const headers = ['receipt', 'invoice', 'bill', 'struk', 'nota'];
        return headers.some(header => line.toLowerCase().includes(header));
    }

    isTotalLine(line) {
        const totalWords = ['total', 'grand total', 'subtotal', 'jumlah'];
        return totalWords.some(word => line.toLowerCase().includes(word));
    }

    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
        }
    }
}

// Export for use in other modules
window.OCRProcessor = OCRProcessor;