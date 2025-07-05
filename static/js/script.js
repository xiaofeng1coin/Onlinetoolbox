document.addEventListener('DOMContentLoaded', function() {

    // --- DOM 元素获取 ---
    const body = document.body;
    const settingsPanel = document.getElementById('settings-panel');
    const modal = document.getElementById('tool-modal');
    const modalIframe = document.getElementById('modal-iframe');
    const backToTopBtn = document.getElementById('back-to-top');
    const categoryTitles = document.querySelectorAll('.main-content .category-title');

    // 桌面端元素
    const desktopHeader = document.querySelector('.top-header.desktop-only');
    const greetingEl = document.getElementById('header-greeting');
    const greetingIconEl = document.getElementById('greeting-icon');
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('full-date');
    const tipEl = document.getElementById('daily-tip');
    const desktopSearchForm = document.getElementById('unified-search-form');
    const desktopSearchInput = desktopSearchForm?.querySelector('.search-input');
    const desktopSearchEngineIcon = document.getElementById('search-engine-icon');
    const desktopSearchModeToggle = document.getElementById('search-mode-toggle');
    const sideNavLinks = document.querySelectorAll('.side-nav a');
    const desktopSettingsBtn = document.getElementById('settings-open');

    // 移动端元素
    const mobileSearchForm = document.getElementById('mobile-search-form');
    const mobileSearchInput = mobileSearchForm?.querySelector('.search-input');
    const mobileSearchEngineIcon = document.getElementById('mobile-search-engine-icon');
    const mobileSearchModeToggle = document.getElementById('mobile-search-mode-toggle');
    const mobileBottomNavLinks = document.querySelectorAll('.mobile-bottom-nav a');
    const mobileSettingsBtn = document.getElementById('mobile-settings-open');

    const toolCount = document.querySelectorAll('.main-content .card').length;

    // --- 状态变量与核心对象 ---
    let currentSearchMode = 'web';
    const settings = { theme: 'light', searchEngine: 'baidu' };
    const searchEngines = {
        baidu: { url: 'https://www.baidu.com/s', placeholder: '百度一下...', queryParam: 'wd', icon: 'fab fa-baidu' },
        google: { url: 'https://www.google.com/search', placeholder: 'Google 搜索', queryParam: 'q', icon: 'fab fa-google' },
        bing: { url: 'https://www.bing.com/search', placeholder: '必应搜索', queryParam: 'q', icon: 'fab fa-bing' }
    };
    const dailyTips = ["喝杯水，休息一下眼睛。", "今天也是元气满满的一天！", "保持专注，事半功倍。", "别忘了站起来活动一下。", "微小的进步，也是进步。"];
    const visitStats = {
        counts: {},
        load() { this.counts = JSON.parse(localStorage.getItem('toolVisitCounts')) || {}; },
        save() { localStorage.setItem('toolVisitCounts', JSON.stringify(this.counts)); },
        add(toolId) { this.counts[toolId] = (this.counts[toolId] || 0) + 1; this.save(); }
    };

    // --- 核心功能函数 ---
    function initialize() {
        visitStats.load();
        loadSettings();
        updateTimeAndGreeting(); // 即使在移动端隐藏，也保持更新
        setInterval(updateTimeAndGreeting, 1000);
        displayDailyTip();
        setupEventListeners();
        updateAllVisitCounts();
        onScroll();
    }

    function displayDailyTip() { if (tipEl) tipEl.textContent = `“${dailyTips[Math.floor(Math.random() * dailyTips.length)]}”`; }
    
    function updateTimeAndGreeting() {
        const now = new Date();
        if (timeEl) timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
        if (dateEl && dateEl.dataset.currentDate !== now.toLocaleDateString()) {
            dateEl.textContent = `${now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}`;
            dateEl.dataset.currentDate = now.toLocaleDateString();
        }
        if (greetingEl) {
            const hour = now.getHours();
            let greetingText, iconClass;
            if (hour >= 5 && hour < 12) { greetingText = '上午好'; iconClass = 'fas fa-sun'; }
            else if (hour >= 12 && hour < 18) { greetingText = '下午好'; iconClass = 'fas fa-cloud-sun'; }
            else { greetingText = '晚上好'; iconClass = 'fas fa-moon'; }
            greetingEl.textContent = greetingText;
            if (greetingIconEl) greetingIconEl.className = iconClass;
        }
    }

    function loadSettings() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedEngine = localStorage.getItem('searchEngine') || 'baidu';
        applyTheme(savedTheme);
        applySearchEngine(savedEngine);
        document.getElementById('theme-selector').value = savedTheme;
        document.getElementById('search-engine-selector').value = savedEngine;
    }

    function saveSettings() {
        localStorage.setItem('theme', settings.theme);
        localStorage.setItem('searchEngine', settings.searchEngine);
    }

    function applyTheme(theme) {
        body.dataset.theme = theme;
        settings.theme = theme;
    }

    function applySearchEngine(engine) {
        settings.searchEngine = engine;
        updateSearchUI();
    }
    
    function updateSearchUI() {
        if (currentSearchMode === 'web') {
            const config = searchEngines[settings.searchEngine];
            const placeholder = config.placeholder;
            const action = config.url;
            const queryParam = config.queryParam;
            const icon = config.icon;
            
            // 同步更新桌面和移动端搜索框
            if (desktopSearchForm) {
                desktopSearchForm.action = action;
                desktopSearchInput.name = queryParam;
                desktopSearchInput.placeholder = placeholder;
                desktopSearchEngineIcon.className = icon;
                desktopSearchModeToggle.innerHTML = '<i class="fas fa-toolbox"></i>';
            }
            if(mobileSearchForm) {
                mobileSearchForm.action = action;
                mobileSearchInput.name = queryParam;
                mobileSearchInput.placeholder = placeholder;
                mobileSearchEngineIcon.className = icon;
                mobileSearchModeToggle.innerHTML = '<i class="fas fa-toolbox"></i>';
            }

        } else { // tool search mode
            const placeholder = `在 ${toolCount} 个工具中筛选...`;
            const icon = 'fas fa-search';

            if(desktopSearchForm) {
                desktopSearchInput.placeholder = placeholder;
                desktopSearchEngineIcon.className = icon;
                desktopSearchModeToggle.innerHTML = '<i class="fas fa-globe-asia"></i>';
            }
             if(mobileSearchForm) {
                mobileSearchInput.placeholder = placeholder;
                mobileSearchEngineIcon.className = icon;
                mobileSearchModeToggle.innerHTML = '<i class="fas fa-globe-asia"></i>';
            }
        }
    }

    function updateAllVisitCounts() {
        document.querySelectorAll('.card').forEach(card => {
            const toolId = card.dataset.toolId;
            const count = visitStats.counts[toolId] || 0;
            const countEl = card.querySelector('.count-number');
            if(countEl) countEl.textContent = count;
        });
    }

    function toggleSearchMode() {
        currentSearchMode = (currentSearchMode === 'web') ? 'tool' : 'web';
        if(desktopSearchInput) desktopSearchInput.value = '';
        if(mobileSearchInput) mobileSearchInput.value = '';
        updateSearchUI();
        handleFilter('');
    }

    function handleFilter(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        document.querySelectorAll('h2.category-title').forEach(title => {
            const grid = title.nextElementSibling;
            let categoryHasVisibleCard = false;
            if (grid && grid.classList.contains('tool-grid')) {
                grid.querySelectorAll('.card').forEach(card => {
                    const toolName = card.dataset.toolName.toLowerCase();
                    const isVisible = toolName.includes(term);
                    card.style.display = isVisible ? 'flex' : 'none';
                    if(isVisible) categoryHasVisibleCard = true;
                });
            }
            title.style.display = categoryHasVisibleCard || !term ? 'block' : 'none';
        });
    }
    
    function onScroll() {
        let currentCategoryId = '';
        const offset = window.innerHeight * 0.3; // 视口30%处为激活线

        categoryTitles.forEach(title => {
            if (title.getBoundingClientRect().top <= offset) {
                currentCategoryId = title.id;
            }
        });

        // 同时更新桌面和移动端导航高亮
        sideNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentCategoryId}`);
        });
        mobileBottomNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentCategoryId}`);
        });
        
        if (backToTopBtn) backToTopBtn.classList.toggle('visible', window.scrollY > 300);
    }
    
    function handleCardInteraction(e) {
        const card = e.target.closest('.card');
        if (!card) return;

        const toolId = card.dataset.toolId;
        const isActionClick = e.target.closest('.card-action-btn');
        const isMainLinkClick = e.target.closest('.card-main-link');

        if (isActionClick || isMainLinkClick) {
            visitStats.add(toolId);
            updateAllVisitCounts();
        }

        if (e.target.closest('.copy-link-btn')) {
            e.preventDefault();
            navigator.clipboard.writeText(card.dataset.toolUrl).then(() => {
                const btn = e.target.closest('.copy-link-btn');
                const originalIcon = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => { btn.innerHTML = originalIcon; }, 1500);
            });

        } else if (e.target.closest('.open-modal-btn')) {
            e.preventDefault();
            document.getElementById('modal-title').textContent = card.dataset.toolName;
            modalIframe.src = card.dataset.toolUrl;
            modal.classList.add('visible');
            body.classList.add('modal-open');
        }
    }
    
    function openSettings() {
        if(settingsPanel) settingsPanel.classList.add('open');
    }
    
    function setupEventListeners() {
        if(desktopSettingsBtn) desktopSettingsBtn.addEventListener('click', openSettings);
        if(mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', openSettings);
        document.getElementById('settings-close').addEventListener('click', () => settingsPanel.classList.remove('open'));

        document.getElementById('theme-selector').addEventListener('change', (e) => { applyTheme(e.target.value); saveSettings(); });
        document.getElementById('search-engine-selector').addEventListener('change', (e) => { applySearchEngine(e.target.value); saveSettings(); });
        
        if(desktopSearchModeToggle) desktopSearchModeToggle.addEventListener('click', toggleSearchMode);
        if(mobileSearchModeToggle) mobileSearchModeToggle.addEventListener('click', toggleSearchMode);

        const filterHandler = (e) => { if (currentSearchMode === 'tool') handleFilter(e.target.value); };
        if(desktopSearchInput) desktopSearchInput.addEventListener('input', filterHandler);
        if(mobileSearchInput) mobileSearchInput.addEventListener('input', filterHandler);

        const submitBlocker = (e) => { if (currentSearchMode === 'tool') e.preventDefault(); };
        if(desktopSearchForm) desktopSearchForm.addEventListener('submit', submitBlocker);
        if(mobileSearchForm) mobileSearchForm.addEventListener('submit', submitBlocker);

        document.querySelector('.main-content').addEventListener('click', handleCardInteraction);
        
        document.getElementById('modal-close').addEventListener('click', () => { modal.classList.remove('visible'); body.classList.remove('modal-open'); modalIframe.src = 'about:blank'; });
        modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('visible'); body.classList.remove('modal-open'); modalIframe.src = 'about:blank'; } });
        
        window.addEventListener('scroll', onScroll, { passive: true });
        if(backToTopBtn) backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    initialize();
});
