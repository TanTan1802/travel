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


/*==================== CHANGE BACKGROUND HEADER ====================*/
function scrollHeader(){
    const header = document.getElementById('header')
    if(this.scrollY >= 100) header.classList.add('scroll-header'); else header.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)
scrollHeader.call(window) // cập nhật ngay khi tải lại trang ở vị trí đã cuộn

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
    window.addEventListener('resize', update)
    update()
})

/*==================== SHOW SCROLL UP ====================*/
function scrollUp(){
    const scrollUp = document.getElementById('scroll-up');
    if(this.scrollY >= 200) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        const sectionId = current.getAttribute('id')
        const link = document.querySelector('.nav__menu a[href*="#' + sectionId + '"]')
        if(!link) return

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            link.classList.add('active-link')
        }else{
            link.classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*==================== SCROLL REVEAL ANIMATION ====================*/
const sr = ScrollReveal({
    distance: '60px',
    duration: 2800,
})


sr.reveal(`.home__data, .home__social-link, .home__info,
           .discover__container,
           .experience__data, .experience__overlay,
           .explore__search, .explore__filters,
           .dest-hero__content, .dest-facts,
           .food-card, .activity-card, .tip-item,
           .footer__data, .footer__rights`,{
    origin: 'top',
    interval: 100,
})

sr.reveal(`.about__data,
           .season__description,
           .subscribe__description,
           .overview__data`,{
    origin: 'left',
})

sr.reveal(`.about__img-overlay,
           .subscribe__form,
           .overview__img`,{
    origin: 'right',
    interval: 100,
})

/*==================== DARK LIGHT THEME ====================*/
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'ri-sun-line'


const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')


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
    localStorage.setItem('selected-theme', getCurrentTheme())
    localStorage.setItem('selected-icon', getCurrentIcon())
})

/*==================== PWA: SERVICE WORKER ====================*/
/* Chỉ đăng ký trên HTTPS hoặc localhost (yêu cầu của trình duyệt) */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`${window.SITE_ROOT || ''}sw.js`).catch(() => { /* bỏ qua */ })
    })
}
