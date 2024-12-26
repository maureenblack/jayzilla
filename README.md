# Jayzilla Services

A modern, full-stack web application for managing service requests and payments for Jayzilla Services. This platform enables customers to easily request services, schedule appointments, and make payments through multiple payment methods.

## 🌟 Features

### Service Management
- Multi-step service request form
- Real-time service scheduling
- Photo upload capability for service requests
- Dynamic pricing based on service type and requirements

### Payment Integration
- Multiple payment options:
  - Credit/Debit Cards (Stripe)
  - PayPal
  - CashApp
  - Zelle
- Secure payment processing
- Automated payment confirmation
- Transaction history tracking

### User Features
- User authentication and authorization
- Personal dashboard for service history
- Real-time service status updates
- Email notifications for service updates

## 🚀 Technologies Used

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 for responsive design
- TypeScript for type-safe code
- Flatpickr for date/time selection
- Dropzone.js for file uploads

### Backend
- Node.js
- Express.js
- MongoDB for database
- JWT for authentication
- Nodemailer for email notifications

### Payment Processing
- Stripe API for card payments
- PayPal SDK for PayPal integration
- Webhook integration for payment notifications

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/maureenblack/jayzilla.git
cd jayzilla
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CASHAPP_ID=your_cashapp_id
ZELLE_EMAIL=your_zelle_email
```

4. Start the development server:
```bash
npm start
```

## 🔧 Configuration

### Payment Setup
1. **Stripe Configuration**
   - Create a Stripe account
   - Add webhook endpoint in Stripe Dashboard
   - Update environment variables

2. **PayPal Configuration**
   - Set up PayPal Developer account
   - Create application credentials
   - Configure webhook endpoints

3. **CashApp & Zelle**
   - Update business account details in environment variables

### Email Configuration
1. Configure email service in `.env`
2. Update email templates in `/models/emailTemplates`

## 🔒 Security

- All sensitive data is stored in environment variables
- Payment processing follows PCI compliance guidelines
- JWT authentication for secure user sessions
- Input validation and sanitization
- CORS protection
- Rate limiting for API endpoints

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop browsers
- Tablets
- Mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is the property of Giiyo Tech and is not open source.

## 👥 Authors

- **Maureen Black** - *Initial work* - [maureenblack](https://github.com/maureenblack)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape Jayzilla Services
- Special thanks to our early users for their valuable feedback
- Bootstrap team for their excellent UI framework
