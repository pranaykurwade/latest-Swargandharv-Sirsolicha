require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB')).catch(err => { console.error(err); process.exit(1); });

const settingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    value: { type: String },
    updatedAt: { type: Date, default: Date.now },
});
const Settings = mongoose.model('Settings', settingsSchema);

const timelineSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String },
    icon: { type: String, default: '🌸' },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
const Timeline = mongoose.model('Timeline', timelineSchema);

const settings = {
    // ── HERO SECTION ──────────────────────────────────────────────────────────
    heroTitle: 'स्वरगंधर्व सिरसोलीचा',
    heroSubtitle: 'एकल गीत गायन स्पर्धा 2025',
    heroDate: '22-23 ऑक्टोबर 2025',
    heroVenue: 'सिरसोली, वर्धा',
    heroPrize: '₹7001 पर्यंत पुरस्कार',

    // ── ABOUT SECTION ─────────────────────────────────────────────────────────
    aboutDesc: 'वंदनीय राष्ट्रसंत तुकडोजी महाराज प्रेरित भव्य एकल गीत गायन स्पर्धा — भक्तिसंगीताची जपणूक करून संतांचे अमूल्य ठेवा पुढील पिढीपर्यंत पोहोचवण्याचा एक संगीतमय उत्सव.',
    aboutCard1: '🏆|पुरस्कार|प्रत्येक वर्गात प्रथम ते पाचवे पुरस्कार. एकूण बक्षीस रक्कम ₹50,000+',
    aboutCard2: '👥|सहभाग|सर्व वयोगटातील कलाकार सहभागी होऊ शकतात. गेल्या तीन वर्षांत 500+ कलाकारांचा सहभाग.',
    aboutCard3: '🎵|संगीत प्रकार|तुकडोजी महाराजांचे भजन, अभंग, देशभक्ती गीत आणि गवळण',

    // ── CATEGORIES SECTION ────────────────────────────────────────────────────
    categories: JSON.stringify([
        {
            name: 'बाल वर्ग',
            age: '15 वर्षाआतील',
            details: [
                '✓ नोंदणी फी: ₹201',
                '✓ 5 मिनिटांपर्यंत सादरीकरण',
                '✓ सादरीकरणाला प्राधान्य',
                '• प्रथम पुरस्कार: ₹3,001',
                '• द्वितीय पुरस्कार: ₹2,501',
                '• तृतीय पुरस्कार: ₹2,001',
                '• चतुर्थ पुरस्कार: ₹1,501',
                '• पाचवे पुरस्कार: ₹1,101',
            ],
        },
        {
            name: 'महिला वर्ग',
            age: '15+ वर्षे',
            details: [
                '✓ नोंदणी फी: ₹301',
                '✓ 7 मिनिटांपर्यंत सादरीकरण',
                '✓ नवीन गीत सादर केल्यास 5 बोनस गुण',
                '• प्रथम पुरस्कार: ₹5,001',
                '• द्वितीय पुरस्कार: ₹4,001',
                '• तृतीय पुरस्कार: ₹3,001',
                '• चतुर्थ पुरस्कार: ₹2,001',
                '• पाचवे पुरस्कार: ₹1,101',
            ],
        },
        {
            name: 'पुरुष वर्ग',
            age: '15+ वर्षे',
            details: [
                '✓ नोंदणी फी: ₹301',
                '✓ 7 मिनिटांपर्यंत सादरीकरण',
                '✓ नवीन गीत सादर केल्यास 5 बोनस गुण',
                '• प्रथम पुरस्कार: ₹7,001',
                '• द्वितीय पुरस्कार: ₹5,001',
                '• तृतीय पुरस्कार: ₹3,501',
                '• चतुर्थ पुरस्कार: ₹2,501',
                '• पाचवे पुरस्कार: ₹1,101',
            ],
        },
    ]),

    // ── RULES SECTION ─────────────────────────────────────────────────────────
    rules: [
        '👶 बाल गटातील सर्व 15 वर्षाआतील मुला/मुलींनी आधार कार्ड / जन्म प्रमाणपत्र / शाळेचा दाखला दाखविणे अनिवार्य आहे.',
        '🎤 एका स्पर्धकाला एकच गीत सादर करता येईल. बाल गटात 5 मिनिटे व महिला/पुरुष गटात 7 मिनिटे वेळ दिला जाईल.',
        '🎶 आयोजकांच्या सूचनेनुसार ऐच्छिक गीत सादर करणे अनिवार्य राहील.',
        '🔄 मागील वर्षीच्या स्पर्धकांनी नवीन गीत सादर करावे, अन्यथा गुणात कपात होईल.',
        '🚫 स्पर्धेमध्ये गैरवर्तन किंवा नशापाणी केल्यास, पूर्वसूचना न देता स्पर्धकाचा प्रवेश रद्द केला जाईल.',
        '✨ स्पर्धकांना सादरीकरणाचा क्रमांक फक्त प्रवेश पावतीनुसारच प्रदान करण्यात येईल.',
        '📅 दि. 21/10/2025 सायंकाळी 6:00 पर्यंत ऑनलाईन प्रवेश करणाऱ्या स्पर्धकांना सादरीकरणासाठी प्राधान्य दिले जाईल.',
        '🏃 दि. 22/10/2025 सायंकाळी 6:00 पर्यंत ऑफलाइन प्रवेश सुरू राहील.',
        '🏆 स्पर्धेचे पारितोषिक वितरण दि. 23/10/2025 ला होईल व त्यासाठी उपस्थित राहणे अनिवार्य राहील.',
        '🎵 गीताचे प्रकार: तुकडोजी महाराजांची भजने, अभंग, देशभक्ती गीत व गवळणी — इतर कोणतेही गीत ग्राह्य धरले जाणार नाही.',
        '⚖️ अंतिम निर्णय परीक्षक व आयोजकांच्या सूचनेनुसार होईल.',
        '🌪️ नैसर्गिक आपत्तीमध्ये मंडळ जबाबदार राहणार नाही.',
    ].join('\n'),

    // ── CONTACT SECTION ───────────────────────────────────────────────────────
    phone1: '+91 91586 68676',
    phone2: '+91 87679 05536',
    instagram: 'swargandharv_sirsolicha',
    address: 'सिरसोली, जिल्हा वर्धा, महाराष्ट्र - 442202',

    // ── IMPORTANT INFO BOX ────────────────────────────────────────────────────
    importantInfo: [
        'नोंदणीची शेवटची तारीख: 22 ऑक्टोबर 2025 संध्याकाळी 6:00 पर्यंत',
        'स्पर्धेचा वेळ: स्पर्धा दुपारी 12:00 वाजता सुरु होईल',
        'सहभागींनी स्पर्धेच्या दिवशी दुपारी 12:30 पर्यंत उपस्थित राहावे',
        'पुरस्कार वितरण: 23 ऑक्टोबर 2025 ला दुपारी 1:00 वाजता होईल',
    ].join('\n'),
};

const timelineItems = [
    {
        icon: '🌸',
        title: 'दुपारी 12:00 – उद्घाटन समारंभ',
        description: 'प्रमुख पाहुण्यांचे आगमन व दीपप्रज्वलन',
        date: new Date('2025-10-22'),
        time: 'दुपारी 12:00',
        order: 1,
    },
    {
        icon: '🎶',
        title: 'दुपारी 1:00 – प्राथमिक फेरी',
        description: 'बाल, महिला व पुरुष वर्गातील स्पर्धकांची कला सादरीकरणे',
        date: new Date('2025-10-22'),
        time: 'दुपारी 1:00',
        order: 2,
    },
    {
        icon: '🍴',
        title: 'सायंकाळी 5:00 – भोजनावकाश',
        description: 'स्पर्धक व पाहुण्यांसाठी विश्रांती व भोजन',
        date: new Date('2025-10-22'),
        time: 'सायंकाळी 5:00',
        order: 3,
    },
    {
        icon: '🏆',
        title: 'सायंकाळी 7:30 – अंतिम फेरी',
        description: 'निवडक स्पर्धकांचे अंतिम सादरीकरण',
        date: new Date('2025-10-22'),
        time: 'सायंकाळी 7:30',
        order: 4,
    },
    {
        icon: '🌟',
        title: 'दुपारी 1:00 – पारितोषिक वितरण',
        description: 'विजेत्यांचा गौरव, सत्कार व बक्षीस वितरण',
        date: new Date('2025-10-23'),
        time: 'दुपारी 1:00',
        order: 5,
    },
];

async function seed() {
    try {
        console.log('\n📦 Seeding Settings...');
        let saved = 0;
        for (const [key, value] of Object.entries(settings)) {
            await Settings.findOneAndUpdate(
                { key },
                { key, value, updatedAt: new Date() },
                { upsert: true, new: true }
            );
            saved++;
            process.stdout.write(`  ✅ ${key}\n`);
        }
        console.log(`\n✅ ${saved} settings saved.`);

        console.log('\n📅 Seeding Timeline...');
        const existing = await Timeline.countDocuments();
        if (existing > 0) {
            console.log(`  ⚠️  ${existing} timeline items already exist — skipping. Delete them first if you want to re-seed.`);
        } else {
            await Timeline.insertMany(timelineItems);
            console.log(`  ✅ ${timelineItems.length} timeline items saved.`);
        }

        console.log('\n🎉 Seed complete! Your website will now show all content.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
