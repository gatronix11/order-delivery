const express = require('express');
const router = express.Router();
const Order = require('./models/order');
const pdf = require('html-pdf');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

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

router.get('/generate-pdf/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber });

    if (!order) {
        return res.status(404).send('Order not found');
    }

    // Render EJS template to HTML
    ejs.renderFile(path.join(__dirname, 'views', 'pdf-template.ejs'), { order }, async (err, html) => {
        if (err) {
            console.error('Error rendering EJS:', err);
            return res.status(500).send('Error generating PDF');
        }

        try {
            // Launch Puppeteer and create a PDF
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Set the PDF options
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                width: '210mm',  // Full A4 width
                height: '297mm'  // Full A4 height
            });

            await browser.close();

            // Send the PDF as a response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=order_${orderNumber}_pdf.pdf`);
            res.send(pdfBuffer);
        } catch (pdfError) {
            console.error('Error generating PDF with Puppeteer:', pdfError);
            res.status(500).send('Error generating PDF');
        }
    });
});

// Route to generate shipping label
router.get('/shipping-label/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    const order = await Order.findOne({ orderNumber });

    if (!order) {
        return res.status(404).send('Order not found');
    }

    // Render the EJS template to HTML
    ejs.renderFile(path.join(__dirname, 'views', 'shipping-label.ejs'), { order }, (err, html) => {
        if (err) {
            console.error('Error rendering EJS:', err);
            return res.status(500).send('Error generating page');
        }
        res.send(html);
    });
});


module.exports = router;
