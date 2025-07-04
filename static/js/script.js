document.addEventListener('DOMContentLoaded', function() {

    // --- DOM 元素获取 ---
    const body = document.body;
    const greetingEl = document.getElementById('header-greeting');
    const greetingIconEl = document.getElementById('greeting-icon');
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('full-date');
    const tipEl = document.getElementById('daily-tip');
    const searchForm = document.getElementById('unified-search-form');
    const searchInput = searchForm.querySelector('.search-input');
    const searchEngineIcon = document.getElementById('search-engine-icon');
    const searchModeToggle = document.getElementById('search-mode-toggle');
    const modal = document.getElementById('tool-modal');
    const modalIframe = document.getElementById('modal-iframe');
    const backToTopBtn = document.getElementById('back-to-top');
    const settingsPanel = document.getElementById('settings-panel');
    const toolCount = document.querySelectorAll('.main-content .card').length;
    const topHeader = document.querySelector('.top-header');
    const sideNav = document.querySelector('.side-nav');
    const navLinks = document.querySelectorAll('.side-nav a');
    const categoryTitles = document.querySelectorAll('.main-content .category-title');

    // --- 状态变量与核心对象 ---
    let currentSearchMode = 'web';
    const settings = { theme: 'light', searchEngine: 'baidu' };
    const searchEngines = {
        baidu: { url: 'https://www.baidu.com/s', placeholder: '百度一下...', queryParam: 'wd', icon: 'fab fa-baidu' },
        google: { url: 'https://www.google.com/search', placeholder: 'Google 搜索', queryParam: 'q', icon: 'fab fa-google' },
        bing: { url: 'https://www.bing.com/search', placeholder: '必应搜索', queryParam: 'q', icon: 'fab fa-bing' }
    };
    const dailyTips = [
        "喝杯水，休息一下眼睛。",
        "今天也是元气满满的一天！",
        "保持专注，事半功倍。",
        "一个任务一个任务地来。",
        "别忘了站起来活动一下。",
        "微小的进步，也是进步。",
        "相信自己的潜力。",
        "今天会是富有成效的一天。",
        "代码总有调通的时候。",
        "设计源于生活，高于生活。"
    ];
    const visitStats = {
        counts: {},
        load() { this.counts = JSON.parse(localStorage.getItem('toolVisitCounts')) || {}; },
        save() { localStorage.setItem('toolVisitCounts', JSON.stringify(this.counts)); },
        add(toolId) {
            this.counts[toolId] = (this.counts[toolId] || 0) + 1;
            this.save();
        }
    };

    // --- 核心功能函数 ---
    function initialize() {
        visitStats.load();
        loadSettings();
        updateTimeAndGreeting();
        setInterval(updateTimeAndGreeting, 1000);
        displayDailyTip();
        setupEventListeners();
        updateAllVisitCounts();
        onScroll();
    }

    function displayDailyTip() {
        if (!tipEl) return;
        const randomIndex = Math.floor(Math.random() * dailyTips.length);
        tipEl.textContent = `“${dailyTips[randomIndex]}”`;
    }

    function updateTimeAndGreeting() {
        const now = new Date();

        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        const currentDateStr = now.toLocaleDateString();
        if (dateEl && dateEl.dataset.currentDate !== currentDateStr) {
             const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
             const weekdayOptions = { weekday: 'long' };
             dateEl.textContent = `${now.toLocaleDateString('zh-CN', dateOptions)} ${now.toLocaleDateString('zh-CN', weekdayOptions)}`;
             dateEl.dataset.currentDate = currentDateStr;
        }

        if (greetingEl) {
            const hour = now.getHours();
            let greetingText = '晚上好';
            let iconClass = 'fas fa-moon';

            if (hour >= 5 && hour < 9) { greetingText = '早上好'; iconClass = 'fas fa-mug-hot'; }
            else if (hour >= 9 && hour < 12) { greetingText = '上午好'; iconClass = 'fas fa-sun'; }
            else if (hour >= 12 && hour < 14) { greetingText = '中午好'; iconClass = 'fas fa-utensils'; }
            else if (hour >= 14 && hour < 18) { greetingText = '下午好'; iconClass = 'fas fa-sun'; }
            else if (hour >= 18 && hour < 22) { greetingText = '傍晚好'; iconClass = 'fas fa-cloud-moon'; }
            else { greetingText = '夜深了'; iconClass = 'fas fa-star'; }

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
        if (currentSearchMode === 'web') {
            const config = searchEngines[engine];
            searchForm.action = config.url;
            searchInput.name = config.queryParam;
            searchInput.placeholder = config.placeholder;
            searchEngineIcon.className = config.icon;
        }
        settings.searchEngine = engine;
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
        searchInput.value = '';
        updateSearchUI();
        handleFilter('');
    }

    function updateSearchUI() {
        if (currentSearchMode === 'web') {
            applySearchEngine(settings.searchEngine);
            searchForm.target = '_blank';
            searchModeToggle.innerHTML = '<i class="fas fa-toolbox"></i>';
        } else {
            searchInput.name = 'q_tool';
            searchInput.placeholder = `在 ${toolCount} 个工具中筛选...`;
            searchEngineIcon.className = 'fas fa-search';
            searchForm.target = '_self';
            searchModeToggle.innerHTML = '<i class="fas fa-globe-asia"></i>';
        }
    }

    function handleFilter(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        document.querySelectorAll('h2.category-title').forEach(title => {
            const grid = title.nextElementSibling;
            let categoryHasVisibleCard = false;
            if (grid) {
                grid.querySelectorAll('.card').forEach(card => {
                    const toolName = card.dataset.toolName.toLowerCase();
                    const description = card.querySelector('.card-text').textContent.toLowerCase();
                    const isVisible = toolName.includes(term) || description.includes(term);
                    card.style.display = isVisible ? 'flex' : 'none';
                    if(isVisible) categoryHasVisibleCard = true;
                });
            }
            title.style.display = categoryHasVisibleCard || !term ? 'block' : 'none';
        });
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

    function onScroll() {
        if (sideNav) {
            const headerHeight = topHeader ? topHeader.offsetHeight : 0;
            const offset = headerHeight + 40;
            let currentCategoryId = '';
            categoryTitles.forEach(title => {
                if (title.getBoundingClientRect().top <= offset) {
                    currentCategoryId = title.id;
                }
            });
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${currentCategoryId}`);
            });
        }
        backToTopBtn.classList.toggle('visible', window.scrollY > 300);
    }

    function setupEventListeners() {
        document.getElementById('settings-open').addEventListener('click', () => settingsPanel.classList.add('open'));
        document.getElementById('settings-close').addEventListener('click', () => settingsPanel.classList.remove('open'));
        document.getElementById('theme-selector').addEventListener('change', (e) => { applyTheme(e.target.value); saveSettings(); });
        document.getElementById('search-engine-selector').addEventListener('change', (e) => { applySearchEngine(e.target.value); saveSettings(); });
        searchModeToggle.addEventListener('click', toggleSearchMode);
        searchInput.addEventListener('input', () => { if (currentSearchMode === 'tool') handleFilter(searchInput.value); });
        searchForm.addEventListener('submit', e => { if (currentSearchMode === 'tool') e.preventDefault(); });
        document.querySelector('.main-content').addEventListener('click', handleCardInteraction);
        document.getElementById('modal-close').addEventListener('click', () => { modal.classList.remove('visible'); body.classList.remove('modal-open'); modalIframe.src = 'about:blank'; });
        modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('visible'); body.classList.remove('modal-open'); modalIframe.src = 'about:blank'; } });
        window.addEventListener('scroll', onScroll, { passive: true });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    initialize();
});
