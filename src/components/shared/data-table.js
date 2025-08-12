/**
 * TrevID Data Table Component
 * Advanced data table with sorting, filtering, pagination, and responsive design
 */

class TrevIDDataTable {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            data: [],
            columns: [],
            pageSize: 10,
            sortable: true,
            filterable: true,
            searchable: true,
            selectable: false,
            responsive: true,
            emptyMessage: 'No data available',
            loadingMessage: 'Loading...',
            ...options
        };
        
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filters = {};
        this.selectedRows = new Set();
        this.filteredData = [];
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.updateTable();
    }

    render() {
        this.container.innerHTML = `
            <div class="trevid-table-wrapper">
                ${this.options.searchable ? this.renderSearchBar() : ''}
                ${this.options.filterable ? this.renderFilters() : ''}
                
                <div class="trevid-table-container">
                    <div class="trevid-table-loading" style="display: none;">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>${this.options.loadingMessage}</span>
                        </div>
                    </div>
                    
                    <table class="trevid-table">
                        <thead class="trevid-table-head">
                            ${this.renderTableHeader()}
                        </thead>
                        <tbody class="trevid-table-body">
                            ${this.renderTableBody()}
                        </tbody>
                    </table>
                    
                    <div class="trevid-table-empty" style="display: none;">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h3>No Data Found</h3>
                            <p>${this.options.emptyMessage}</p>
                        </div>
                    </div>
                </div>
                
                <div class="trevid-table-footer">
                    <div class="table-info">
                        <span class="results-count">Showing 0 of 0 results</span>
                        ${this.options.selectable ? '<span class="selected-count">0 selected</span>' : ''}
                    </div>
                    <div class="table-pagination">
                        ${this.renderPagination()}
                    </div>
                </div>
            </div>
        `;
    }

    renderSearchBar() {
        return `
            <div class="trevid-table-search">
                <div class="trevid-input-wrapper">
                    <i class="trevid-input-icon fas fa-search"></i>
                    <input type="text" 
                           class="trevid-input search-input" 
                           placeholder="Search..." 
                           id="table-search">
                </div>
            </div>
        `;
    }

    renderFilters() {
        const filterableColumns = this.options.columns.filter(col => col.filterable);
        if (filterableColumns.length === 0) return '';
        
        return `
            <div class="trevid-table-filters">
                ${filterableColumns.map(column => `
                    <div class="filter-group">
                        <label class="filter-label">${column.title}</label>
                        <select class="trevid-select filter-select" data-column="${column.key}">
                            <option value="">All ${column.title}</option>
                            ${this.getFilterOptions(column).map(option => 
                                `<option value="${option.value}">${option.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                `).join('')}
                <button class="trevid-btn trevid-btn--tertiary trevid-btn--small clear-filters">
                    <i class="fas fa-times"></i>
                    Clear Filters
                </button>
            </div>
        `;
    }

    renderTableHeader() {
        return `
            <tr>
                ${this.options.selectable ? `
                    <th class="select-column">
                        <div class="trevid-checkbox">
                            <input type="checkbox" id="select-all" class="select-all-checkbox">
                            <label for="select-all" class="sr-only">Select all</label>
                        </div>
                    </th>
                ` : ''}
                ${this.options.columns.map(column => `
                    <th class="table-header ${column.sortable !== false && this.options.sortable ? 'sortable' : ''} 
                               ${column.className || ''}"
                        data-column="${column.key}"
                        ${column.width ? `style="width: ${column.width}"` : ''}>
                        <div class="header-content">
                            <span class="header-title">${column.title}</span>
                            ${column.sortable !== false && this.options.sortable ? `
                                <div class="sort-indicators">
                                    <i class="fas fa-sort sort-icon"></i>
                                    <i class="fas fa-sort-up sort-icon sort-asc"></i>
                                    <i class="fas fa-sort-down sort-icon sort-desc"></i>
                                </div>
                            ` : ''}
                        </div>
                    </th>
                `).join('')}
            </tr>
        `;
    }

    renderTableBody() {
        if (this.filteredData.length === 0) {
            return '<tr><td colspan="100%" class="no-data">No data available</td></tr>';
        }

        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return pageData.map((row, index) => `
            <tr class="table-row ${this.selectedRows.has(row.id) ? 'selected' : ''}" 
                data-row-id="${row.id}">
                ${this.options.selectable ? `
                    <td class="select-column">
                        <div class="trevid-checkbox">
                            <input type="checkbox" 
                                   id="select-${row.id}" 
                                   class="row-checkbox"
                                   ${this.selectedRows.has(row.id) ? 'checked' : ''}>
                            <label for="select-${row.id}" class="sr-only">Select row</label>
                        </div>
                    </td>
                ` : ''}
                ${this.options.columns.map(column => `
                    <td class="table-cell ${column.className || ''}" data-label="${column.title}">
                        ${this.renderCellContent(row, column)}
                    </td>
                `).join('')}
            </tr>
        `).join('');
    }

    renderCellContent(row, column) {
        const value = this.getNestedValue(row, column.key);
        
        if (column.render) {
            return column.render(value, row);
        }
        
        if (column.type === 'currency') {
            return this.formatCurrency(value, column.currency || 'IDR');
        }
        
        if (column.type === 'date') {
            return this.formatDate(value);
        }
        
        if (column.type === 'badge') {
            return this.renderBadge(value, column.badgeConfig);
        }
        
        if (column.type === 'actions') {
            return this.renderActions(row, column.actions);
        }
        
        return value || '-';
    }

    renderBadge(value, config = {}) {
        const badgeClass = config[value] || 'trevid-badge--draft';
        const icon = config.icons?.[value] || '';
        
        return `
            <span class="trevid-badge ${badgeClass} trevid-badge--small">
                ${icon ? `<i class="${icon} trevid-badge__icon"></i>` : ''}
                ${value}
            </span>
        `;
    }

    renderActions(row, actions = []) {
        return `
            <div class="table-actions">
                ${actions.map(action => `
                    <button class="action-btn ${action.className || ''}" 
                            onclick="${action.handler}('${row.id}')"
                            title="${action.title || action.label}">
                        <i class="${action.icon}"></i>
                        ${action.showLabel ? `<span>${action.label}</span>` : ''}
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        if (totalPages <= 1) return '';

        const pages = this.getPaginationPages(totalPages);
        
        return `
            <div class="pagination">
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                ${pages.map(page => {
                    if (page === '...') {
                        return '<span class="pagination-ellipsis">...</span>';
                    }
                    return `
                        <button class="pagination-btn ${page === this.currentPage ? 'active' : ''}" 
                                data-page="${page}">
                            ${page}
                        </button>
                    `;
                }).join('')}
                
                <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Search
        if (this.options.searchable) {
            const searchInput = this.container.querySelector('#table-search');
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.updateTable();
            });
        }

        // Filters
        if (this.options.filterable) {
            this.container.querySelectorAll('.filter-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const column = e.target.dataset.column;
                    const value = e.target.value;
                    
                    if (value) {
                        this.filters[column] = value;
                    } else {
                        delete this.filters[column];
                    }
                    
                    this.currentPage = 1;
                    this.updateTable();
                });
            });

            const clearFiltersBtn = this.container.querySelector('.clear-filters');
            if (clearFiltersBtn) {
                clearFiltersBtn.addEventListener('click', () => {
                    this.clearFilters();
                });
            }
        }

        // Sorting
        if (this.options.sortable) {
            this.container.querySelectorAll('.sortable').forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.dataset.column;
                    this.handleSort(column);
                });
            });
        }

        // Selection
        if (this.options.selectable) {
            // Select all
            const selectAllCheckbox = this.container.querySelector('.select-all-checkbox');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', (e) => {
                    this.handleSelectAll(e.target.checked);
                });
            }

            // Individual row selection
            this.container.addEventListener('change', (e) => {
                if (e.target.classList.contains('row-checkbox')) {
                    const rowId = e.target.id.replace('select-', '');
                    this.handleRowSelect(rowId, e.target.checked);
                }
            });
        }

        // Pagination
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-btn')) {
                const btn = e.target.closest('.pagination-btn');
                if (!btn.disabled && !btn.classList.contains('disabled')) {
                    const page = btn.dataset.page;
                    this.handlePageChange(page);
                }
            }
        });
    }

    updateTable() {
        this.showLoading();
        
        // Simulate async operation
        setTimeout(() => {
            this.applyFilters();
            this.applySorting();
            this.updateTableContent();
            this.updatePagination();
            this.updateInfo();
            this.hideLoading();
        }, 100);
    }

    applyFilters() {
        this.filteredData = this.options.data.filter(row => {
            // Search filter
            if (this.searchTerm) {
                const searchLower = this.searchTerm.toLowerCase();
                const matchesSearch = this.options.columns.some(column => {
                    const value = this.getNestedValue(row, column.key);
                    return String(value).toLowerCase().includes(searchLower);
                });
                if (!matchesSearch) return false;
            }

            // Column filters
            for (const [column, filterValue] of Object.entries(this.filters)) {
                const cellValue = this.getNestedValue(row, column);
                if (String(cellValue) !== String(filterValue)) {
                    return false;
                }
            }

            return true;
        });
    }

    applySorting() {
        if (this.sortColumn) {
            this.filteredData.sort((a, b) => {
                const aValue = this.getNestedValue(a, this.sortColumn);
                const bValue = this.getNestedValue(b, this.sortColumn);
                
                let comparison = 0;
                if (aValue < bValue) comparison = -1;
                if (aValue > bValue) comparison = 1;
                
                return this.sortDirection === 'desc' ? -comparison : comparison;
            });
        }
    }

    updateTableContent() {
        const tbody = this.container.querySelector('.trevid-table-body');
        tbody.innerHTML = this.renderTableBody();
        
        // Show/hide empty state
        const emptyState = this.container.querySelector('.trevid-table-empty');
        const table = this.container.querySelector('.trevid-table');
        
        if (this.filteredData.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            table.style.display = 'table';
            emptyState.style.display = 'none';
        }
    }

    updatePagination() {
        const paginationContainer = this.container.querySelector('.table-pagination');
        paginationContainer.innerHTML = this.renderPagination();
    }

    updateInfo() {
        const totalResults = this.filteredData.length;
        const startIndex = (this.currentPage - 1) * this.options.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.options.pageSize, totalResults);
        
        const resultsCount = this.container.querySelector('.results-count');
        if (totalResults === 0) {
            resultsCount.textContent = 'No results found';
        } else {
            resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${totalResults} results`;
        }

        if (this.options.selectable) {
            const selectedCount = this.container.querySelector('.selected-count');
            selectedCount.textContent = `${this.selectedRows.size} selected`;
        }
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.updateSortIndicators();
        this.updateTable();
    }

    updateSortIndicators() {
        // Reset all sort indicators
        this.container.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Set current sort indicator
        if (this.sortColumn) {
            const currentHeader = this.container.querySelector(`[data-column="${this.sortColumn}"]`);
            if (currentHeader) {
                currentHeader.classList.add(`sort-${this.sortDirection}`);
            }
        }
    }

    handleSelectAll(checked) {
        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        pageData.forEach(row => {
            if (checked) {
                this.selectedRows.add(row.id);
            } else {
                this.selectedRows.delete(row.id);
            }
        });
        
        this.updateTableContent();
        this.updateInfo();
    }

    handleRowSelect(rowId, checked) {
        if (checked) {
            this.selectedRows.add(rowId);
        } else {
            this.selectedRows.delete(rowId);
        }
        
        // Update select all checkbox
        const selectAllCheckbox = this.container.querySelector('.select-all-checkbox');
        if (selectAllCheckbox) {
            const startIndex = (this.currentPage - 1) * this.options.pageSize;
            const endIndex = startIndex + this.options.pageSize;
            const pageData = this.filteredData.slice(startIndex, endIndex);
            const allSelected = pageData.every(row => this.selectedRows.has(row.id));
            
            selectAllCheckbox.checked = allSelected;
            selectAllCheckbox.indeterminate = !allSelected && pageData.some(row => this.selectedRows.has(row.id));
        }
        
        this.updateInfo();
    }

    handlePageChange(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        
        if (page === 'prev') {
            this.currentPage = Math.max(1, this.currentPage - 1);
        } else if (page === 'next') {
            this.currentPage = Math.min(totalPages, this.currentPage + 1);
        } else {
            this.currentPage = parseInt(page);
        }
        
        this.updateTable();
    }

    clearFilters() {
        this.filters = {};
        this.searchTerm = '';
        this.currentPage = 1;
        
        // Reset form controls
        const searchInput = this.container.querySelector('#table-search');
        if (searchInput) searchInput.value = '';
        
        this.container.querySelectorAll('.filter-select').forEach(select => {
            select.value = '';
        });
        
        this.updateTable();
    }

    showLoading() {
        const loading = this.container.querySelector('.trevid-table-loading');
        const table = this.container.querySelector('.trevid-table');
        loading.style.display = 'flex';
        table.style.opacity = '0.5';
    }

    hideLoading() {
        const loading = this.container.querySelector('.trevid-table-loading');
        const table = this.container.querySelector('.trevid-table');
        loading.style.display = 'none';
        table.style.opacity = '1';
    }

    // Utility methods
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    formatCurrency(amount, currency = 'IDR') {
        if (!amount) return '-';
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return formatter.format(amount);
    }

    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID');
    }

    getFilterOptions(column) {
        const uniqueValues = [...new Set(this.options.data.map(row => 
            this.getNestedValue(row, column.key)
        ))].filter(Boolean);
        
        return uniqueValues.map(value => ({
            value: value,
            label: column.filterLabels?.[value] || value
        }));
    }

    getPaginationPages(totalPages) {
        const pages = [];
        const current = this.currentPage;
        
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            
            if (current > 4) {
                pages.push('...');
            }
            
            const start = Math.max(2, current - 1);
            const end = Math.min(totalPages - 1, current + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (current < totalPages - 3) {
                pages.push('...');
            }
            
            pages.push(totalPages);
        }
        
        return pages;
    }

    // Public API
    setData(data) {
        this.options.data = data;
        this.currentPage = 1;
        this.selectedRows.clear();
        this.updateTable();
    }

    getSelectedRows() {
        return Array.from(this.selectedRows);
    }

    clearSelection() {
        this.selectedRows.clear();
        this.updateTableContent();
        this.updateInfo();
    }

    refresh() {
        this.updateTable();
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use
window.TrevIDDataTable = TrevIDDataTable;