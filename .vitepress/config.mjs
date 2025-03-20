import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "旦夕 App 开发者指南",
    description: "旦夕 App 文档库",
    lang: 'zh-CN',
    base: '/docs-swift/',
    cleanUrls: true,
    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { text: '开发', link: '/dev/intro' },
            { text: '运营', link: '/ops/app-store' }
        ],
        sidebar: [
            {
                text: '开发',
                items: [
                    { text: '快速入门', link: '/dev/getting-started' },
                    { text: 'App 架构', link: '/dev/intro' },
                    { 
                        text: 'Utils',
                        collapsed: true,
                        items: [
                            { text: '全局配置中心', link: '/dev/utils/config-center' },
                            { text: 'LocatableError', link: '/dev/utils/locatable-error' }
                        ]
                    },
                    { 
                        text: 'View Utils',
                        collapsed: true,
                        items: [
                            { text: 'App 导航', link: '/dev/view-utils/navigation' },
                            { text: '异步组件', link: '/dev/view-utils/async' },
                            { text: '图片查看', link: '/dev/view-utils/image' }
                        ]
                    },
                    { 
                        text: 'DanXi Kit',
                        collapsed: true,
                        items: [
                            { text: '后端鉴权', link: '/dev/danxi-kit/authentication' },
                            { text: 'API 封装', link: '/dev/danxi-kit/api' },
                            { text: '对象和 JSON 解码', link: '/dev/danxi-kit/entity-decode' }
                        ]
                    },
                    { 
                        text: 'DanXiUI',
                        collapsed: true,
                        items: [
                            { text: '渲染 UI 的 Presentation', link: '/dev/danxi-ui/presentation' },
                            { text: 'Environment Object', link: '/dev/danxi-ui/environment-object' },
                            { text: '存储信息的 Store', link: '/dev/danxi-ui/store' },
                            { text: '功能丰富的树洞页', link: '/dev/danxi-ui/forum-hole' }
                        ]
                    },
                    { 
                        text: 'Fudan Kit',
                        collapsed: true,
                        items: [
                            { text: 'UIS 认证服务', link: '/dev/fudan-kit/uis' },
                            { text: 'API、缓存和对象', link: '/dev/fudan-kit/api-entity-store' },
                            { text: '课程表管理', link: '/dev/fudan-kit/course-model' }
                        ]
                    },
                    { 
                        text: 'FudanUI',
                        collapsed: true,
                        items: [
                            { text: '课程表页面', link: '/dev/fudan-ui/calendar' },
                            { text: '首页布局', link: '/dev/fudan-ui/homepage' }
                        ] 
                    }
                ]
            },
            {
                text: '运营',
                items: [
                    { text: 'GitHub 工作流', link: '/ops/github' },
                    { text: 'App 分发', link: '/ops/app-store' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/DanXi-Dev/DanXi-swift' }
        ]
    },
    markdown: {
        container: {
            tipLabel: '提示',
            warningLabel: '警告',
            dangerLabel: '危险',
            infoLabel: '说明',
            detailsLabel: '详细信息'
        }
    }
})
