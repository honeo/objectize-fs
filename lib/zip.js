/*
	ZIPコンストラクタ
*/
const fse = require('fs-extra');
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const {zip, unzip, list} = require('zip-unzip-promise');
const File = require('./file.js');
const {cache} = require('./shared.js');

// 本体
class ZIP extends File{

	/*
		引数パスの.zipファイルからインスタンスを作る
			キャッシュがあればそのまま返す。

			引数
				1: string
				2: op, stats
			返り値
				promise
					作成したZIPインスタンスを引数に解決する。
	*/
	constructor(_pathStr, stats){
		console.log('new ZIP()');
		const fullpath = path.resolve(_pathStr);

		if( cache.has(fullpath) ){
			return cache.get(fullpath);
		}else{
			return super(fullpath, stats);
		}
	}

	/*
		自身の実体を展開する
			引数
				1: op, 展開先ディレクトリのパス
			返り値
				promise
					出力先ディレクトリのdirectoryインスタンスを引数に解決する
	*/
	async unzip(outputDirPath='./'){
		console.log('ZIP#unzip()', outputDirPath);
		if( not.str(outputDirPath) ){
			throw new TypeError(`Invalid argument: ${outputDirPath}`);
		}
		const dirPath = await unzip(this.path, outputDirPath);
		const Directory = require('./directory.js');
		return new Directory(dirPath);
	}

	/*
		自身の実体が持つコンテンツ一覧を配列で取得する
			引数
				なし
			返り値
				promise
					コンテンツ一覧の配列を引数に解決する。
	*/
	async list(){
		console.log('ZIP#list()');
		return await list(this.path);
	}

	// ZIP#prop

	/*
		true
	*/
	get isZIP(){
		console.log('ZIP#isZIP');
		return true;
	}
	set isZIP(arg){}

	// ZIP.method()

	/*
		引数のfile, dir, zipインスタンスを元に.zipファイルを作成する

		引数
			1: array
				[..file or dir or zip]
			2: string
				出力する.zipファイルのパス
		返り値
			promise
				作成した.zipファイルのZIPインスタンスを引数に解決する。
	*/
	static async make(_instanceArr, outputZipPath){
		console.log('ZIP#make()', _instanceArr, outputZipPath);
		// 配列でなければ配列化する
		const instanceArr = Array.isArray(_instanceArr) ?
			_instanceArr:
			[_instanceArr];
		// [..'path']
		const pathArr = instanceArr.map( (instance)=>{
			if( not.str(instance.path) ){
				throw TypeError(`Invalid argument: ${instance}`);
			}
			return instance.path;
		});
		const zipPath = await zip(pathArr, outputZipPath);
		return new ZIP(zipPath);
	}

}

module.exports = ZIP;
