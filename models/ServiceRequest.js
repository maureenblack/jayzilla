const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['local_moving', 'lawn_mowing', 'landscaping', 'property_maintenance']
    },
    taskDetails: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        required: true,
        enum: ['urgent', 'normal', 'low']
    },
    address: {
        type: String,
        required: true
    },
    serviceDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true,
        enum: ['morning', 'afternoon', 'evening']
    },
    photos: [{
        type: String
    }],
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    price: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    additionalNotes: {
        type: String
    }
}, {
    timestamps: true
});

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports = ServiceRequest;
