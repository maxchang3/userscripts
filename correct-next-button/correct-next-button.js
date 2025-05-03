// ==UserScript==
// @name         矫正 b 站自动连播按钮 - 分P、合集、单视频开关分别独立
// @namespace    https://maxchang.me
// @version      0.4
// @description  关于我不想要哔哩哔哩自动连播只想在分 P 中跳转但是阿 b 把他们混为一谈这件事。
// @author       MaxChang3
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

;(function () {
    // 自定义 logger
    const logger = {
        log: (...args) => console.log('[Correct-Next-Button]', ...args),
        error: (...args) => console.error('[Correct-Next-Button]', ...args),
    }
    const type = {
        VIDEO: 'video',
        MULTIPART: 'multipart',
        COLLECTION: 'collection',
    }
    const correctNextButton = (app) => {
        const videoData = app.videoData
        const { videos: videosCount } = videoData
        const pageType =
            videosCount > 1 ? type.MULTIPART : app.isSection ? type.COLLECTION : type.VIDEO
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
        document.querySelector('.switch-btn').addEventListener('click', () => {
            GM_setValue(pageType, !app.continuousPlay)
        })
    }
    const main = () => {
        if (location.href.startsWith('https://www.bilibili.com/medialist/play/')) {
            // todo
        } else {
            const interval = setInterval(() => {
                const app = document.querySelector('#app')
                if (app?.__vue__?.videoData) {
                    clearInterval(interval)
                    correctNextButton(app.__vue__)
                    // hook loadVideoData 保证从推荐视频加载新视频时重新判断视频类型
                    const __loadVideoData = app.__vue__.loadVideoData
                    app.__vue__.loadVideoData = () =>
                        new Promise((resolve, rejct) =>
                            __loadVideoData.call(this).then(
                                (res) => {
                                    correctNextButton(app.__vue__)
                                    resolve(res)
                                },
                                (error) => rejct(error)
                            )
                        )
                }
            }, 500)
        }
    }
    main()
})()
