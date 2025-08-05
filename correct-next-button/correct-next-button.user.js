// ==UserScript==
// @name         矫正 b 站自动连播按钮 - 分P、合集、单视频开关分别独立
// @namespace    http://maxchang.me
// @version      0.2.0
// @description  关于我不想要哔哩哔哩自动连播只想在分 P 中跳转但是阿 b 把他们混为一谈这件事。
// @author       MaxChang3
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

// 自定义 logger
const logger = {
    log: (...args) => console.log('[Correct-Next-Button]', ...args),
    error: (...args) => console.error('[Correct-Next-Button]', ...args),
}

/**
 * 给没有自动连播按钮的页面添加一个开关按钮（目前只考虑了播放列表）
 */
const prepareSwitchButton = () => {
    const continuousBtn = document.createElement('div')
    continuousBtn.className = 'continuous-btn'

    const txt = document.createElement('div')
    txt.className = 'txt'
    txt.textContent = '自动连播'

    const switchBtn = document.createElement('div')
    switchBtn.className = 'switch-btn'

    const switchBlock = document.createElement('div')
    switchBlock.className = 'switch-block'

    switchBtn.appendChild(switchBlock)
    continuousBtn.appendChild(txt)
    continuousBtn.appendChild(switchBtn)

    const headerLeft = document.querySelector('.header-left')
    headerLeft?.appendChild(continuousBtn)
    GM_addStyle(
        `.switch-btn{--switch-btn-width:30px;--switch-btn-height:20px;--switch-btn-gap:2px;cursor:pointer;position:relative;display:inline-block;box-sizing:border-box;border-radius:calc(var(--switch-btn-height)/ 2);border-radius:calc(var(--switch-btn-height)/ 2);width:var(--switch-btn-width);width:var(--switch-btn-width);height:var(--switch-btn-height);height:var(--switch-btn-height);background-color:var(--graph_bg_thick);background-color:var(--graph_bg_thick);transition:.2s}.switch-btn .switch-block{position:absolute;border-radius:50%;top:var(--switch-btn-gap);top:var(--switch-btn-gap);left:var(--switch-btn-gap);left:var(--switch-btn-gap);width:calc(var(--switch-btn-height) - calc(2 * var(--switch-btn-gap)));width:calc(var(--switch-btn-height) - calc(2 * var(--switch-btn-gap)));height:calc(var(--switch-btn-height) - calc(2 * var(--switch-btn-gap)));height:calc(var(--switch-btn-height) - calc(2 * var(--switch-btn-gap)));background-color:var(--text_white);background-color:var(--text_white);transition:.2s}.switch-btn.on{background:var(--brand_blue);background:var(--brand_blue)}.switch-btn.on .switch-block{left:calc(calc(var(--switch-btn-width) - var(--switch-btn-height)) + var(--switch-btn-gap));left:calc(calc(var(--switch-btn-width) - var(--switch-btn-height)) + var(--switch-btn-gap))}.continuous-btn{cursor:pointer;display:flex;align-items:center}.continuous-btn .txt{color:var(--text3);color:var(--text3);font-size:14px;margin-right:4px}`
    )
    return switchBtn
}

const type = { VIDEO: 0, MULTIPART: 1, COLLECTION: 2, PLAYLIST: 3 }

const correctNextButton = (app) => {
    const videoData = app.videoData
    if (!videoData) {
        logger.error('videoData is not available')
        return
    }
    const { videos: videosCount } = videoData
    const pageType =
        videosCount > 1
            ? type.MULTIPART
            : app.isSection
              ? type.COLLECTION
              : app.playlist?.type
                ? type.PLAYLIST
                : type.VIDEO
    const pageStatus = app.continuousPlay
    const userStatus = GM_getValue(pageType)
    if (userStatus === undefined) {
        GM_setValue(pageType, pageStatus)
    } else if (pageStatus !== userStatus) {
        app.setContinuousPlay(userStatus)
    }
    logger.log(pageType, {
        collection: GM_getValue(type.COLLECTION),
        multipart: GM_getValue(type.MULTIPART),
        video: GM_getValue(type.VIDEO),
    })
    let switchButton = document.querySelector('.switch-btn')
    if (!switchButton) {
        switchButton = prepareSwitchButton()
        switchButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            switchButton.classList.toggle('on')
            app.setContinuousPlay(!app.continuousPlay)
            GM_setValue(pageType, app.continuousPlay)
        })
        switchButton.classList.toggle('on', app.continuousPlay)
    } else {
        switchButton.addEventListener('click', () => {
            GM_setValue(pageType, !app.continuousPlay)
        })
    }
}

let lastVueInstance = null
const hookVueInstance = (vueInstance) => {
    if (!vueInstance || vueInstance === lastVueInstance) return
    lastVueInstance = vueInstance
    correctNextButton(vueInstance)
    // hook loadVideoData 保证从推荐视频加载新视频时重新判断视频类型
    if (!vueInstance.__correctNextButtonHooked) {
        const __loadVideoData = vueInstance.loadVideoData
        vueInstance.loadVideoData = function () {
            return __loadVideoData.call(this).then(
                (res) => {
                    correctNextButton(vueInstance)
                    return res
                },
                (error) => Promise.reject(error)
            )
        }
        vueInstance.__correctNextButtonHooked = true
    }
}

const observeVueInstance = () => {
    const appContainer = document.querySelector('#app')
    if (!appContainer) return
    if (appContainer.__vue__) {
        hookVueInstance(appContainer.__vue__)
    }
    const observer = new MutationObserver(() => {
        const app = document.querySelector('#app')
        if (app?.__vue__) {
            hookVueInstance(app.__vue__)
        }
    })
    observer.observe(appContainer, { childList: true, subtree: true })
}

observeVueInstance()
