content = open('Frontend/index.html', encoding='utf-8').read()
fixes = [
    # Hero title - add sm breakpoint
    ('text-3xl md:text-5xl font-bold mb-4">स्वरगंधर्व',
     'text-2xl sm:text-3xl md:text-5xl font-bold mb-4">स्वरगंधर्व'),
    # Hero subtitle
    ('text-xl md:text-2xl text-orange-100 mb-6">',
     'text-lg md:text-2xl text-orange-100 mb-6">'),
    # Hero cards - single col on mobile
    ('class="flex flex-wrap justify-center gap-4 mb-8">',
     'class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-lg mx-auto sm:max-w-none">'),
    # Registration form rows - single col on mobile
    ('class="grid md:grid-cols-3 gap-4">\n          <div>\n            <label class="block text-sm font-medium text-gray-700 mb-1">पूर्ण नाव',
     'class="grid grid-cols-1 md:grid-cols-3 gap-4">\n          <div>\n            <label class="block text-sm font-medium text-gray-700 mb-1">पूर्ण नाव'),
    ('class="grid md:grid-cols-3 gap-4">\n          <div>\n            <label class="block text-sm font-medium text-gray-700 mb-1">वर्ग',
     'class="grid grid-cols-1 md:grid-cols-3 gap-4">\n          <div>\n            <label class="block text-sm font-medium text-gray-700 mb-1">वर्ग'),
    # Admin stats - single col on very small screens
    ('class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">',
     'class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">'),
    # Admin dashboard modal - full width on mobile
    ('class="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-screen overflow-hidden flex flex-col">',
     'class="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-screen overflow-hidden flex flex-col" style="border-radius: 0.5rem;">'),
    # Admin tabs - smaller text on mobile
    ('class="admin-tab active" onclick="switchAdminTab(\'registrations\', this)">📋 नोंदणी</button>',
     'class="admin-tab active text-xs md:text-sm" onclick="switchAdminTab(\'registrations\', this)">📋 नोंदणी</button>'),
    ('class="admin-tab" onclick="switchAdminTab(\'gallery-admin\', this)">🖼️ गॅलरी</button>',
     'class="admin-tab text-xs md:text-sm" onclick="switchAdminTab(\'gallery-admin\', this)">🖼️ गॅलरी</button>'),
    ('class="admin-tab" onclick="switchAdminTab(\'events-admin\', this)">📅 इव्हेंट्स</button>',
     'class="admin-tab text-xs md:text-sm" onclick="switchAdminTab(\'events-admin\', this)">📅 इव्हेंट्स</button>'),
    ('class="admin-tab" onclick="switchAdminTab(\'team-admin\', this)">👥 टीम</button>',
     'class="admin-tab text-xs md:text-sm" onclick="switchAdminTab(\'team-admin\', this)">👥 टीम</button>'),
    ('class="admin-tab" onclick="switchAdminTab(\'timeline-admin\', this)">⏱️ टाइमलाइन</button>',
     'class="admin-tab text-xs md:text-sm" onclick="switchAdminTab(\'timeline-admin\', this)">⏱️ टाइमलाइन</button>'),
    ('class="admin-tab" onclick="switchAdminTab(\'settings-admin\', this)">⚙️ सेटिंग्ज</button>',
     'class="admin-tab text-xs md:text-sm" onclick="switchAdminTab(\'settings-admin\', this)">⚙️ सेटिंग्ज</button>'),
    # Gallery grid - single col on very small
    ('class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">\n        <!-- Loaded dynamically -->',
     'class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">\n        <!-- Loaded dynamically -->'),
    # Team grid index
    ('class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">',
     'class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">'),
    # Table colspan fix
    ('colspan="11" class="px-4 py-8 text-center text-gray-400">कोणतीही नोंदणी सापडली नाही',
     'colspan="11" class="px-4 py-8 text-center text-gray-400 text-sm">कोणतीही नोंदणी सापडली नाही'),
]

count = 0
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f'NOT FOUND: {old[:60]}')

open('Frontend/index.html', 'w', encoding='utf-8').write(content)
print(f'Applied {count}/{len(fixes)} fixes')
