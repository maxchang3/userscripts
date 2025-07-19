// https://github.com/lzghzr/TampermonkeyJS/blob/master/libBilibiliToken/libBilibiliToken.ts
/// <reference types="@types/tampermonkey" />
interface pollData {
    is_new: boolean
    mid: number
    access_token: string
    refresh_token: string
    expires_in: number
    token_info: pollDataTokenInfo
    cookie_info: pollDataCookieInfo
    sso: string[]
}

interface pollDataCookieInfo {
    cookies: pollDataCookieInfoCooky[]
    domains: string[]
}

interface pollDataCookieInfoCooky {
    name: string
    value: string
    http_only: number
    expires: number
}

interface pollDataTokenInfo {
    mid: number
    access_token: string
    refresh_token: string

    expires_in: number
}

// biome-ignore lint/suspicious/noExplicitAny: no can do bro
interface XHROptions extends Tampermonkey.Request<any> {
    GM?: boolean
    withCredentials?: boolean
}

interface XHRResponse<T> {
    // biome-ignore lint/suspicious/noExplicitAny: no can do bro
    response: XMLHttpRequest | Tampermonkey.Response<any>
    body: T
}

declare global {
    interface Window {
        __BiliUser__: {
            isLogin: boolean
        }
    }
    class BilibiliToken {
        static loginAppKey: string
        static appKey: string
        static __secretKey: string
        mobiApp: string
        platform: string
        build: string
        public Slocale: string
        /**
         * 请求头
         */
        public headers: Record<string, string>
        /**
         * 对参数签名
         */
        public static signQuery(params: string, ts?: number, secretKey?: string): string
        /**
         * 获取此时浏览器登录账号 Token
         */
        // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
        public getToken(): Promise<pollData | void>
        /**
         * 使用 Promise 封装 xhr 请求
         * 由于上下文环境的限制，GM_xmlhttpRequest 需要单独处理
         * fetch 与 GM_xmlhttpRequest 的兼容实现过于复杂，因此选择使用 XMLHttpRequest
         */
        public static XHR<T>(XHROptions: XHROptions): Promise<XHRResponse<T> | undefined>
    }

    type SelectorOptions = {
        timeout?: number
    }

    const GmExtra: {
        querySelector<K extends keyof HTMLElementTagNameMap>(
            root: ParentNode,
            selectors: K,
            options?: SelectorOptions
        ): Promise<HTMLElementTagNameMap[K] | null>
        querySelector<K extends keyof SVGElementTagNameMap>(
            root: ParentNode,
            selectors: K,
            options?: SelectorOptions
        ): Promise<SVGElementTagNameMap[K] | null>
        querySelector<E extends Element = Element>(
            root: ParentNode,
            selectors: string,
            options?: SelectorOptions
        ): Promise<E | null>
    }
}

export {}
