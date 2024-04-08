// ==UserScript==
// @name         “如需浏览，请长按网址复制后使用浏览器访问”——Anti Wechat Anti External Links
// @namespace    https://zhangmaimai.com
// @version      1.1
// @description  微信PC内置浏览器复制链接或使用其他浏览器打开也提示“如需浏览，请长按网址复制后使用浏览器访问”，本脚本应用后可以直接跳转目标网址。
// @author       Max39
// @match        https://weixin110.qq.com/cgi-bin/mmspamsupport-bin/newredirectconfirmcgi?*
// @grant         GM_addStyle
// @run-at       document-start
// ==/UserScript==

GM_addStyle(`
body { display: none !important; }
`)

document.addEventListener('DOMContentLoaded', function() {
    const targetUrl = document.querySelector(".weui-msg__desc").innerText;
    window.location.href = targetUrl;
})
