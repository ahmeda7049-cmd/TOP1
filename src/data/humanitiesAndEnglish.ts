import { Lesson, Unit } from '../types';

export const HUMANITIES_ENGLISH_UNITS: Unit[] = [
  // English (9 lessons)
  { id: 'en-u1', subjectId: 'english', title: 'Unit 1: Getting Away' },
  { id: 'en-u2', subjectId: 'english', title: 'Unit 2: Supporting the Community' },
  { id: 'en-u3', subjectId: 'english', title: 'Unit 3: Improving Lives' },

  // History (9 lessons)
  { id: 'hi-u1', subjectId: 'history', title: 'الوحدة الأولى: مدخل لدراسة الحضارة' },
  { id: 'hi-u2', subjectId: 'history', title: 'الوحدة الثانية: ملامح التاريخ الفرعوني' },
  { id: 'hi-u3', subjectId: 'history', title: 'الوحدة الثالثة: مظاهر الحضارة المصرية' },
];

export const HUMANITIES_ENGLISH_LESSONS: Lesson[] = [
  // ================= ENGLISH (9 lessons) =================
  {
    id: 'en-1',
    subjectId: 'english',
    unitId: 'en-u1',
    title: 'Ecotourism Vocabulary',
    branch: 'مفردات',
    durationMinutes: 12,
    summary: 'مفردات السياحة البيئية والاستدامة وحماية الكائنات المهددة بالانقراض.',
    passageTitle: 'Key Ecotourism Concepts',
    passageLines: [
      'Ecotourism provides holidays to places that are endangered and isolated while protecting nature.',
      'Tourists stay in eco-friendly hotels built from local materials to preserve the environment.',
    ],
    keyTakeaways: [
      'Sustainable tourism respects local culture and reduces pollution.',
    ],
    vocabulary: [
      { word: 'Endangered', meaning: 'معرّض للانقراض', opposite: 'Safe' },
      { word: 'Ecosystem', meaning: 'النظام البيئي' },
      { word: 'Isolated', meaning: 'معزول وبعيد عن العمران', opposite: 'Accessible' },
    ],
    rules: [
      {
        title: 'Impact vs. Effect',
        detail: 'كلاهما يعني أثر، ونستخدم غالباً have an impact on + اسم.',
        example: 'Tourism has a positive impact on the local economy.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en1-q1',
        question: 'What does "ecotourism" aim to do?',
        options: [
          'Pollute beaches',
          'Protect nature and support local communities',
          'Build giant factories',
          'Hunt wild animals',
        ],
        correctIndex: 1,
        explanation: 'السياحة البيئية تهدف لحماية البيئة ودعم السكان المحليين.',
      },
      {
        id: 'en1-q2',
        question: 'The antonym of "endangered" is:',
        options: ['isolated', 'protected', 'damaged', 'crowded'],
        correctIndex: 1,
        explanation: 'مضاد معرّض للخطر (endangered) هو محمي (protected).',
      },
    ],
  },
  {
    id: 'en-2',
    subjectId: 'english',
    unitId: 'en-u1',
    title: 'Past Simple & Past Continuous',
    branch: 'قواعد',
    durationMinutes: 15,
    summary: 'استخدام الماضي البسيط والماضي المستمر والربط بينهما باستخدام While و When و During.',
    passageTitle: 'Interrupted Past Actions',
    passageLines: [
      'Past Continuous (was/were + V-ing) describes a long action in progress in the past.',
      'Past Simple describes a shorter action that interrupted it: While I was reading, the phone rang.',
    ],
    keyTakeaways: [
      'During يتبعها اسم (Noun) وليس جملة كاملة.',
    ],
    vocabulary: [
      { word: 'Trek', meaning: 'يسير لمسافات طويلة في الطبيعة' },
    ],
    rules: [
      {
        title: 'Stative Verbs',
        detail: 'أفعال الحالة مثل know, love, seem لا تُوضع في الماضي المستمر.',
        example: 'While I was at school, I knew the answer.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en2-q1',
        question: 'While we ________ through the desert, we saw a rare gazelle.',
        options: ['walk', 'were walking', 'have walked', 'are walking'],
        correctIndex: 1,
        explanation: 'نستخدم الماضي المستمر (were walking) بعد While للحدث المستمر.',
      },
      {
        id: 'en2-q2',
        question: '________ the flight, passengers enjoyed a quiet meal.',
        options: ['While', 'During', 'When', 'As'],
        correctIndex: 1,
        explanation: 'During هي الوحيدة التي يتبعها اسم (the flight).',
      },
    ],
  },
  {
    id: 'en-3',
    subjectId: 'english',
    unitId: 'en-u1',
    title: 'Travel & Eco-Hotels Writing',
    branch: 'قراءة',
    durationMinutes: 12,
    summary: 'مهارات كتابة فقرة وصفية عن رحلة بيئية باستخدام روابط التسلسل الزمني.',
    passageTitle: 'Descriptive Writing Tips',
    passageLines: [
      'Begin with a clear topic sentence stating where and when you went.',
      'Use sensory adjectives such as peaceful, breathtaking, and crystal-clear.',
    ],
    keyTakeaways: [
      'ترتيب الأحداث بوضوح (First, Then, Finally) يجعل المقال ممتعاً ومترابطاً.',
    ],
    vocabulary: [
      { word: 'Breathtaking', meaning: 'خلاب ورائع للغاية' },
    ],
    rules: [
      {
        title: 'Concluding Sentence',
        detail: 'اختم الفقرة بانطباعك الشخصي أو نصيحة للقارئ.',
        example: 'In short, it was an unforgettable eco-friendly adventure.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en3-q1',
        question: 'Which word best describes an amazingly beautiful natural view?',
        options: ['boring', 'breathtaking', 'crowded', 'noisy'],
        correctIndex: 1,
        explanation: 'breathtaking تعني خلاب ومذهل الجمال.',
      },
      {
        id: 'en3-q2',
        question: 'What should the first sentence of a paragraph usually be?',
        options: ['A topic sentence', 'A signature', 'A bibliography', 'A footnote'],
        correctIndex: 0,
        explanation: 'الجملة الافتتاحية (topic sentence) تلخص الفكرة الرئيسة للفقرة.',
      },
    ],
  },
  {
    id: 'en-4',
    subjectId: 'english',
    unitId: 'en-u2',
    title: 'Blood Donors & Role Models',
    branch: 'مفردات',
    durationMinutes: 12,
    summary: 'القدوة المجتمعية والتبرع التطوعي وقيم العطاء في خدمة المجتمع.',
    passageTitle: 'Making a Difference',
    passageLines: [
      'A role model inspires young people through generosity, courage, and hard work.',
      'Regular blood donation helps save millions of lives around the world.',
    ],
    keyTakeaways: [
      'الكرم والعطاء يبنيان مجتمعاً متماسكاً.',
    ],
    vocabulary: [
      { word: 'Donor', meaning: 'متبرع' },
      { word: 'Generosity', meaning: 'الكرم والسخاء', opposite: 'Selfishness' },
    ],
    rules: [
      {
        title: 'Inspire vs. Admire',
        detail: 'Inspire يلهم الآخرين، أما Admire فيُعجب بـ شخص أو عمل.',
        example: 'Scientists admire Dr. Magdi Yacoub for his achievements.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en4-q1',
        question: 'Someone who gives blood or money to help others is called a ________.',
        options: ['donor', 'guard', 'driver', 'tourist'],
        correctIndex: 0,
        explanation: 'Donor تعني متبرع.',
      },
      {
        id: 'en4-q2',
        question: 'The opposite of "generosity" is:',
        options: ['kindness', 'selfishness', 'bravery', 'honesty'],
        correctIndex: 1,
        explanation: 'مضاد الكرم (generosity) هو الأنانية (selfishness).',
      },
    ],
  },
  {
    id: 'en-5',
    subjectId: 'english',
    unitId: 'en-u2',
    title: 'Present Simple & Passive Voice',
    branch: 'قواعد',
    durationMinutes: 14,
    summary: 'استخدام المضارع البسيط للحقائق والعادات وتحويله إلى المبني للمجهول (am/is/are + P.P).',
    passageTitle: 'Active vs. Passive',
    passageLines: [
      'Active: Conservationists monitor lions every day.',
      'Passive: Lions are monitored by conservationists every day.',
    ],
    keyTakeaways: [
      'في المبني للمجهول نبدأ بالمفعول به ثم am/is/are ثم التصريف الثالث.',
    ],
    vocabulary: [
      { word: 'Monitor', meaning: 'يراقب ويتابع عن كثب' },
    ],
    rules: [
      {
        title: 'ظروف التكرار',
        detail: 'always, usually, often, sometimes تأتي قبل الفعل الأساسي وبعد verb to be.',
        example: 'She is always punctual. / She always arrives early.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en5-q1',
        question: 'Many lions ________ by tracking collars in Kenya.',
        options: ['monitor', 'are monitored', 'monitoring', 'is monitored'],
        correctIndex: 1,
        explanation: 'Lions جمع ومفعول به، فنختار are monitored.',
      },
      {
        id: 'en5-q2',
        question: 'Choose the correct sentence:',
        options: [
          'He always is late.',
          'He is always helpful.',
          'Always he helps.',
          'He help always.',
        ],
        correctIndex: 1,
        explanation: 'ظرف التكرار always يأتي بعد verb to be (is).',
      },
    ],
  },
  {
    id: 'en-6',
    subjectId: 'english',
    unitId: 'en-u2',
    title: 'Translation & Reading Skills',
    branch: 'قراءة',
    durationMinutes: 13,
    summary: 'أساسيات الترجمة من الإنجليزية إلى العربية والعكس بدقة لغوية وتجنب الترجمة الحرفية.',
    passageTitle: 'Smart Translation Principles',
    passageLines: [
      'Understand the full meaning of the sentence before translating individual words.',
      'Arabic prefers starting verbal sentences with a verb (تُعد الرياضة...), while English uses Subject + Verb.',
    ],
    keyTakeaways: [
      'انتبه للضمائر والأزمنة والمصطلحات العلمية عند الترجمة.',
    ],
    vocabulary: [
      { word: 'Charity', meaning: 'عمل خيري أو مؤسسة خيرية' },
    ],
    rules: [
      {
        title: 'أسلوب الجملة العربية',
        detail: 'اختر أسلوباً عربياً سليماً خالياً من الركاكة وتكرار «يكون».',
        example: 'Education is the key to progress -> التعليم هو مفتاح التقدم.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en6-q1',
        question: 'What is the best Arabic translation for "Voluntary work builds strong communities"?',
        options: [
          'العمل التطوعي يبني مجتمعات قوية',
          'العمل المادي يدمر المجتمعات',
          'العمل التطوعي يضيع الوقت',
          'العمل القوي يبني تطوعاً',
        ],
        correctIndex: 0,
        explanation: 'Voluntary work = العمل التطوعي، builds = يبني، strong communities = مجتمعات قوية.',
      },
      {
        id: 'en6-q2',
        question: 'What should you avoid when translating English to Arabic?',
        options: ['Word-for-word literal translation', 'Reading the full context', 'Using proper Arabic grammar', 'Checking verb tenses'],
        correctIndex: 0,
        explanation: 'الترجمة الحرفية كلمة بكلمة تفسد المعنى السليم.',
      },
    ],
  },
  {
    id: 'en-7',
    subjectId: 'english',
    unitId: 'en-u3',
    title: 'Improving Lives Vocabulary',
    branch: 'مفردات',
    durationMinutes: 12,
    summary: 'مفردات المساعدة المجتمعية، التجارة، الديون، والعمل الإنساني.',
    passageTitle: 'Helping Others',
    passageLines: [
      'Charities work hard to reduce poverty and help people pay off their debts.',
      'Fair opportunities allow young people to earn a decent living.',
    ],
    keyTakeaways: [
      'الفرق بين earn (يكسب مالاً بعمل) و win (يفوز بجائزة/مباراة).',
    ],
    vocabulary: [
      { word: 'Debt', meaning: 'دَيْن مالي' },
      { word: 'Earn', meaning: 'يكسب رزقه بالعمل' },
      { word: 'Miserable', meaning: 'بائس', opposite: 'Cheerful' },
    ],
    rules: [
      {
        title: 'Earn vs. Gain vs. Win',
        detail: 'earn money/living · gain experience/weight · win a match/prize.',
        example: 'You gain valuable experience from volunteering.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en7-q1',
        question: 'Working on community projects helps students ________ useful experience.',
        options: ['win', 'gain', 'beat', 'rob'],
        correctIndex: 1,
        explanation: 'نستخدم gain مع الخبرة (experience) والمعرفة.',
      },
      {
        id: 'en7-q2',
        question: 'If you owe money to a bank, you have a ________.',
        options: ['prize', 'debt', 'hobby', 'reward'],
        correctIndex: 1,
        explanation: 'Debt تعني دَيْن مالي.',
      },
    ],
  },
  {
    id: 'en-8',
    subjectId: 'english',
    unitId: 'en-u3',
    title: 'Present Perfect vs. Past Simple',
    branch: 'قواعد',
    durationMinutes: 15,
    summary: 'المضارع التام (has/have + P.P) واستخداماته مع since, for, already, yet, just.',
    passageTitle: 'Connecting Past and Present',
    passageLines: [
      'Use Present Perfect for experiences or past actions with a present result.',
      'Use Past Simple when a specific past time (yesterday, last year, in 2019) is mentioned.',
    ],
    keyTakeaways: [
      'have been to = ذهب وعاد · have gone to = ذهب ولم يعد بعد.',
    ],
    vocabulary: [
      { word: 'Since', meaning: 'منذ (تسبق نقطة بداية الزمن)' },
      { word: 'For', meaning: 'لمدة (تسبق المدة الزمنية الكاملة)' },
    ],
    rules: [
      {
        title: 'Since + Past Simple',
        detail: 'إذا جاءت since كرابط بين جملتين: قبلها مضارع تام وبعدها ماضي بسيط.',
        example: 'I have lived here since I was born.',
      },
    ],
    pointsReward: 20,
    questions: [
      {
        id: 'en8-q1',
        question: 'My sister ________ to Cairo; she will come back next Friday.',
        options: ['has been', 'has gone', 'went', 'goes'],
        correctIndex: 1,
        explanation: 'ما زالت في القاهرة ولم تعد بعد فنستخدم has gone.',
      },
      {
        id: 'en8-q2',
        question: 'I haven’t met Omar ________ five years.',
        options: ['since', 'for', 'ago', 'already'],
        correctIndex: 1,
        explanation: 'five years مدة زمنية كاملة تسبقها for.',
      },
    ],
  },
  {
    id: 'en-9',
    subjectId: 'english',
    unitId: 'en-u3',
    title: 'Short Essay Writing',
    branch: 'قراءة',
    durationMinutes: 13,
    summary: 'تنظيم المقال القصير من مقدمة وفقرات جسم وخاتمة مؤثرة.',
    passageTitle: 'Essay Structure',
    passageLines: [
      'Introduction: Hook + Background + Thesis statement.',
      'Body Paragraphs: Clear arguments supported by real examples.',
      'Conclusion: Restate the main idea in fresh words.',
    ],
    keyTakeaways: [
      'استخدم علامات الترقيم بدقة وتجنب الأخطاء الإملائية.',
    ],
    vocabulary: [
      { word: 'Thesis Statement', meaning: 'جملة الأطروحة التي تحدد فكرة المقال كله' },
    ],
    rules: [
      {
        title: 'Transition Words',
        detail: 'Moreover, Furthermore (للإضافة) · However, On the other hand (للتناقض).',
        example: 'However, hard work always leads to success.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'en9-q1',
        question: 'Which transition word shows contrast (التناقض)?',
        options: ['Moreover', 'However', 'In addition', 'Firstly'],
        correctIndex: 1,
        explanation: 'However (مع ذلك / ولكن) تفيد الاستدراك والتناقض.',
      },
      {
        id: 'en9-q2',
        question: 'Where does the thesis statement appear in an essay?',
        options: ['In the introduction', 'In the title only', 'After the signature', 'Nowhere'],
        correctIndex: 0,
        explanation: 'تظهر جملة الأطروحة في نهاية المقدمة.',
      },
    ],
  },

  // ================= HISTORY (9 lessons) =================
  {
    id: 'hi-1',
    subjectId: 'history',
    unitId: 'hi-u1',
    title: 'مفهوم الحضارة والتاريخ',
    branch: 'تاريخ قديم',
    durationMinutes: 13,
    summary: 'مفهوم الحضارة عند ول ديورانت، أهمية دراسة التاريخ، وتقسيم العصور التاريخية الأربعة.',
    passageTitle: 'العصور التاريخية وتطور الحضارة',
    passageLines: [
      'الحضارة هي ثمرة أي مجهود يقوم به الإنسان لتحسين ظروف حياته مادياً ومعنوياً.',
      'العصور التاريخية: القديمة (حتى سقوط روما 476م)، الوسطى (حتى فتح القسطنطينية 1453م)، الحديثة، والتاريخ المعاصر.',
    ],
    keyTakeaways: [
      'الحضارات تتواصل ولا تتصارع؛ فأخذت أوروبا عن الحضارة الإسلامية والعربية.',
    ],
    vocabulary: [
      { word: 'الحضارة', meaning: 'نتاج تفاعل الإنسان مع البيئة لتعمير الكون' },
    ],
    rules: [
      {
        title: 'ملامح العصور الوسطى',
        detail: 'ازدهرت فيها الحضارة العربية الإسلامية من الصين شرقاً إلى الأندلس غرباً.',
        example: 'فتح القسطنطينية 1453م ينهي العصور الوسطى.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi1-q1',
        question: 'ما الحدث الذي يحدد نهاية العصور الوسطى وبداية العصور الحديثة؟',
        options: ['اكتشاف النار', 'فتح القسطنطينية عام 1453م', 'توحيد القطرين', 'بناء الأهرامات'],
        correctIndex: 1,
        explanation: 'فتح السلطان محمد الفاتح للقسطنطينية 1453م علامة فاصلة في التاريخ.',
      },
      {
        id: 'hi1-q2',
        question: 'ما الهدف الأسمى لدراسة التاريخ؟',
        options: ['استخلاص العبر وتنمية الشعور بالمسؤولية', 'الحفظ دون فهم', 'التعصب ضد الآخرين', 'تجاهل الحاضر'],
        correctIndex: 0,
        explanation: 'دراسة التاريخ تعلمنا القدوة وتنمي الانتماء وتبعدنا عن التعصب.',
      },
    ],
  },
  {
    id: 'hi-2',
    subjectId: 'history',
    unitId: 'hi-u1',
    title: 'مصادر دراسة الحضارات',
    branch: 'تاريخ قديم',
    durationMinutes: 14,
    summary: 'المصادر الأولية (الآثار، النقوش، البرديات، الأوستراكا، النقود) والمصادر الثانوية.',
    passageTitle: 'كيف نوثق التاريخ؟',
    passageLines: [
      'المصادر الأولية هي التي عاصرت وقوع الحدث مثل حجر باليرمو وبردية إيبرس الطبية.',
      'الأوستراكا هي كسرات الفخار المكتوب عليها، ولجأت إليها الطبقة المتوسطة والفقيرة لرخصها.',
    ],
    keyTakeaways: [
      'لم تعرف مصر الفرعونية سك العملة المعدنية؛ لذا تُدرس النقود في العصور اليونانية وما بعدها.',
    ],
    vocabulary: [
      { word: 'الأوستراكا', meaning: 'شقفات الفخار والأحجار المستخدمة في الكتابة اليومية' },
    ],
    rules: [
      {
        title: 'قيمة بردية إيبرس',
        detail: 'أقدم مخطوطة علمية في الطب، تكشف تقدم المصريين في التشريح والعلاج.',
        example: 'صلاية نعرمر من أهم النقوش الغائرة لتوحيد القطرين.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi2-q1',
        question: 'لماذا استخدم المصريون القدماء الأوستراكا في المراسلات اليومية والتدريب؟',
        options: ['لسهولة الحصول عليها ورخص ثمنها مقارنة بالبردي', 'لثقل وزنها', 'لأنها مصنوعة من الذهب', 'لأنها تستورد من الخارج'],
        correctIndex: 0,
        explanation: 'كانت أوراق البردي غالية الثمن فاستخدم العامة الأوستراكا لرخصها.',
      },
      {
        id: 'hi2-q2',
        question: 'أي من الآتي يُعد مصدراً ثانوياً (مرجعاً)؟',
        options: ['تمثال فرعوني', 'كتاب مؤرخ حديث عن الحضارة المصرية', 'بردية طبية قديمة', 'نقش على معبد الكرنك'],
        correctIndex: 1,
        explanation: 'الكتب المؤلفة بعد الحدث بقرون تُعد مصادر ثانوية.',
      },
    ],
  },
  {
    id: 'hi-3',
    subjectId: 'history',
    unitId: 'hi-u1',
    title: 'عوامل قيام الحضارة المصرية',
    branch: 'تاريخ قديم',
    durationMinutes: 13,
    summary: 'العوامل الطبيعية (نهر النيل، الموقع، الثروات، الحدود الآمنة) وكفاح الإنسان المصري.',
    passageTitle: 'مصر هبة النيل والمصريين',
    passageLines: [
      'علّم نهر النيل المصريين الوحدة والتضامن لبناء الجسور وتنظيم الفيضان، والتكافل بين الأقاليم.',
      'وجود الجنادل في الجنوب والصحاري شرقاً وغرباً وفر لمصر حدوداً طبيعية آمنة.',
    ],
    keyTakeaways: [
      'بدون جهد الإنسان المصري وكفاحه ما كانت الطبيعة لتصنع حضارة وحدها.',
    ],
    vocabulary: [
      { word: 'الجنادل', meaning: 'صخور ضخمة تعترض مجرى النيل جنوب مصر' },
    ],
    rules: [
      {
        title: 'أثر المناخ المعتدل',
        detail: 'أسهم الجفاف النسبي في بقاء الآثار المصرية آلاف السنين دون تلف.',
        example: 'اختلاف المحاصيل بين الشمال والجنوب شجع التجارة الداخلية.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi3-q1',
        question: 'ما القيمة الاجتماعية التي اكتسبها المصريون من مواجهة فيضان النيل؟',
        options: ['التنافس والانقسام', 'الوحدة والتضامن والتعاون', 'العزلة', 'ترك الزراعة'],
        correctIndex: 1,
        explanation: 'احتاج شق الترع وبناء السدود إلى عمل جماعي موحد.',
      },
      {
        id: 'hi3-q2',
        question: 'ما الذي ساعد على حفظ الآثار المصرية عبر آلاف السنين؟',
        options: ['جفاف المناخ المصري', 'الأمطار الاستوائية الغزيرة', 'كثرة الزلازل', 'الرياح القطبية'],
        correctIndex: 0,
        explanation: 'مناخ مصر الجاف ساهم في حماية النقوش والبرديات والآثار.',
      },
    ],
  },
  {
    id: 'hi-4',
    subjectId: 'history',
    unitId: 'hi-u2',
    title: 'الدولة القديمة وعصر بناة الأهرام',
    branch: 'تاريخ قديم',
    durationMinutes: 14,
    summary: 'ملامح عصر الدولة القديمة من الاستقرار وبناء الأهرامات وحتى أول ثورة اجتماعية في التاريخ.',
    passageTitle: 'عصر البناء والنهضة المعمارية',
    passageLines: [
      'تميزت الدولة القديمة بحكومة منظمة وموارد وفيرة سمحت ببناء الأهرامات الضخمة.',
      'في أواخر عهد بيبي الثاني اندلعت أول ثورة اجتماعية في التاريخ مطالبة بالعدالة والمساواة.',
    ],
    keyTakeaways: [
      'انتهى عصر الدولة القديمة بالثورة الاجتماعية التي غيرت نظرة المجتمع إلى سلطة الملك.',
    ],
    vocabulary: [
      { word: 'بناة الأهرام', meaning: 'لقب أطلق على ملوك الدولة القديمة لروعة منشآتهم' },
    ],
    rules: [
      {
        title: 'نتائج الثورة الاجتماعية',
        detail: 'تحول نظام الحكم من ملكية مطلقة إلى ملكية مقيدة تلتزم بالعدالة ورعاية الشعب.',
        example: 'ارتفعت قيمة الفرد وكرامته في المجتمع المصري.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi4-q1',
        question: 'ما النتيجة السياسية الأبرز لأول ثورة اجتماعية في مصر القديمة؟',
        options: [
          'تحول الحكم إلى ملكية مقيدة تراعي حقوق الشعب',
          'إلغاء القوانين تماماً',
          'احتلال مصر فوراً',
          'زيادة الضرائب',
        ],
        correctIndex: 0,
        explanation: 'ترسخ مبدأ سيادة القانون ومسؤولية الحاكم أمام شعبه.',
      },
      {
        id: 'hi4-q2',
        question: 'بماذا اشتهر عصر الدولة القديمة؟',
        options: ['عصر بناة الأهرام', 'عصر المجد الحربي', 'عصر الاضمحلال', 'العصر اليوناني'],
        correctIndex: 0,
        explanation: 'شُيدت فيه أهرامات سقارة والجيزة العظيمة.',
      },
    ],
  },
  {
    id: 'hi-5',
    subjectId: 'history',
    unitId: 'hi-u2',
    title: 'الدولة الوسطى والرخاء الاقتصادي',
    branch: 'تاريخ قديم',
    durationMinutes: 14,
    summary: 'إنجازات منتوحتب الثاني وأمنمحات الثالث وسد اللاهون وحفر قناة سيزوستريس، وطرد الهكسوس.',
    passageTitle: 'عصر الرخاء والمشروعات',
    passageLines: [
      'أعاد الملك منتوحتب الثاني توحيد البلاد بعد عصر الانتقال الأول.',
      'أنشأ سنوسرت الثالث قناة سيزوستريس لربط البحر الأحمر بنهر النيل، وأقام أمنمحات الثالث سد اللاهون.',
    ],
    keyTakeaways: [
      'انتهى عصر الانتقال الثاني بانتصار أحمس الأول وطرد الهكسوس من مصر.',
    ],
    vocabulary: [
      { word: 'قناة سيزوستريس', meaning: 'أول قناة مائية تربط البحر الأحمر بالمتوسط عبر النيل' },
    ],
    rules: [
      {
        title: 'الاستثمار الزراعي',
        detail: 'مشاريع الري في الفيوم زادت الرقعة الزراعية وحمت مصر من أخطار الفيضان.',
        example: 'الملكة إياح حتب شجعت أبناءها كامس وأحمس على تحرير الوطن.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi5-q1',
        question: 'من الملك الذي أعاد توحيد البلاد في بداية عصر الدولة الوسطى؟',
        options: ['أحمس', 'منتوحتب الثاني', 'رمسيس الثاني', 'زوسر'],
        correctIndex: 1,
        explanation: 'وحد منتوحتب الثاني مصر وجعل طيبة عاصمة موحدة.',
      },
      {
        id: 'hi5-q2',
        question: 'ما الهدف من إنشاء قناة سيزوستريس في عهد سنوسرت الثالث؟',
        options: ['تنشيط التجارة بين مصر وجيرانها عبر البحر الأحمر والنيل', 'إغراق الدلتا', 'منع الصيد', 'بناء الأهرامات'],
        correctIndex: 0,
        explanation: 'سهلت القناة حركة السفن التجارية نحو بلاد بونت وجزر البحر المتوسط.',
      },
    ],
  },
  {
    id: 'hi-6',
    subjectId: 'history',
    unitId: 'hi-u2',
    title: 'الدولة الحديثة والمجد الحربي',
    branch: 'تاريخ قديم',
    durationMinutes: 15,
    summary: 'تكوين أول جيش نظامي وبناء الإمبراطورية: حتشبسوت، تحتمس الثالث، أخناتون، رمسيس الثاني.',
    passageTitle: 'عصر المجد الحربي',
    passageLines: [
      'قاد تحتمس الثالث معركة مجدو بعبقرية عسكرية، بينما أرسلت حتشبسوت بعثات تجارية لبلاد بونت.',
      'وقع رمسيس الثاني أول معاهدة سلام دولية مكتوبة في التاريخ مع ملك الحيثيين.',
    ],
    keyTakeaways: [
      'اهتم ملوك الدولة الحديثة بتأمين حدود مصر وتكوين تحالفات تجارية وسياسية متوازنة.',
    ],
    vocabulary: [
      { word: 'معركة مجدو', meaning: 'انتصار حاسم لتحتمس الثالث ثبت نفوذ مصر في آسيا' },
    ],
    rules: [
      {
        title: 'الدعوة للتوحيد',
        detail: 'دعا الملك أمنحتب الرابع (أخناتون) إلى عبادة إله واحد (آتون) ونقل العاصمة إلى أخيتاتون.',
        example: 'أصدر الملك حورمحب قوانين لتحقيق العدالة وإعادة الاستقرار.',
      },
    ],
    pointsReward: 20,
    questions: [
      {
        id: 'hi6-q1',
        question: 'أي ملك مصري وقع أول معاهدة سلام مكتوبة في التاريخ؟',
        options: ['مينا', 'رمسيس الثاني', 'تحتمس الأول', 'خفرع'],
        correctIndex: 1,
        explanation: 'وقع رمسيس الثاني معاهدة السلام مع الحيثيين بعد معركة قادش.',
      },
      {
        id: 'hi6-q2',
        question: 'بماذا اشتهرت الملكة حتشبسوت في سياستها الخارجية؟',
        options: ['الرحلات التجارية السلمية إلى بلاد بونت', 'الهجرة للغرب', 'إهمال المعابد', 'إغلاق الحدود'],
        correctIndex: 0,
        explanation: 'أرسلت بعثتها الشهيرة لبلاد بونت لجلب البخور والأخشاب النادرة.',
      },
    ],
  },
  {
    id: 'hi-7',
    subjectId: 'history',
    unitId: 'hi-u3',
    title: 'الحياة السياسية والإدارية',
    branch: 'تاريخ قديم',
    durationMinutes: 13,
    summary: 'عناصر الحكم في مصر الفرعونية: الملك، الوزير، الإدارة المركزية، حكام الأقاليم، والقضاء والجيش.',
    passageTitle: 'تنظيم الدولة المصرية',
    passageLines: [
      'استعان الفرعون بالوزير لإدارة شؤون الحكومة ورئاسة القضاء والإدارة المركزية.',
      'قسمت مصر إلى 42 إقليماً، وعُين لكل إقليم حاكم يتابع الزراعة وجمع الضرائب وحفظ الأمن.',
    ],
    keyTakeaways: [
      'أدرك المصريون منذ القدم أن العدل أساس الملك وحفظ الاستقرار.',
    ],
    vocabulary: [
      { word: 'الإدارة المركزية', meaning: 'مجلس العشرة الكبار وكبار الموظفين برئاسة الوزير' },
    ],
    rules: [
      {
        title: 'وصايا الملك للوزير',
        detail: 'كان يُوصى الوزير عند تعيينه بالمساواة بين القريب والبعيد وألا يغضب على أحد بغير حق.',
        example: 'الجيش المصري لم يكن معتدياً بل مدافعاً عن حدود الوطن.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi7-q1',
        question: 'من كان يترأس الإدارة المركزية والقضاء بتفويض من الفرعون؟',
        options: ['الوزير', 'قائد الأسطول', 'الكاتب الصغير', 'كبير الأطباء'],
        correctIndex: 0,
        explanation: 'الوزير هو المسؤول الأول عن الجهاز الإداري للدولة بعد الملك.',
      },
      {
        id: 'hi7-q2',
        question: 'كم بلغ عدد الأقاليم الإدارية في مصر القديمة؟',
        options: ['12 إقليماً', '20 إقليماً', '42 إقليماً', '60 إقليماً'],
        correctIndex: 2,
        explanation: 'قُسمت مصر إدارياً إلى 42 إقليماً.',
      },
    ],
  },
  {
    id: 'hi-8',
    subjectId: 'history',
    unitId: 'hi-u3',
    title: 'الحياة الاقتصادية والاجتماعية',
    branch: 'تاريخ قديم',
    durationMinutes: 14,
    summary: 'الزراعة والصناعة والتجارة الداخلية والخارجية، وطبقات المجتمع المصري ومكانة المرأة.',
    passageTitle: 'المجتمع والعمل في مصر القديمة',
    passageLines: [
      'ارتبطت الزراعة بثلاثة فصول: الفيضان، البذر، والحصاد، واشتهر المصريون بصناعة البردي والزجاج والنسيج.',
      'نالت المرأة المصرية مكانة رفيعة في الأسرة والمجتمع، فكانت ملكة وأماً وصاحبة حق في التملك والتجارة.',
    ],
    keyTakeaways: [
      'المقايضة كانت أساس التبادل التجاري مع الأمانة والثقة المتبادلة.',
    ],
    vocabulary: [
      { word: 'المقايضة', meaning: 'مبادلة سلعة بسلعة أخرى قبل اختراع النقود' },
    ],
    rules: [
      {
        title: 'دور الأسرة في التربية',
        detail: 'اهتم الوالدان بتعليم الأبناء القيم والأخلاق الحميدة وإتقان المهن.',
        example: 'تعددت الصناعات القائمة على نبات البردي كالورق والقوارب والحبال.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi8-q1',
        question: 'ما الصناعة التي انفردت بها مصر القديمة وكانت أساس التدوين في العالم القديم؟',
        options: ['صناعة الورق من نبات البردي', 'صناعة السفن البخارية', 'صناعة البلاستيك', 'طباعة الكتب الرقمية'],
        correctIndex: 0,
        explanation: 'صنع المصريون ورق البردي وصدرّوه إلى بلدان البحر المتوسط.',
      },
      {
        id: 'hi8-q2',
        question: 'كيف كانت تتم المعاملات التجارية في مصر الفرعونية؟',
        options: ['بنظام المقايضة', 'بالبطاقات البنكية', 'بالعملات الورقية', 'دون تبادل'],
        correctIndex: 0,
        explanation: 'اعتمد المصريون القدماء على المقايضة في الأسواق.',
      },
    ],
  },
  {
    id: 'hi-9',
    subjectId: 'history',
    unitId: 'hi-u3',
    title: 'الحياة الدينية والثقافية',
    branch: 'تاريخ قديم',
    durationMinutes: 14,
    summary: 'خصائص الديانة المصرية (البعث والخلود والحساب)، تطور الكتابة (الهيروغليفية والديموطيقية)، والعلوم والفنون.',
    passageTitle: 'الفكر والإبداع المصري',
    passageLines: [
      'آمن المصريون بالبعث والخلود والحساب بعد الموت، مما دفعهم لتحنيط الجثث وبناء المقابر الحصينة وفعل الخيرات.',
      'ابتكروا الكتابة الهيروغليفية (الخط المقدس) ثم الهيراطيقية والديموطيقية (الخط الشعبي) والقبطية.',
    ],
    keyTakeaways: [
      'برع المصريون في الطب والهندسة والفلك (التقويم الشمسي وتعامد الشمس على وجه رمسيس الثاني).',
    ],
    vocabulary: [
      { word: 'الديموطيقية', meaning: 'الخط الشعبي الذي استُخدم في المعاملات اليومية' },
    ],
    rules: [
      {
        title: 'الحساب بعد الموت (محكمة الموتى)',
        detail: 'يُوزن قلب المتوفى أمام ريشة الإلهة ماعت (رمز الحق والعدل)، مما عزز الالتزام الأخلاقي.',
        example: 'تألف التقويم الشمسي المصري من 365 يوماً.',
      },
    ],
    pointsReward: 15,
    questions: [
      {
        id: 'hi9-q1',
        question: 'ما العقيدة الدينية التي دفعت المصريين القدماء إلى الاهتمام بالتحنيط؟',
        options: ['الإيمان بالبعث والخلود', 'حب الترحال', 'الخوف من الفيضان', 'تغيير العاصمة'],
        correctIndex: 0,
        explanation: 'اعتقدوا بعودة الروح للجسد في الحياة الأخرى فحافظوا عليه بالتحنيط.',
      },
      {
        id: 'hi9-q2',
        question: 'ما نوع الكتابة المصرية القديمة التي عُرفت بالخط الشعبي؟',
        options: ['الهيروغليفية', 'الديموطيقية', 'المسمارية', 'الفينيقية'],
        correctIndex: 1,
        explanation: 'الديموطيقية كانت الكتابة الشعبية اليومية لدى المصريين.',
      },
    ],
  },
];
