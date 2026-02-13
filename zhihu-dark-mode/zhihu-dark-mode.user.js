// ==UserScript==
// @name       知乎网页版深色模式
// @namespace    https://maxchang.me
// @version      0.0.1
// @description  为知乎网页版提供深色模式适配与自动切换（由于知乎限制，自动切换时仍需手动刷新才能使所有组件生效）。
// @author       Max
// @match        https://www.zhihu.com/*
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @grant        GM_cookie
// ==/UserScript==
// @ts-check
/// <reference types="@types/tampermonkey" />
/**
 * @typedef {'light' | 'dark'} Theme
 */

/**
 * 通过搜索参数设置的主题。
 */
const themeQuery = /** @type {Theme | null}*/ (new URLSearchParams(location.search).get('theme'))

/** @returns {Theme} */
const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
/** @returns {Theme} */

const getCurrentTheme = () =>
    /** @type {Theme | undefined}*/ (document.documentElement.dataset.theme) ?? getSystemTheme()

/**
 * @param {Theme} theme
 */
const setTheme = (theme) => {
    // 如果是搜索参数中的主题，知乎会自动切换，我们不用管理。
    if (themeQuery || theme === getCurrentTheme()) return
    document.documentElement.dataset.theme = theme
    if (theme === 'dark') {
        // 手动添加/清理类，由于是硬编码，很明显会因为某次更新而失效
        document.querySelector('.AppHeader')?.classList.add('css-vuzuz7')
        document.querySelector('.AppHeader-inner')?.classList.add('css-ellrqg')
    } else {
        document.querySelector('.AppHeader')?.classList.remove('css-vuzuz7')
        document.querySelector('.AppHeader-inner')?.classList.remove('css-ellrqg')
    }
    fetch('/?theme=' + theme)
}

const toggleTheme = () => setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark')

const setupTheme = () => {
    const theme = themeQuery ?? getSystemTheme()
    setTheme(theme)
}

setupTheme()

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setupTheme)
