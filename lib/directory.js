/*
	ディレクトリのコンストラクタ
		いくつかの実体が変わるとまずいプロパティはgetter実装
*/

// Modules
const fse = require('fs-extra');
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const Base = require('./base.js');
const {cache} = require('./shared.js');

/*
	本体
*/
class Directory extends Base {

	/*
		引数パスのディレクトリからインスタンスを作る
			キャッシュがあればそのまま返す。
			Baseから結果をpromise経由で受け取る。
			super後はthisがBase.constructor返り値のpromiseに変わる。

		引数
			1: string
			2: op, stats
		返り値
			promise
				作成したDirectoryインスタンスを引数に解決する。
	*/
	constructor(_pathStr, stats){
		console.log('new Directory()');
		const fullpath = path.resolve(_pathStr);
		if( cache.has(fullpath) ){
			return cache.get(fullpath);
		}else{
			return super(fullpath, stats).then( ({_this, stats, _fullpath})=>{
				if( !stats.isDirectory() ){
					throw new Error(`Not directory path: ${_fullpath}`);
				}
				return _this;
			});
		}
	}

	// Directory#method()

	/*
		自身をカレントディレクトリにする
			引数
				なし
			返り値
				promise
	*/
	async cd(){
		console.log('Directory#cd()');
		process.chdir(this.path);
	}

	/*
		自身を空ディレクトリにする
			引数
				なし
			返り値
				promise
	*/
	async clear(){
		console.log('Directory#clear()');
		const contents = await this.getContents();
		for(let content of contents){
			await content.delete();
		}
	}

	/*
		自身が直接含む引数文字列と一致するファイル・ディレクトリを取得する
		引数2のoptionで対象を絞れる
			引数
				1: string
				2: op, object
			返り値
				promise
					directory or file or nullを引数に解決する
	*/
	async get(name, {file=true, directory=true}={}){
		console.log(`Directory#get()`);
		// Validation
		if( not.str(name) ){
			throw new TypeError(`Invalid argument[0]: ${name}`);
		}else if( not.bool(file, directory) ){
			throw new TypeError(`Invalid argument[1]`);
		}
		const map = await getMap(this);
		const target = map.get(name, null);
		if(target===null){
			return null;
		}else{
			return  (file && directory) ?
				target:
				file && target.isFile ?
				target:
				directory && target.isDirectory ?
				target:
				null;
		}
	}

	/*
		自身が含むファイル・ディレクトリを配列で取得する
		対象は引数1のoptionに従う
			引数
				1: op, object
					返す対象を絞ったりgreedyの有無を設定。
			返り値
				promise
					[..file or dir] を引数に解決する。
	*/
	async getContents({file=true, directory=true, greedy=false}={}){
		console.log(`getContents: file=${file} directory=${directory}, greedy=${greedy}`);
		const map = await getMap(this);
		const resultArr = [];
		const contents = [...map.values()];
		for(let instance of contents){
			if( instance.isFile && file){
				resultArr.push(instance);
			}else if( instance.isDirectory ){
				directory && resultArr.push(instance);
				if( greedy ){
					const _contents = await instance.getContents({file, directory, greedy});
					resultArr.push(..._contents);
				}
			}
		}
		return resultArr;
	}

	/*
		それぞれ自身が含むファイル・ディレクトリインスタンスを返す
			getContentsのラッパー。
			optionで指定すればgreedy動作。
		引数
			1: op, boolean
		返り値
			[..file or dir]
	*/
	getDirectories(greedy=false){
		console.log(`Directory#getDirectories greedy=${greedy}`);
		return this.getContents({
			directory: true,
			file: false,
			greedy
		});
	}
	getDirs(...args){
		return this.getDirectories(...args);
	}
	getFiles(greedy=false){
		console.log(`Directory#getFiles greedy=${greedy}`);
		return this.getContents({
			directory: false,
			file: true,
			greedy
		});
	}



	/*
		Directory#get()のbooleanを返す板
			引数
				1: string
				2: op, object
			返り値
				promise
					取得したbooleanを引数に解決する。
	*/
	async has(...args){
		console.log(`Directory#has()`, ...args);
		const result = await this.get(...args);
		return !!result;
	}

	/*
		自身の含むファイル・ディレクトリ名を配列で取得
			引数
				なし
			返り値
				promise
					取得した [...'name'] を引数に解決する。
	*/
	async list(){
		console.log('Directory#list()');
		const map = await getMap(this);
		return [...map.keys()];
	}



	/*
		引数1の文字列or正規表現と一致する名前を持つ、自身の含むファイル・ディレクトリインスタンスを取得
			引数
				1: string or regexp
				2: op, object
			返り値
				promise
					取得したfile or dirかnullを引数に解決する。
					globalなら配列で返す。
	*/
	async search(arg, {file=true, directory=true, greedy=false, global=false}={}){
		console.log(`Directory#search() file=${file} directory=${directory} greedy=${greedy}`);
		// 判定に使う関数を返す、ついでにバリデーション
		const func = (function(){
			if( is.str(arg) ){
				return function(name, str){
					return str===name;
				}
			}else if( is.re(arg) ){
				return function(name, re){
					return re.test(name);
				}
			}else{
				throw new TypeError(`Invalid argument: ${arg}`);
			}
		}());
		const lists = await this.getContents();
		if(global){
			const resultArr = [];
			for(let instance of lists){
				if(file && instance.isFile && func(instance.name, arg) ){
					resultArr.push(instance);
				}
				if(directory && instance.isDirectory && func(instance.name, arg) ){
					resultArr.push(instance);
				}
				// greedyが有効でディレクトリなら同条件で投げ、返り値を連結する。
				if(greedy && instance.isDirectory){
					const _resultArr = await instance.search(arg, {file, directory, global, greedy});
					resultArr.push(..._resultArr);
				}
			}
			return resultArr;
		}else{
			for(let instance of lists){
				if(file && instance.isFile && func(instance.name, arg) ){
					return instance;
				}
				if(directory && instance.isDirectory && func(instance.name, arg) ){
					return instance;
				}
				// スカ*2後にgreedyが有効でディレクトリなら同条件で投げ、返り値があればそのまま返す
				if(greedy && instance.isDirectory){
					const result = await instance.search(arg, {file, directory, greedy});
					if(result!==null){
						return result;
					}
				}
			}
			return null;
		}
	}

	/*
		自身の含むコンテンツの総サイズを数値で取得
			引数
				なし
			返り値
				promise
					取得した数値を引数に解決する。
	*/
	async size(){
		console.log('Directory#size()');
		let size_total = 0;
		const arr = await this.getContents();
		for(let instance of arr){
			const size = await instance.size();
			size_total += size;
		}
		return size_total;
	}



	// #property, 書き方がわからないからgetterで代用
	get isDirectory(){
		return true;
	}
	set isDirectory(arg){}
	get isDir(){
		return this.isDirectory;
	}
	set isDir(arg){}


	// Constractor.method()

	/*
		引数パスのディレクトリを作ってインスタンスを返す
			引数
				1: string
				2: string
			返り値
				promise
					作成したディレクトリのDirectoryインスタンスを引数に解決する。
	*/
	static async make(path_newDir, mode){
		console.log('make', path_newDir);
		if( not.str(path_newDir) ){
			throw new TypeError(`Invalid argument: ${path_newDir}`);
		}
		const fullpath = path.resolve(path_newDir);
		await fse.mkdir(fullpath, mode);
		const dir = await new Directory(fullpath);
		return dir;
	}

}

/*
	引数Directoryインスタンスのコンテンツ一覧をMapインスタンスで取得する
		引数
			Directoryインスタンス
		返り値
			promise
				keyにファイル・ディレクトリ名、値にそのインスタンスを持つmapを引数に解決する。
*/
async function getMap(dir){
	console.log('getMap', dir.name);
	// Validation
	if( !(dir instanceof Directory) ){
		throw new TypeError(`Invalid argument: ${dir}`);
	}
	const map = new Map();
	const Utility = require('./utility.js');
	const nameArr = await fse.readdir(dir.path);
	for(let name of nameArr){
		const path_child = path.join(dir.path, name);
		const instance = await Utility.getInstance(path_child);
		map.set(name, instance);
	}
	return map;
}

module.exports = Directory;
