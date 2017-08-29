# objectize-fs
* [honeo/objectize-fs](https://github.com/honeo/objectize-fs)  
* [objectize-fs](https://www.npmjs.com/package/objectize-fs)


## なにこれ
ファイル・ディレクトリを抽象化してNode.js APIで扱うやつ。  
JScriptのFileSystemObjectとは一切関係ない。


## 使い方
```sh
# v1までは仕様がコロコロ変わるため
$ npm i -E objectize-fs
```
```js
const {Directory, File, ZIP, RAR, Utility} = require('objectize-fs');

// $ rm *.txt
const dir = await new Directory('./');
const files = await dir.getFiles();
for(let file of files){
	if(file.ext==='txt'){
		await file.delete();
	}
}
```


## API
* 属性は、書き込み例のあるもの以外は読み取り専用。
* いくつかの関数は第二引数で再利用する[Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)を受け取れる。

### Directory, File共通


#### Constractor#copy(outputPath [, overwrite])
自身を引数1パスにコピーする。  
コピーした実体から作ったインスタンスを引数に解決するpromiseを返す。  
引数2がtrueなら上書きを許可する。
```js
// dir => dir, dir2
const dir = new Directory('dir');
const dir2 = await dir.copy('dir2');

// fileA.ext => fileA.ext, fileB.ext
const fileA = await new File('fileA.ext');
const fileB = await file.copy('fileB.ext');
```


#### Constractor#date()
自身の日付情報を含むオブジェクトを取得する。  
取得したオブジェクトを引数に解決するpromiseを返す。
```js
// date {a, m, c, birth}
const date = await dir.date();
```


#### Constractor#delete()
自身の実体を削除する。  
削除後に解決するpromiseを返す。
```js
await instance.delete();
```


#### Constractor#getParentDirectory()
自身の親ディレクトリのDirectoryインスタンスを取得する。
取得したインスタンスを引数に解決するpromiseを返す。
```js
const parentDir = await instance.getParentDirectory();
```


#### Constractor#isLive()
自身の実体が存在するかのbooleanを取得する。  
取得したbooleanを引数に解決するpromiseを返す。
```js
const bool = await instance.isLive();
```


#### Constractor#move(dirPath [, overwrite])
自身の実体を引数パスのディレクトリに移動する。  
引数2がtrueなら上書きを許可する。  
移動後に解決するpromiseを返す。  
```js
// bar => foo/bar
await dir.move('foo');

// filename => foo/filename
await file.move('foo');
```
##### 注意
inodeナンバーは変化する。


#### Constractor#open()
自身の実体を開く。  
子プロセスを引数に解決するpromiseを返す。
```js
const child_process = await dir.open();

const child_process = await file.open();
```
* [GitHub - domenic/opener: Opens stuff, like webpages and files and executables, cross-platform](https://github.com/domenic/opener)


#### Constractor#rename(string)
自身と実体を引数文字列に改名する。  
自身を引数に解決するpromiseを返す。
```js
await dir.rename('new-dirname');

await file.rename('new-filename.ext');
```


#### Constractor#trash()
自身の実体をゴミ箱に移動する。  
移動後に解決するpromiseを返す。
```js
await dir.trash();

await file.trash();
```


#### Constractor#zip([path])
自身の実体を圧縮する。  
圧縮した.zipファイルのZIPインスタンスを引数に解決するpromiseを返す。
```js
// dir => dir.zip
const zip = await dir.zip();

// dir => hoge.zip
const zip = await dir.zip('./hoge.zip');

// file.ext => file.zip
const zip = await file.zip();

// file.ext => hoge.zip
const zip = await file.zip('hoge.zip');
```


#### Constractor#base
読み取り専用。  
自身の親ディレクトリの絶対パス文字列。
```js
instance.base; // Win: "C:\\Users\\username"
```


#### Constractor#name
読み取り専用。  
自身のファイル・ディレクトリ名の文字列。
```js
dir.name; // "dirname"
file.name; // "filename.ext"
```


#### Constractor#path
自身の絶対パスの文字列。
```js
dir.path; // Win: "C:\\Users\\username\\dirname"

file.path; // Win: "C:\\Users\\username\\filename.ext"
```




### Directory


#### new Directory(dirpath [, stats])
引数パスのディレクトリを基にインスタンスを作る。  
作成したインスタンスを引数に解決するpromiseを返す。
```js
const dir = await new Directory('path');
```


#### Directory.make(path [, mode])
引数1のパスにディレクトリを作成する。  
作成したディレクトリのDirectoryインスタンスを引数に解決するpromiseを返す。
引数2については[File System | Node.js Documentation](https://nodejs.org/api/fs.html#fs_fs_mkdirsync_path_mode)を参照。
```js
const dir = await Directory.make('hoge');
```


#### Directory#cd()
自身の実体をプロセスのカレントディレクトリにする。  
変更後に解決するPromiseを返す。
```js
await dir.cd();
```


#### Directory#get(string [, option])
自身が直接含む、引数文字列と一致する名前のファイル・ディレクトリのインスタンスかnullを取得する。  
取得した結果を引数に解決するpromiseを返す。  
引数2のオブジェクトで対象を絞れる。
```js
const file = await dir.get('file.txt', {file: true, directory: false});
```


#### Directory#getContents({...})
自身が直接含むファイル・ディレクトリインスタンスを配列で取得する。  
取得した配列を引数に解決するpromiseを返す。  
引数2のオブジェクトで対象を絞れる。
```js
const arr = await dir.getContents();
const fileArr = await dir.getContents({directory: false});
const dirArr = await dir.getContents({file: false});
const arr_deep = await dir.getContents({greedy: true});
```


#### Directory#getDirectories(greedy)
自身が含むディレクトリインスタンスを配列で取得する。  
取得した配列を引数に解決するpromiseを返す。
```js
const dirs = await dir.getDirectories();
const dirs_deep = await dir.getDirectories(true);
```
* Alias
 * Directory#getDirs()


#### Directory#getFiles(greedy)
自身が含むファイルインスタンスを配列で取得する。  
取得した配列を引数に解決するpromiseを返す。
```js
const files = await dir.getFiles();
const files_deep = await dir.getFiles(true);
```


#### Directory#has(string [, option])
Directory#get()のbooleanを取得する版。
```js
const bool = await dir.has('hoge', {
	file: true,
	directory: true}
);
```


#### Directory#list()
自身が直接含んでいるファイル・ディレクトリ名の配列を取得する。
取得した配列を引数に解決するpromiseを返す。
```js
const nameArr = await dir.list();
```


#### Directory#search(string or regexp [, option])
自身の含む、引数の文字列or正規表現と一致する名前を持つファイル・ディレクトリインスタンスを取得する。  
取得したインスタンスかnullを引数に解決するpromiseを返す。  
option.globalがtrueなら代わりに一致したインスタンスの配列を引数に解決するpromiseを返す。
```js
const file = await dir.search('hoge.txt');

// default
const option = {
	directory: true,
	file: true,
	greedy: false,
	global: false
}
const dir = await dir.search(/fuga|piyo/, option);
```


#### Directory#size()
自身の含むファイル・ディレクトリの総サイズを数値で取得する。  
取得した数値を引数に解決するpromiseを返す。
```js
const size = await dir.size();
```


#### Directory#isDirectory
```js
dir.isDirectory; // true
```
* Alias
 * Directory#isDir




### File


#### new File(filepath [, stats])
引数パスのファイルを基にfileインスタンスを作る。  
作ったインスタンスを引数に解決するpromiseを返す。
```js
const file = await new File('./filename.ext');
```


#### File.make(path, content [, option])
引数1のパスにファイルを作成する。  
作成したファイルのFileインスタンスを引数に解決するpromiseを返す。  
引数3については[File System | Node.js Documentation](https://nodejs.org/api/fs.html#fs_fs_writefilesync_file_data_options)を参照。
```js
const file = await File.make('hoge.txt', 'hogefugapiyo');
```

#### File#autoExt()
自身の実体から拡張子を推測して、可能なら改名する。  
自身を引数に解決するpromiseを返す。
```js
// filename => filename.ext
await file.autoExt();
```
* 対応する拡張子一覧
 * [sindresorhus/file-type: Detect the file type of a Buffer/Uint8Array](https://github.com/sindresorhus/file-type#supported-file-types)

#### File#read([encode])
自身の内容を文字列で取得する。  
取得した文字列を引数に解決するpromiseを返す。
```js
const str = await file.read();
```


#### File#size()
自身のファイルサイズを数値で取得する。  
取得した数値を引数に解決するpromiseを返す。
```js
const size = await file.size();
```


#### File#write(string [, encode])
自身の内容を引数の文字列で書き換える。  
書き換え後に解決するpromiseを返す。
```js
await file.write('hogehoge');
```


#### File#basename
自身の拡張子を除いたファイル名の文字列。
```js
const file = await new File('filename.ext');
file.basename; // "filename"
```


#### File#ext
自身の拡張子の文字列。
```js
const file = await new File('filename.ext');
file.ext; // "ext"
```


#### File#isFile
```js
file.isFile; // true
```




### JSON
[File](#File)を継承している。


#### new JSON(filepath [, stats])
引数パスの.jsonファイルを基にJSONインスタンスを作る。  
作ったインスタンスを引数に解決するpromiseを返す。
```js
const json = await new JSON('hoge.json');
```


#### JSON.make(path [, object])
引数1パスに.jsonファイルを作成する。  
引数2にオブジェクトが渡されていれば.jsonファイルに反映する。  
作成したファイルのJSONインスタンスを引数に解決するpromiseを返す。
```js
// => {}
const json = await JSON.make('hoge.json');

// => {"foo":"bar"}
const json = await JSON.make('hoge.json', {foo: 'bar'});
```


#### JSON#read()
自身の内容をオブジェクトで取得する。  
取得したオブジェクトを引数に解決するpromiseを返す。
```js
const obj = await json.read();
```


#### JSON#write(object)
引数オブジェクトを基に自身の実体へ書き込む。  
書き込み後に解決するpromiseを返す。
```js
await json.write({foo: 'bar'});
```


#### JSON#isJSON
```js
json.isJSON; // true
```


#### JSON#space
JSON.make(), JSON#write()実行時の整形に使う値。  
詳しくは[JSON.stringify() - JavaScript | MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)を参照。
```js
json.space; // 2
json.space = '\t';
```




### ZIP
[File](#File)を継承している。


#### new ZIP(filepath [, stats])
引数パスの.zipファイルを基にZIPインスタンスを作る。  
作ったインスタンスを引数に解決するpromiseを返す。
```js
const zip = await new ZIP('hoge.zip');
```


#### ZIP.make(...file or dir [, outputZipPath])
引数のFile, Directoryインスタンスの実体を圧縮する。  
圧縮したファイルのZIPインスタンスを引数に解決するpromiseを返す。
```js
// file.ext => file.zip
const zip = await ZIP.make(file);

// file.ext & dir => hoge.zip
const zip = await ZIP.make([file, dir], './hoge.zip');
```


#### ZIP#unzip(outputDirPath)
自身の実体を同じディレクトリか引数パスのディレクトリへ展開する。  
展開先のDirectoryインスタンスを引数に解決するpromiseを返す。
```js
// hoge.zip => ...
const dir = await zip.unzip();

// hoge.zip => output/...
const dir = await zip.unzip('./output');
```


#### ZIP#list()
自身の実体が持つコンテンツ一覧を配列で取得する。  
取得した配列を引数に解決するpromiseを返す。
```js
// [...'file.ext', 'dir/']
const arr = await zip.list();
```


#### ZIP#isZIP
```js
zip.isZIP; // true
```



### RAR
[File](#File)を継承している。


#### new RAR(filepath [, stats])
引数パスの.rarファイルを基にRARインスタンスを作る。  
作ったインスタンスを引数に解決するpromiseを返す。
```js
const rar = await new RAR('hoge.rar');
```


#### RAR#extract(targetContent or [..targetContent], outputDirPath [, password])
自身の実体から引数1のコンテンツを、引数2のパスのディレクトリへ展開する。  
展開先のDirectoryインスタンスを引数に解決するpromiseを返す。
```js
// hoge.rar => output/dirinrar/file
const dir = await rar.extract('dirinrar/file', 'output');

// multi
const dir = await rar.extract([
	'dirinrar/fileA',
	'dirinrar/fileB'
], 'output');
```


#### RAR#extractAll(outputDirPath [, password])
自身の実体から全てのコンテンツを、引数1のパスのディレクトリへ展開する。  
展開先のDirectoryインスタンスを引数に解決するpromiseを返す。
```js
// hoge.rar => output/...
const dir = await rar.extractAll('output');
```


#### RAR#list([password])
自身の実体が持つコンテンツ一覧を配列で取得する。  
取得した配列を引数に解決するpromiseを返す。
```js
// [...'file.ext', 'dir/']
const arr = await rar.list();
```


#### RAR#isRAR
```js
rar.isRAR; // true
```



### Utility
コンストラクタじゃないよ。

#### Utility.cache
キャッシュを管理するオブジェクト。  
詳しくは[honeo/lru-cache](https://github.com/honeo/lru-cache)を参照。
```js
// default 1000 => 300
Utility.cache.capacity = 300;

// default 1h => 3m
Utility.cache.expire = 1000*60*3;
```

#### Utility.getInstance(path [, stats])
引数パスを基に対応するインスタンスを作る。  
作ったインスタンスを引数に解決するpromiseを返す。
```js
// dir or file or zip
const instance = await Utility getInstance('path');
```


#### Utility.getDesktop(), getHomeDir(), getTempDir()
それぞれデスクトップ・ユーザー・テンポラリディレクトリのDirectoryインスタンスを作る。  
作ったインスタンスを引数に解決するpromiseを返す。
```js
const dir_desktop = await Utility.getDesktop();
const dir_home = await Utility.getHomeDir();
const dir_Temp = await Utility.getTempDir();
```
