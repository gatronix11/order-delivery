const express = require('express');
const router = express.Router();
const Order = require('./models/order');
const pdf = require('html-pdf');
const ejs = require('ejs');
const path = require('path');


// Route to render the add order page
router.get('/add-order', (req, res) => {
    res.render('add-order');
});

// Route to handle adding a new order
router.post('/add-order', async (req, res) => {
    const { orderNumber, customerName, address, contactNumber, product, price, shippingMethod } = req.body;
    const newOrder = new Order({ orderNumber, customerName, address, contactNumber, product, price, shippingMethod });
    await newOrder.save();
    res.redirect('/view-orders');
});

// Route to render the view orders page
router.get('/view-orders', async (req, res) => {
    const { date, status } = req.query;

    // Build the query object
    const query = {};

    if (date) {
        // Parse the date from the query
        const startDate = new Date(date);
        const endDate = new Date(date);

        // Set start and end times for the given date
        startDate.setHours(0, 0, 0, 0); // Start of the day
        endDate.setHours(23, 59, 59, 999); // End of the day

        // Set the date range filter
        query.orderDate = { $gte: startDate, $lte: endDate };
    }
    if (status) {
        query.status = status;
    }
    
    try {
        const orders = await Order.find(query).sort({ createdAt: -1 }); // Adjust sorting as needed
        res.render('view-orders', { orders, date, status });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to update order status
router.get('/update-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.query;

    try {
        await Order.findByIdAndUpdate(id, { status });
        res.redirect('/view-orders'); // Redirect back to the orders page
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to generate PDF
router.get('/generate-shipping-label/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber });

    if (!order) {
        return res.status(404).send('Order not found');
    }

    ejs.renderFile(path.join(__dirname, 'views', 'shipping-label.ejs'), { order }, (err, html) => {
        if (err) {
            console.error('Error rendering EJS:', err);
            return res.status(500).send('Error generating PDF');
        }
        const options = {
            format: 'A4',
            width: '148mm',  // Width of half A4
            height: '37mm'   // Height of 1/8 A4
        };
        pdf.create(html, options).toStream((err, stream) => {
            if (err) {
                console.error('Error creating PDF:', err);
                return res.status(500).send('Error generating PDF');
            }
            res.setHeader('Content-type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=shipping_label_${orderNumber}.pdf`);
            stream.pipe(res);
        });
    });
});


// Route to generate Shipping Label PDF
router.get('/generate-shipping-label/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    const order = await Order.findOne({orderNumber});
    const pdfPath = path.join(__dirname, 'public', 'pdf', `shipping_label_${orderNumber}.pdf`);
    ejs.renderFile(path.join(__dirname, 'views', 'shipping-label.ejs'), { order }, (err, html) => {
        if (err) {
            console.error('Error rendering EJS:', err);
            return res.status(500).send('Error generating PDF');
        }
        const options = {
            height: "37.5mm", // 1/8th of A4 height
            width: "105mm"    // Full A4 width
        };
        pdf.create(html, options).toFile(pdfPath, (err) => {
            if (err) {
                console.error('Error creating PDF:', err);
                return res.status(500).send('Error generating PDF');
            }
            res.download(pdfPath);
        });
    });
});



module.exports = router;
