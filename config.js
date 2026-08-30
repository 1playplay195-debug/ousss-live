// ===== إعدادات المشروع =====

// الدوريات (أكواد ESPN الرسمية)
const LEAGUES = [
  { code: 'eng.1',          arName: 'الدوري الإنجليزي الممتاز', flag: '🏴' },
  { code: 'esp.1',          arName: 'الدوري الإسباني',          flag: '🇪🇸' },
  { code: 'ita.1',          arName: 'الدوري الإيطالي',          flag: '🇮🇹' },
  { code: 'ger.1',          arName: 'الدوري الألماني',          flag: '🇩🇪' },
  { code: 'sau.1',          arName: 'دوري روشن السعودي',        flag: '🇸🇦' },
  { code: 'uefa.champions', arName: 'دوري أبطال أوروبا',        flag: '🏆' }
];

// رابط الـ API
const API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

// مدة التحديث التلقائي (بالمللي ثانية)
const REFRESH_INTERVAL = 10000; // 60 ثانية

// ترجمة حالات المباراة
const STATUS_AR = {
  'First Half':  'الشوط الأول',
  'Second Half': 'الشوط الثاني',
  'Halftime':    'بين الشوطين',
  'Full Time':   'انتهت المباراة',
  'After ET':    'بعد الوقت الإضافي',
  'Postponed':   'مؤجلة',
  'Canceled':    'ملغاة',
  'Scheduled':   'لم تبدأ'

  // إعدادات التقويم
const DAYS_BACK  = 3;  // عدد الأيام السابقة المعروضة كأزرار سريعة
const DAYS_AHEAD = 3;  // عدد الأيام القادمة المعروضة كأزرار سريعة

// أسماء الأيام بالعربية
const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                     'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

};
