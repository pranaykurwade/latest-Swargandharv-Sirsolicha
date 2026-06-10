const express = require('express');

const mongoose = require('mongoose');

const multer = require('multer');

const cloudinary = require('cloudinary').v2;

const { CloudinaryStorage } = require('multer-storage-cloudinary');

const cors = require('cors');

const crypto = require('crypto');

const Razorpay = require('razorpay');

const nodemailer = require('nodemailer');

require('dotenv').config();



const app = express();

const port = process.env.PORT || 3000;





// Cloudinary configuration

cloudinary.config({

  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,

  api_secret: process.env.CLOUDINARY_API_SECRET,

});



// Razorpay configuration

const razorpay = new Razorpay({

  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET,

});





// MongoDB connection

mongoose.connect(process.env.MONGODB_URI)

  .then(async () => {

    console.log('Connected to MongoDB');

    // Drop legacy indexes that no longer exist in schema

    try {

      const db = mongoose.connection.db;

      const col = db.collection('registrations');

      const indexes = await col.indexes();

      const legacyIndexes = [

        'paymentScreenshot.filename_1',

        'paymentScreenshot.transactionId_1',

        'email_1',

      ];

      for (const idxName of legacyIndexes) {

        if (indexes.find(i => i.name === idxName)) {

          await col.dropIndex(idxName);

          console.log(`Dropped legacy index: ${idxName}`);

        }

      }

    } catch (e) {

      console.log('Index cleanup note:', e.message);

    }

  })

  .catch(err => console.error('MongoDB connection error:', err));



// Middleware

app.use(cors({

  origin: [

    'http://localhost:5500',

    'http://127.0.0.1:5500',

    'http://localhost:3000',

    /\.netlify\.app$/,      // any Netlify subdomain

    /\.onrender\.com$/,     // Render itself

    process.env.FRONTEND_URL,

  ].filter(Boolean),

  credentials: true,

}));

app.use(express.json());





// ─── SCHEMAS ────────────────────────────────────────────────────────────────



const registrationSchema = new mongoose.Schema({

  registrationId: { type: String, unique: true },

  fullName: { type: String, required: true },

  age: { type: Number, required: true },

  phone: { type: String, required: true, unique: true },

  email: { type: String },

  googleId: { type: String },

  googleName: { type: String },

  category: { type: String, required: true },

  songType: { type: String, required: true },

  songTitle: { type: String },

  payment: {

    razorpayOrderId: { type: String },

    razorpayPaymentId: { type: String },

    razorpaySignature: { type: String },

    amount: { type: Number },

    currency: { type: String, default: 'INR' },

    status: { type: String, default: 'pending' }, // pending, paid, failed, refunded

    paidAt: { type: Date },

    refundId: { type: String },

    refundStatus: { type: String }, // processed, pending, failed

    refundAmount: { type: Number },

    refundedAt: { type: Date },

    refundNotes: { type: String },

  },

  emailSent: { type: Boolean, default: false },

  emailSentAt: { type: Date },

  status: { type: String, default: 'pending' }, // pending, approved, rejected, cancelled, refunded

  cancelledAt: { type: Date },

  cancelledBy: { type: String },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});



const gallerySchema = new mongoose.Schema({

  title: { type: String, required: true },

  description: { type: String },

  imageUrl: { type: String, required: true },

  publicId: { type: String },

  year: { type: String },

  tags: [String],

  createdAt: { type: Date, default: Date.now },

});



const eventSchema = new mongoose.Schema({

  title: { type: String, required: true },

  description: { type: String },

  venue: { type: String },

  date: { type: Date },

  time: { type: String },

  posterUrl: { type: String },

  posterPublicId: { type: String },

  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});



const teamMemberSchema = new mongoose.Schema({

  name: { type: String, required: true },

  designation: { type: String },

  photoUrl: { type: String },

  photoPublicId: { type: String },

  instagram: { type: String },

  facebook: { type: String },

  phone: { type: String },

  order: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },

});



const timelineSchema = new mongoose.Schema({

  title: { type: String, required: true },

  description: { type: String },

  date: { type: Date, required: true },

  time: { type: String },

  icon: { type: String, default: '🌸' },

  order: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },

});



const settingsSchema = new mongoose.Schema({

  key: { type: String, unique: true, required: true },

  value: { type: String },

  updatedAt: { type: Date, default: Date.now },

});



const Registration = mongoose.model('Registration', registrationSchema);

const Gallery = mongoose.model('Gallery', gallerySchema);

const Event = mongoose.model('Event', eventSchema);

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

const Timeline = mongoose.model('Timeline', timelineSchema);

const Settings = mongoose.model('Settings', settingsSchema);



// ─── MULTER / CLOUDINARY STORAGE ────────────────────────────────────────────



function makeStorage(folder) {

  return new CloudinaryStorage({

    cloudinary,

    params: { folder, allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },

  });

}



const uploadGallery = multer({ storage: makeStorage('swargandhav_gallery'), limits: { fileSize: 10 * 1024 * 1024 } });

const uploadEvent = multer({ storage: makeStorage('swargandhav_events'), limits: { fileSize: 10 * 1024 * 1024 } });

const uploadTeam = multer({ storage: makeStorage('swargandhav_team'), limits: { fileSize: 5 * 1024 * 1024 } });



// ─── HELPERS ─────────────────────────────────────────────────────────────────



function generateRegistrationId() {

  return 'SG' + crypto.randomInt(100000, 999999).toString();

}



function getRegistrationFee(category) {

  return category === 'बाल' ? 201 : 301;

}





// ─── REGISTRATION ROUTES ─────────────────────────────────────────────────────



// POST /api/register  (no file upload — Razorpay handles payment)

app.post('/api/register', async (req, res) => {

  try {

    const { fullName, age, phone, email, googleId, googleName, category, songType, songTitle } = req.body;



    if (!fullName || !age || !phone || !category || !songType) {

      return res.status(400).json({ success: false, message: 'सर्व आवश्यक माहिती भरा' });

    }



    const existing = await Registration.findOne({ phone });

    if (existing) {

      return res.status(400).json({ success: false, message: 'हा मोबाइल नंबर आधीच नोंदणीकृत आहे' });

    }



    const registrationId = generateRegistrationId();

    const amount = req.body.testMode ? 100 : getRegistrationFee(category) * 100; // 100 paise = ₹1 for test



    // Create Razorpay order

    const order = await razorpay.orders.create({

      amount,

      currency: 'INR',

      receipt: registrationId,

      notes: { registrationId, fullName, phone, email },

    });



    const registration = new Registration({

      registrationId,

      fullName,

      age: parseInt(age),

      phone,

      email,

      googleId: googleId || null,

      googleName: googleName || null,

      category,

      songType,

      songTitle: songTitle || '',

      payment: {

        razorpayOrderId: order.id,

        amount: order.amount,

        status: 'pending',

      },

    });



    await registration.save();



    res.json({

      success: true,

      data: {

        registrationId,

        orderId: order.id,

        amount: order.amount,

        currency: order.currency,

        keyId: process.env.RAZORPAY_KEY_ID,

      },

    });

  } catch (error) {

    console.error('Registration Error:', error);

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/payment/verify  — called by frontend after Razorpay checkout

app.post('/api/payment/verify', async (req, res) => {

  try {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;



    console.log('Payment verify request:', { razorpay_order_id, razorpay_payment_id, registrationId });



    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId) {

      return res.status(400).json({ success: false, message: 'Missing payment details' });

    }



    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto

      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)

      .update(body)

      .digest('hex');



    console.log('Signature match:', expectedSignature === razorpay_signature);



    if (expectedSignature !== razorpay_signature) {

      console.error('Signature mismatch:', { expected: expectedSignature, received: razorpay_signature });

      return res.status(400).json({ success: false, message: 'Invalid payment signature' });

    }



    await approveRegistrationByOrderId(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    res.json({ success: true, data: { registrationId, status: 'approved' } });

  } catch (error) {

    console.error('Payment verification error:', error);

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/webhook/razorpay  — called directly by Razorpay servers (backup)

// Set this URL in Razorpay Dashboard → Settings → Webhooks

// URL: https://your-domain.com/api/webhook/razorpay

// Events: payment.captured

app.post('/api/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {

  try {

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {

      const signature = req.headers['x-razorpay-signature'];

      const expectedSig = crypto

        .createHmac('sha256', webhookSecret)

        .update(req.body)

        .digest('hex');

      if (signature !== expectedSig) {

        console.error('Webhook signature invalid');

        return res.status(400).json({ success: false });

      }

    }



    const event = JSON.parse(req.body.toString());

    console.log('Razorpay webhook event:', event.event);



    if (event.event === 'payment.captured') {

      const payment = event.payload.payment.entity;

      const orderId = payment.order_id;

      const paymentId = payment.id;

      console.log('Webhook: payment captured', { orderId, paymentId });

      await approveRegistrationByOrderId(orderId, paymentId, null);

    }



    res.json({ success: true });

  } catch (error) {

    console.error('Webhook error:', error);

    res.status(500).json({ success: false });

  }

});



// Helper: approve registration by Razorpay order ID

async function approveRegistrationByOrderId(orderId, paymentId, signature) {

  const update = {

    'payment.razorpayPaymentId': paymentId,

    'payment.status': 'paid',

    'payment.paidAt': new Date(),

    status: 'approved',

    updatedAt: new Date(),

  };

  if (signature) update['payment.razorpaySignature'] = signature;



  const result = await Registration.findOneAndUpdate(

    { 'payment.razorpayOrderId': orderId },

    update,

    { new: true }

  );

  if (result) {

    console.log('Registration approved:', result.registrationId);

    await sendEmailNotification(result);

  } else {

    console.warn('No registration found for orderId:', orderId);

  }

  return result;

}



async function sendEmailNotification(registration) {

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {

    console.warn('Email configuration not complete; skipping email notification');

    return;

  }



  if (!registration.email) {

    console.warn('No email available for registration', registration.registrationId);

    return;

  }



  const transporter = nodemailer.createTransport({

    service: 'gmail',

    auth: {

      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASSWORD,

    },

  });



  const mailOptions = {

    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,

    to: registration.email,

    subject: `🎉 नोंदणी यशस्वी! - आयडी: ${registration.registrationId}`,

    html: `

      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">

        <div style="text-align: center; margin-bottom: 30px;">

          <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>

          <h1 style="color: #1f2937; margin: 0; font-size: 28px;">नोंदणी यशस्वी झाली!</h1>

        </div>

        

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #fb923c;">

          <p style="color: #666; margin: 0 0 15px 0; font-size: 16px;">नमस्कार ${registration.fullName},</p>

          <p style="color: #666; margin: 0 0 15px 0; font-size: 16px;">तुमची नोंदणी स्वरगंधर्व सिरसोलीचा स्पर्धेसाठी यशस्वी झाली आहे!</p>

          

          <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">

            <p style="color: #c2410b; margin: 0 0 10px 0; font-weight: bold; font-size: 14px;">तुमचा नोंदणी आयडी:</p>

            <p style="color: #c2410b; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; text-align: center;">${registration.registrationId}</p>

          </div>

          

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">

            <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">📋 नोंदणी तपशील:</h3>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">

              <tr>

                <td style="padding: 6px 0; color: #666;"><strong>नाव:</strong></td>

                <td style="padding: 6px 0; color: #1f2937;">${registration.fullName}</td>

              </tr>

              <tr>

                <td style="padding: 6px 0; color: #666;"><strong>वय:</strong></td>

                <td style="padding: 6px 0; color: #1f2937;">${registration.age} वर्षे</td>

              </tr>

              <tr>

                <td style="padding: 6px 0; color: #666;"><strong>वर्ग:</strong></td>

                <td style="padding: 6px 0; color: #1f2937;">${registration.category} वर्ग</td>

              </tr>

              <tr>

                <td style="padding: 6px 0; color: #666;"><strong>गीताचे प्रकार:</strong></td>

                <td style="padding: 6px 0; color: #1f2937;">${registration.songType}</td>

              </tr>

              <tr>

                <td style="padding: 6px 0; color: #666;"><strong>रक्कम:</strong></td>

                <td style="padding: 6px 0; color: #1f2937;">₹${(registration.payment.amount || 0) / 100}</td>

              </tr>

              <tr>

                <td style="padding: 6px 0; color: #666;"><strong>पेमेंट स्थिती:</strong></td>

                <td style="padding: 6px 0; color: #16a34a;">✅ पेमेंट झाले</td>

              </tr>

            </table>

          </div>

          

          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">

            <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px;">⚠️ महत्त्वाची माहिती:</h3>

            <ul style="color: #7f1d1d; margin: 0; padding-left: 20px; font-size: 13px;">

              <li style="margin: 5px 0;">स्पर्धेच्या दिवशी हा आयडी सोबत आणा</li>

              <li style="margin: 5px 0;">या ईमेलला महत्त्व द्या</li>

              <li style="margin: 5px 0;">कोणत्याही प्रश्नासाठी आमच्याशी संपर्क साधा</li>

            </ul>

          </div>

        </div>

        

        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">

          <p style="margin: 0;">स्वरगंधर्व सिरसोलीचा</p>

          <p style="margin: 0;">एकल गीत गायन स्पर्धा 2025</p>

        </div>

      </div>

    `,

  };



  try {

    await transporter.sendMail(mailOptions);

    await Registration.findOneAndUpdate(

      { registrationId: registration.registrationId },

      { emailSent: true, emailSentAt: new Date() }

    );

    console.log('Email sent successfully to', registration.email);

  } catch (err) {

    console.error('Failed to send email:', err.message || err);

  }

}



// GET /api/registration/:id

app.get('/api/registration/:id', async (req, res) => {

  try {

    const registration = await Registration.findOne({ registrationId: req.params.id });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    res.json({ success: true, data: registration });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// GET /api/registration/email/:email  — lookup registration by email

app.get('/api/registration/email/:email', async (req, res) => {

  try {

    const registration = await Registration.findOne({ email: req.params.email });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found with this email' });

    res.json({ success: true, data: registration });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// GET /api/registrations

app.get('/api/registrations', async (req, res) => {

  try {

    const registrations = await Registration.find().sort({ createdAt: -1 });

    res.json({ success: true, data: registrations });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// GET /api/stats

app.get('/api/stats', async (req, res) => {

  try {

    const totalRegistrations = await Registration.countDocuments();

    const byCategory = await Registration.aggregate([

      { $group: { _id: '$category', count: { $sum: 1 } } },

      { $project: { category: '$_id', count: 1, _id: 0 } },

    ]);

    const paidCount = await Registration.countDocuments({ 'payment.status': 'paid' });

    res.json({ success: true, data: { totalRegistrations, byCategory, paidCount } });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// PATCH /api/registration/:id/status  (admin manual override)

app.patch('/api/registration/:id/status', async (req, res) => {

  try {

    const { status } = req.body;

    const update = { status, updatedAt: new Date() };

    if (status === 'approved') {

      update['payment.status'] = 'paid';

      update['payment.paidAt'] = new Date();

    }

    if (status === 'cancelled') {

      update.cancelledAt = new Date();

      update.cancelledBy = 'admin';

    }

    const registration = await Registration.findOneAndUpdate(

      { registrationId: req.params.id },

      update,

      { new: true }

    );

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    res.json({ success: true, data: registration });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/registration/:id/refund  (admin — initiate Razorpay refund)

app.post('/api/registration/:id/refund', async (req, res) => {

  try {

    const { notes } = req.body;

    const registration = await Registration.findOne({ registrationId: req.params.id });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });



    const paymentId = registration.payment?.razorpayPaymentId;

    const paymentAmount = registration.payment?.amount;



    if (!paymentId) {

      return res.status(400).json({ success: false, message: 'या नोंदणीसाठी Razorpay payment ID नाही. Manual payment असल्यास refund manually करा.' });

    }

    if (registration.payment?.status === 'refunded') {

      return res.status(400).json({ success: false, message: 'हा परतावा आधीच दिला गेला आहे.' });

    }

    if (!paymentAmount || paymentAmount <= 0) {

      return res.status(400).json({ success: false, message: 'Payment amount invalid for refund.' });

    }

    if (paymentAmount < 100) {

      return res.status(400).json({ success: false, message: `Payment amount ₹${paymentAmount / 100} is too small to refund via API. Please refund manually from Razorpay Dashboard.` });

    }



    const refund = await razorpay.payments.refund(paymentId, {

      amount: paymentAmount,

      notes: { reason: notes || 'Admin initiated refund', registrationId: req.params.id },

    });



    await Registration.findOneAndUpdate(

      { registrationId: req.params.id },

      {

        status: 'refunded',

        'payment.status': 'refunded',

        'payment.refundId': refund.id,

        'payment.refundStatus': refund.status,

        'payment.refundAmount': refund.amount,

        'payment.refundedAt': new Date(),

        'payment.refundNotes': notes || '',

        updatedAt: new Date(),

      }

    );



    res.json({ success: true, data: { refundId: refund.id, status: refund.status, amount: refund.amount } });

  } catch (error) {

    console.error('Refund error full:', JSON.stringify(error));

    const msg = error?.error?.description || error?.message || 'Refund failed';

    res.status(500).json({ success: false, message: msg });

  }

});



// DELETE /api/registration/:id  — permanently removes record (admin only)

app.delete('/api/registration/:id', async (req, res) => {

  try {

    const registration = await Registration.findOneAndDelete({ registrationId: req.params.id });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    res.json({ success: true, message: 'Registration deleted permanently' });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/registration/:id/cancel  — cancel + auto-refund if paid (admin)

app.post('/api/registration/:id/cancel', async (req, res) => {

  try {

    const registration = await Registration.findOne({ registrationId: req.params.id });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (registration.status === 'cancelled') return res.json({ success: true, message: 'Already cancelled' });



    let refundResult = null;

    if (registration.payment?.status === 'paid' && registration.payment?.razorpayPaymentId) {

      try {

        refundResult = await razorpay.payments.refund(registration.payment.razorpayPaymentId, {

          amount: registration.payment.amount,

          speed: 'optimum',

          notes: { registrationId: registration.registrationId },

        });

      } catch (refundErr) {

        console.error('Refund error during cancel:', refundErr.message);

      }

    }



    registration.status = refundResult ? 'refunded' : 'cancelled';

    registration.cancelledAt = new Date();

    registration.cancelledBy = 'admin';

    if (refundResult) {

      registration.payment.status = 'refunded';

      registration.payment.refundId = refundResult.id;

      registration.payment.refundStatus = refundResult.status;

      registration.payment.refundedAt = new Date();

    }

    registration.updatedAt = new Date();

    await registration.save();



    res.json({ success: true, message: refundResult ? 'Cancelled and refund initiated' : 'Cancelled', refund: refundResult });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// ─── GALLERY ROUTES ───────────────────────────────────────────────────────────



// GET /api/gallery

app.get('/api/gallery', async (req, res) => {

  try {

    const { page = 1, limit = 12, search = '' } = req.query;

    const query = search ? { $or: [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }] } : {};

    const total = await Gallery.countDocuments(query);

    const images = await Gallery.find(query)

      .sort({ createdAt: -1 })

      .skip((page - 1) * limit)

      .limit(parseInt(limit));

    res.json({ success: true, data: images, total, page: parseInt(page), pages: Math.ceil(total / limit) });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/gallery  (admin)

app.post('/api/gallery', uploadGallery.single('image'), async (req, res) => {

  try {

    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });

    const { title, description, year, tags } = req.body;

    const image = new Gallery({

      title: title || 'Gallery Image',

      description,

      imageUrl: req.file.path,

      publicId: req.file.filename,

      year,

      tags: tags ? tags.split(',').map(t => t.trim()) : [],

    });

    await image.save();

    res.json({ success: true, data: image });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// DELETE /api/gallery/:id  (admin)

app.delete('/api/gallery/:id', async (req, res) => {

  try {

    const image = await Gallery.findByIdAndDelete(req.params.id);

    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    if (image.publicId) await cloudinary.uploader.destroy(image.publicId).catch(() => { });

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// ─── EVENTS ROUTES ────────────────────────────────────────────────────────────



// GET /api/events

app.get('/api/events', async (req, res) => {

  try {

    const events = await Event.find({ isActive: true }).sort({ date: 1 });

    res.json({ success: true, data: events });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// GET /api/events/all  (admin)

app.get('/api/events/all', async (req, res) => {

  try {

    const events = await Event.find().sort({ date: 1 });

    res.json({ success: true, data: events });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/events  (admin)

app.post('/api/events', uploadEvent.single('poster'), async (req, res) => {

  try {

    const { title, description, venue, date, time } = req.body;

    const event = new Event({

      title,

      description,

      venue,

      date: date ? new Date(date) : null,

      time,

      posterUrl: req.file ? req.file.path : null,

      posterPublicId: req.file ? req.file.filename : null,

    });

    await event.save();

    res.json({ success: true, data: event });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// PUT /api/events/:id  (admin)

app.put('/api/events/:id', uploadEvent.single('poster'), async (req, res) => {

  try {

    const { title, description, venue, date, time, isActive } = req.body;

    const update = { title, description, venue, time, updatedAt: new Date() };

    if (date) update.date = new Date(date);

    if (isActive !== undefined) update.isActive = isActive === 'true';

    if (req.file) { update.posterUrl = req.file.path; update.posterPublicId = req.file.filename; }

    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// DELETE /api/events/:id  (admin)

app.delete('/api/events/:id', async (req, res) => {

  try {

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.posterPublicId) await cloudinary.uploader.destroy(event.posterPublicId).catch(() => { });

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// ─── TEAM ROUTES ──────────────────────────────────────────────────────────────



// GET /api/team

app.get('/api/team', async (req, res) => {

  try {

    const members = await TeamMember.find({ isActive: true }).sort({ order: 1, createdAt: 1 });

    res.json({ success: true, data: members });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// GET /api/team/all  (admin)

app.get('/api/team/all', async (req, res) => {

  try {

    const members = await TeamMember.find().sort({ order: 1, createdAt: 1 });

    res.json({ success: true, data: members });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/team  (admin)

app.post('/api/team', uploadTeam.single('photo'), async (req, res) => {

  try {

    const { name, designation, instagram, facebook, phone, order } = req.body;

    const member = new TeamMember({

      name,

      designation,

      instagram,

      facebook,

      phone,

      order: parseInt(order) || 0,

      photoUrl: req.file ? req.file.path : null,

      photoPublicId: req.file ? req.file.filename : null,

    });

    await member.save();

    res.json({ success: true, data: member });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// PUT /api/team/:id  (admin)

app.put('/api/team/:id', uploadTeam.single('photo'), async (req, res) => {

  try {

    const { name, designation, instagram, facebook, phone, order, isActive } = req.body;

    const update = { name, designation, instagram, facebook, phone, order: parseInt(order) || 0 };

    if (isActive !== undefined) update.isActive = isActive === 'true';

    if (req.file) { update.photoUrl = req.file.path; update.photoPublicId = req.file.filename; }

    const member = await TeamMember.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    res.json({ success: true, data: member });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// DELETE /api/team/:id  (admin)

app.delete('/api/team/:id', async (req, res) => {

  try {

    const member = await TeamMember.findByIdAndDelete(req.params.id);

    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (member.photoPublicId) await cloudinary.uploader.destroy(member.photoPublicId).catch(() => { });

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// ─── TIMELINE ROUTES ──────────────────────────────────────────────────────────



// GET /api/timeline

app.get('/api/timeline', async (req, res) => {

  try {

    const items = await Timeline.find().sort({ date: 1, order: 1 });

    res.json({ success: true, data: items });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// POST /api/timeline  (admin)

app.post('/api/timeline', async (req, res) => {

  try {

    const { title, description, date, time, icon, order } = req.body;

    const item = new Timeline({ title, description, date: new Date(date), time, icon, order: parseInt(order) || 0 });

    await item.save();

    res.json({ success: true, data: item });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// PUT /api/timeline/:id  (admin)

app.put('/api/timeline/:id', async (req, res) => {

  try {

    const { title, description, date, time, icon, order } = req.body;

    const update = { title, description, time, icon, order: parseInt(order) || 0 };

    if (date) update.date = new Date(date);

    const item = await Timeline.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!item) return res.status(404).json({ success: false, message: 'Timeline item not found' });

    res.json({ success: true, data: item });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// DELETE /api/timeline/:id  (admin)

app.delete('/api/timeline/:id', async (req, res) => {

  try {

    const item = await Timeline.findByIdAndDelete(req.params.id);

    if (!item) return res.status(404).json({ success: false, message: 'Timeline item not found' });

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// ─── SETTINGS ROUTES ─────────────────────────────────────────────────────────



// GET /api/settings  — returns all settings as a key:value map

app.get('/api/settings', async (req, res) => {

  try {

    const all = await Settings.find();

    const map = {};

    all.forEach(s => { map[s.key] = s.value; });

    res.json({ success: true, data: map });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// GET /api/settings/:key

app.get('/api/settings/:key', async (req, res) => {

  try {

    const setting = await Settings.findOne({ key: req.params.key });

    res.json({ success: true, data: setting });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// PUT /api/settings  — bulk upsert (admin) — MUST be before /:key route

app.put('/api/settings', async (req, res) => {

  try {

    const entries = req.body; // { key: value, ... }

    const ops = Object.entries(entries).map(([key, value]) => ({

      updateOne: {

        filter: { key },

        update: { key, value, updatedAt: new Date() },

        upsert: true,

      },

    }));

    await Settings.bulkWrite(ops);

    res.json({ success: true });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// PUT /api/settings/:key  (admin)

app.put('/api/settings/:key', async (req, res) => {

  try {

    const { value } = req.body;

    const setting = await Settings.findOneAndUpdate(

      { key: req.params.key },

      { value, updatedAt: new Date() },

      { upsert: true, new: true }

    );

    res.json({ success: true, data: setting });

  } catch (error) {

    res.status(500).json({ success: false, message: error.message });

  }

});



// 404 handler — returns JSON instead of HTML

app.use((req, res) => {

  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });

});



// Error handler — returns JSON instead of HTML

app.use((err, req, res, next) => {

  console.error('Server error:', err.message);

  res.status(500).json({ success: false, message: err.message || 'Internal server error' });

});



// Start server

app.listen(port, () => {

  console.log(`Server running on port ${port}`);

});

