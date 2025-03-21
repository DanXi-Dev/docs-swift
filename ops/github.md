# GitHub 工作流

:::info
读者应熟悉 Git 的基本操作，包括提交、分支管理、rebase、push 等。
:::

GitHub 是一个代码托管网站，你可以将你的项目代码托管在上面。但是如果你只是把它当成一个「代码云盘」在用，那么你就没有值回票价（~~尽管 GitHub 也不收钱~~）。如果善于利用 GitHub 提供的各项功能，就可以把整个工作流放到 GitHub 上。

GitHub 有很多功能，比如 Issue、PR 等等，这些功能可以帮助你更好地管理你的项目。我们会简单介绍一下 Issue 和 PR，以及它们在我们项目工作流中的使用。

:::details
GitHub 有一些很实用的功能，但是我们这个项目通常用不到，但旦夕的其他项目时常用到。它们包括：

- Actions。这是 GitHub 提供的 CI 服务。我们项目的 CI 服务是在 Xcode Cloud 上的。
- Releases。这是 GitHub 提供的版本发布功能。我们项目的版本发布是直接在 App Store 上的。
- Milestones。这是 GitHub 提供的里程碑功能，用来记录下个版本发布前还有哪些工作需要完成。~~我们没有项目经理，通常采用意识流开发，发版前很少有什么一定要完成的工作，也没有工作规划，所以不需要里程碑。~~
:::

## Issue 管理

Issue，英文原意是「问题」，在 GitHub 上，它可以用来记录项目中的问题、任务、需求等等。以下是几个 Issue 的例子：

- 首页校车时刻表显示的时间错误
- 添加校园卡余额查询功能
- 优化树洞首页加载速度

可以看到，Issue 可以充当一个「备忘录」，记录项目中接下来要做的工作。

:::tip
我们推荐所有想到的新功能、遇到的 bug 在经过内部讨论后都应该记录到 Issue 中，以免自己忘记。
:::

Issue 创建以后自带一个「评论区」板块，任何人都可以在这里发言。

:::tip
**我们推荐将开发过程中遇到的重要问题或阶段性成果记录到 Issue 中，以免丢失。** 此类内容包括但不限于：

- 修复 bug 中找到的重要线索
- 重构代码的思路
- 找到的有用的第三方库
:::

由于 Issue 里的回复周期较长，不推荐在 Issue 里进行实时讨论。如果有问题需要讨论，可以在 Issue 里提出，然后在群里进行展开讨论，并将讨论结果记录在 Issue 里。

~~GitHub 别人一回复就给我发邮件的毛病真的该改改了，我的收件箱都要塞满了。~~

Issue 可以 Close，Close 代表这个 Issue 已经完成了。Close as not planned 代表这个 Issue 不会被做了，可以直接 Close。Close as completed 代表这个 Issue 已经完成了，我们更推荐用链接 PR（见后文）的方式来 Close 此类 Issue。

### Issue 类别和标签

GitHub 里可以给 Issue 添加类别和标签，用于分类。

类别包括：

- Feature：新功能。
- Bug：~~what can I say?~~
- Task：说实话我也不知道这是什么，我们目前把这个当垃圾桶。

标签有很多，挑一些常用的出来说：

- `good first issue`：这个 Issue 比较简单适合新手。
- `help wanted`：这个 Issue 比较复杂，没人知道怎么做，需要帮助。
- `waiting for upstream`：这个 Issue 等待上游项目的更新（上游项目包括后端和依赖库）。
- `internal`：这个 Issue 是内部提出的，和用户没关系，例如为树洞管理员提供的功能等。

### Assign

Issue 可以指派给某个人，这个人就是 Issue 的「负责人」。负责人负责跟进 Issue 的进展，以及在 Issue 里回复问题。

:::warning 重要
Issue 指派是记录工作分配的核心方式。**为了避免无人负责和重复工作**，需要注意以下几点：
- Issue 的负责人应该积极开发手头的 Issue，不要让 Issue 一直处于「待定」状态。
- Issue 的负责人应该在不能完成 Issue 的时候及时告知，并在 GitHub 里 unassign，以便其他人接手。
- 在 Issue 列表里挑选工作时尽量挑选自己负责的或无人负责的 Issue。对于有 Assignee 的 Issue，**务必与其协商后再接手**，避免重复工作。
- 当自己被指定开发，或自己希望开发一个功能时，**一定要在 GitHub 里 assign 自己，避免别人重复工作**。
:::

## PR 流程

PR，全称 Pull Request，是 GitHub 上的一个功能，用于提交代码。当你完成了一些工作，想要提交这些工作的时候，就用 PR。PR 提交后，会有人审核你的工作是否符合项目标准并决定是否接受它。如果接受它，那么它就会被纳入项目中，成为项目的一部分，称为 Merge。

:::warning 重要
我们的项目不能直接在 `main` 分支上提交。当你在开发一个功能时，你应该新建一个分支，在这个分支上开发，开发完成后提交 PR。
:::

### 链接 Issue

当你的 PR 和一个 Issue 直接相关时，你应该把它们链接起来。链接的方式是在 PR 的描述里写 `close #123`，参见 [GitHub 文档](https://docs.github.com/zh/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)。

当 PR 和 Issue 链接起来后，当 PR 被 Merge 时，Issue 会被自动 Close。这样就会避免已经被完成的 Issue 仍然挂在 Issue 列表里。

:::warning 重要
如果 PR 有对应的 Issue 存在，**一定要将 PR 和 Issue 关联起来。** 这样可以更好地追踪工作进度，避免遗漏。
:::

### Review

Review 是 PR 的重要环节。在 Review 中，你的代码会被其他人检查，他们会提出问题、建议，或者直接通过你的 PR。你可以在提交 PR 时点击右侧的 Reviewer 面板请求项目负责人来 Review 你的代码。

Review 时，其他人会在你的代码上直接提出评论，你可以在这些评论中~~和他们吵架~~回复，或按照评论修改你的代码。当修改完成后，将相关的评论标记为 Resolved，然后重新请求 Review。

如果 Review 最终没有问题，它会被 Approve，这时你就可以点击 Merge 来合并你的代码了。

## 一个标准的工作流程

1. 去 Issue 列表里选择一个 Issue，或者新开一个 Issue
2. 在 Issue 里 Assign 自己
3. 新建一个分支，开始写代码
4. 写好代码后，push 到 GitHub
5. 提交 PR 并请求别人 Review
6. 根据别人的 Review 修改代码，再次 push
7. Review 通过后，Merge PR