# TrevID - Business Companion

TrevID is a comprehensive web-based travel expense management system built with HTML, CSS, and JavaScript. This application helps organizations manage travel bookings, expenses, and approvals efficiently. The latest update introduces quick add items for expense reports and other improvements.

## Features

### 🛫 Travel Management
- **Travel Bookings**: Create and manage travel requests
- **Multiple Booking Options**: Integration with Traveloka, manual booking, and MWP (Monthly Work Plan) based bookings
- **Booking Details**: Comprehensive view of flight and hotel bookings
- **Trip Planning**: Interactive trip creation with date selection and destination management

### 💰 Expense Management
- **Expense Tracking**: Record and categorize travel expenses
- **Receipt Management**: Upload and manage expense receipts
- **Expense Reports**: Generate detailed expense reports
- **Quick Add Items**: Quickly add placeholder expenses for initial estimates
- **Budget Monitoring**: Track expenses against allocated budgets

### 📋 Approval Workflow
- **Multi-level Approvals**: Configurable approval workflows
- **Real-time Notifications**: Instant updates on approval status
- **Approval Dashboard**: Centralized view for managers

### 📱 Progressive Web App (PWA)
- **Offline Support**: Work without internet connection
- **Mobile Responsive**: Optimized for all device sizes
- **App-like Experience**: Install on mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome 6.0
- **PWA**: Service Worker, Web App Manifest
- **Architecture**: Component-based modular design

## Project Structure

```
travel_id/
├── index.html              # Dashboard/Home page
├── travel.html             # Travel bookings overview
├── travel-new.html         # New trip creation
├── travel-detail.html      # Booking details view
├── expenses.html           # Expense management
├── approvals.html          # Approval dashboard
├── mwp.html               # Monthly Work Plan
├── profile.html           # User profile
├── style.css              # Main stylesheet
├── script.js              # Core JavaScript functionality
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
└── icon-192.svg           # App icon
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/travel-expense-manager.git
cd travel-expense-manager
```

2. Start a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## Features Overview

### Dashboard
- Quick stats and overview
- Recent activities
- Pending approvals
- Budget summaries

### Travel Module
- **New Trip Creation**: Multiple booking options (Traveloka, Manual, MWP)
- **Trip Management**: View, edit, and cancel bookings
- **Integration Ready**: Prepared for third-party booking APIs

### Expense Module
- **Expense Entry**: Easy expense recording with categories
- **Receipt Upload**: Digital receipt management
- **Reporting**: Comprehensive expense reports

### Approval System
- **Workflow Management**: Configurable approval chains
- **Real-time Updates**: Live status updates
- **Notification System**: Email and in-app notifications

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Font Awesome for the icon library
- Modern CSS Grid and Flexbox for responsive layouts
- Progressive Web App best practices

## Development Notes

- The application uses vanilla JavaScript for maximum compatibility
- CSS Grid and Flexbox are used for responsive layouts
- Service Worker provides offline functionality
- Modular CSS architecture for maintainability

## Future Enhancements

- [ ] Backend API integration
- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced search and filtering
- [ ] Export functionality (PDF, Excel)
- [ ] Integration with accounting systems
