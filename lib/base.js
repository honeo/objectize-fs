/*
	Directory, Fileの共通コンストラクタ
		各コンストラクタにキャッシュがなければここに辿り着く。
*/

// Modules
const fse = require('fs-extra');
const opener = require('opener');
const path = require('path');
const console = require('console-wrapper');
const trash = require('trash');
const {is, not, any} = require('@honeo/check');

// Var
const {cache, isStats, symbol_path, validationAndResolve} = require('./shared.js');


/*
	本体
*/
class Base {

	/*
		引数パスの実体からBaseインスタンスを作って返す
			作成したインスタンスをキャッシュに登録する。
			Directory, Fileのconstructorから呼び出す
			async化すると怒られる

			引数
				1: string
					パス、これを呼び出したDirectory, Fileで絶対パス文字列であることを確認済み。
				2: op, stats
					あれば再利用する
			返り値
				promise
					{
						stats, // 引数パス実体のstatsオブジェクト。
						fullpath // 引数パスをフルパスにしたもの。
				  		_this // this. _を付けないと予約語なのかリファレンスエラーになる。
					}
					を引数に解決する。
	*/
	constructor(fullpath, _stats){
		console.log('new Base()');

		// パスをプライベートプロパティとして設定
		Object.defineProperty(this, symbol_path, {
			value: fullpath,
			writable: true,
		});

		// キャッシュに登録
		cache.set(fullpath, this);

		if( isStats(_stats) ){
			return Promise.resolve({
				stats: _stats,
				fullpath,
				_this: this
			});
		}else{
			return fse.stat(fullpath).then( (stats)=>{
				return {
					stats,
					fullpath,
					_this: this
				};
			});
		}
	}

	// Base#method() ////////////////////////////////

	/*
		自身の実体をコピーする
			詳細
				fs-extraのWin環境の不具合で上書き失敗時でもそのままresolveしてしまう。
				対策としてfse.copyの前に自分で対象の有無を確認している。
			引数
				1: string
					コピー先のパス
				2: op, boolean
					上書き有無
			返り値
				promise
					コピーした実体から作ったインスタンスを引数に解決する。
			既知の不具合
				fs-extraの仕様で、コピー先がコピー元以下だと無限ループに陥る。
	*/
	async copy(outputPath, overwrite=false){
		console.log('Base#copy()', outputPath, overwrite);
		if( not.str(outputPath) ){
			throw TypeError(`Invalid argument: ${derPath}`);
		}
		const isDuplication = await fse.exists(outputPath);
		// 重複＆上書き不可設定ならエラー
		if(isDuplication && !overwrite){
			throw new Error(`Duplication: ${outputPath}`);
		}
		// コピーを待ってからインスタンス作って返す。
		await fse.copy(this.path, outputPath);
		if(this.isFile){
			const File = require('./file.js');
			return new File(outputPath);
		}else if(this.isDirectory){
			const Directory = require('./directory.js');
			return new Directory(outputPath);
		}

	}

	/*
		dateオブジェクトらを取得する
			引数
				なし
			返り値
				object
					属性にdateインスタンスを含む
	*/
	async date(){
		console.log(`Base#date()`);
		const stats = await fse.stat(this.path);
		return {
			a: stats.atime,
			m: stats.mtime,
			c: stats.ctime,
			birth: stats.birthtime
		}
	}

	/*
		自身の実体を削除する
			引数
				なし
			返り値
				promise
	*/
	async delete(){
		console.log('Base#delete()');
		return fse.remove(this.path);
	}

	/*
		自身の親ディレクトリのDirectoryインスタンスを取得
			引数
				なし
			返り値
				promise
					取得したインスタンスを引数に解決する
	*/
	async getParentDirectory(){
		console.log('Base#getParentDirectory()');
		const Directory = require('./directory.js');
		return new Directory(this.base);
	}

	/*
		自身の実体が存在しているか
			引数
				なし
			返り値
				promise
					結果のbooleanを引数に解決する。
	*/
	async isLive(){
		console.log('Base#isLive()');
		return fse.exists(this.path);
	}

	/*
		自身の実体を引数パスのディレクトリに移動する
			引数
				string
			返り値
				promise
	*/
	async move(dirPath, overwrite=false){
		console.log('Base#move()', dirPath);
		// Validation
		if( not.str(dirPath) ){
			throw new TypeError(`Invalid argument: ${dirPath}`);
		}
		// 移動先Dirがなければ失敗
		const bool = await fse.exists(dirPath);
		if( !bool ){
			throw new Error(`not found: ${dirPath}`);
		}
		// 移動先のパスがディレクトリでなければ失敗
		const stats = await fse.stat(dirPath);
		if( !stats.isDirectory() ){
			throw new Error(`not directory: ${dirPath}`);
		}
		const path_new = path.resolve(path.join(dirPath, this.name));
		// overwrite=falseの場合、移動先に同名Dirがあれば失敗
		if( overwrite===false && await fse.exists(path_new) ){
			throw new Error(`Duplication: ${path_new}`);
		}
		await fse.move(this.path, path_new, {overwrite});
		// パス更新
		this[symbol_path] = path_new;
	}

	/*
		自身の実体を開く
	*/
	async open(){
		console.log(`Base#open()`);
		return opener(this.path);
	}

	/*
		自身の実体の名前を変更する
			引数
				1: string
			返り値
				promise
	*/
	async rename(name){
		console.log(`Base#rename()`, `before: ${this.name}`, `after: ${name}`);
		// Validation
		if( not.str(name) ){
			throw new TypeError(`Invalid argument: ${name}`);
		}
		const path_new = path.join(this.base, name);
		await fse.rename(this.path, path_new);
		this.name = name;

		// パス更新
		this[symbol_path] = path_new;

		return this;
	}


	/*
		自身の実体をゴミ箱に移動する
			引数
				なし
			返り値
				promise
	*/
	async trash(){
		console.log('Base#trash()');
		return trash([this.path]);
	}


	/*
		自身を.zipに圧縮する
			詳細
				ZIP.make()に丸投げ
			引数
				1: op, string
					出力する.zipファイルのパス
			返り値
				promise
					圧縮した.zipファイルのZIPインスタンスを引数に解決する
	*/
	async zip(outputZipPath){
		console.log('Base#zip()', outputZipPath);
		const ZIP = require('./zip.js');
		return ZIP.make(this, outputZipPath);
	}

	// Base#prop getter, setter ///////////////////////////////

	/*
		.base
		自身の親ディレクトリの絶対パス
			詳細
				setは破棄する。
			返り値
				string
	*/
	get base(){
		console.log('get Base#base');
		return path.resolve(this.path, '../');
	}
	set base(arg){}

	/*
		.name
		ファイル・ディレクトリ名。
		ファイルの場合は拡張子も含む。
			詳細
				setは破棄する。
			返り値
				string
	*/
	get name(){
		console.log('get Base#name');
		return path.basename(this.path);
	}
	set name(arg){}

	/*
		.path
			自身の実体のフルパス。
			取得のみ、書き込みは this[symbol_path] へ。

			返り値
				string
	*/
	get path(){
		return this[symbol_path];
	}
	set path(arg){}

}

module.exports = Base;
