/*
	JSONコンストラクタ
*/
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const File = require('./file.js');
const jsonfileP = require('jsonfile-promised');
const {cache} = require('./shared.js');


// 本体
class JSON extends File{

	/*
		引数パスの.jsonファイルからインスタンスを作る
			キャッシュがあればそのまま返す。

			引数
				1: string
				2: op, stats
			返り値
				promise
					作成したJSONインスタンスを引数に解決する。
	*/
	constructor(_pathStr, stats){
		console.log('new JSON()');
		const fullpath = path.resolve(_pathStr);

		if( cache.has(fullpath) ){
			return cache.get(fullpath);
		}else{
			return super(fullpath, stats).then( (json)=>{
				json.space = 2; // やっつけ
				return json;
			});
		}
	}

	// JSON#method() ///////////////////////////////////////

	/*
		.jsonファイルを読み込む
			引数
				なし
			返り値
				promise
					オブジェクトを引数に解決する。
	*/
	async read(){
		console.log('JSON#read()');
		return jsonfileP.readFile(this.path);
	}

	/*
		.jsonファイルに書き込む
			引数
				1: object
			返り値
				promise
	*/
	async write(obj={}){
		console.log('JSON#write()', obj);
		return jsonfileP.writeFile(this.path, obj, {spaces: this.space});
	}

	// JSON#prop ///////////////////////////////////////////

	/*
		true
	*/
	get isJSON(){
		console.log('JSON#isJSON');
		return true;
	}
	set isJSON(arg){}

	// JSON.method() ///////////////////////////////////////

	/*
		引数パスを元に.jsonファイルを作成する

		引数
			1: string
				出力する.jsonファイルのパス。
			2: op, object
				key:valueをJSONに書き込むオブジェクト。
			3: number or string

		返り値
			promise
				作成した.jsonファイルのJSONインスタンスを引数に解決する。
	*/
	static async make(outputJsonPath, obj={}){
		console.log('JSON#make()', outputJsonPath);
		if( not.str(outputJsonPath) ){
			throw new TypeError(`Invalid argument: ${outputJsonPath}`);
		}
		await jsonfileP.writeFile(outputJsonPath, obj, {spaces: this.space});
		return new JSON(outputJsonPath);
	}

}

module.exports = JSON;
