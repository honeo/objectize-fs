# document
いわゆるメモ。


## 方針
* 命名で悩んだらAliasにしてどっちも実装する。
* パスから推測できるものは属性、そうでないものは非同期関数。
* このモジュール以外からの変更を想定して、実体の情報はその都度取得しに行く。

## Bug
* npm i でgraceful-fsが依存しているnativesが入らない。

## TODO
* インスタンス生成を同期処理に
 * Statsによる存在とfile/dirの確認は実際にread,writeする際でいいのでは。
* キャッシュのテスト
 * キャッシュモジュールとこれ両方にイベント実装したら書く。
* RARとZIPでAPIが違うのを統一したい。

### File
* File#getMimeType()
 * 実体からMIMEタイプの文字列を取得。

### ZIP
先にzip操作モジュールを弄る必要がある。
* ZIP#append(instance)
 * ZIPファイルの実体に引数インスタンスの実体を追加する。
* ZIP#get('targetName');
 * ZIPファイルの実体から引数名の実体だけを展開する。
* ZIP#remove('removeTargetName')
 * ZIPファイルの実体から引数名の実体を削除する。


## 廃止・ボツ案

### Constractor#watch(), unwatch()
chokidarによる実体の変更監視とインスタンスへの反映。
バックグラウンドで常に最新の状態を保てば、同期処理やプロパティ化できる部分が広がる。
メモリリークはイベント発火から発火したパスのインスタンスの存在確認→なければoffで防げる。
* ボツ理由
 * インスタンスの数が増えると負荷が鰻登りになる。
 * 常に最新の状態を保ったところで負荷に対して利用されるのはほんの一部。
 * Constractor#size()のプロパティ化は結局ディレクトリツリー全てを読み込まないといけない＝同期化できない。

### Constractor#copy()
* 引数にコピー先対象ディレクトリのインスタンスも取れるようにしたかった。
* copy(コピー先dir, コピー先名) とせざるを得ず、挙動が別物になってしまうためボツ。

### stats.inoで実体のオリジン管理
fs-extra.move()等でも変わってしまうため不確実。

### Directory
* Map継承
 * インスタンス自身がmapなら便利かなって思った。
 * インスタンスとディレクトリ構造Mapに分離した。
* Directory.getDesktop()
 * デスクトップのインスタンスを返す。
 * 便利だがDirectoryの領分ではなかった、Utilityに実装。

### FileList
Directory#getMethod() の返り値をArrayを継承したこれにしたかった。
dir.getFileList().delete(/\.ext$/); とかできるように。
あまり複雑になっても労力の割には覚えられないためボツ。

### JSON
JSON#add(), remove(), get(), has()などで直接値を操作したかった。
手間の割には役に立たない、大抵はオブジェクトでの入出力を一回ずつできればいいだけだし。


## キャッシュについて
シンプルなLRU Cache実装。
インスタンス生成時のフルパスをkey、インスタンスをvalueに持つ。
全てのコンストラクタでキャッシュの有無を確認する。
キャッシュがあればそのまま返し、なければ作成したインスタンスを加工して返す。
キャッシュに登録するのはBaseコンストラクタのみ。

### 例： new ZIP(zipFilePath)
* キャッシュがない場合
 1. ZIPコンストラクタでキャッシュ確認して不発、作成する。
 2. ZIPから呼び出し、Fileコンストラクタでキャッシュ確認して不発、作成する。
 3. Fileから呼び出し、Baseコンストラクタでインスタンスを作成してキャッシュ登録して返す。
 4. Baseから受け取ったインスタンスをFileコンストラクタで加工して返す。
 5. Fileから受け取ったインスタンスをZIPコンストラクタで加工して返す。
* キャッシュ済みの場合
 1. ZIPコンストラクタでキャッシュ確認、キャッシュを返す。


## DebugMode
console出すだけ。
```js
const {debug} = require('objectize-fs');
debug(true); // on
debug(false); // off
```


## 構造

### ./
* document.md
 * これ。
* index.js
 * 各モジュールをまとめて出力する。
* readme.md
 * 説明書。、

### ./lib
* base.js
 * Directory, Fileの継承元になるBaseコンストラクタを返す。
* directory.js
 * Directoryコンストラクタを返す。
* file.js
 * Fileコンストラクタを返す。
* json.js
 * JSONコンストラクタを返す。
* zip.js
 * ZIPコンストラクタを返す。
* rar.js
 * RARコンストラクタを返す。
* utility.js
 * Utilityオブジェクトを返す。
* shared.js
 * 共通で使い回すオブジェクト。

### ./test
基本的に動作確認はWin10のみ。
* index.js
 * 各コンストラクタとAPIの動作確認。
* example
 * テスト用のサンプルファイルいろいろ。
 * 暗号化のパスはpassword


## 依存モジュール
* @honeo/check
 * 型チェックなど。
* @honeo/lru-cache
 * キャッシュ用。
* @honeo/test
 * テスト用。
* Archiver
 * テスト用のzipファイルを作る。
* console-wrapper
 * コンソールON/OFF一括切り替え。
* file-type
 * 拡張子の推測用。
* fs-extra
 * fs拡張版。
* jsonfile-promised
 * json操作モジュールjsonfileのpromise版。
* ospath
 * Utilityの各getDir系メソッドとテスト用。
* read-chunk
 * 拡張子の推測用。
* trash
 * ゴミ箱へ移動。Constractor#trash() に使う。
* zip-unzip-promise
 * zip関連の実装。
