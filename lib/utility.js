/*
	便利メソッド詰め合わせ
*/

// Modules
const fse = require('fs-extra');
const ospath = require('ospath');
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const {cache, isStats} = require('./shared.js');


// 本モジュール返り値のオブジェクト
const Utility = {

	/*
		引数パスをよしなにインスタンスにする
			キャッシュがあればそのまま返す。

			引数
				1: string
					ファイル・ディレクトリへのパス
				2: op, stats
					あれば再利用する。
			返り値
				promise
					作成したインスタンスを引数に解決する。
	*/
	async getInstance(pathStr, _stats){
		console.log('Utility.getInstance()', pathStr);

		// キャッシュがあればそれを返しておしまい
		if( cache.has(pathStr) ){
			return cache.get(pathStr);
		}

		// なければインスタンス作成を代行
		const stats = isStats(_stats) ?
			_stats:
			await fse.stat(pathStr);
		const instance = (function(){
			if( stats.isFile() ){
				const name = path.basename(pathStr);
				if( /\.ZIP$/i.test(name) ){
					const ZIP = require('./zip.js');
					return new ZIP(pathStr, stats);
				}else if( /\.RAR$/i.test(name) ){
					const RAR = require('./rar.js');
					return new RAR(pathStr, stats);
				}else if( /\.JSON$/i.test(name) ){
					const JSON = require('./json.js');
					return new JSON(pathStr, stats);
				}else{
					const File = require('./file.js');
					return new File(pathStr, {stats});
				}
			}else{
				const Directory = require('./directory.js');
				return new Directory(pathStr, {stats});
			}
		}());
		return instance;
	},

	async getDesktop(){
		console.log('Utility.getDesktop()');
		const Directory = require('./directory.js');
		return new Directory(ospath.desktop());
	},
	async getHomeDir(){
		console.log('Utility.getHomeDir()');
		const Directory = require('./directory.js');
		return new Directory(ospath.home());
	},
	async getTempDir(){
		console.log('Utility.getTempDir()');
		const Directory = require('./directory.js');
		return new Directory(ospath.tmp());
	}

}

module.exports = Utility;
