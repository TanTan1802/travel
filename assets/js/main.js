/*==================== SHOW MENU ====================*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')


/* Validate if constant exists */
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show-menu')
    })
}

/*===== MENU HIDDEN =====*/
/* Validate if constant exists */
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show-menu')
    })
}

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))


/*==================== HEADER ĐỔI NỀN + NÚT LÊN ĐẦU TRANG ====================*/
/* Một listener cuộn (passive), gom về một lần mỗi khung hình */
const header = document.getElementById('header')
const scrollUpBtn = document.getElementById('scroll-up')
let scrollTicking = false

function onScroll() {
    scrollTicking = false
    const y = window.scrollY
    header?.classList.toggle('scroll-header', y >= 100)
    scrollUpBtn?.classList.toggle('show-scroll', y >= 200)
    if (sectionLinks.length) scrollActive(y)
}
window.addEventListener('scroll', () => {
    if (scrollTicking) return
    scrollTicking = true
    requestAnimationFrame(onScroll)
}, { passive: true })

/*==================== THANH CUỘN NGANG (thay Swiper) ====================*/
/* Vuốt bằng CSS scroll-snap; nút mũi tên cho chuột, tự ẩn khi đã tới đầu/cuối */
document.querySelectorAll('.hscroll-wrap').forEach(wrap => {
    const track = wrap.querySelector('.hscroll')
    const prev = wrap.querySelector('.hscroll__btn--prev')
    const next = wrap.querySelector('.hscroll__btn--next')
    if (!track || !prev || !next) return
    const step = dir => track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
    const update = () => {
        prev.disabled = track.scrollLeft <= 4
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
    }
    prev.addEventListener('click', () => step(-1))
    next.addEventListener('click', () => step(1))
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    update()
})

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
/* Tìm sẵn link của từng mục; khi cuộn chỉ đọc vị trí rồi mới đổi class (không đọc/ghi xen kẽ) */
const sectionLinks = [...document.querySelectorAll('section[id]')]
    .map(section => ({ section, link: document.querySelector(`.nav__menu a[href*="#${CSS.escape(section.id)}"]`) }))
    .filter(item => item.link)

function scrollActive(scrollY) {
    /* Vị trí so với đầu trang (offsetTop chỉ tính theo phần tử cha nên lệch khi mục nằm trong khối định vị) */
    const active = sectionLinks.map(({ section }) => {
        const rect = section.getBoundingClientRect()
        const top = rect.top + scrollY - 50
        return scrollY > top && scrollY <= top + rect.height
    })
    sectionLinks.forEach(({ link }, i) => link.classList.toggle('active-link', active[i]))
}

onScroll() // cập nhật ngay khi tải lại trang ở vị trí đã cuộn

/*==================== HIỆN DẦN KHI CUỘN (thay ScrollReveal) ====================*/
/*
 * Chỉ áp dụng cho phần tử còn ở dưới màn hình lúc tải trang (nội dung đầu trang hiện ngay, không chờ JS
 * → tốt cho LCP); bỏ qua khi người dùng bật "giảm chuyển động". CSS: .reveal / .reveal--in (vietnam.css).
 */
const REVEAL_GROUPS = [
    { from: 'top', stagger: true, selector: `.home__data, .home__social-link, .home__info,
        .discover__container, .numbers__item,
        .explore__search, .explore__filters, .dest-hero__content, .dest-facts,
        .food-card, .activity-card, .tip-item, .footer__data, .footer__rights` },
    { from: 'left', stagger: false, selector: '.about__data, .season__description, .subscribe__description, .overview__data' },
    { from: 'right', stagger: true, selector: '.about__img-overlay, .subscribe__form, .overview__img' },
]

function initReveal() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(entries => {
        let delay = 0
        entries.filter(e => e.isIntersecting).forEach(({ target }) => {
            target.style.transitionDelay = target.dataset.revealStagger ? `${delay}ms` : ''
            if (target.dataset.revealStagger) delay += 100
            target.classList.add('reveal--in')
            observer.unobserve(target)
            target.addEventListener('transitionend', () => {
                target.classList.remove('reveal', `reveal--${target.dataset.revealFrom}`, 'reveal--in')
                target.style.transitionDelay = ''
            }, { once: true })
        })
    }, { rootMargin: '0px 0px -10% 0px' })

    const fold = window.innerHeight
    REVEAL_GROUPS.forEach(({ from, stagger, selector }) => {
        document.querySelectorAll(selector).forEach(el => {
            if (el.classList.contains('reveal') || el.getBoundingClientRect().top < fold) return
            el.dataset.revealFrom = from
            if (stagger) el.dataset.revealStagger = '1'
            el.classList.add('reveal', `reveal--${from}`)
            observer.observe(el)
        })
    })
}
initReveal()

/*==================== DARK LIGHT THEME ====================*/
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'ri-sun-line'


/* Lớp dark-theme đã được gắn sớm bằng script nội tuyến ngay sau <body> (tránh nháy nền sáng) */
const readStore = key => { try { return localStorage.getItem(key) } catch { return null } }
const selectedTheme = readStore('selected-theme')
const selectedIcon = readStore('selected-icon')


const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'ri-moon-line' : 'ri-sun-line'


if (selectedTheme) {

  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'ri-moon-line' ? 'add' : 'remove'](iconTheme)
}

// Activate / deactivate the theme manually with the button
themeButton.addEventListener('click', () => {
    // Add or remove the dark / icon theme
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(iconTheme)
    // We save the theme and the current icon that the user chose
    try {
        localStorage.setItem('selected-theme', getCurrentTheme())
        localStorage.setItem('selected-icon', getCurrentIcon())
    } catch { /* bỏ qua: trình duyệt chặn lưu trữ */ }
})

/*==================== MENU NGÔN NGỮ ====================*/
/* <details> tự mở/đóng khi bấm nút; thêm: đóng khi bấm ra ngoài hoặc nhấn Esc */
const langMenu = document.getElementById('lang-menu')
if (langMenu) {
    document.addEventListener('click', e => {
        if (langMenu.open && !langMenu.contains(e.target)) langMenu.open = false
    })
    langMenu.addEventListener('keydown', e => {
        if (e.key === 'Escape' && langMenu.open) {
            langMenu.open = false
            langMenu.querySelector('summary').focus()
        }
    })
}

/*==================== PWA: SERVICE WORKER ====================*/
/* Chỉ đăng ký trên HTTPS hoặc localhost (yêu cầu của trình duyệt) */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`${window.SITE_ROOT || ''}sw.js`).catch(() => { /* bỏ qua */ })
    })
}

/*==================== PWA: NÚT CÀI APP ====================*/
/*
 * Chrome / Edge / Android: giữ sự kiện beforeinstallprompt, hiện nút "Cài app" ở chân trang; bấm thì mở hộp cài của trình duyệt.
 * iPhone / iPad (Safari không có sự kiện này): nút mở hướng dẫn Chia sẻ → Thêm vào MH chính.
 * Đang chạy dạng app (standalone) thì không hiện.
 */
;(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
    const host = document.querySelector('.footer__data')
    if (standalone || !host || typeof t !== 'function') return
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const wrap = document.createElement('div')
    wrap.className = 'install'
    wrap.hidden = true
    wrap.innerHTML = `
        <button type="button" class="button button--flex install__btn" id="install-app"><i class="ri-download-2-line"></i> ${t('Cài app Việt Travel')}</button>
        <p class="install__hint" id="install-hint" hidden>${t('Trên iPhone / iPad: bấm nút Chia sẻ của Safari rồi chọn "Thêm vào MH chính".')}</p>`
    host.append(wrap)
    const btn = wrap.querySelector('button')
    const hint = wrap.querySelector('.install__hint')
    btn.setAttribute('aria-controls', 'install-hint')
    let deferred = null
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault()
        deferred = e
        wrap.hidden = false
    })
    window.addEventListener('appinstalled', () => {
        deferred = null
        wrap.hidden = true
    })
    if (ios) wrap.hidden = false
    btn.addEventListener('click', async () => {
        if (deferred) {
            const prompt = deferred
            deferred = null
            prompt.prompt()
            const { outcome } = await prompt.userChoice
            if (outcome === 'accepted') wrap.hidden = true
        } else {
            hint.hidden = !hint.hidden
            btn.setAttribute('aria-expanded', String(!hint.hidden))
        }
    })
})()
