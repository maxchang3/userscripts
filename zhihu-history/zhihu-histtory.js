// ==UserScript==
// @name         知乎历史记录
// @namespace    https://zhangmaimai.com
// @version      0.7
// @description  给知乎添加历史记录
// @author       MaxChang3
// @match        https://www.zhihu.com/
// @match        https://www.zhihu.com/search*
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @grant        none
// @run-at       document-end
// @license      WTFPL
// ==/UserScript==

/** 历史记录限制 */
const HISTORYS_LIMIT = 20
/** 自定义组件 - 弹出层 */
class ZHHDialog extends HTMLElement {
    /** @type {HTMLDialogElement} */
    dialog
    /** @type {HTMLUListElement} */
    historyList
    constructor() {
        super()
        const shadow = this.attachShadow({ mode: 'open' })
        const style = document.createElement('style')
        style.textContent = `
            dialog {
                padding: 0;
                border: 0;
            }
            dialog::backdrop {
                background-color: hsla(0,0%,7%,.65);
            }
            .inner {
                padding: 0 25px;
            }
            .inner:focus{
                outline: none;
            }
            a {
                text-decoration: none;
                color: black;
            }
            ul {
                list-style: none;
                padding-left: 0;
            }
            li {
                padding-bottom: 10px;
            }
            .zhh-type-answer::before {
                content: '问题';
                color: #2196F3;
                background-color: #2196F333;
                font-weight: bold;
                font-size: 13px;
                padding: 1px 4px 0;
                border-radius: 2px;
                display: inline-block;
                vertical-align: 1.5px;
                margin: 0 4px 0 0;
            }
            .zhh-type-article::before  {
                content: '文章';
                color: #004b87;
                background-color: #2196F333;
                font-weight: bold;
                font-size: 13px;
                padding: 1px 4px 0;
                border-radius: 2px;
                display: inline-block;
                vertical-align: 1.5px;
                margin: 0 4px 0 0;
            }`
        const dialog = document.createElement('dialog')
        dialog.innerHTML = `<div class="inner" tabindex="0"></div>`
        // 点击弹出层周围直接关闭
        dialog.addEventListener('click', (e) => {
            if (!e.target.closest('div')) e.target.close()
        })
        const inner = document.createElement('div')
        inner.setAttribute('class', 'inner')
        inner.setAttribute('tabindex', '0')
        const historyList = document.createElement('ul')
        historyList.setAttribute('id', 'zzh-list')
        historyList.innerHTML = `<slot/>`
        this.dialog = dialog
        this.historyList = historyList
        dialog.appendChild(inner)
        inner.appendChild(historyList)
        shadow.appendChild(dialog)
        shadow.appendChild(style)
    }
    showModal() {
        this.dialog.showModal()
    }
}
customElements.define('zh-dialog', ZHHDialog)

/** 自定义组件 - 历史记录卡片 */
class ZHHistoryCard extends HTMLElement {
    /** @type {HTMLElement} */
    button
    constructor() {
        super()
        const shadow = this.attachShadow({ mode: 'open' })
        const style = document.createElement('style')
        style.textContent = `
            .Card {
                background: #fff;
                border-radius: 2px;
                -webkit-box-shadow: 0 1px 3px hsl(0deg 0% 7% / 10%);
                box-shadow: 0 1px 3px hsl(0deg 0% 7% / 10%);
                -webkit-box-sizing: border-box;
                box-sizing: border-box;
                margin-bottom: 10px;
                overflow: hidden;
                padding: 5px 0;
            }
            .zhh-button {
                box-sizing: border-box;
                margin: 0px 18px;
                min-width: 0px;
                -webkit-box-pack: center;
                justify-content: center;
                -webkit-box-align: center;
                align-items: center;
                display: flex;
                border: 1px solid rgba(5, 109, 232, 0.5);
                color: rgb(5, 109, 232);
                border-radius: 4px;
                cursor: pointer;
                height: 40px;
                font-size: 14px;
            }
            `
        const wrapper = document.createElement('div')
        wrapper.setAttribute('class', 'Card')
        const button = document.createElement('div')
        button.setAttribute('class', 'zhh-button')
        button.innerText = '查看历史记录'
        wrapper.append(button)
        this.button = button
        shadow.appendChild(wrapper)
        shadow.appendChild(style)
    }
}
customElements.define('zh-history-card', ZHHistoryCard)

/**
 * 定义一下后面用到的属性类型
 * @typedef {{
 *   authorName: string,
 *   itemId: number,
 *   title: string,
 *   type: 'answter' | 'article',
 *   url?: string
 * }} ZHContentData
 */
/** 给元素绑定添加历史记录的事件
 * @param {Event} e Event
 */
const bindHistoryEvent = (e) => {
    /** @type {HTMLElement | undefined} */
    const ansterItem = e.target.closest('.ContentItem')
    if (!ansterItem) return
    const zop = ansterItem.dataset.zop
    if (!zop) console.error('无法读取回答或文章信息')
    /** @type {ZHContentData} */
    const contentData = JSON.parse(zop)
    /** @type {string} */
    const url = ansterItem.querySelector('.ContentItem-title a').href
    contentData.url = url
    const historysData = window.localStorage.getItem('ZH_HISTORY')
    /** @type {ZHContentData[]} */
    const histroys = historysData
        ? JSON.parse(historysData)
              .filter((histroy) => histroy.itemId !== contentData.itemId)
              .concat(contentData)
        : [contentData]
    if (histroys.length > HISTORYS_LIMIT) histroys.shift()
    window.localStorage.setItem('ZH_HISTORY', JSON.stringify(histroys))
    HISTORYS_CACHE.CNT++
}

/** 从 localStorage 中取回历史记录 @returns {ZHContentData[]} */
const getHistoryList = () =>
    JSON.parse(window.localStorage.getItem('ZH_HISTORY'))

/** 缓存数组 */
const HISTORYS_CACHE = { VALUE: '', CNT: 0, LAST_CNT: -1 }
/** 获取历史记录元素 */
const getHistoryListElements = () => {
    // 做了个简单的缓存机制，如果距离上次点开前进行了若干次点击动作，则重新取回数据
    // 否则就从直接缓存中拿回来
    if (HISTORYS_CACHE.LAST_CNT === HISTORYS_CACHE.CNT)
        return HISTORYS_CACHE.VALUE
    const type2Class = {
        answer: 'zhh-type-answer',
        article: 'zhh-type-article',
    }
    /** @type {string} */
    const ret = getHistoryList()
        .map(
            ({ title, url, authorName, type }) =>
                `<li>
            <a class="${type2Class[type]}" href="${url}">${title}</a> - ${authorName}
        </li>`
        )
        .reverse()
        .join('\n')
    HISTORYS_CACHE.VALUE = ret
    HISTORYS_CACHE.LAST_CNT = HISTORYS_CACHE.CNT
    return ret
}

// 给现存的卡片添加点击事件
document
    .querySelectorAll('.ContentItem')
    .forEach((el) => el.addEventListener('click', bindHistoryEvent))

// 插入历史记录卡片
document
    .querySelector('.Topstory-container')
    .children[1].children[1].insertAdjacentHTML(
        'afterbegin',
        `<zh-history-card></zh-history-card>`
    )

// 插入 dialog
document.body.insertAdjacentHTML('beforeEnd', `<zh-dialog></zh-dialog>`)

/** @type {ZHHDialog} */
const dialog = document.querySelector('zh-dialog')
/** @type {ZHHistoryCard} */
const historyCard = document.querySelector('zh-history-card')

// 给历史记录卡片绑定一个点击事件 实时插入历史记录列表
historyCard.button.addEventListener('click', () => {
    dialog.historyList.innerHTML = getHistoryListElements()
    dialog.showModal()
})

// 监听元素更新，给新添加的内容绑定事件
const targetNode = document.querySelector('.Topstory-recommend')
const config = { childList: true, subtree: true }
/** @type {MutationCallback} */
const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type !== 'childList') continue
        mutation.addedNodes.forEach((node) => {
            /** @type {HTMLElement | undefined} */
            const contentItem = node.querySelector('.ContentItem')
            if (contentItem)
                contentItem.addEventListener('click', bindHistoryEvent)
        })
    }
}
const observer = new MutationObserver(callback)
observer.observe(targetNode, config)
