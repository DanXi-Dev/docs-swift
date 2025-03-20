# 旦夕社区的 API 封装

这篇文档主要是在说树洞、蛋壳等旦夕自营社区服务中，如何对接后端的 API 接口。

## Swift 标准库中进行 HTTP 请求的基本 API

:::info
这部分属于基础知识性的内容，和旦夕项目没有直接的关系，如果熟悉 Swift 标准库可以直接跳到下一节。
:::

Swift 的标准库（Foundation）中内置有对 HTTP 请求的支持，封装较少且功能完善，因此我们优先考虑使用 Foundation 提供的 API 来进行 HTTP 请求。目前没有必要引入第三方网络框架。

下面简单介绍一下使用 Foundation 进行 HTTP 请求的流程，这部分在 Foundation 中被称为 [URL Loading System](https://developer.apple.com/documentation/foundation/url_loading_system)。在这之前，读者应该熟悉 URL 的组成、HTTP 协议、Cookie 等基本概念。

### 一个 HTTP 请求的基本流程

要进行一个 HTTP 请求，基本的流程是：

- **构建出请求的 URL。** 有些简单的 URL 可以直接敲字符串敲出来， 但是有些复杂的 URL 有很多请求参数，请求参数里含有空格等特殊字符的时候还要进行转义，这种 URL 应该用程序来处理。下面分别是一个简单和复杂的 URL 例子。

```text
https://forum.fduhole.com/api/divisions

https://forum.fduhole.com/api/search?query=Hello%20World&category=technology&page=2&sort=desc&filter=recent5&lang=zh-CN&date_from=2023-01-01&date_to=2023-12-31&limit=50
```

- **构建出 HTTP 请求**。一个完整的 HTTP 请求不止包含 URL，还包含 HTTP 方法、HTTP Header、HTTP Body 等部分。
- **发送 HTTP 请求。**
- **接收并处理 HTTP 响应。** HTTP 响应包含返回码，Header 和 Body 几个部分。

### 如何用代码实现一个 HTTP 请求

接下来我们会用一个在树洞里发帖的例子来帮助大家熟悉 Swift 里 URL Loading System 中的各种概念。

:::info
这个例子里的树洞 API 是虚构的，真正的树洞 API 请去看 API 文档。
:::

#### 构建请求 URL

首先，我们要构造请求的 URL。我们发帖是必须提供一个分区的，分区的 ID 会写在 URL 参数里。

```swift
let divisionId: Int // 这个变量是分区的 ID

var components = URLComponents(string: "https://forum.fduhole.com/api/post")!
components.queryItems = [
  URLQueryItem(name: "divisionId", value: divisionId)
]
let url = components.url!
```

可以看到，`URLComponents` 是一个“半成品” URL，它经过一个组装过程后变成真的 `URL`。

:::tip
对于简单的、不需要构建过程的 URL，也可以直接用字符串构建，比如

```swift
let url = URL(string: "https://forum.fduhole.com/api/divisions")
```
:::

#### 构建 HTTP 请求

我们已经提供了分区的 ID 参数，接下来该提供发帖内容了。由于发帖内容可能很长，因此不适合放在 URL 参数里，通常会把它放到 HTTP Body 里。

```swift
let content: String // 这个变量是发帖的内容
let token: String // 这个变量是鉴别身份用的 Token

let data = content.data(using: String.Encoding.utf8)!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
request.httpBody = data
```

这里涉及到的概念是 `URLRequest`。

#### 发送请求并获取响应

```swift
let (data, response) = try await URLSession.shared.data(for: request)
let httpResponse = response as! HTTPURLResponse
if httpResponse.statusCode != 200 {
	throw HTTPError()
}
// 下面可以继续使用 data
```

可以看到，发送请求后会返回两样东西，一个是 `Data`， 另一个是 `URLResponse`。

> 因为历史遗留问题，必须把 `URLResponse` 类型转换成 `HTTPURLResponse` 才能用。

`HTTPURLResponse` 相当于包含了响应中 HTTP Header 的信息，如 status code 和所有的 header field。

`Data` 就是返回的 body 了。要进一步使用 `Data` 需要将它解码，这会在另一个文档里讲。

## 旦夕对 HTTP 请求进行的封装

可以看到，上述的流程总共需要十几行代码，这还没算上我们编码和解码 JSON 的部分，以及一些异常处理的部分。而我们有几十个 API，全都重复相似的代码没有必要。

### `requestWithData`

我们把上述的代码封装了一下，做成了这个函数：

```swift
func requestWithData(_ path: String, base: URL, protected: Bool = true, params: [String: String]? = nil, payload: [String: Any]? = nil, method: String? = nil) async throws -> Data
```

这个函数在代码里对各个参数的注释已经写得很明白了，我们这里再重复一遍：

- `path` 请求的路径，附加到传入的 base URL 后构成完整的 URL，比如 `"/courses"`。

- `base` 基础 URL，目前包括树洞、蛋壳和 auth 三个。
- `protected` 控制是否加上 JWT 来认证用户身份。
- `params` URL 里的 Query 参数。
- `payload` 请求体，以字典传入，会自动编码成 JSON。
- `method` HTTP 方法。如果没有传入则根据有无 payload 选择 GET 或 POST。

### `requestWithResponse`

我们基本不需要裸的 `Data`，而是需要进行一个 JSON 解码处理，把它解码成 `Hole, Floor, Tag` 等数据对象。`requestWithResponse` 就是干这个的，它用泛型的方式来获取到需要什么类型，并调用 `JSONDecoder` 完成解码。

```swift
func requestWithResponse<T: Decodable>(...) async throws -> T
```

方法里的参数和之前是一样的。

### `requestWithoutResponse`

有些方法其实不需要服务器返回的数据，只需要知道成功执行了就好。但是如果函数提供了一个返回值，那么直接忽略它会导致编译警告，导致你不得不写这种逆天代码：

```swift
_ = try await requestWithData(...)
```

为了大家的身心健康，我们封装了一个没有返回值的包装方法：

```swift
func requestWithoutResponse(...) async throws
```

## 项目里是怎么写的？

### 项目中 API 相关代码的结构

旦夕项目里，网络请求基本按照后端的微服务分类，大概分为以下几类：

- 树洞服务，即 `ForumAPI`
- 蛋壳服务，即 `CurriculumAPI`
- 账户服务，即 `GeneralAPI`

每个 API 服务都是一个 `enum`，它在这里基本起到 namespace 的作用，防止函数之间的名字冲突。

```swift
// 一个 API Collection 的例子
enum ForumAPI {
  static func listDivisions() async throws ... 
  static func deleteFloor() async throws ...
}
```

### API 案例分析

我们拿一些真实的代码来说明一下。

获取所有树洞里的分区（`Division`）：

```swift
public static func getDivisions() async throws -> [Division] {
    return try await requestWithResponse("/divisions", base: forumURL)
}
```

获取一个洞里的一些楼层，这里使用了 URL Query：

```swift
public static func listFloorsInHole(holeId: Int, startFloor: Int, size: Int? = nil) async throws -> [Floor] {
    var params = ["offset": "\(startFloor)", "order_by": "id"]
    if let size {
        params["size"] = String(size)
    }
    return try await requestWithResponse("/holes/\(holeId)/floors", base: forumURL, params: params)
}
```

发布一条回复，这里使用了 HTTP Body：

```swift
public static func createFloor(content: String, holeId: Int, specialTag: String = "") async throws -> Floor {
    let payload = ["content": content, "special_tag": specialTag]
    return try await requestWithResponse("/holes/\(holeId)/floors", base: forumURL, payload: payload)
}
```

进行登录操作。用户没有登录时显然没有 Token，所以这个 API 需要把 `protected` 设置成 `false`：

```swift
public static func login(email: String, password: String) async throws -> Token {
    let payload = ["email": email, "password": password]
    return try await requestWithResponse("/login", base: authURL, protected: false, payload: payload)
}
```
