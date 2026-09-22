// Fictional demo leads. No real client data, ever.
//
// Dates are built relative to today instead of being written as fixed dates.
// A lead that is three days overdue stays three days overdue whenever the demo
// is opened – next week, next month, or a year from now. With fixed dates the
// whole dataset would silently rot and every lead would look overdue.
//
// The set is designed to show every situation the app has to handle:
// all 5 sources, all 8 statuses, all 3 temperatures, all 3 products,
// overdue actions, actions due today, upcoming actions, a lead with no next
// action, stale leads, closed clients with different sale amounts and payment
// methods, and leads that did not close for different reasons.

import { dayOfThisMonth, daysFromToday } from './dates.js';

/**
 * Builds a fresh copy of the demo leads.
 *
 * This is a function and not a constant on purpose: every call returns brand
 * new objects, so editing a lead in the app can never corrupt the original
 * dataset. "Reset Demo Data" simply calls it again.
 *
 * @returns {import('./model.js').Lead[]}
 */
export function createDemoLeads() {
  return [
    {
      id: 'lead-01',
      name: 'דנה לוי',
      phone: '052-4471903',
      source: 'instagram',
      products: ['personal_coaching'],
      interestReason: 'מרגישה תקועה בעבודה ורוצה להחליט לאן להתקדם.',
      createdAt: daysFromToday(-2),
      lastInteractionAt: daysFromToday(-2),
      status: 'new',
      temperature: 'hot',
      discountOffered: false,
      nextAction: 'send_message',
      nextActionDate: daysFromToday(0), // due today
      notes: 'כתבה בסטורי, נראית ממש מוטיבציונית.',
      interactions: [
        {
          id: 'lead-01-i1',
          date: daysFromToday(-2),
          type: 'instagram',
          note: 'פנתה בהודעה פרטית ושאלה על אימון אישי.',
        },
      ],
    },

    {
      id: 'lead-02',
      name: 'מיכל כהן',
      phone: '054-3128860',
      source: 'referral',
      products: ['starting_to_move'],
      interestReason: 'חברה שלה עשתה את התוכנית והמליצה בחום.',
      createdAt: daysFromToday(-6),
      lastInteractionAt: daysFromToday(-5),
      status: 'contacted',
      temperature: 'hot',
      offeredPrice: 1890,
      discountOffered: false,
      nextAction: 'call',
      nextActionDate: daysFromToday(0), // due today
      notes: 'ביקשה שאתקשר אחרי 17:00.',
      interactions: [
        {
          id: 'lead-02-i1',
          date: daysFromToday(-6),
          type: 'whatsapp',
          note: 'פנתה בעקבות המלצה של שירה.',
        },
        {
          id: 'lead-02-i2',
          date: daysFromToday(-5),
          type: 'phone',
          note: 'שיחה קצרה, שלחתי לה את פרטי התוכנית.',
        },
      ],
    },

    {
      id: 'lead-03',
      name: 'יעל ישראלי',
      phone: '053-7729415',
      source: 'facebook',
      products: ['personal_coaching'],
      interestReason: 'רוצה לחזור לעבוד אחרי חופשת לידה ומתלבטת לגבי הכיוון.',
      createdAt: daysFromToday(-12),
      lastInteractionAt: daysFromToday(-4),
      status: 'considering',
      temperature: 'medium',
      offeredPrice: 3200,
      discountOffered: false,
      nextAction: 'send_offer',
      nextActionDate: daysFromToday(-2), // overdue
      notes: 'ביקשה לראות את ההצעה בכתב לפני שהיא מחליטה.',
      interactions: [
        {
          id: 'lead-03-i1',
          date: daysFromToday(-12),
          type: 'facebook',
          note: 'הגיבה לפוסט וביקשה פרטים.',
        },
        {
          id: 'lead-03-i2',
          date: daysFromToday(-8),
          type: 'zoom',
          note: 'שיחת היכרות. מתעניינת מאוד אבל צריכה לבדוק תקציב.',
        },
        {
          id: 'lead-03-i3',
          date: daysFromToday(-4),
          type: 'whatsapp',
          note: 'ביקשה הצעת מחיר מסודרת.',
        },
      ],
    },

    {
      id: 'lead-04',
      name: 'נועה אדרי',
      phone: '050-6612237',
      source: 'whatsapp',
      products: ['personal_coaching', 'five_day_challenge'],
      interestReason: 'רוצה להתחיל בקטן ולראות אם זה מתאים לה.',
      createdAt: daysFromToday(-20),
      lastInteractionAt: daysFromToday(-9), // stale: over 5 days with no contact
      status: 'follow_up',
      temperature: 'hot',
      offeredPrice: 3200,
      discountOffered: false,
      nextAction: 'follow_up',
      nextActionDate: daysFromToday(-4), // overdue
      notes: 'ביקשה שאחזור אליה אחרי החג.',
      interactions: [
        {
          id: 'lead-04-i1',
          date: daysFromToday(-20),
          type: 'whatsapp',
          note: 'שאלה על אתגר 5 ימים.',
        },
        {
          id: 'lead-04-i2',
          date: daysFromToday(-15),
          type: 'phone',
          note: 'הסברתי על שתי האפשרויות, התלהבה מהאימון האישי.',
        },
        {
          id: 'lead-04-i3',
          date: daysFromToday(-9),
          type: 'whatsapp',
          note: 'ביקשה לחזור אליה אחרי החג.',
        },
      ],
    },

    {
      id: 'lead-05',
      name: 'קרן שלום',
      phone: '052-9035174',
      source: 'instagram',
      products: ['personal_coaching'],
      interestReason: 'אחרי גירושין, רוצה לבנות מחדש ביטחון עצמי.',
      createdAt: daysFromToday(-34),
      lastInteractionAt: daysFromToday(-8),
      status: 'won',
      temperature: 'hot',
      offeredPrice: 3200,
      discountOffered: false,
      notes: 'מתחילה בשבוע הבא, נרגשת מאוד.',
      interactions: [
        {
          id: 'lead-05-i1',
          date: daysFromToday(-34),
          type: 'instagram',
          note: 'פנתה אחרי סדרת סטוריז על ביטחון עצמי.',
        },
        {
          id: 'lead-05-i2',
          date: daysFromToday(-30),
          type: 'zoom',
          note: 'שיחת היכרות ארוכה, התאמה מצוינת.',
        },
        {
          id: 'lead-05-i3',
          date: daysFromToday(-8),
          type: 'phone',
          note: 'סגרנו. שילמה בשלושה תשלומים.',
        },
      ],
      sale: {
        product: 'personal_coaching',
        closedAt: dayOfThisMonth(6),
        agreedPrice: 3200,
        paid: true,
        paymentMethod: 'credit_card',
        installments: 3,
      },
    },

    {
      id: 'lead-06',
      name: 'רוני שחר',
      phone: '054-2288603',
      source: 'whatsapp',
      products: ['starting_to_move'],
      interestReason: 'רוצה להתחיל לזוז אחרי שנים בלי פעילות.',
      createdAt: daysFromToday(-28),
      lastInteractionAt: daysFromToday(-11),
      status: 'won',
      temperature: 'hot',
      offeredPrice: 1890,
      discountOffered: false,
      interactions: [
        {
          id: 'lead-06-i1',
          date: daysFromToday(-28),
          type: 'whatsapp',
          note: 'הגיעה דרך קבוצת וואטסאפ שכונתית.',
        },
        {
          id: 'lead-06-i2',
          date: daysFromToday(-11),
          type: 'phone',
          note: 'סגרה על התוכנית, שילמה בביט.',
        },
      ],
      sale: {
        product: 'starting_to_move',
        closedAt: dayOfThisMonth(12),
        agreedPrice: 1890,
        paid: true,
        paymentMethod: 'bit',
      },
    },

    {
      id: 'lead-07',
      name: 'שירה בן־דוד',
      phone: '053-4416729',
      source: 'facebook',
      products: ['five_day_challenge'],
      interestReason: 'חיפשה משהו קצר להתחיל איתו.',
      createdAt: daysFromToday(-40),
      lastInteractionAt: daysFromToday(-21),
      status: 'lost',
      temperature: 'cold',
      offeredPrice: 3200,
      discountOffered: true,
      discountAmount: 400,
      finalOfferedPrice: 2800,
      lostReason: 'price_too_high',
      notes: 'גם אחרי ההנחה זה היה מעבר לתקציב שלה.',
      interactions: [
        {
          id: 'lead-07-i1',
          date: daysFromToday(-40),
          type: 'facebook',
          note: 'שאלה על האתגר בתגובה לפוסט.',
        },
        {
          id: 'lead-07-i2',
          date: daysFromToday(-28),
          type: 'phone',
          note: 'ניסיתי להציע לה גם אימון אישי.',
        },
        {
          id: 'lead-07-i3',
          date: daysFromToday(-21),
          type: 'whatsapp',
          note: 'אמרה שהמחיר גבוה לה כרגע.',
        },
      ],
    },

    {
      id: 'lead-08',
      name: 'אורלי מזרחי',
      phone: '050-3357081',
      source: 'referral',
      products: ['personal_coaching'],
      interestReason: 'לחץ בעבודה, מחפשת כלים להתמודדות.',
      createdAt: daysFromToday(-4),
      lastInteractionAt: daysFromToday(-1),
      status: 'intro_call_scheduled',
      temperature: 'medium',
      discountOffered: false,
      nextAction: 'call',
      nextActionDate: daysFromToday(2), // upcoming
      notes: 'שיחת היכרות נקבעה ליום רביעי בבוקר.',
      interactions: [
        {
          id: 'lead-08-i1',
          date: daysFromToday(-4),
          type: 'phone',
          note: 'הופנתה על ידי מיכל.',
        },
        {
          id: 'lead-08-i2',
          date: daysFromToday(-1),
          type: 'whatsapp',
          note: 'תיאמנו שיחת היכרות.',
        },
      ],
    },

    {
      id: 'lead-09',
      name: 'תמר גולן',
      phone: '052-7714458',
      source: 'whatsapp',
      products: ['personal_coaching', 'starting_to_move'],
      interestReason: 'רוצה שינוי כולל – גם ראש וגם גוף.',
      createdAt: daysFromToday(-9),
      lastInteractionAt: daysFromToday(-3),
      status: 'after_intro_call',
      temperature: 'hot',
      offeredPrice: 3200,
      discountOffered: false,
      nextAction: 'send_offer',
      nextActionDate: daysFromToday(1), // upcoming
      notes: 'מתלבטת בין שתי התוכניות, שווה להציע חבילה.',
      interactions: [
        {
          id: 'lead-09-i1',
          date: daysFromToday(-9),
          type: 'whatsapp',
          note: 'פנתה אחרי שראתה פוסט של חברה.',
        },
        {
          id: 'lead-09-i2',
          date: daysFromToday(-3),
          type: 'zoom',
          note: 'שיחת היכרות. מתעניינת בשתי התוכניות.',
        },
      ],
    },

    {
      id: 'lead-10',
      name: 'ליאת פרץ',
      phone: '054-6690312',
      source: 'instagram',
      products: ['five_day_challenge'],
      createdAt: daysFromToday(-7),
      lastInteractionAt: daysFromToday(-7), // stale, and no next action set
      status: 'new',
      temperature: 'cold',
      discountOffered: false,
      notes: 'שאלה מה זה האתגר ולא ענתה מאז.',
      interactions: [
        {
          id: 'lead-10-i1',
          date: daysFromToday(-7),
          type: 'instagram',
          note: 'שאלה כללית על האתגר.',
        },
      ],
    },

    {
      id: 'lead-11',
      name: 'הילה אבני',
      phone: '053-2205846',
      source: 'other',
      customSource: 'הרצאה בספרייה העירונית',
      products: ['starting_to_move'],
      interestReason: 'שמעה את ההרצאה ורוצה להמשיך משם.',
      createdAt: daysFromToday(-15),
      lastInteractionAt: daysFromToday(-6), // stale
      status: 'contacted',
      temperature: 'medium',
      discountOffered: false,
      nextAction: 'send_details',
      nextActionDate: daysFromToday(-1), // overdue
      notes: 'ביקשה את המצגת מההרצאה.',
      interactions: [
        {
          id: 'lead-11-i1',
          date: daysFromToday(-15),
          type: 'email',
          note: 'כתבה אחרי ההרצאה.',
        },
        {
          id: 'lead-11-i2',
          date: daysFromToday(-6),
          type: 'email',
          note: 'הזכירה שהיא עדיין מחכה לפרטים.',
        },
      ],
    },

    {
      id: 'lead-12',
      name: 'מאיה רוזן',
      phone: '050-8843726',
      source: 'facebook',
      products: ['five_day_challenge'],
      interestReason: 'רצתה לנסות משהו קטן לפני התחייבות.',
      createdAt: daysFromToday(-22),
      lastInteractionAt: daysFromToday(-13),
      status: 'won',
      temperature: 'medium',
      offeredPrice: 690,
      discountOffered: false,
      notes: 'עדיין לא שילמה – לעקוב אחרי ההעברה.',
      interactions: [
        {
          id: 'lead-12-i1',
          date: daysFromToday(-22),
          type: 'facebook',
          note: 'נרשמה דרך פוסט על האתגר.',
        },
        {
          id: 'lead-12-i2',
          date: daysFromToday(-13),
          type: 'whatsapp',
          note: 'אישרה השתתפות, ההעברה בדרך.',
        },
      ],
      sale: {
        product: 'five_day_challenge',
        closedAt: dayOfThisMonth(3),
        agreedPrice: 690,
        paid: false,
        paymentMethod: 'bank_transfer',
        notes: 'ההעברה טרם התקבלה.',
      },
    },

    {
      id: 'lead-13',
      name: 'גלית נחום',
      phone: '052-1194670',
      source: 'referral',
      products: ['personal_coaching'],
      interestReason: 'חיפשה ליווי בתקופת מעבר.',
      createdAt: daysFromToday(-30),
      lastInteractionAt: daysFromToday(-16),
      status: 'lost',
      temperature: 'medium',
      offeredPrice: 3200,
      discountOffered: false,
      lostReason: 'other',
      customLostReason: 'עברה לגור בחו״ל',
      interactions: [
        {
          id: 'lead-13-i1',
          date: daysFromToday(-30),
          type: 'phone',
          note: 'הופנתה על ידי קרן.',
        },
        {
          id: 'lead-13-i2',
          date: daysFromToday(-16),
          type: 'whatsapp',
          note: 'עדכנה שהיא עוברת לחו״ל בחודש הבא.',
        },
      ],
    },

    {
      id: 'lead-14',
      name: 'ענת ברקוביץ׳',
      phone: '054-9962148',
      source: 'whatsapp',
      products: ['starting_to_move'],
      interestReason: 'רוצה להיכנס לשגרה קבועה של פעילות.',
      createdAt: daysFromToday(-11),
      lastInteractionAt: daysFromToday(-2),
      status: 'considering',
      temperature: 'medium',
      offeredPrice: 1890,
      discountOffered: true,
      discountAmount: 190,
      finalOfferedPrice: 1700,
      nextAction: 'follow_up',
      nextActionDate: daysFromToday(4), // upcoming
      notes: 'הצעתי הנחת הרשמה מוקדמת, מתלבטת.',
      interactions: [
        {
          id: 'lead-14-i1',
          date: daysFromToday(-11),
          type: 'whatsapp',
          note: 'שאלה על מועדי הקבוצה הבאה.',
        },
        {
          id: 'lead-14-i2',
          date: daysFromToday(-2),
          type: 'phone',
          note: 'שלחתי הצעה עם הנחה, ביקשה כמה ימים לחשוב.',
        },
      ],
    },

    {
      id: 'lead-15',
      name: 'סיון דהן',
      phone: '053-5538091',
      source: 'instagram',
      products: ['personal_coaching'],
      interestReason: 'רוצה ליווי לקראת פתיחת עסק עצמאי.',
      createdAt: daysFromToday(-18),
      lastInteractionAt: daysFromToday(-5),
      status: 'won',
      temperature: 'hot',
      offeredPrice: 3200,
      discountOffered: true,
      discountAmount: 300,
      finalOfferedPrice: 2900,
      notes: 'סגרה אחרי הנחה קטנה.',
      interactions: [
        {
          id: 'lead-15-i1',
          date: daysFromToday(-18),
          type: 'instagram',
          note: 'פנתה אחרי ריל על יזמות.',
        },
        {
          id: 'lead-15-i2',
          date: daysFromToday(-12),
          type: 'zoom',
          note: 'שיחת היכרות, התאמה טובה.',
        },
        {
          id: 'lead-15-i3',
          date: daysFromToday(-5),
          type: 'phone',
          note: 'סגרה אחרי שהצעתי הנחה קטנה.',
        },
      ],
      sale: {
        product: 'personal_coaching',
        closedAt: dayOfThisMonth(16),
        agreedPrice: 2900,
        paid: true,
        paymentMethod: 'credit_card',
        installments: 2,
        notes: 'מתחילה בתחילת החודש הבא.',
      },
    },

    {
      id: 'lead-16',
      name: 'נטע אביב',
      phone: '050-7724395',
      source: 'facebook',
      products: ['five_day_challenge'],
      createdAt: daysFromToday(-25),
      lastInteractionAt: daysFromToday(-19),
      status: 'lost',
      temperature: 'cold',
      discountOffered: false,
      lostReason: 'no_response',
      notes: 'שלחתי שלוש תזכורות, לא חזרה.',
      interactions: [
        {
          id: 'lead-16-i1',
          date: daysFromToday(-25),
          type: 'facebook',
          note: 'שאלה על מועד האתגר הבא.',
        },
        {
          id: 'lead-16-i2',
          date: daysFromToday(-19),
          type: 'whatsapp',
          note: 'שלחתי פרטים, לא הגיבה.',
        },
      ],
    },
  ];
}
