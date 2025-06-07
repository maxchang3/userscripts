import { readFile, readdir } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
// @ts-check
import GreasyForkURLMap from './greasyfork.json' with { type: 'json' }

/**
 * @typedef {{
 *   name: string,
 *   description: string,
 *   icon: string,
 *   match?: string,
 *   [key: string]: string | undefined
 * }} Metadata
 *
 * @typedef {{
 *  entry: string,
 *  dir: string,
 *  metadata: Metadata,
 * }} UserScript
 */

/**
 * 从文本内容中解析用户脚本元数据
 * @param {string} text - 用户脚本内容
 * @returns {Metadata}
 */
function parseMetadata(text) {
    const userScriptBlockRegex = /\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/
    const match = text.match(userScriptBlockRegex)

    if (!match?.[1]) return { name: '', description: '', icon: '' }

    const metadataBlock = match[1]
    const metadata = { name: '', description: '', icon: '' }
    const lines = metadataBlock.split('\n')

    for (const line of lines) {
        const metaMatch = line.match(/^(?:[ \t]*(?:\/\/)?[ \t]*@)([\w-]+)[ \t]+(.+?)[ \t]*$/)
        if (!metaMatch) continue

        const [, key, value] = metaMatch
        if (!key || !value) continue

        // 优先使用中文本地化
        if (value.startsWith(':zh-CN ') || value.startsWith(':zh ')) {
            const localizedValue = value.replace(/^:zh(?:-CN)? /, '').trim()
            metadata[key] = localizedValue
        } else if (!metadata[key] || !value.includes(':')) {
            metadata[key] = value.trim()
        }
    }

    return metadata
}

/**
 * 从URL中提取根域名
 * @param {string} url - URL字符串
 * @returns {string}
 */
function extractRootDomain(url) {
    if (!url) return ''
    try {
        const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`)
        const parts = hostname.split('.')
        return parts.length > 2 ? parts.slice(-2).join('.') : hostname
    } catch {
        return url
    }
}

/**
 * 获取所有用户脚本目录
 * @returns {Promise<string[]>}
 */
async function getUserScriptDirectories() {
    const items = await readdir('.', { withFileTypes: true })
    return items
        .filter(
            (item) =>
                item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules'
        )
        .map((item) => item.name)
}

/**
 * 从目录中解析用户脚本
 * @param {string} dirName - 目录名称
 * @returns {Promise<UserScript[]>}
 */
async function parseUserScriptsFromDirectory(dirName) {
    try {
        const files = await readdir(dirName, { withFileTypes: true })
        const userScripts = []

        for (const file of files) {
            if (!file.isFile() || !file.name.endsWith('.user.js')) continue

            try {
                const content = await readFile(path.join(dirName, file.name), 'utf-8')
                const metadata = parseMetadata(content)
                userScripts.push({
                    entry: file.name,
                    dir: dirName,
                    metadata,
                })
            } catch (error) {
                console.warn(`读取文件失败 ${path.join(dirName, file.name)}:`, error.message)
            }
        }

        return userScripts
    } catch (error) {
        console.warn(`读取目录失败 ${dirName}:`, error.message)
        return []
    }
}

/**
 * 为用户脚本生成markdown表格行
 * @param {UserScript} script - 用户脚本对象
 * @returns {string}
 */
function generateTableRow(script) {
    const { metadata, entry, dir } = script
    const name = metadata.name || entry.replace('.user.js', '')
    const description = metadata.description || ''
    const icon = metadata.icon || 'https://www.tampermonkey.net/favicon.ico'

    const iconMarkdown = `<img src="${icon}" width="32px" />`
    const installLink = `https://raw.githubusercontent.com/maxchang3/userscripts/main/${dir}/${entry}`

    // 生成安装徽章
    const githubInstallBadge = `[![安装](https://img.shields.io/badge/GithubRaw-安装-black)](${installLink})`

    // 检查Greasy Fork URL
    const greasyforkUrl = GreasyForkURLMap[dir]
    const greasyforkBadge = greasyforkUrl
        ? `[![GreasyFork](https://img.shields.io/badge/GreasyFork-安装-black)](${greasyforkUrl})`
        : ''

    const badges = greasyforkBadge ? `${greasyforkBadge} ${githubInstallBadge}` : githubInstallBadge

    return `| ${iconMarkdown} | **[${name}](${dir})** | ${description} | ${badges} |`
}

async function main() {
    try {
        // 获取所有用户脚本目录
        const directories = await getUserScriptDirectories()
        console.log(`找到 ${directories.length} 个目录`)

        // 从所有目录中解析用户脚本
        const allUserScripts = []
        for (const dir of directories) {
            const scripts = await parseUserScriptsFromDirectory(dir)
            allUserScripts.push(...scripts)
        }

        console.log(`找到 ${allUserScripts.length} 个用户脚本`)

        // 按域名排序
        allUserScripts.sort((a, b) => {
            const aDomain = extractRootDomain(a.metadata.match || '')
            const bDomain = extractRootDomain(b.metadata.match || '')
            return aDomain.localeCompare(bDomain)
        })

        // 读取README模板
        const templatePath = path.join('.scripts', 'README.template.md')
        const readmeTemplate = await readFile(templatePath, 'utf-8')

        // 生成表格行
        const tableRows = allUserScripts.map(generateTableRow).join('\n')

        // 生成最终的 README 内容
        const readmeContent = readmeTemplate.replace('<!-- INJECT_ENTRY_POINT -->', tableRows)

        // 写入 README.md
        await writeFile('README.md', readmeContent, 'utf-8')
        console.log('README.md 生成成功！')
    } catch (error) {
        console.error('生成README时出错:', error.message)
        process.exit(1)
    }
}

// 运行主函数
main()
