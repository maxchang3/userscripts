// ==UserScript==
// @name         只用小红书搜索 - JS 版
// @namespace    https://maxchang.me
// @version      0.0.3
// @description  使用小红书网页版作为搜索引擎，隐藏主页的时间线，搜索框页面居中。RAASE™ (Rednote as a Search Engine)
// @author       Max Chang
// @license      MIT
// @icon         https://fe-video-qc.xhscdn.com/fe-platform/ed8fe781ce9e16c1bfac2cd962f0721edabe2e49.ico
// @grant        unsafeWindow
// @grant        GM_addStyle
// @run-at       document-start
// @include      https://www.xiaohongshu.com/*
// ==/UserScript==

/// <reference types="tampermonkey" />
// @ts-check

console.log('script loaded', performance.now())
;(() => {
    const STYLE_CSS = `
    #mfContainer {
      display: none;
    }
    .mask-paper {
      background: none!important;
      backdrop-filter: none!important;
      min-height: 100vh;
    }
    .input-box {
      top: 35%;
      left: 55% !important;
    }
    .side-bar {
      z-index: 999;
    }
    @media screen and (max-width: 695px) {
      .input-box {
        width: 80% !important;
        padding: 0 84px 0 16px !important;
      }
      .min-width-search-icon {
        display: none !important
      }
      .input-button {
        opacity: 1 !important;
      }
      #search-input {
        padding: 10px;
      }
    }
  `

    /** @type {HTMLStyleElement | null} */
    let styleNode = null

    function injectStyles() {
        if (styleNode) return
        const node = GM_addStyle(STYLE_CSS)
        styleNode = node
    }

    function removeStyles() {
        if (!styleNode) return
        styleNode.remove()
        styleNode = null
    }

    /**
     * @param {string} pathname
     */
    function isExploreRoute(pathname) {
        return pathname === '/explore' && !pathname.endsWith('/')
    }

    /**
     * 根据当前 URL 应用或移除样式。
     * @param {string} [pathname]
     */
    function applyStylesForRoute(pathname) {
        const path = pathname || location.pathname
        if (isExploreRoute(path)) {
            injectStyles()
        } else {
            removeStyles()
        }
    }

    // 优先使用 Navigation API
    if ('navigation' in unsafeWindow) {
        // @ts-ignore
        unsafeWindow?.navigation?.addEventListener('navigate', (e) => {
            applyStylesForRoute(new URL(e?.destination?.url)?.pathname)
            console.log('[navigate]', {
                url: e.destination?.url,
                type: e.navigationType,
                canTransition: e.canTransition,
            })
        })
    } else {
        /**
         * @param {'pushState'|'replaceState'} type
         */
        function proxyHistoryMethod(type) {
            const original = history[type]
            history[type] = new Proxy(original, {
                apply(target, thisArg, argArray) {
                    const ret = Reflect.apply(target, thisArg, argArray)
                    unsafeWindow.dispatchEvent(new Event('urlchange'))
                    return ret
                },
            })
        }

        proxyHistoryMethod('pushState')
        proxyHistoryMethod('replaceState')

        // 兼容原生的后退/前进（popstate）事件
        unsafeWindow.addEventListener('popstate', () => {
            unsafeWindow.dispatchEvent(new Event('urlchange'))
        })

        unsafeWindow.addEventListener('urlchange', () => applyStylesForRoute())
    }

    applyStylesForRoute()
})()
