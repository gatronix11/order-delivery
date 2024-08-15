const mongoose = require('mongoose');

const orderNumberSchema = new mongoose.Schema({
    lastOrderNumber: { type: Number, default: 0 }
});

module.exports = mongoose.model('OrderNumber', orderNumberSchema);
