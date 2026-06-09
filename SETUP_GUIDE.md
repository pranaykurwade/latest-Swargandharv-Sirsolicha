# स्वरगंधर्व सिरसोलीचा - नई सेटअप गाइड

## अवलोकन (Overview)

SMS सेवा को हटा दिया गया है। अब प्रणाली निम्नलिखित का उपयोग करती है:
- **Google OAuth** - उपयोगकर्ता प्रमाणीकरण के लिए
- **Email (Gmail SMTP)** - पंजीकरण पुष्टिकरण भेजने के लिए

## आवश्यक परिवर्तन

### 1. npm packages स्थापित करें

```bash
npm install
```

यह निम्नलिखित नए packages स्थापित करेगा:
- `nodemailer` - Email भेजने के लिए
- `passport` - Authentication के लिए
- `passport-google-oauth20` - Google OAuth के लिए

### 2. Google OAuth सेटअप करें

#### Step 1: Google Cloud Console पर जाएं
1. https://console.cloud.google.com/ खोलें
2. नया project बनाएं या मौजूदा project चुनें

#### Step 2: OAuth 2.0 Credentials बनाएं
1. "APIs & Services" → "Credentials" पर जाएं
2. "Create Credentials" → "OAuth 2.0 Client ID" चुनें
3. "Web Application" का चयन करें
4. Authorized redirect URIs में जोड़ें:
   - `http://localhost:3000/auth/google/callback`
   - `https://your-domain.com/auth/google/callback` (उत्पादन के लिए)

#### Step 3: Credentials को .env में जोड़ें

अपने `.env` फ़ाइल में यह जोड़ें:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 3. Email (Gmail) सेटअप करें

#### Step 1: Gmail खाता तैयार करें

1. एक Gmail खाता खोलें या मौजूदा का उपयोग करें
2. 2-Factor Authentication (2FA) सक्षम करें:
   - myaccount.google.com पर जाएं
   - "Security" पर क्लिक करें
   - "2-Step Verification" सक्षम करें

#### Step 2: App Password जनरेट करें

1. myaccount.google.com → Security → "App passwords" पर जाएं
2. Device: Select → "Windows Computer" चुनें
3. App: Select → "Mail" चुनें
4. Generated password प्राप्त करें

#### Step 3: .env में Email Credentials जोड़ें

```env
# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM_NAME=स्वरगंधर्व सिरसोलीचा
```

### 4. Frontend में Google Client ID डालें

`Frontend/index.html` में, इस लाइन को खोजें:

```javascript
client_id: '517265848633-blah.apps.googleusercontent.com',
```

और अपने actual Google Client ID से बदलें:

```javascript
client_id: 'your-client-id-here.apps.googleusercontent.com',
```

## Database Schema परिवर्तन

Registration collection में ये नए fields जोड़े गए हैं:

```javascript
{
  email: String,           // यूजर का ईमेल (जरूरी)
  googleId: String,        // Google से userId
  googleName: String,      // Google से नाम
  emailSent: Boolean,      // क्या ईमेल भेजी गई
  emailSentAt: Date        // ईमेल कब भेजी गई
}
```

पुराने `phone` field की unique constraint बनी रही है।

## API Routes

### नई Routes:

1. **GET /api/registration/email/:email**
   - किसी email के साथ registration खोजता है
   - Frontend में email check के लिए उपयोग

### Updated Routes:

1. **POST /api/register**
   - अब `email` की जरूरत है
   - Optional: `googleId` और `googleName`

## Frontend Changes

### Registration Form में नई सुविधाएं:

1. **Google Sign-In Button**
   - यूजर के नाम और ईमेल को स्वचालित भरता है
   - मोबाइल user के लिए आसान

2. **Email Field (अनिवार्य)**
   - Registration के लिए ईमेल जरूरी है
   - Google से auto-fill होता है

3. **Email Status Check Section**
   - यूजर अपनी ईमेल से status देख सकता है
   - यह दिखाता है कि:
     - नोंदणी आयडी
     - ईमेल कब भेजी गई
     - पेमेंट स्थिति

### Registration Success Message:
- अब ईमेल check करने के लिए instruction दिखाता है
- "ईमेल पुष्टीकरण" section का reference देता है

## Testing

### Local Testing:

```bash
# Dependencies install करें
npm install

# Server चलाएं
npm start
```

Server http://localhost:3000 पर चलेगा

### Frontend URL:
- Development: `http://localhost:5500` (Live Server)
- Production: https://swargandharv-sirsolicha-latest.netlify.app

## Troubleshooting

### Google Sign-In काम नहीं कर रहा:

1. Client ID सही है या नहीं check करें
2. Redirect URL सही है या नहीं check करें
3. Browser console में errors देखें

### Email नहीं आ रहा:

1. Gmail App Password सही है या नहीं check करें
2. 2FA enable है या नहीं check करें
3. Server logs में email error देखें: `console.log` statements

### Database Error:

पुरानी registrations के साथ अगर कोई issue हो:

```javascript
// MongoDB में यह command चलाएं:
db.registrations.updateMany(
  { email: { $exists: false } },
  { $set: { email: "legacy@example.com", emailSent: false } }
)
```

## Future Enhancements

आप निम्नलिखित जोड़ सकते हैं:

1. **Email Resend**
   - यूजर को फिर से ईमेल भेजने का option

2. **Email Templates**
   - विभिन्न languages के लिए templates

3. **Email Notifications**
   - Admin को भी notifications भेजना

4. **SMS Backup**
   - Important info के लिए SMS backup (optional)

## File Changed Summary

### Backend (server.js):
- Removed: Twilio/Fast2SMS imports और code
- Added: Nodemailer configuration
- Updated: Registration schema with email fields
- New: Email sending function
- New: Email lookup API route

### Frontend (index.html):
- Added: Google Sign-In script
- Updated: Registration form with email field
- New: Email check section
- Updated: Google authentication handling

### Configuration:
- Updated: package.json - removed twilio, added nodemailer & passport
- Updated: .env - removed SMS vars, added Google OAuth & Email vars

## Support

किसी समस्या के लिए:
1. Server logs check करें
2. Browser console में errors देखें
3. .env file सही तरीके से configured है या नहीं check करें
