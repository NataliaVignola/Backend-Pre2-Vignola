const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
    ],
    totalPrice: Number,
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', cartSchema);

