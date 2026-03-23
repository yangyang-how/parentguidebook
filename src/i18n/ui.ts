export const languages = {
  en: 'English',
  zh: '中文',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.sources': 'Sources',
    'nav.emergency': 'Emergency Signs',
    'nav.guides': 'Guides by Age',
    'nav.exams': 'Eye Exams',

    // Language & Theme
    'lang.switch': '中文',
    'lang.switchLabel': 'Switch to Chinese',
    'theme.dark': 'Dark mode',
    'theme.light': 'Light mode',

    // Article components
    'article.lastUpdated': 'Last updated',
    'article.sources': 'Sources',
    'article.readInChinese': '阅读中文版',
    'article.readInEnglish': 'Read in English',
    'article.tldr': 'Quick Summary (30 seconds)',
    'article.backToHome': '← Back to home',

    // Urgency badges
    'urgency.critical': 'See a doctor within days',
    'urgency.important': 'Mention to your doctor soon',
    'urgency.good-to-know': 'Follow regular schedule',

    // Categories (article subcategories within a domain)
    'category.emergency-signs': 'Emergency Signs',
    'category.guides': 'Guides by Age',
    'category.eye-exams': 'Eye Exams',

    // Category groups (four pillars)
    'categoryGroup.body': 'For the Body',
    'categoryGroup.mind': 'For the Mind',
    'categoryGroup.dailyLife': 'For Daily Life',
    'categoryGroup.heartSoul': 'For the Heart & Soul',

    // Domains
    'domain.eyes': 'Eyes',
    'domain.breathing': 'Breathing',
    'domain.bonesMovement': 'Bones & Movement',
    'domain.teeth': 'Teeth',
    'domain.nutrition': 'Nutrition',
    'domain.attentionDigital': 'Attention & Digital World',
    'domain.learningCognitive': 'Learning & Cognitive',
    'domain.socialEmotional': 'Social & Emotional',
    'domain.schoolLife': 'School Life',
    'domain.physicalActivity': 'Physical Activity',
    'domain.outdoorLife': 'Outdoor Life',
    'domain.homeEnvironment': 'Home Environment',
    'domain.identityBelonging': 'Identity & Belonging',
    'domain.genderConfidence': 'Gender, Confidence & Equality',
    'domain.characterStrength': 'Character & Inner Strength',
    'domain.adaptability': 'Adaptability & Transitions',
    'domain.bigQuestions': 'Big Questions',
    'domain.exploreFuture': 'Explore & Future Readiness',
    'domain.howWorldWorks': 'How the World Works',
    'domain.comingSoon': 'Coming soon',
    'hub.underConstruction': 'Under construction',

    // Landing page
    'landing.hero.subheadline':
      'A free, bilingual guide to raising a whole, healthy, resilient child — written for parents, not doctors.',
    'landing.featured.title': 'Featured Articles',

    // Footer
    'footer.disclaimer':
      'All content is for educational purposes only and is not a substitute for professional medical advice.',
    'footer.noAds': 'No ads · No products · No data collection',
    'footer.project': 'A non-profit educational project',
    'footer.contactLabel': 'Contact',

    // Medical disclaimer
    'disclaimer.title': 'Medical Disclaimer',
    'disclaimer.text':
      "This article is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. If you have concerns about your child's health, please consult a qualified health care professional.",

    // 404
    '404.title': 'Page not found',
    '404.message': "We couldn't find what you're looking for.",
    '404.home': 'Go to homepage',
  },

  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.about': '关于',
    'nav.sources': '参考来源',
    'nav.emergency': '紧急信号',
    'nav.guides': '按年龄指南',
    'nav.exams': '眼科检查',

    // Language & Theme
    'lang.switch': 'English',
    'lang.switchLabel': '切换到英文',
    'theme.dark': '深色模式',
    'theme.light': '浅色模式',

    // Article components
    'article.lastUpdated': '最后更新',
    'article.sources': '参考来源',
    'article.readInChinese': '阅读中文版',
    'article.readInEnglish': 'Read in English',
    'article.tldr': '快速摘要（30秒）',
    'article.backToHome': '← 返回首页',

    // Urgency badges
    'urgency.critical': '请在几天内就医',
    'urgency.important': '请尽快告诉医生',
    'urgency.good-to-know': '按常规时间表',

    // Categories
    'category.emergency-signs': '紧急信号',
    'category.guides': '按年龄指南',
    'category.eye-exams': '眼科检查',

    // Category groups
    'categoryGroup.body': '身体',
    'categoryGroup.mind': '心智',
    'categoryGroup.dailyLife': '日常生活',
    'categoryGroup.heartSoul': '心灵与品格',

    // Domains
    'domain.eyes': '眼睛',
    'domain.breathing': '呼吸',
    'domain.bonesMovement': '骨骼与运动',
    'domain.teeth': '牙齿',
    'domain.nutrition': '营养',
    'domain.attentionDigital': '注意力与网络',
    'domain.learningCognitive': '学习与认知',
    'domain.socialEmotional': '社交与情绪',
    'domain.schoolLife': '校园生活',
    'domain.physicalActivity': '身体活动',
    'domain.outdoorLife': '户外生活',
    'domain.homeEnvironment': '家庭环境',
    'domain.identityBelonging': '身份与归属',
    'domain.genderConfidence': '性别、自信与平等',
    'domain.characterStrength': '品格与内心力量',
    'domain.adaptability': '适应与过渡',
    'domain.bigQuestions': '大问题',
    'domain.exploreFuture': '探索与未来',
    'domain.howWorldWorks': '世界如何运转',
    'domain.comingSoon': '敬请期待',
    'hub.underConstruction': '建设中',

    // Landing page
    'landing.hero.subheadline':
      '一份免费的、双语指南，帮助你养育全面、健康、有韧性的孩子——为家长而写，不是为医生而写。',
    'landing.featured.title': '精选文章',

    // Footer
    'footer.disclaimer': '所有内容仅供教育目的，不能替代专业医疗建议。',
    'footer.noAds': '无广告 · 无产品销售 · 不收集个人数据',
    'footer.project': '非营利教育项目',
    'footer.contactLabel': '联系',

    // Medical disclaimer
    'disclaimer.title': '医疗免责声明',
    'disclaimer.text':
      '本文仅供健康教育目的，不能替代专业医疗建议、诊断或治疗。如果您对孩子的健康有任何担忧，请咨询合格的医疗专业人员。',

    // 404
    '404.title': '页面未找到',
    '404.message': '我们找不到您要访问的页面。',
    '404.home': '返回首页',
  },
} as const;

