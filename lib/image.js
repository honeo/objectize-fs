/*
	Imageコンストラクタ
*/

// Mod
const path = require('path');
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');
const File = require('./file.js');
const {cache} = require('./shared.js');
const fse = require('fs-extra');

// Var
const re_validExts = /^(bmp|jpg|png)$/; // 対応する拡張子

// 本体
class Image extends File{

	/*
		引数パスの画像ファイルからインスタンスを作る
			対応する画像タイプの拡張子を持つファイルのみ許可する。
			キャッシュがあればそのまま返す。

			引数
				1: string
				2: op, stats
			返り値
				promise
					作成したImageインスタンスを引数に解決する。
	*/
	constructor(_pathStr, stats){
		console.log('new Image()');
		const fullpath = path.resolve(_pathStr);

		const instance = cache.has(fullpath) ?
			cache.get(fullpath):
			super(fullpath, stats);

		// validation
		if( !re_validExts.test(instance.ext) ){
			throw new TypeError(`Invalid extension: ${instance.ext}`);
		}

		return instance;
	}

	// Image#method() ///////////////////////////////////////



	// JSON#prop ///////////////////////////////////////////

	/*
		true
	*/
	get isImage(){
		console.log('Image#isImage');
		return true;
	}
	set isImage(arg){}




	// Image.method() ///////////////////////////////////////

	/*
		URL, bufferを元に画像ファイル実体を作成する

		引数
			1: string or buffer
				入力する画像のBMP Buffer or URL.
			2: string
				出力する画像ファイルのパス。

		返り値
			promise
				作成した画像ファイルのImageインスタンスを引数に解決する。
	*/
	static async make(input, outputFilePath){
		console.log('JSON#make()', outputJsonPath);
		if( not.str(outputJsonPath) ){
			throw new TypeError(`Invalid argument: ${outputJsonPath}`);
		}
		await fse.writeJson(outputJsonPath, obj, {spaces: this.space});
		return new JSON(outputJsonPath);
	}

}

module.exports = JSON;
