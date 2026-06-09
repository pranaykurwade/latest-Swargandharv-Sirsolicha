# Quick Configuration Checklist

## ✅ Completed Changes in Code:

### ✨ Backend (server.js):
- [x] Removed Twilio imports
- [x] Removed Fast2SMS configuration  
- [x] Removed `sendSmsNotification()` function
- [x] Added Nodemailer import and configuration
- [x] Updated Registration schema with email, googleId, googleName fields
- [x] Added `sendEmailNotification()` function
- [x] Updated `/api/register` endpoint to accept email
- [x] Added `/api/registration/email/:email` endpoint
- [x] Changed `approveRegistrationByOrderId()` to call email instead of SMS

### ✨ Frontend (index.html):
- [x] Added Google Sign-In script
- [x] Added Google Sign-In button to form
- [x] Added Email input field (required)
- [x] Added Email status check section
- [x] Added Google login handling JavaScript
- [x] Added `checkEmailConfirmation()` function
- [x] Updated success message with email instructions

### ✨ Configuration:
- [x] Updated package.json (removed twilio, added nodemailer, passport, passport-google-oauth20)
- [x] Updated .env template (removed SMS vars, added Google OAuth & Email vars)

---

## 🔧 YOUR TO-DO (Required Setup):

### 1️⃣ Install Dependencies:
```bash
cd "d:\New Swargandharv Sirsolicha"
npm install
```

### 2️⃣ Get Google OAuth Credentials:

Go to: https://console.cloud.google.com/

1. Create/Select a project
2. Enable "Google+ API"
3. Go to "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web Application"
6. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://swargandharv-sirsolicha-latest.netlify.app/auth/google/callback`
7. Copy Client ID and Secret

### 3️⃣ Setup Gmail for Email:

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" (if not already done)
3. Go to "App passwords"
4. Select: Device → "Windows Computer"
5. Select: App → "Mail"
6. Copy the generated password

### 4️⃣ Update .env File:

Edit `d:\New Swargandharv Sirsolicha\.env`:

```env
# Add these new lines with your credentials:

GOOGLE_CLIENT_ID=your-client-id-from-google-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-google-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-from-gmail
EMAIL_FROM_NAME=स्वरगंधर्व सिरसोलीचा
```

### 5️⃣ Update Frontend Google Client ID:

Edit `Frontend/index.html`, find line ~1427:

Replace:
```javascript
client_id: '517265848633-blah.apps.googleusercontent.com',
```

With:
```javascript
client_id: 'your-client-id-from-google.apps.googleusercontent.com',
```

### 6️⃣ Test Locally:

```bash
npm start
```

Then open: http://localhost:5500/Frontend/index.html

Test:
- [ ] Google Sign-In button दिखता है?
- [ ] Google से login कर सकते हैं?
- [ ] Form fill हो जाता है?
- [ ] Email field भरी हो?
- [ ] Registration submit हो सकता है?
- [ ] Payment काम करती है?
- [ ] Email आती है?

---

## 📊 What Changed in Database:

**पुरानी Registration Document:**
```json
{
  "registrationId": "SG123456",
  "fullName": "राज शर्मा",
  "age": 25,
  "phone": "9876543210",
  "category": "पुरुष",
  ...
}
```

**नई Registration Document (with Email):**
```json
{
  "registrationId": "SG123456",
  "fullName": "राज शर्मा",
  "age": 25,
  "phone": "9876543210",
  "email": "raj@example.com",        // ← NEW
  "googleId": "abc123def456",         // ← NEW (optional)
  "googleName": "Raj Sharma",         // ← NEW (optional)
  "category": "पुरुष",
  "emailSent": true,                  // ← NEW
  "emailSentAt": "2025-06-07T10:30:00Z", // ← NEW
  ...
}
```

**For existing registrations**, you may need to migrate:
```javascript
// Run in MongoDB:
db.registrations.updateMany(
  { email: { $exists: false } },
  { 
    $set: { 
      email: "pending@example.com", 
      emailSent: false,
      googleId: null,
      googleName: null 
    } 
  }
)
```

---

## 🚀 Deployment Checklist:

- [ ] .env file में सभी credentials हैं?
- [ ] Google OAuth credentials production के लिए configure हैं?
- [ ] Netlify redirect URIs में Google callback add किया है?
- [ ] Email configuration test किया है?
- [ ] npm install किया है?
- [ ] सभी files push किए हैं?

---

## 📱 User Flow (नई):

```
Village User without email knowledge:
    ↓
Website पर आता है
    ↓
Google button देखता है → उसका Google account से login करता है
    ↓
नाम और email automatically fill हो जाते हैं
    ↓
सिर्फ age, phone, category, song type भरता है
    ↓
Payment करता है
    ↓
Registration ID मिलता है
    ↓
Email को खुद check करना नहीं पड़ता - सीधे मिल जाती है
    ↓
Email में सभी details होती हैं
    ↓
स्पर्धे के दिन registration ID को screenshot या note से ले जाता है
```

---

## ❓ Quick Troubleshooting:

| Problem | Solution |
|---------|----------|
| Google Sign-In button नहीं दिख रहा | Client ID check करें, script load हो रहा है? |
| Email नहीं आ रहा | App password check करें, 2FA enable है? |
| "सर्व आवश्यक माहिती भरा" error | Email field fill की है? |
| Payment verify नहीं हो रहा | Razorpay keys check करें |
| Email भेजने में error | Server logs में "Failed to send email" देखें |

---

## 📞 Support:

यदि कोई issue हो:
1. SETUP_GUIDE.md पढ़ें
2. IMPLEMENTATION_SUMMARY.md देखें
3. Server logs check करें
4. Browser console में errors देखें
5. .env file verify करें

---

**All code changes are complete!** ✅  
**Just add your credentials and you're ready to go!** 🚀
