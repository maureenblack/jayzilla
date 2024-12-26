require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { loadScript } = require("@paypal/paypal-js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize PayPal
let paypal;
(async () => {
    paypal = await loadScript({ 
        "client-id": process.env.PAYPAL_CLIENT_ID,
        "enable-funding": "venmo,paylater"
    });
})();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Models
const User = require('./models/User');
const ServiceRequest = require('./models/ServiceRequest');

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Authentication Middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        
        if (!user) {
            throw new Error();
        }
        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Routes

// User Registration
app.post('/api/users/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        
        // Send welcome email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Welcome to Jayzilla Services',
            text: `Welcome ${user.name}! Thank you for registering with Jayzilla Services.`
        };
        
        await transporter.sendMail(mailOptions);
        
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

// User Login
app.post('/api/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({ error: 'Invalid login credentials' });
    }
});

// Logout
app.post('/api/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

// Password Reset Request
app.post('/api/users/reset-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        
        const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        user.resetToken = resetToken;
        await user.save();
        
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            text: `Please click on the following link to reset your password: ${resetUrl}`
        };
        
        await transporter.sendMail(mailOptions);
        
        res.send({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).send({ error: 'Error processing password reset' });
    }
});

// Service Request Submission with Multiple Payment Methods
app.post('/api/service-request', auth, upload.array('photos', 5), async (req, res) => {
    try {
        const { paymentMethod, paymentId } = req.body;
        let paymentStatus = 'pending';
        let paymentDetails = {};

        // Handle different payment methods
        switch (paymentMethod) {
            case 'stripe':
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
                if (paymentIntent.status === 'succeeded') {
                    paymentStatus = 'paid';
                    paymentDetails = {
                        method: 'stripe',
                        transactionId: paymentId,
                        amount: paymentIntent.amount / 100
                    };
                }
                break;

            case 'paypal':
                // Verify PayPal payment
                const paypalOrder = await paypal.orders.get(paymentId);
                if (paypalOrder.status === 'COMPLETED') {
                    paymentStatus = 'paid';
                    paymentDetails = {
                        method: 'paypal',
                        transactionId: paymentId,
                        amount: parseFloat(paypalOrder.purchase_units[0].amount.value)
                    };
                }
                break;

            case 'cashapp':
            case 'zelle':
                // For CashApp and Zelle, payment verification will be manual
                paymentStatus = 'pending';
                paymentDetails = {
                    method: paymentMethod,
                    reference: `REF-${Date.now()}`
                };
                break;

            default:
                throw new Error('Invalid payment method');
        }

        const serviceRequest = new ServiceRequest({
            ...req.body,
            photos: req.files.map(file => file.path),
            user: req.user._id,
            paymentStatus,
            paymentDetails
        });
        
        await serviceRequest.save();
        
        // Send confirmation email with payment instructions if needed
        const emailSubject = paymentStatus === 'paid' 
            ? 'Service Request Confirmation' 
            : 'Service Request Received - Payment Instructions';

        let emailText = `Thank you for your service request!\n\n`;
        emailText += `Service Type: ${req.body.serviceType}\n`;
        emailText += `Date: ${req.body.serviceDate}\n`;
        emailText += `Time: ${req.body.timeSlot}\n\n`;

        if (paymentStatus === 'pending') {
            emailText += 'Payment Instructions:\n';
            if (paymentMethod === 'cashapp') {
                emailText += `Please send payment to CashApp ID: $jayzilla\n`;
                emailText += `Reference: ${paymentDetails.reference}\n`;
            } else if (paymentMethod === 'zelle') {
                emailText += `Please send payment to Zelle Email: payments@jayzilla.com\n`;
                emailText += `Reference: ${paymentDetails.reference}\n`;
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.user.email,
            subject: emailSubject,
            text: emailText
        };
        
        await transporter.sendMail(mailOptions);
        
        res.status(201).send({
            serviceRequest,
            paymentStatus,
            reference: paymentDetails.reference
        });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Payment Processing
app.post('/api/create-payment-intent', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            metadata: { integration_check: 'accept_a_payment' }
        });
        
        res.send({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        res.status(500).send({ error: 'Error processing payment' });
    }
});

// Get User's Service Requests
app.get('/api/service-requests', auth, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.send(requests);
    } catch (error) {
        res.status(500).send();
    }
});

// Stripe webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Handle successful payment
            await handleSuccessfulPayment(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            // Handle failed payment
            await handleFailedPayment(failedPayment);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

async function handleSuccessfulPayment(paymentIntent) {
    // Update order status
    // Send confirmation email
    // Update database
    console.log('Payment succeeded:', paymentIntent.id);
}

async function handleFailedPayment(paymentIntent) {
    // Update order status
    // Send notification email
    // Update database
    console.log('Payment failed:', paymentIntent.id);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
