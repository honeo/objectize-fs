/*
	ファイルのコンストラクタ
		statsを継承しようかと思ったがDirectoryとの整合性を考えてやめた
*/

// Modules
const fse = require('fs-extra');
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const Base = require('./base.js');
const {cache, validationAndResolve} = require('./shared.js');

/*
	本体
*/
class File extends Base {

	/*
		引数パスのファイルからインスタンスを作る
			キャッシュがあればそのまま返す。

			引数
				1: string
				2: op, stats
			返り値
				promise
					作成したFileインスタンスを引数に解決する。
	*/
	constructor(_pathStr, stats){
		console.log('new File()');
		const pathStr = validationAndResolve(_pathStr);
		if( cache.has(pathStr) ){
			return cache.get(pathStr);
		}else{
			return super(pathStr, stats).then( ({_this, stats, fullpath})=>{
				if( !stats.isFile() ){
					throw new Error(`Not file path: ${fullpath}`);
				}
				return _this;
			});
		}
	}



	// File##method())

	/*
		自身の実体から拡張子を推測して改名する
			file-typeで推測できれば改名、できなければ何もしない。

			引数
			返り値
				promise
					自身を引数に解決する。
	*/
	async autoExt(){
		console.log('File#autoExt()');
		const readChunk = require('read-chunk');
		const fileType = require('file-type');
		const buffer = await readChunk(this.path, 0, 4100);
		const result = fileType(buffer);
		// 推測に成功して拡張子が違えば改名
		if( is.obj(result) && this.ext!==result.ext){
			return this.rename(`${this.basename}.${result.ext}`);
		}else{
			return this;
		}
	}

	/*
		自身の内容を文字列で取得する
			引数
				1: op, string
					読み込み時のencode
			返り値
				promise
					読み込んだ文字列を引数に解決する。
	*/
	async read(encode='utf8'){
		console.log('File#read()', encode);
		if( not.str(encode) ){
			throw new TypeError(`Invalid argument: ${encode}`);
		}
		return fse.readFile(this.path, encode);
	}

	/*
		自身の実体のファイルサイズを数値で取得
			引数
				なし
			返り値
				promise
					取得した数値を引数に解決する。
	*/
	async size(){
		console.log('File#size()');
		const stats = await fse.stat(this.path);
		return stats.size;
	}

	/*
		自身の内容を引数文字列で書き換え
			引数
				1: string
					書き込み内容の文字列。
				2: string
					option. 書き込み時のencode
			返り値
				promise
					書き込み後に解決する。
	*/
	async write(str, encode='utf8'){
		console.log('File#write', str, encode);
		if( not.str(str, encode) ){
			throw new TypeError(`Invalid arguments`);
		}
		return fse.writeFile(this.path, str, {encode});
	}


	// #property, 書き方がわからないからgetterで代用

	/*
		拡張子を除いたファイル名の文字列
			path.parse().nameだとdotを含む拡張子のないファイル名で誤爆したため正規表現で書き直し。

			返り値
				string
	*/
	get basename(){
		console.log('File#basename');
		return /^.+\.[0-9a-zA-Z]+$/.test(this.name) ?
			this.name.match(/^(.+)(\.[0-9a-zA-Z]+)$/)[1]:
			this.name;
	}
	set basename(arg){}


	/*
		自身の拡張子の文字列
			path.extnameだと "hoge.v2 fuga" みたいなファイル名で誤爆したため正規表現で書き直し。

			返り値
				string
	*/
	get ext(){
		console.log('File#ext');
		const arr = this.name.match(/^(.+)(\.)([0-9a-zA-Z]+)$/);
		return arr ?
			arr[3]:
			'';
	}
	set ext(arg){}

	/*
		true
	*/
	get isFile(){
		console.log('File#isFile');
		return true;
	}
	set isFile(arg){}


	// Constractor.method()

	/*
		ファイル実体を作る
			引数
				1: string
					作成するファイルのパス
				2: op, string
					作成するファイルの内容
				3: op, string
					作成するファイルのエンコード
			返り値
				promise
					作成したファイルのFileインスタンスを引数に解決する。
	*/
	static async make(path_newFile, string, encode){
		console.log('File.make()', path_newFile);
		const fullpath = path.resolve(path_newFile);
		await fse.writeFile(fullpath, string, encode);
		return new File(fullpath);
	}

}

module.exports = File;
