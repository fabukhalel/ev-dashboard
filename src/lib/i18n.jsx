import React, { createContext, useContext } from 'react';
// القاموس: لإضافة نص جديد ضع المفتاح في ar و en معاً، واستعمله بـ t('المفتاح', { متغير: قيمة })
const D = {
  ar: {
    // عام
    close: 'إغلاق', confirm: 'تأكيد', cancel: 'إلغاء', cancel_back: 'تراجع', done: 'تم', save: 'حفظ',
    edit: 'تعديل', delete: 'حذف', all: 'الكل', km: 'كم',
    type_home_ac: 'منزلي AC', type_fast_dc: 'سريع DC', type_home_s: 'منزلي', type_fast_s: 'سريع',
    // التنقل
    tab_home: 'الرئيسية', tab_list: 'الشحنات', tab_settings: 'الإعدادات',
    nav_aria: 'التنقل الرئيسي',



    // الصفحة الرئيسية
    demo_banner: 'أمثلة تجريبية، وليست بياناتك. أول شحنة تضيفها تستبدلها.',
    start_fresh: 'ابدأ بسجل فارغ',
    welcome_title: 'مرحباً بك في لوحتك الذكية',
    welcome_hint: 'سجّل شحنتك الأولى أو حمّل بيانات تجريبية لمعاينة التطبيق.',
    demo_btn: 'بيانات تجريبية', add_charge: 'إضافة شحنة',
    customize: 'تخصيص', recent_title: 'آخر الشحنات',
    // KPIs
    kpi_energy: 'إجمالي الطاقة', kpi_cost: 'إجمالي التكلفة',
    charges_n: '{n} شحنة', charges_n_one: '{n} شحنة',

    // مقارنة النوع

    // الرسم
    m_cost: 'التكلفة', m_energy: 'الطاقة',
    ch_empty: 'أضف شحنات لتظهر المقارنة', ch_aria: 'رسم بياني لمقارنة الأشهر',
    // القوائم
    list_empty_title: 'لا توجد شحنات', list_empty_hint: 'سجّل أول شحنة لتبدأ المتابعة والتحليل.',

    // التقويم
    prev_month: 'الشهر السابق', next_month: 'الشهر التالي', cal_aria: 'تقويم الشحن',

    legend_home: 'شحن منزلي', legend_fast: 'شحن سريع', 
    day_aria: '{d} {m}', day_aria_n: '{d} {m}، {n} شحنة',
    // الرحلات

eg: 'مثال: {v}',
    // نموذج الشحنة
    form_edit: 'تعديل الشحنة', date: 'التاريخ',

    energy_auto: 'الطاقة المكتسبة (تلقائي من SoC × {cap} kWh)',



    by_price: 'بسعر الكيلوواط', by_total: 'بالمبلغ الكلي',


    note: 'ملاحظات', note_ph: 'اسم المحطة، مثلاً', save_charge: 'حفظ الشحنة', confirm_delete: 'تأكيد الحذف',
    err_date: 'اختر تاريخاً صحيحاً', err_soc_missing: 'أدخل نسبة الشحن قبل وبعد',
    err_soc_range: 'النسبة يجب أن تكون بين 0 و 100', err_soc_order: 'نسبة الشحن بعد يجب أن تكون أكبر من قبل',
    err_energy: 'تعذر احتساب الطاقة', err_energy_cap: 'الطاقة تتجاوز سعة البطارية ({cap} kWh)',
    err_cost: 'أدخل التكلفة', err_odo: 'قراءة العداد غير صحيحة',
    // الإعدادات
    s_lang: 'اللغة', lang_ar: 'العربية', lang_en: 'English',
    s_theme: 'المظهر', theme_system: 'تلقائي', theme_dark: 'داكن', theme_light: 'نهاري',

    car_name: 'الاسم / الماركة', car_model: 'الموديل',
    capacity_label: 'سعة البطارية الإجمالية (kWh)',
    capacity_hint: 'تُحسب منها الطاقة من نسبة الشحن، وهي الحد الأعلى للطاقة في الشحنة الواحدة. الشحنات القديمة تحتفظ بالسعة وقت تسجيلها.',





    currency_label: 'رمز العملة',
    fast_price: 'سعر kWh السريع',
    reset_defaults: 'استعادة الإعدادات الافتراضية',


    customize_home: 'تخصيص الصفحة الرئيسية',

    export_csv: 'تصدير السجلات CSV', backup: 'نسخة احتياطية', restore: 'استعادة نسخة',
    load_demo: 'تحميل بيانات تجريبية للمعاينة', clear_all: 'حذف كل الشحنات',
    dev_by: 'Developed by Eng. Fadi Abu Khalel',
    // التخصيص
    cust_title: 'تخصيص الصفحة الرئيسية', cust_hint: 'رتّب الأقسام بالأسهم وأخفِ ما لا تحتاجه.',

    show: 'إظهار', hide: 'إخفاء', cust_reset: 'استعادة الترتيب الافتراضي',

    // رسائل
    t_saved: 'تم حفظ الشحنة ✓', t_deleted: 'تم حذف الشحنة', t_csv: 'تم تصدير ملف CSV', t_csv_fail: 'تعذر تصدير الملف',
    t_backup: 'تم حفظ النسخة الاحتياطية', t_backup_fail: 'تعذر حفظ النسخة', t_restored: 'تمت استعادة {n} شحنة',
    t_bad_file: 'الملف تالف', t_bad_backup: 'الملف ليس نسخة احتياطية صالحة لهذا التطبيق',
    discard_q: 'تجاهل التعديلات؟', discard: 'تجاهل', keep_editing: 'متابعة',
    back_again: 'اضغط رجوع مرة أخرى للخروج',
    save_failed: 'تعذر حفظ آخر تعديل على الجهاز. خذ نسخة احتياطية الآن.', save_failed_btn: 'تصدير نسخة الآن',
    ab_title: 'النسخ التلقائية', 
    ab_hint: 'تُحفظ نسخة كل أسبوع على الهاتف (آخر 5). شاركها إلى Drive لتكون خارج الهاتف.',
    ab_share: 'مشاركة', ab_restore: 'استعادة', ab_now: 'خذ نسخة تلقائية الآن', ab_nothing: 'لا توجد شحنات لنسخها',
    t_demo: 'تم تحميل بيانات تجريبية', t_cleared: 'تم حذف كل الشحنات', t_fresh: 'بدأت بسجل فارغ',
    t_reset: 'تمت استعادة الإعدادات الافتراضية',
    confirm_replace: 'سيتم استبدال بياناتك الحالية بـ {n} شحنة من النسخة. متابعة؟', replace: 'استبدال',
    confirm_demo: 'سيتم استبدال شحناتك الحالية ببيانات تجريبية. متابعة؟',
    confirm_clear: 'حذف كل الشحنات نهائياً؟ لا يمكن التراجع.', delete_all: 'حذف الكل',
    confirm_del_one: 'حذف هذه الشحنة نهائياً؟',
    // CSV
    csv_date: 'التاريخ', csv_type: 'نوع الشاحن', csv_before: 'نسبة الشحن قبل %', csv_after: 'نسبة الشحن بعد %',
    csv_energy: 'الطاقة kWh', csv_price: 'سعر الكيلوواط', csv_total: 'التكلفة الإجمالية', csv_odo: 'قراءة العداد km', csv_note: 'ملاحظات',
    // ===== جولة التعديلات 4 =====
    m_eff: 'الكفاءة',
    date_ph: 'يوم/شهر/سنة', pick_date: 'اختيار من التقويم', tab_bill: 'الفاتورة',
    // الفترة
    period_prev: 'الفترة السابقة', period_custom: 'فترة مخصصة', 
    sum_empty: 'لا توجد شحنات ضمن هذه الفترة', 

    period_from: 'من', period_to: 'إلى',

    period_bad: 'حدّد تاريخ بداية ونهاية صحيحين (البداية قبل النهاية أو تساويها)، وإلا تُعرض بيانات الشهر الحالي.',
    // الألوان والخط


    pal_default: 'الافتراضي', pal_blue: 'أزرق', pal_red: 'أحمر', pal_gold: 'ذهبي', pal_mono: 'رمادي',
    font_tajawal: 'Tajawal', font_cairo: 'Cairo', font_almarai: 'Almarai', font_system: 'خط الجهاز',
    font_size_val: 'حجم الخط {v}', font_sample: 'نص تجريبي: شحنة 25.5 kWh — 3.4 د.أ',

    // أداة الفاتورة


    bill_from: 'بداية فترة الفاتورة', bill_to: 'نهاية فترة الفاتورة', bill_total: 'استهلاك المنزل الكلي في الفاتورة (kWh)',
    bill_loss: 'فقد الشاحن % (اختياري)',
    bill_loss_hint: 'الطاقة المسجلة هي ما وصل البطارية، وما سُحب من عداد المنزل أعلى عادةً بنحو 5–15% بسبب فقد الشاحن. اتركه فارغاً لاستخدام الأرقام كما هي.',


    bill_bad_dates: 'تاريخ البداية يجب أن يسبق النهاية أو يساويها', bill_bad_total: 'أدخل استهلاكاً أكبر من صفر',


    bill_capped: 'طاقة شحن السيارة ({ev} kWh) أكبر من استهلاك المنزل المُدخل، فاحتُسب كل الاستهلاك على السيارة. تحقق من الأرقام والتواريخ.',
    bill_with: 'الفاتورة مع السيارة',
    bill_impact: 'أثر السيارة على الفاتورة', bill_share: 'تشكّل السيارة {v}% من قيمة الفاتورة',
    bill_eff: 'متوسط كلفة kWh للسيارة: {v} {c}', bill_break: 'توزيع طاقة السيارة على الشرائح',
    tier_range: '{a} – {b} kWh', tier_above: 'أكثر من {a} kWh', fils: 'فلس',
    tariff_title: 'التعرفة', plan_sub: 'مدعومة', plan_unsub: 'غير مدعومة', plan_custom: 'مخصصة',
    tariff_src: 'الأسعار الافتراضية هي تعرفة القطاع المنزلي المنشورة من هيئة تنظيم قطاع الطاقة والمعادن والسارية من 1/1/2025. التعرفة تتغير بقرار رسمي، فتأكد من فاتورتك.',
    tier_limit: 'حتى (kWh/شهر)', tier_rate: 'السعر (فلس/kWh)', tier_last: 'ما فوق ذلك',
    tariff_extra: 'رسوم إضافية (فلس/kWh)',
    tariff_extra_hint: 'اختياري: مثل بند فرق أسعار الوقود الظاهر في فاتورتك. يُضاف على طاقة السيارة فقط. اتركه 0 إن لم ترد ذلك.',



    // ===== جولة التعديلات 5 =====
    tab_analysis: 'التحليل',
    hello: 'أهلاً بك',
    hello_name: 'أهلاً، {name}',


    period_kind: 'نوع الفترة',
    kind_month: 'شهر عادي',





    view_all_n: 'عرض الكل ({n})',
    view_list: 'قائمة',
    view_calendar: 'تقويم',






    m_distance: 'المسافة',


    an_table: 'تفاصيل الفترات',


    ch_no_odo: 'سجّل قراءتين على الأقل لعداد السيارة لعرض المسافة والكفاءة',

    odo_title: 'قراءات عداد السيارة',

    odo_add_long: 'تسجيل قراءة عداد السيارة',

    odo_empty: 'لا توجد قراءات مسجّلة يدوياً بعد',
    odo_add_title: 'قراءة عداد السيارة',
    odo_add_hint: 'سجّل قراءة العداد في بداية الفترة وأخرى في نهايتها (أو أي تاريخ بينهما) ليحسب التطبيق المسافة وكفاءة الاستهلاك.',
    odo_km_label: 'قراءة العداد (كم)',
    odo_last: 'آخر قراءة {v}',
    odo_err_order: 'القراءة تتعارض مع ترتيب القراءات الأخرى (العداد لا ينقص مع الزمن)',
    t_odo_saved: 'تم حفظ القراءة ✓',
    t_odo_deleted: 'تم حذف القراءة',
    confirm_del_odo: 'حذف هذه القراءة؟',
    bill_add: 'إضافة فاتورة',
    bill_edit: 'تعديل الفاتورة',
    bill_save: 'حفظ الفاتورة',
    bill_form_hint: 'أدخل الفترة التي تغطيها الفاتورة واستهلاك المنزل الكلي المكتوب عليها. المبلغ اختياري ويُستخدم للمقارنة مع الحساب التقديري.',

    bill_bad_amount: 'المبلغ غير صحيح',



    bill_diff: 'الحساب التقديري ({est} {c}) يختلف عن مبلغ فاتورتك ({real} {c}). قد تكون التعرفة أو الرسوم تغيّرت، فعدّلها من قسم التعرفة.',
    confirm_del_bill: 'حذف هذه الفاتورة؟',
    t_bill_saved: 'تم حفظ الفاتورة ✓',
    t_bill_deleted: 'تم حذف الفاتورة',

    user_name: 'اسمك',
    user_name_ph: 'مثال: فادي',

    export_pdf: 'تصدير تقرير PDF',
    t_pdf: 'تم إنشاء تقرير PDF',
    t_pdf_fail: 'تعذر إنشاء ملف PDF',
    pal_indigo: 'نيلي',
    rep_title: 'تقرير الشحن',

    rep_charges: 'سجل الشحنات',
    rep_bill: 'أثر السيارة على الفاتورة',
    rep_page: 'صفحة {p} من {n}',
    rep_none: 'لا توجد شحنات في هذه الفترة',
    rep_type: 'النوع',
    rep_soc: 'البطارية %',
    rep_time: 'الوقت',
    rep_generated: 'أُنشئ بتاريخ {d}',
    kpi_count: 'عدد الشحنات',
    kpi_distance: 'المسافة',
    kpi_eff: 'الكفاءة',
    kpi_costkm: 'كلفة الكيلومتر',
    rep_odo_note: '≈ تقديري من قراءات عداد السيارة',
    // ===== التصميم الجديد 6أ =====
    kind_cycle: 'دورة الفاتورة', kind_custom: 'مخصص', apply: 'تطبيق', period_next: 'الفترة التالية',
    preset_last7: 'آخر 7 أيام', preset_last30: 'آخر 30 يوماً', preset_all: 'كل السجل',
    cycle_start: 'بداية الدورة', cycle_title: 'دورة {a} – {b}', current: 'الحالية',
    day_n_of_m: 'اليوم {n} من {m}', days: 'يوم', back: 'رجوع', avg: 'المتوسط',
    today: 'اليوم', yesterday: 'أمس', details: 'التفاصيل', undo: 'تراجع', t_restored_one: 'أُعيدت الشحنة',
    tier: 'الشريحة', tier_auto: 'تلقائي حسب اليوم', tier_manual: 'اخترتها يدوياً',
    tier_low: 'منخفضة', tier_mid: 'متوسطة', tier_high: 'مرتفعة',
    tier_low_s: 'منخفضة', tier_mid_s: 'متوسطة', tier_high_s: 'مرتفعة',
    tier_low_full: 'الشريحة المنخفضة', tier_mid_full: 'الشريحة المتوسطة', tier_high_full: 'الشريحة المرتفعة',
    tier_under: 'حتى {a} kWh', tier_over: 'فوق {a} kWh', tier_between: '{a} – {b} kWh',
    // تفاصيل الشحنة والنموذج
    detail_fast: 'شحنة سريعة', detail_home: 'شحنة منزلية',
    detail_nth_month: 'الشحنة رقم {n} في الشهر', detail_nth_cycle: 'الشحنة رقم {n} في الدورة',
    energy_from_charger: 'الطاقة مأخوذة من شاشة الشاحن', price_kwh: 'سعر الكيلوواط', station: 'المحطة',
    form_new: 'شحنة جديدة', battery: 'البطارية', soc_before_s: 'قبل', soc_after_s: 'بعد',
    warn_soc_prev: 'آخر شحنة انتهت عند {a}%، والنسبة «قبل» أعلى منها. تأكد من الرقم.',
    energy_charger: 'الطاقة من شاشة الشاحن', energy: 'الطاقة', energy_soc_est: 'تقدير من نسبة البطارية: {v} kWh',
    price_recorded: 'السعر المسجّل سابقاً: {v}', price: 'السعر للكيلوواط', station_note: 'المحطة',
    note_opt: 'ملاحظة (اختياري)', station_ph: 'اسم المحطة',
    swipe_hint: 'اسحب الشحنة جانباً لحذفها', drag: 'اسحب لتغيير الترتيب', recent_count: 'عدد الشحنات',
    // الرئيسية
    hero_energy: 'طاقة الفترة',
    vs_prev_cycle: 'عن الدورة السابقة', vs_prev_month: 'عن الشهر السابق', vs_prev_period: 'عن الفترة السابقة',
   
    last_today: 'آخر شحنة اليوم، والبطارية {p}%', last_ago: 'آخر شحنة قبل {d} يوم، والبطارية {p}%', last_ago_one: 'آخر شحنة أمس، والبطارية {p}%',
    high_in: 'المرتفعة تبدأ بعد {d} يوم', high_in_one: 'المرتفعة تبدأ غداً', cycle_ends_in: 'الدورة تنتهي بعد {d} يوم', cycle_ends_today: 'الدورة تنتهي اليوم',
    forecast_lead: 'بهذا المعدل تصل إلى نحو ', forecast_tail_cycle: ' مع نهاية الدورة.', forecast_tail_period: ' مع نهاية الفترة.', strip_label: 'شحنات الفترة يوماً بيوم، {n} يوم فيه شحن، ملوّنة حسب الشريحة',
    charges_count: 'عدد الشحنات', avg_per_charge: 'المعدل للشحنة',
    bill_card_title: 'أثر السيارة على فاتورة هذه الدورة', backup_stale: 'آخر نسخة احتياطية قبل {d} يوماً. احفظ نسخة الآن',
    backup_never: 'لم تحفظ أي نسخة احتياطية بعد. احفظ نسخة الآن',
    sec_hero: 'البطاقة الرئيسية', sec_stats: 'التكلفة وعدد الشحنات', sec_bill: 'بطاقة الفاتورة', sec_recent: 'آخر الشحنات',
    // الشحنات والتحليل
    view_kind: 'طريقة العرض', filter_type: 'نوع الشحن', an_metric: 'المقياس', daily_avg: 'المعدل اليومي',
    odo_old_title: 'قراءات قديمة مسجّلة مع الشحنات ({n})', odo_old_hint: 'هذه قراءات من النسخة القديمة كانت تُكتب مع كل شحنة. يمكنك تعديل أي منها أو حذفها كلها. الشحنات نفسها لا تتغيّر.', odo_old_clear: 'حذف كل القراءات القديمة', odo_old_clear_q: 'حذف كل قراءات العداد المسجّلة مع الشحنات القديمة؟ الشحنات نفسها تبقى كما هي.',
    t_too_big: 'الملف كبير جداً (أكثر من 20 ميجا)، وهو ليس نسخة احتياطية من هذا التطبيق',
    sort_label: 'ترتيب الشحنات', sort_newest: 'الأحدث أولاً', sort_oldest: 'الأقدم أولاً',
    odo_today: 'قراءة اليوم', odo_edit_title: 'تعديل قراءة العداد', odo_tap_hint: 'اضغط على أي قراءة لتعديلها أو حذفها.', show_less: 'عرض أقل',
    odo_from_charge_hint: 'هذه القراءة محفوظة مع شحنة قديمة. عند الحفظ تُنقل إلى قائمة القراءات، والشحنة نفسها لا تتغيّر.', odo_hint_new: 'سجّل قراءة العداد مرة في بداية كل شهر أو دورة، ويحسب التطبيق المسافة والاستهلاك لكل فترة.',
    // الفاتورة
    bill_amount_c: 'مبلغ الفاتورة ({c}) اختياري', bill_recorded: 'فاتورة مسجّلة', bill_not_recorded: 'لم تُسجّل فاتورتها',
    bill_ev_kwh: 'طاقة السيارة المنزلية', bill_estimate: 'التقدير', bill_est_vs_real: 'التقدير مقابل الفاتورة الفعلية',
    bill_record: 'سجّل الفاتورة', bill_intro_new: 'كل دورة تبدأ من يوم بداية الدورة في الإعدادات. سجّل فاتورتك عند وصولها لتقارن التقدير بالمبلغ الفعلي.',
    bill_share_chart: 'حصة السيارة من الفاتورة',
    // الإعدادات
    set_car: 'السيارة', set_car_sub: 'الاسم والبطارية والصورة', set_power: 'الكهرباء والأسعار', set_power_sub: 'الشرائح ودورة الفاتورة والشحن السريع',
    set_look: 'المظهر', set_look_sub: 'الألوان والوضع الليلي والخط واللغة', set_data: 'البيانات', set_data_sub: 'النسخ الاحتياطي والتصدير والحذف',
    set_about: 'حول التطبيق', set_about_sub: 'الإصدار والمطوّر والخصوصية',
    tariff_from: 'تُطبّق الأسعار من تاريخ',
    tariff_from_hint: 'الشحنات قبل هذا التاريخ تحتفظ بأسعارها المسجّلة. اتركه فارغاً لتطبيق الأسعار على كل الشحنات.',
    cycle_settings: 'دورة الفاتورة والشرائح', cycle_day: 'يوم بداية الدورة', cycle_day_hint: 'اليوم الذي تبدأ فيه قراءة عدّاد الكهرباء كل شهر (من 1 إلى 28).',
    tier_days_low: 'أيام الشريحة المنخفضة في أول الدورة', tier_days_high: 'أيام الشريحة المرتفعة في آخر الدورة',
    tier_days_hint: 'يختار التطبيق الشريحة حسب يوم الدورة، ويمكنك رفعها يدوياً لأي شحنة. الشريحة لا تنزل بعد رفعها في نفس الدورة.',
    more_prices: 'أسعار الشحن السريع وغيرها',
    recalc_hint: 'عندك {n} شحنة منزلية قديمة بسعر ثابت. يمكن إعادة حسابها بنظام الشرائح الجديد.',
    recalc_btn: 'إعادة حساب الشحنات القديمة', recalc_q: 'ستُعاد تكلفة الشحنات المنزلية القديمة حسب الشريحة. متابعة؟',
    t_recalc: 'أُعيد حساب الشحنات',
    s_palette: 'لون التطبيق', pal_amman: 'ليل عمّان', pal_amman_sub: 'كحلي وكهرماني', pal_lime: 'ليموني', pal_lime_sub: 'أسود وأخضر ليموني', pal_teal: 'تركوازي', pal_teal_sub: 'كحلي وتركوازي',
    s_backup: 'النسخ الاحتياطي', s_export: 'التصدير', s_danger: 'منطقة الحذف',
    backup_status: 'آخر نسخة احتياطية', backup_last: 'بتاريخ {d}', backup_none: 'لا توجد نسخة بعد',
    confirm_clear2: 'سيُحذف {n} شحنة نهائياً ولا يمكن التراجع. هل أنت متأكد؟', delete_all_final: 'احذف الكل نهائياً',
    // حول التطبيق
    app_name: 'لوحة الشحن الذكية', version_build: 'الإصدار {v} · البناء {b}', released_on: 'تاريخ البناء {d}',
    whats_new: 'ما الجديد', whats_new_sub: 'التغييرات في هذا الإصدار',
    whats_new_list: 'حجم الخط يتبع إعداد التطبيق فقط، ولا يتضاعف مع تكبير خط الهاتف|ترتيب الشحنات: الأحدث أولاً أو الأقدم أولاً|قراءات العداد: تعديل وحذف أي قراءة، والقراءات القديمة مع الشحنات مخفية مع زر لحذفها كلها|المتوسط في الرسم البياني مكتوب بوضوح تحت الرسم|إزالة صورة السيارة غير المستخدمة|تحسينات أمان: سياسة أمان المحتوى، حماية ملف CSV، التحقق من رابط التحديث، حد لحجم النسخة الاحتياطية',
    upd_title: 'التحقق من التحديثات', upd_sub: 'اضغط للتحقق من وجود إصدار أحدث', upd_loading: 'جارٍ التحقق…',
    upd_none: 'لا توجد إصدارات منشورة بعد', upd_latest: 'لديك أحدث إصدار', upd_error: 'تعذّر الاتصال. حاول لاحقاً',
    upd_new: 'يتوفر الإصدار {v}. اضغط للتنزيل',
    developer: 'المطوّر', dev_role: 'مهندس ومطوّر التطبيق', contact_me: 'تواصل معي', info: 'معلومات',
    privacy: 'الخصوصية', privacy_sub: 'بياناتك تبقى على هاتفك', libs: 'المكتبات المستخدمة', libs_sub: 'برمجيات مفتوحة المصدر',
    privacy_text: 'كل بياناتك محفوظة على هاتفك فقط، ولا يرسل التطبيق أي شيء إلى خوادم. الاتصال الوحيد بالإنترنت هو عند ضغطك «التحقق من التحديثات»، وهو يسأل GitHub عن رقم آخر إصدار دون إرسال أي بيانات منك.',
    made_in: 'صُنع في الأردن',
  },
  en: {
    close: 'Close', confirm: 'Confirm', cancel: 'Cancel', cancel_back: 'Cancel', done: 'Done', save: 'Save',
    edit: 'Edit', delete: 'Delete', all: 'All', km: 'km',
    type_home_ac: 'Home AC', type_fast_dc: 'Fast DC', type_home_s: 'Home', type_fast_s: 'Fast',
    tab_home: 'Home', tab_list: 'Charges', tab_settings: 'Settings',
    nav_aria: 'Main navigation',



    demo_banner: 'Sample data, not yours. Your first real charge replaces it.',
    start_fresh: 'Start with an empty log',
    welcome_title: 'Welcome to your smart dashboard',
    welcome_hint: 'Log your first charge or load sample data to preview the app.',
    demo_btn: 'Sample data', add_charge: 'Add charge',
    customize: 'Customize', recent_title: 'Recent charges',
    kpi_energy: 'Total energy', kpi_cost: 'Total cost',
    charges_n: '{n} charges', charges_n_one: '{n} charge',

    m_cost: 'Cost', m_energy: 'Energy',
    ch_empty: 'Add charges to see the comparison', ch_aria: 'Monthly comparison chart',
    list_empty_title: 'No charges yet', list_empty_hint: 'Log your first charge to start tracking and analysis.',

    prev_month: 'Previous month', next_month: 'Next month', cal_aria: 'Charging calendar',

    legend_home: 'Home charge', legend_fast: 'Fast charge', 
    day_aria: '{m} {d}', day_aria_n: '{m} {d}, {n} charges',

eg: 'e.g. {v}',
    form_edit: 'Edit charge', date: 'Date',

    energy_auto: 'Energy gained (auto from SoC × {cap} kWh)',



    by_price: 'By price per kWh', by_total: 'By total amount',


    note: 'Notes', note_ph: 'Station name, for example', save_charge: 'Save charge', confirm_delete: 'Confirm delete',
    err_date: 'Pick a valid date', err_soc_missing: 'Enter the charge level before and after',
    err_soc_range: 'Level must be between 0 and 100', err_soc_order: 'The level after must be higher than before',
    err_energy: 'Could not calculate the energy', err_energy_cap: 'Energy exceeds the battery capacity ({cap} kWh)',
    err_cost: 'Enter the cost', err_odo: 'Invalid odometer reading',
    s_lang: 'Language', lang_ar: 'العربية', lang_en: 'English',
    s_theme: 'Theme', theme_system: 'Auto', theme_dark: 'Dark', theme_light: 'Light',

    car_name: 'Name / brand', car_model: 'Model',
    capacity_label: 'Total battery capacity (kWh)',
    capacity_hint: 'Used to turn charge level into energy, and the upper limit for energy in one charge. Older charges keep the capacity they were logged with.',





    currency_label: 'Currency symbol',
    fast_price: 'Fast price / kWh',
    reset_defaults: 'Restore default settings',


    customize_home: 'Customize home page',

    export_csv: 'Export records as CSV', backup: 'Backup', restore: 'Restore backup',
    load_demo: 'Load sample data to preview', clear_all: 'Delete all charges',
    dev_by: 'Developed by Eng. Fadi Abu Khalel',
    cust_title: 'Customize home page', cust_hint: 'Reorder sections with the arrows and hide what you do not need.',

    show: 'Show', hide: 'Hide', cust_reset: 'Restore default layout',

    t_saved: 'Charge saved ✓', t_deleted: 'Charge deleted', t_csv: 'CSV exported', t_csv_fail: 'Could not export the file',
    t_backup: 'Backup saved', t_backup_fail: 'Could not save the backup', t_restored: 'Restored {n} charges',
    t_bad_file: 'The file is corrupted', t_bad_backup: 'This file is not a valid backup for this app',
    discard_q: 'Discard changes?', discard: 'Discard', keep_editing: 'Keep editing',
    back_again: 'Press back again to exit',
    save_failed: 'Your last change could not be saved on this device. Export a backup now.', save_failed_btn: 'Export now',
    ab_title: 'Automatic backups', 
    ab_hint: 'A copy is saved weekly on the phone (last 5). Share one to Drive to keep it off the phone.',
    ab_share: 'Share', ab_restore: 'Restore', ab_now: 'Back up now', ab_nothing: 'No charges to back up',
    t_demo: 'Sample data loaded', t_cleared: 'All charges deleted', t_fresh: 'Started with an empty log',
    t_reset: 'Default settings restored',
    confirm_replace: 'Your current data will be replaced with {n} charges from the backup. Continue?', replace: 'Replace',
    confirm_demo: 'Your current charges will be replaced with sample data. Continue?',
    confirm_clear: 'Delete all charges permanently? This cannot be undone.', delete_all: 'Delete all',
    confirm_del_one: 'Delete this charge permanently?',
    csv_date: 'Date', csv_type: 'Charger type', csv_before: 'Charge before %', csv_after: 'Charge after %',
    csv_energy: 'Energy kWh', csv_price: 'Price per kWh', csv_total: 'Total cost', csv_odo: 'Odometer km', csv_note: 'Notes',
    // ===== round 4 =====
    m_eff: 'Efficiency',
    date_ph: 'dd/mm/yyyy', pick_date: 'Pick from calendar', tab_bill: 'Bill',
    period_prev: 'Previous period', period_custom: 'Custom period', 
    sum_empty: 'No charges in this period', 

    period_from: 'From', period_to: 'To',

    period_bad: 'Enter a valid start and end date (start on or before end); otherwise the current month is shown.',


    pal_default: 'Default', pal_blue: 'Blue', pal_red: 'Red', pal_gold: 'Gold', pal_mono: 'Gray',
    font_tajawal: 'Tajawal', font_cairo: 'Cairo', font_almarai: 'Almarai', font_system: 'Device font',
    font_size_val: 'Font size {v}', font_sample: 'Sample text: charge 25.5 kWh — 3.4 JOD',



    bill_from: 'Bill period start', bill_to: 'Bill period end', bill_total: 'Household total on the bill (kWh)',
    bill_loss: 'Charger loss % (optional)',
    bill_loss_hint: 'Logged energy is what reached the battery; the meter usually sees about 5–15% more because of charger losses. Leave empty to use the numbers as logged.',


    bill_bad_dates: 'Start date must be on or before the end date', bill_bad_total: 'Enter a consumption above zero',


    bill_capped: 'The car charging energy ({ev} kWh) is higher than the household total entered, so all of it was assigned to the car. Check the numbers and dates.',
    bill_with: 'Bill with the car',
    bill_impact: 'Car impact on the bill', bill_share: 'The car makes up {v}% of the bill',
    bill_eff: 'Average cost per kWh for the car: {v} {c}', bill_break: 'Car energy across the tiers',
    tier_range: '{a} – {b} kWh', tier_above: 'Above {a} kWh', fils: 'fils',
    tariff_title: 'Tariff', plan_sub: 'Subsidized', plan_unsub: 'Unsubsidized', plan_custom: 'Custom',
    tariff_src: 'Default rates are the household tariff published by the Energy and Minerals Regulatory Commission, effective 1/1/2025. Tariffs change by official decision, so check your own bill.',
    tier_limit: 'Up to (kWh/month)', tier_rate: 'Rate (fils/kWh)', tier_last: 'Everything above',
    tariff_extra: 'Extra charges (fils/kWh)',
    tariff_extra_hint: 'Optional: for example the fuel price difference shown on your bill. Added to the car energy only. Leave 0 if you do not want it.',



    // ===== round 5 =====
    tab_analysis: 'Analysis',
    hello: 'Welcome',
    hello_name: 'Hello, {name}',


    period_kind: 'Period type',
    kind_month: 'Calendar month',





    view_all_n: 'View all ({n})',
    view_list: 'List',
    view_calendar: 'Calendar',






    m_distance: 'Distance',


    an_table: 'Period details',


    ch_no_odo: 'Log at least two odometer readings to see distance and efficiency',

    odo_title: 'Car odometer readings',

    odo_add_long: 'Log a car odometer reading',

    odo_empty: 'No manual readings yet',
    odo_add_title: 'Car odometer reading',
    odo_add_hint: 'Log the odometer at the start of a period and another at its end (or any date in between) so the app can compute distance and efficiency.',
    odo_km_label: 'Odometer (km)',
    odo_last: 'Last reading {v}',
    odo_err_order: 'This reading conflicts with the order of other readings (an odometer never goes down)',
    t_odo_saved: 'Reading saved ✓',
    t_odo_deleted: 'Reading deleted',
    confirm_del_odo: 'Delete this reading?',
    bill_add: 'Add bill',
    bill_edit: 'Edit bill',
    bill_save: 'Save bill',
    bill_form_hint: 'Enter the period the bill covers and the household total printed on it. The amount is optional and is compared with the estimate.',

    bill_bad_amount: 'The amount is not valid',



    bill_diff: 'The estimate ({est} {c}) differs from your bill amount ({real} {c}). The tariff or fees may have changed; adjust them in the tariff section.',
    confirm_del_bill: 'Delete this bill?',
    t_bill_saved: 'Bill saved ✓',
    t_bill_deleted: 'Bill deleted',

    user_name: 'Your name',
    user_name_ph: 'e.g. Fadi',

    export_pdf: 'Export PDF report',
    t_pdf: 'PDF report created',
    t_pdf_fail: 'Could not create the PDF',
    pal_indigo: 'Indigo',
    rep_title: 'Charging report',

    rep_charges: 'Charge log',
    rep_bill: 'Car impact on the bill',
    rep_page: 'Page {p} of {n}',
    rep_none: 'No charges in this period',
    rep_type: 'Type',
    rep_soc: 'Battery %',
    rep_time: 'Time',
    rep_generated: 'Generated on {d}',
    kpi_count: 'Charges',
    kpi_distance: 'Distance',
    kpi_eff: 'Efficiency',
    kpi_costkm: 'Cost per km',
    rep_odo_note: '≈ estimated from car odometer readings',
    // ===== New design 6A =====
    kind_cycle: 'Bill cycle', kind_custom: 'Custom', apply: 'Apply', period_next: 'Next period',
    preset_last7: 'Last 7 days', preset_last30: 'Last 30 days', preset_all: 'All time',
    cycle_start: 'Cycle start', cycle_title: 'Cycle {a} – {b}', current: 'Current',
    day_n_of_m: 'Day {n} of {m}', days: 'days', back: 'Back', avg: 'Average',
    today: 'Today', yesterday: 'Yesterday', details: 'Details', undo: 'Undo', t_restored_one: 'Charge restored',
    tier: 'Tier', tier_auto: 'Auto by day', tier_manual: 'set manually',
    tier_low: 'Low', tier_mid: 'Middle', tier_high: 'High',
    tier_low_s: 'Low', tier_mid_s: 'Middle', tier_high_s: 'High',
    tier_low_full: 'Low tier', tier_mid_full: 'Middle tier', tier_high_full: 'High tier',
    tier_under: 'Up to {a} kWh', tier_over: 'Above {a} kWh', tier_between: '{a} – {b} kWh',
    detail_fast: 'Fast charge', detail_home: 'Home charge',
    detail_nth_month: 'Charge #{n} this month', detail_nth_cycle: 'Charge #{n} this cycle',
    energy_from_charger: 'Energy taken from the charger screen', price_kwh: 'Price per kWh', station: 'Station',
    form_new: 'New charge', battery: 'Battery', soc_before_s: 'Before', soc_after_s: 'After',
    warn_soc_prev: 'Your last charge ended at {a}%, and "before" is higher. Check the number.',
    energy_charger: 'Energy from the charger screen', energy: 'Energy', energy_soc_est: 'Estimate from battery %: {v} kWh',
    price_recorded: 'Previously recorded price: {v}', price: 'Price per kWh', station_note: 'Station',
    note_opt: 'Note (optional)', station_ph: 'Station name',
    swipe_hint: 'Swipe a charge sideways to delete it', drag: 'Drag to reorder', recent_count: 'Number of charges',
    hero_energy: 'Period energy',
    vs_prev_cycle: 'vs previous cycle', vs_prev_month: 'vs last month', vs_prev_period: 'vs previous period',
   
    last_today: 'Last charge today, battery at {p}%', last_ago: 'Last charge {d} days ago, battery at {p}%', last_ago_one: 'Last charge yesterday, battery at {p}%',
    high_in: 'High tier starts in {d} days', high_in_one: 'High tier starts tomorrow', cycle_ends_in: 'Cycle ends in {d} days', cycle_ends_today: 'Cycle ends today',
    forecast_lead: 'At this rate you will reach about ', forecast_tail_cycle: ' by the end of the cycle.', forecast_tail_period: ' by the end of the period.', strip_label: 'Charges day by day, {n} days with charging, coloured by tier',
    charges_count: 'Charges', avg_per_charge: 'Average per charge',
    bill_card_title: "Car's effect on this cycle's bill", backup_stale: 'Last backup was {d} days ago. Back up now',
    backup_never: 'You have no backup yet. Back up now',
    sec_hero: 'Main card', sec_stats: 'Cost and charge count', sec_bill: 'Bill card', sec_recent: 'Recent charges',
    view_kind: 'View', filter_type: 'Charge type', an_metric: 'Metric', daily_avg: 'Daily average',
    odo_old_title: 'Old readings saved with charges ({n})', odo_old_hint: 'These come from the old version, which saved a reading with every charge. Edit any of them or delete them all. The charges themselves do not change.', odo_old_clear: 'Delete all old readings', odo_old_clear_q: 'Delete all odometer readings saved with old charges? The charges stay as they are.',
    t_too_big: 'The file is too large (over 20 MB) to be a backup from this app',
    sort_label: 'Sort charges', sort_newest: 'Newest first', sort_oldest: 'Oldest first',
    odo_today: "Today's reading", odo_edit_title: 'Edit odometer reading', odo_tap_hint: 'Tap any reading to edit or delete it.', show_less: 'Show less',
    odo_from_charge_hint: 'This reading is stored with an old charge. Saving moves it to the readings list; the charge itself does not change.', odo_hint_new: 'Record the odometer once at the start of each month or cycle, and the app works out distance and consumption per period.',
    bill_amount_c: 'Bill amount ({c}), optional', bill_recorded: 'Bill recorded', bill_not_recorded: 'No bill recorded',
    bill_ev_kwh: 'Home charging energy', bill_estimate: 'Estimate', bill_est_vs_real: 'Estimate vs actual bill',
    bill_record: 'Record bill', bill_intro_new: 'Each cycle starts on the cycle start day in settings. Record your bill when it arrives to compare the estimate with the real amount.',
    bill_share_chart: "Car's share of the bill",
    set_car: 'Car', set_car_sub: 'Name, battery and photo', set_power: 'Electricity and prices', set_power_sub: 'Tiers, bill cycle and fast charging',
    set_look: 'Appearance', set_look_sub: 'Colours, dark mode, font and language', set_data: 'Data', set_data_sub: 'Backup, export and delete',
    set_about: 'About', set_about_sub: 'Version, developer and privacy',
    tariff_from: 'Prices apply from',
    tariff_from_hint: 'Charges before this date keep their recorded prices. Leave empty to apply prices to all charges.',
    cycle_settings: 'Bill cycle and tiers', cycle_day: 'Cycle start day', cycle_day_hint: 'The day your electricity meter is read each month (1 to 28).',
    tier_days_low: 'Low-tier days at cycle start', tier_days_high: 'High-tier days at cycle end',
    tier_days_hint: 'The app picks the tier from the day in the cycle, and you can raise it for any charge. A raised tier never drops within the same cycle.',
    more_prices: 'Fast charging and other prices',
    recalc_hint: 'You have {n} old home charges with a fixed price. They can be recalculated with the new tier system.',
    recalc_btn: 'Recalculate old charges', recalc_q: 'Old home charges will be re-priced by tier. Continue?',
    t_recalc: 'Charges recalculated',
    s_palette: 'App colour', pal_amman: 'Amman night', pal_amman_sub: 'Navy and amber', pal_lime: 'Lime', pal_lime_sub: 'Black and lime green', pal_teal: 'Teal', pal_teal_sub: 'Navy and teal',
    s_backup: 'Backup', s_export: 'Export', s_danger: 'Danger zone',
    backup_status: 'Last backup', backup_last: 'On {d}', backup_none: 'No backup yet',
    confirm_clear2: '{n} charges will be deleted permanently and cannot be undone. Are you sure?', delete_all_final: 'Delete all permanently',
    app_name: 'EV Smart Dashboard', version_build: 'Version {v} · Build {b}', released_on: 'Built on {d}',
    whats_new: "What's new", whats_new_sub: 'Changes in this version',
    whats_new_list: "Font size follows the app setting only, not the phone's font scale|Sort charges newest or oldest first|Odometer: edit or delete any reading; old per-charge readings hidden with a delete-all button|Chart average shown clearly under the chart|Removed the unused car photo|Security: content security policy, safe CSV export, checked update link, backup size limit",
    upd_title: 'Check for updates', upd_sub: 'Tap to check for a newer version', upd_loading: 'Checking…',
    upd_none: 'No published releases yet', upd_latest: 'You have the latest version', upd_error: 'Could not connect. Try later',
    upd_new: 'Version {v} is available. Tap to download',
    developer: 'Developer', dev_role: 'Engineer and app developer', contact_me: 'Contact me', info: 'Information',
    privacy: 'Privacy', privacy_sub: 'Your data stays on your phone', libs: 'Libraries used', libs_sub: 'Open-source software',
    privacy_text: 'All your data is stored only on your phone, and the app sends nothing to any server. The only internet connection is when you tap "Check for updates", which asks GitHub for the latest version number without sending any of your data.',
    made_in: 'Made in Jordan',
  },
};
export const DICT = D;
export function makeT(lang) {
  const table = D[lang] || D.ar;
  return (key, vars) => {
    // صيغة المفرد: إن وُجد مفتاح باسم key_one واستُعمل n === 1
    const k = vars && vars.n === 1 && (table[`${key}_one`] || D.ar[`${key}_one`]) ? `${key}_one` : key;
    let s = table[k] ?? D.ar[k] ?? k;
    if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
    return s;
  };
}
const defaultValue = { lang: 'ar', rtl: true, t: makeT('ar') };
const Ctx = createContext(defaultValue);
export function I18nProvider({ lang, children }) {
  const value = React.useMemo(() => ({ lang, rtl: lang === 'ar', t: makeT(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
