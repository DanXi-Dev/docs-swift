import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "旦夕开发者文档",
    description: "iOS端的旦夕开发者文档",
    lang: 'zh-CN',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: '首页', link: '/' },
            { text: '示例', link: '/examples/api-examples' }
        ],

        sidebar: [
            {
                text: '示例',
                items: [
                    { text: 'Markdown Examples', link: '/examples/markdown-examples' },
                    { text: 'Runtime API Examples', link: '/examples/api-examples' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/DanXi-Dev/DanXi-swift' }
        ]
    }
})
