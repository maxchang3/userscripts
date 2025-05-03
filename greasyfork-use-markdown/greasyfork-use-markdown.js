// ==UserScript==
// @name         Greasy Fork Use Markdown
// @namespace    https://maxchang.me
// @version      0.0.1
// @description  Sets the default format of the reply area on Greasy Fork to Markdown.
// @author       You
// @match        https://greasyfork.org/*
// @icon            https://greasyfork.org/vite/assets/blacklogo16-DftkYuVe.png
// @run-at       document-idle
// ==/UserScript==

;(() => {
    document
        .querySelectorAll('[id$="markup_markdown"]')
        .forEach((x) => x.click())
})()
