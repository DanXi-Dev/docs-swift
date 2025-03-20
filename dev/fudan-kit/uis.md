# UIS 认证服务

:::tip
读者应熟悉 HTTP 协议和 Swift 的并发机制。
:::

## SSO：UIS 的认证机制

### 单点登录（SSO）的概念

> 这里为了易读性，对 SSO 的机制做了简化，仅在概念上做了介绍，会有一些不那么精确甚至错误的表述。读者如果希望了解完整的 SSO 机制，可以去阅读其他资料。

我们自己做一个小网站时，一般是自己负责认证服务，即用户登录的部分。我们会直接把用户名、（加密后的）密码和其他业务数据一起存到数据库中。对于一个个人网站，乃至一个几人合作开发的小网站，这当然没有问题。

但是在一些大的企业中，有数十个独立的服务，例如一个大学会提供选课、校园卡、校车、学生信息、课表、图书馆预约等服务。这些服务由不同的团队开发，采用不同的技术栈，用不同的方式部署。让它们共用同一个登录逻辑，即都去访问同一个用户信息数据库显然不合适，开发者会崩溃。而让它们各自分别提供登录逻辑，那么用户就需要保存几十套密码，用户会崩溃。因此有必要 **将登录逻辑拆分出来独立运行，并定义一个登录模块和其他服务的清晰接口**。

**这就是单点登录（SSO）的概念**。单点登录中有一个认证服务器和很多业务服务器。当用户需要访问业务服务器时，他会被重定向到认证服务器进行认证。认证完成后，认证服务器会将用户再次重定向到业务服务器，带上访问令牌。业务服务器看到访问令牌，就能鉴别用户的身份，并提供服务。这其中涉及到多次 HTTP 302 跳转。

### UIS 系统的鉴权流程

UIS 系统位于 `uis.fudan.edu.cn`，我们以用户登录教务服务网站 `jwfw.fudan.edu.cn` 为例说明。为了简化表达，域名被简写为 `[uis], [jwfw]`。

1. 用户访问 `[jwfw]`，重定向到 `[uis]?service=[jwfw]`
2. 用户访问 `[uis]?service=[jwfw]`，获得一个登录表单
3. 用户填写登录表单，并 `POST [uis]?service=[jwfw]`，重定向到 `[jwfw]?ticket=xxx`
4. 用户访问 `[jwfw]?ticket=xxx`，教务服务网站拿到 Ticket，并向 UIS 核实，核实确认用户身份后提供业务数据，如考试成绩。

注意：以上只是第一次登录教务服务时的流程。后续一段时间（一般是 2 小时）内再次登录教务服务，由于服务器通过 Cookie 对你的浏览器进行了标识，因此不需要再次登录。

### UIS 系统的登录流程

上节提到 UIS 系统登录的核心流程就是 **服务器提供一个表单，用户填写表单并上传，然后服务器签发 Ticket**。本节介绍这个表单是什么样的，如何填写。

我们知道 HTML 里处理用户输入的元素是 `input`，因此我们把 UIS 中所有 `input` 元素全部提取出来看看：

```html
<input id="username" name="username" class="IDCheckLoginName" type="text" value=""/>
<input id="password" name="password" class="IDCheckLoginPassWord" type="password" value="" autocomplete="off"/>
<input id="idcheckloginbtn" class="IDCheckLoginBtn" type="button" value="登录">

<input type="hidden" name="lt" value="LT-1***4-d******6-y**J-cas"/>
<input type="hidden" name="dllt" value="userNamePasswordLogin"/>
<input type="hidden" name="execution" value="e2s1"/>
<input type="hidden" name="_eventId" value="submit"/>
<input type="hidden" name="rmShown" value="1">
```

可以看到，有关键的两个 `input` 分别对应用户名和密码。有一个按钮对应提交表单。还有一些隐藏的 `input`，我们猜测这是防止 CSRF 的。

在提交表单时，只需要

- 填写用户名和密码
- 忽略提交表单按钮对应的 `input`
- 将隐藏的 `input` 的 `name` 和 `value` 原样填入表单即可

表单填写好，`POST` 上去，就拿到了 Ticket。

## `AuthenticationAPI` 中提供的认证机制

对 UIS 系统的 API 封装都位于 `AuthenticationAPI` 中。

### 检查用户名密码

```swift
func checkUserCredential(username: String, password: String) async throws -> Bool
```

这个 API 非常简单，就是检查用户的用户名和密码是否正确。这个 API 只用在登录界面。

### 通过 URL 获取数据

```swift
func authenticateForData(_ url: URL) async throws -> Data
```

我们之前说过，UIS 的登录流程是经过一系列跳转后，业务系统最终返回数据。我们一般在外部不关心登录的流程，只需要获取到业务数据然后解析它即可，因此封装了这么一个 API，返回的是 `Data`。

### 通过 URL 获取 Ticket

```swift
func authenticateForURL(_ url: URL) async throws -> URL
```

有些时候我们不需要别人帮我们获取数据，我们只希望获取一个有 Ticket 的 URL，然后我们自己去通过这个 URL 获取数据。这个的应用场景在于 `SafariController`，其不允许我们控制它的任何逻辑，只允许提供一个 URL。因此这时这个 API 就有用了。

在实现方面，`URLSessionDelegate` 可以被注入一个网络请求中。正常的网络请求是 URL Loading System 帮我们处理所有的 302 跳转，但是 Delegate 可以拦截这些跳转，并提前返回跳转的 URL。

## `Authenticator` 的并发保护

在旦夕 App 中，多个服务同时调用 `AuthenticationAPI` 会出现以下问题：

- 如果同一个服务（如教务服务）里多个请求都调用 `AuthenticationAPI`，并且在时间上接近，可能会导致对 UIS 进行不必要的多次请求。教务服务只需要登录一次就好了。~~多次对 UIS 的重复请求可能导致我们的 App 被信息办拉黑~~。

- 更严重的问题是，我们之前讲过 UIS 的登录逻辑是先索取一个表单，填好再把表单交给服务器，但是如果并发地对同一个域名进行登录，就可能会出现以下情况：

  > 1. （线程1）索取表单1
  > 2. （线程2）索取表单2
  > 3. （线程1）提交表单1

  从 UIS 的视角看，你索取了表单 2，但提交了表单 1，这对不上，就会拒绝你的登录请求。

因此需要对 UIS 登录系统进行并发保护。对于同一个服务的请求而言，有两种情况：

1. 在这个服务没有登录，因此需要登录
2. 在这个服务已经登录了，可以直接访问得到数据，不经过 UIS

这其实是一个 **读写锁问题**，第一种请求是写者，第二种请求是读者。任何时候都只能有一个写者，但可以有多个读者，且读者和写者不能同时工作。

因此我们建立 `Authenticator` 以解决并发问题。它内部维护一个 `hostLastLoggedInDate: [String: Date]`，同一个服务一般默认登录有效期是 2 小时。在 2 小时内，访问数据不会经过 UIS，而是直接发给业务服务器，出错后才会再尝试 UIS 登录。

```swift
func authenticateWithResponse(_ request: URLRequest, manualLoginURL: URL? = nil) async throws -> (Data, URLResponse)
```

在外部服务请求以上 API 时，会进行并发保护。由于 Swift 没有内置的和异步系统兼容的读写锁，我们使用 `Queue` 来做这个。它可能看起来比较复杂，但是还是容易理解的，只需要记住我们刚才提到过的设计目标就可以。

在以上的封装下，业务系统基本不需要考虑 UIS 登录问题，只需要调用 API 然后等着数据返回解析数据就可以了。
