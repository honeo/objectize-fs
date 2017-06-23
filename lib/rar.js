/*
	RARコンストラクタ
		ZIPと違いライセンスの都合で圧縮はなし。
*/
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const unrarp = require('unrar-promise');
const File = require('./file.js');
const {cache, validationAndResolve} = require('./shared.js');

// 本体
class RAR extends File{

	/*
		引数パスの.rarファイルからインスタンスを作る
			キャッシュがあればそのまま返す。

			引数
				1: string
				2: op, stats
			返り値
				promise
					作成したRARインスタンスを引数に解決する。
	*/
	constructor(_pathStr, stats){
		console.log('new RAR()');
		const pathStr = validationAndResolve(_pathStr);

		if( cache.has(pathStr) ){
			return cache.get(pathStr);
		}else{
			return super(pathStr, stats);
		}
	}

	/*
		自身の実体から指定したコンテンツを展開する
			Validationはunrarpの方でやるから省略。

			引数
				1: string or array
					自身の実体から展開するコンテンツのパスかその配列
				2: string
					展開先ディレクトリのパス
				3: op, string
					password
			返り値
				promise
					出力先ディレクトリのdirectoryインスタンスを引数に解決する
	*/
	async extract(...args){
		console.log('RAR#extract()');
		const dirPath = await unrarp.extract(this.path, ...args);
		const Directory = require('./directory.js');
		return new Directory(dirPath);
	}

	/*
		自身の実体から全てのコンテンツを展開する
			Validationはunrarpの方でやるから省略。

			引数
				1: string
					展開先ディレクトリのパス
				2: op, string
					password
			返り値
				promise
					出力先ディレクトリのdirectoryインスタンスを引数に解決する
	*/
	async extractAll(...args){
		console.log('RAR#extractAll()');
		const dirPath = await unrarp.extractAll(this.path, ...args);
		const Directory = require('./directory.js');
		return new Directory(dirPath);
	}

	/*
		自身の実体が持つ全てのコンテンツ名を配列で取得する
			Validationはunrarpの方でやるから省略。

			引数
				1: op, string
					password
			返り値
				promise
					取得したコンテンツ名の配列を引数に解決する。
	*/
	async list(...args){
		console.log('RAR#list()');
		return await unrarp.list(this.path, ...args);
	}

	// RAR#prop

	/*
		true
	*/
	get isRAR(){
		console.log('RAR#isRAR');
		return true;
	}
	set isRAR(arg){}

	// RAR.method()

}

module.exports = RAR;
