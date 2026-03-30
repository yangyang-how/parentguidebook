export const languages = {
	en: "English",
	zh: "中文",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "en";

export const ui = {
	en: {
		// Navigation
		"nav.home": "Home",
		"nav.about": "About",
		"nav.sources": "Sources",
		"nav.emergency": "Emergency Signs",
		"nav.guides": "Guides by Age",
		"nav.exams": "Eye Exams",

		// Language & Theme
		"lang.switch": "中文",
		"lang.switchLabel": "Switch to Chinese",
		"theme.dark": "Dark mode",
		"theme.light": "Light mode",

		// Article components
		"article.lastUpdated": "Last updated",
		"article.sources": "Sources",
		"article.readInChinese": "阅读中文版",
		"article.readInEnglish": "Read in English",
		"article.tldr": "Quick Summary (30 seconds)",
		"article.backToHome": "← Back to home",

		// Urgency badges
		"urgency.critical": "See a doctor within days",
		"urgency.important": "Mention to your doctor soon",
		"urgency.good-to-know": "Follow regular schedule",

		// Categories (article subcategories within a domain)
		"category.emergency-signs": "Emergency Signs",
		"category.guides": "Guides by Age",
		"category.eye-exams": "Eye Exams",

		// Category groups (five pillars)
		"categoryGroup.childBody": "For the Child's Body",
		"categoryGroup.childMind": "For the Child's Mind",
		"categoryGroup.childHeart": "For the Child's Heart & Soul",
		"categoryGroup.parent": "For the Parent",
		"categoryGroup.family": "For the Family",

		// Domains — Child's Body
		"domain.eyes": "Eyes",
		"domain.breathing": "Breathing & ENT",
		"domain.bonesMovement": "Bones & Movement",
		"domain.teeth": "Teeth",
		"domain.nutrition": "Nutrition & Feeding",
		"domain.skin": "Skin",
		"domain.sleep": "Sleep",

		// Domains — Child's Mind
		"domain.learningCognitive": "Learning & Cognitive",
		"domain.attentionDigital": "Attention & Digital",
		"domain.socialEmotional": "Social & Emotional",
		"domain.schoolLife": "School Life",

		// Domains — Child's Heart & Soul
		"domain.identityBelonging": "Identity & Belonging",
		"domain.characterStrength": "Character & Strength",
		"domain.genderConfidence": "Gender & Confidence",
		"domain.bigQuestions": "Big Questions",
		"domain.adaptability": "Adaptability & Transitions",

		// Domains — Parent
		"domain.physicalRecovery": "Physical Recovery",
		"domain.mentalHealth": "Mental Health",
		"domain.relationships": "Relationships",
		"domain.parentingConfidence": "Parenting Confidence",

		// Domains — Family
		"domain.homeSafety": "Home & Safety",
		"domain.routinesLogistics": "Routines & Logistics",
		"domain.workLife": "Work-Life",
		"domain.communitySupport": "Community & Support",

		"domain.comingSoon": "Coming soon",
		"hub.underConstruction": "Under construction",

		// Age stages
		"stage.0-1mo": "0–1 month",
		"stage.1-6mo": "1–6 months",
		"stage.6mo-2yr": "6 months–2 years",
		"stage.2-5yr": "2–5 years",
		"stage.5-12yr": "5–12 years",
		"stage.12-18yr": "12–18 years",

		// Landing page
		"landing.hero.subheadline":
			"A free, bilingual guide to raising a whole, healthy, resilient child — written for parents, not doctors.",
		"landing.featured.title": "Featured Articles",

		// Home page
		"home.hero.title": "What do you need help with?",
		"home.hero.subtitle":
			"Evidence-based guidance for every stage of your child's health and development.",
		"home.selector.age": "My child is",
		"home.selector.agePlaceholder": "Select age...",
		"home.selector.topic": "I need help with",
		"home.selector.topicPlaceholder": "Select topic...",
		"home.selector.go": "Find article",
		"home.selector.noArticle": "Article coming soon",
		"home.selector.birthday": "or enter birthday",
		"home.selector.birthdayClear": "Clear",
		"home.browse.title": "Browse by topic",
		"home.browse.articles": "articles",
		"home.browse.comingSoon": "Coming soon",

		// Related articles
		"related.sameAge": "Related for",
		"related.sameDomain": "More about",

		// Matrix UI (moved to /matrix)
		"matrix.hero.title": "Content coverage",
		"matrix.hero.subtitle":
			"Every age brings new questions. Select your child's age to see what to watch for — from body to mind to heart.",
		"matrix.hero.birthday": "Enter birthday for automatic tracking",
		"matrix.hero.birthday.clear": "Clear saved birthday",
		"matrix.hero.birthday.placeholder": "Child's birthday",
		"matrix.legend.selectedAge": "Selected age",
		"matrix.placeholder": "To be written",
		"matrix.sticky.label": "Age",
		"matrix.mobile.showing": "Showing",
		"matrix.mobile.swipe": "Swipe to change age",

		// Footer
		"footer.disclaimer":
			"All content is for educational purposes only and is not a substitute for professional medical advice.",
		"footer.noAds": "No ads · No products · No data collection",
		"footer.project": "A non-profit educational project",
		"footer.contactLabel": "Contact",

		// Medical disclaimer
		"disclaimer.title": "Medical Disclaimer",
		"disclaimer.text":
			"This article is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. If you have concerns about your child's health, please consult a qualified health care professional.",

		// 404
		"404.title": "Page not found",
		"404.message": "We couldn't find what you're looking for.",
		"404.home": "Go to homepage",
	},

	zh: {
		// Navigation
		"nav.home": "首页",
		"nav.about": "关于",
		"nav.sources": "参考来源",
		"nav.emergency": "紧急信号",
		"nav.guides": "按年龄指南",
		"nav.exams": "眼科检查",

		// Language & Theme
		"lang.switch": "English",
		"lang.switchLabel": "切换到英文",
		"theme.dark": "深色模式",
		"theme.light": "浅色模式",

		// Article components
		"article.lastUpdated": "最后更新",
		"article.sources": "参考来源",
		"article.readInChinese": "阅读中文版",
		"article.readInEnglish": "Read in English",
		"article.tldr": "快速摘要（30秒）",
		"article.backToHome": "← 返回首页",

		// Urgency badges
		"urgency.critical": "请在几天内就医",
		"urgency.important": "请尽快告诉医生",
		"urgency.good-to-know": "按常规时间表",

		// Categories
		"category.emergency-signs": "紧急信号",
		"category.guides": "按年龄指南",
		"category.eye-exams": "眼科检查",

		// Category groups (five pillars)
		"categoryGroup.childBody": "孩子的身体",
		"categoryGroup.childMind": "孩子的心智",
		"categoryGroup.childHeart": "孩子的心灵",
		"categoryGroup.parent": "家长自己",
		"categoryGroup.family": "家庭",

		// Domains — Child's Body
		"domain.eyes": "眼睛",
		"domain.breathing": "呼吸",
		"domain.bonesMovement": "骨骼与运动",
		"domain.teeth": "牙齿",
		"domain.nutrition": "营养与喂养",
		"domain.skin": "皮肤",
		"domain.sleep": "睡眠",

		// Domains — Child's Mind
		"domain.learningCognitive": "学习与认知",
		"domain.attentionDigital": "注意力与屏幕",
		"domain.socialEmotional": "社交与情绪",
		"domain.schoolLife": "校园生活",

		// Domains — Child's Heart & Soul
		"domain.identityBelonging": "身份与归属",
		"domain.characterStrength": "品格与力量",
		"domain.genderConfidence": "性别与自信",
		"domain.bigQuestions": "大问题",
		"domain.adaptability": "适应与过渡",

		// Domains — Parent
		"domain.physicalRecovery": "产后恢复",
		"domain.mentalHealth": "心理健康",
		"domain.relationships": "亲密关系",
		"domain.parentingConfidence": "育儿信心",

		// Domains — Family
		"domain.homeSafety": "家居安全",
		"domain.routinesLogistics": "日常与后勤",
		"domain.workLife": "工作与生活",
		"domain.communitySupport": "社区与支持",

		"domain.comingSoon": "敬请期待",
		"hub.underConstruction": "建设中",

		// Age stages
		"stage.0-1mo": "0–1个月",
		"stage.1-6mo": "1–6个月",
		"stage.6mo-2yr": "6个月–2岁",
		"stage.2-5yr": "2–5岁",
		"stage.5-12yr": "5–12岁",
		"stage.12-18yr": "12–18岁",

		// Landing page
		"landing.hero.subheadline":
			"一份免费的、双语指南，帮助你养育全面、健康、有韧性的孩子——为家长而写，不是为医生而写。",
		"landing.featured.title": "精选文章",

		// Home page
		"home.hero.title": "你需要什么帮助？",
		"home.hero.subtitle": "为孩子健康成长的每个阶段提供循证指导。",
		"home.selector.age": "孩子的年龄",
		"home.selector.agePlaceholder": "选择年龄...",
		"home.selector.topic": "我想了解",
		"home.selector.topicPlaceholder": "选择主题...",
		"home.selector.go": "查找文章",
		"home.selector.noArticle": "文章即将上线",
		"home.selector.birthday": "或输入生日",
		"home.selector.birthdayClear": "清除",
		"home.browse.title": "按主题浏览",
		"home.browse.articles": "篇文章",
		"home.browse.comingSoon": "敬请期待",

		// Related articles
		"related.sameAge": "同年龄段相关",
		"related.sameDomain": "更多关于",

		// Matrix UI (moved to /matrix)
		"matrix.hero.title": "内容覆盖全览",
		"matrix.hero.subtitle":
			"每个年龄段都有新的问题。选择孩子的年龄，了解从身体到心智到心灵需要关注什么。",
		"matrix.hero.birthday": "输入生日，自动匹配年龄段",
		"matrix.hero.birthday.clear": "清除已保存的生日",
		"matrix.hero.birthday.placeholder": "孩子的生日",
		"matrix.legend.selectedAge": "当前年龄段",
		"matrix.placeholder": "待撰写",
		"matrix.sticky.label": "年龄",
		"matrix.mobile.showing": "当前显示",
		"matrix.mobile.swipe": "滑动切换年龄段",

		// Footer
		"footer.disclaimer": "所有内容仅供教育目的，不能替代专业医疗建议。",
		"footer.noAds": "无广告 · 无产品销售 · 不收集个人数据",
		"footer.project": "非营利教育项目",
		"footer.contactLabel": "联系",

		// Medical disclaimer
		"disclaimer.title": "医疗免责声明",
		"disclaimer.text":
			"本文仅供健康教育目的，不能替代专业医疗建议、诊断或治疗。如果您对孩子的健康有任何担忧，请咨询合格的医疗专业人员。",

		// 404
		"404.title": "页面未找到",
		"404.message": "我们找不到您要访问的页面。",
		"404.home": "返回首页",
	},
} as const;
