# API、缓存与实体类

当我们看 Fudan Kit 包的代码结构的时候，目录结构是比较清晰的，每个目录代表一项服务。如校车对应 `Bus`，教务对应 `Course` 等。每个服务都有一个

展开这些目录时，会发现有很多代码文件，被命名为 `*API, *Entity, *Store`，如 `BusAPI.swift`, `BusEntity.swift`, `BusStore.swift`。这三个文件分别代表了 API、实体类和缓存。

它们的关系很直接：API 层负责封装校园网站上提供的各类信息接口，Store 层负责缓存这些信息并向上层业务提供，Entity 负责建模业务中涉及到的各项实体。

## API 层和解析数据常用的工具箱

API 层的核心任务是从校园网站上获取数据，并将其解析为我们需要的格式。这些 API 方法被放置在一个 `enum` 中作为命名空间。以下例说明：

```swift
enum ReservationAPI {
    static func getPlaygrounds() async throws -> [Playground]
    static func getReservations(playground: Playground, date: Date) async throws -> [Reservation]
}   
```

调用时，调用 `ReservationAPI.getPlaygrounds()` 即可获取所有可预约的场馆。

API 层需要解析复杂的 HTML 或 JSON 数据，并将其转换为 Entity 中结构明确的 `struct` 并呈现给用户。

:::info
这部分功能的开发没有固定的模式，需要具体查看对应页面的结构。这个过程中需要频繁用到浏览器开发者工具或者抓包软件，和比较丰富的经验。毕竟我们没有学校官方提供的数据接口。
:::

### 网络请求

:::tip
如果没有 Swift 网络标准库的基础，可以先阅读 [网络基本 API](/dev/danxi-kit/api) 一节。
:::

我们为校园服务设置了专门的 `URLSession`：

```swift
extension URLSession {
    static let campusSession = URLSession(configuration: .default)
}
```

并封装了两个常用的构造 `URLRequest` 的方法：

```swift
func constructRequest(_ url: URL, payload: Data? = nil, method: String? = nil) -> URLRequest
func constructFormRequest(_ url: URL, method: String = "POST", form: [String: String]) -> URLRequest
```

这些方法会设置请求的 `User-Agent` 字段，后者还会自动将字典转换为 URL-encoded form，用起来比较方便。

### HTML 解析

对于有写爬虫经验的同学，Python 中的 `BeautifulSoup` 应该不陌生。在 Swift 中，我们使用 `SwiftSoup` 来解析 HTML。这里建议读一读它们的官方 [入门文档](https://scinfu.github.io/SwiftSoup/)，还是比较简短的。

下面我们来看一个使用 SwiftSoup 解析 HTML 的例子：

```swift
let html = """
<html><body>
<p class='message'>SwiftSoup is powerful!</p>
<p class='message'>Parsing HTML in Swift</p>
</body></html>
"""

let document: Document = try SwiftSoup.parse(html)
let messages: Elements = try document.select("p.message")
for message in messages {
    // message: Element
    let text: String = try message.text()
}
```

这里我们为了让大家理解，明确标注了各个变量的类型。可以看到 SwiftSoup 中的核心概念包括 `Document`、`Elements` 和 `Element`。我们可以用 CSS 选择器等各种方式检索元素。实际应用中，CSS 选择器通常已经足够好用了。

为了减少重复代码，我们封装了几个常用方法，可以应付多数情况：

```swift
func existHTMLElement(_ data: Data, selector: String) -> Bool
func decodeHTMLDocument(_ data: Data) throws -> Document
func decodeHTMLElement(_ data: Data, selector: String) throws -> Element
func decodeHTMLElementList(_ data: Data, selector: String) throws -> Elements
```

它们的名字足够直接，因此就不进一步解释了。

### JSON 解析

Swift 内置的 `Codable` 协议可以帮助我们解析 JSON 数据，但是它对类型要求严格，不太适用于复杂的 JSON 结构。因此我们使用 `SwiftyJSON` 来解析 JSON 数据。

`SwiftyJSON` 的使用方法也很简单，我们可以直接将 `Data` 转换为 `JSON` 对象，然后使用下标访问：

```swift
let json = try JSON(data: data)
json["message"].string
json["code"].int
json["subtype"].rawData()
// ...
```

学校提供的大部分 JSON API 有以下格式：

```json
{
  "e": 0,
  "m": "error message",
  "d": {
    // actual data
  }
}
```

其中 `e` 代表错误码（0即无错误），`m` 代表错误信息，`d` 代表数据。我们封装了以下函数来处理。如果检测到错误会直接抛出。

```swift
func unwrapJSON(_ data: Data) throws -> JSON
```

## Store

Store 层负责将收到的数据缓存起来，避免重复请求。部分 Store 层的数据是存储在磁盘上的，其他则只在内存中存储。

Store 层通常有以下方法（具体名字可能有出入）：
- `getCachedData`：获取缓存的数据
- `getRefreshedData`：获取最新的数据，并刷新缓存
- `clearCache`：清除缓存（在用户退出登录时调用）

:::warning
如果存在 Store 层，UI 层不应该绕过 Store 层直接调用 API 层的数据。
:::

## Entity

Entity 结尾的文件会提供该服务中所有涉及到的实体。通常建议先阅读这个文件，它可以帮助你理清这个服务模块的业务逻辑和核心概念。

以场馆预约 `ReservationEntity` 为例：

```swift
struct Playground: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let campus: String
    let category: String
}

struct Reservation: Identifiable, Codable {
    let id: UUID
    let name: String
    let begin, end: Date
    let reserved, total: Int
}
```

其中 `Playground` 代表一个可预约的场馆，而 `Reservation` 代表一个可预约的时间段。

:::info
有时服务器返回的信息结构很乱，为了方便处理，我们会在 API 层定义一些辅助结构体，用于解析服务器返回的数据，并将其转换为 Entity 层的实体。

当服务器返回的数据结构需要进一步处理时，如将 `String` 转换为 `Date`、将部分字段重新命名等，我们会在 API 层进行处理，而不是在 Entity 层。我们会将此类结构用 Response 作为命名后缀。参见以下例子：

```swift
// In BusAPI:
struct ScheduleResponse: Codable {
    let id: String
    let start: String
    let end: String
    let stime: String
    let etime: String
    let arrow: String
    let holiday: String
}

// In BusEntity
struct Schedule: Identifiable, Codable {
    let id: Int
    let time: Date
    let start, end: String
    let holiday: Bool
    let bidirectional: Bool
}
```

还有一个场景，是需要将多个服务器返回的数据结构合并为一个。我们同样在 API 层进行处理，以 Builder 作为命名后缀。参见以下例子：

```swift
struct CourseBuilder {
    let name, code, teacher, location: String
    let weekday: Int
    var start, end: Int
    var onWeeks: [Int] = []

    func build() -> Course {
        Course(id: UUID(), name: name, code: code, teacher: teacher, location: location, weekday: weekday - 1, start: start, end: end, onWeeks: onWeeks)
    }
}
```

这个例子中，如果有同一个课程跨越几个时间段，如高等数学课在周四第2和第3节课都要上课，那么服务器会返回2节课，我们要将它合并为同一节课，就可以调用 `courseBuilder.build()`。


:::
