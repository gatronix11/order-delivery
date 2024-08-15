const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: { type: Number , unique : true},
    customerName: String,
    address: String,
    contactNumber: String,
    product: String,
    price: Number,
    shippingMethod: String,
    orderDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Pending delivery' },
});

module.exports = mongoose.model('Order', orderSchema);
