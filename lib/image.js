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
		const ext = path.extname(_pathStr);

		// validation
		if( !Image.isValidExtension(ext) ){
			throw new TypeError(`Invalid extension: ${ext}`);
		}

		const instance = cache.has(fullpath) ?
			cache.get(fullpath):
			super(fullpath, stats);


		return instance;
	}


	// prototype ///////////////////////////////////////////////////////

	/*
		jimpへ投げて加工してファイルにする
			拡張子のvalidationはjimp側でもやるからサボっている
			#rgba()以外にboolを渡すとcallbackとして読み取ろうとしてコケる
				呼び出す関数名を見てundefinedにすげ替えて回避している

			引数
				1: string
					出力先パス
				2: object
					jimpに投げる{関数名:引数or[..引数]}
	*/
	async output(output, options){
		console.log('Image#output()', output, options);

		if( not.str(output) ){
			throw new TypeError(`Invalid argument: ${output}`);
		}else if( not.obj(options) ){
			throw new TypeError(`Invalid argument: ${options}`);
		}

		const jimp = require('jimp');
		const image_jimp = await jimp.read(this.path);

		for(let [methodName, value] of Object.entries(options) ){
			// 配列でないなら配列化
			const _args = is.arr(value) ?
				value:
				[value];
			// 引数チェック
			const args = _args.map( (arg)=>{
				// jimp.から始まる文字列があれば定数化
				if( is.str(arg) && /^jimp\./.test(arg) ){
					const [, , propName] = /(^jimp\.)(.+$)/.exec(arg);
					return jimp[propName];
				}else if( methodName!=='rgba' && is.bool(arg) ){
				// jimp#rgba() 以外で引数がbooleanならundef化
					return undefined
				}else{
					return arg;
				}
			});

			image_jimp[methodName](...args);
		}

		await new Promise( (res, rej)=>{
			image_jimp.write(output, (error)=>{
				error ?
					rej(error):
					res();
			});
		});
		return await new Image(output);
	}


	// prop ///////////////////////////////////////////

	/*
		true
	*/
	get isImage(){
		console.log('Image#isImage');
		return true;
	}
	set isImage(arg){}




	// static ///////////////////////////////////////

	/*
		URL, bufferを元に画像ファイル実体を作成する

		引数
			1: string or buffer
				入力する画像のBMP Buffer or URL.
			2: string
				出力する画像ファイルのパス。
				対応する拡張子じゃないとダメ。
		返り値
			promise
				作成した画像ファイルのImageインスタンスを引数に解決する。
	*/
	static async make(output, input){
		console.log('Image.make()', output, input);

		if( not.str(output) ){
			throw new TypeError(`Invalid argument: ${output}`);
		}

		const output_ext = path.extname(output);
		if( !Image.isValidExtension(output_ext) ){
			throw new Error(`Invalid extension: ${output_ext}`);
		}

		if( is.str(input) ){
			// DLしたbufferの画像チェックがめんどいからjimpに丸投げ
			const jimp = require('jimp');
			const image_jimp = await jimp.read(input);
			await new Promise( (res, rej)=>{
				image_jimp.write(output, (error)=>{
					error ?
						rej(error):
						res();
				});
			});
			return await new Image(output);
		}else if( is.buffer(input) ){
			await fse.writeFile(output, input);
			return new Image(output);
		}else{
			throw new TypeError(`Invalid argument: ${input}`);
		}
	}

	/*
		引数文字列が対応している画像タイプの拡張子か

		引数
			1: string
				"bmp", "jpg", "png" など。
				dotはあってもなくてもいい。
		返り値
			boolean
				対応の可否。
	*/
	static isValidExtension(ext){
		console.log('Image.isValidExtension', ext);
		if( not.str(ext) ){
			throw new TypeError(`Invalid argument: ${ext}`);
		}
		return /^\.?(bmp|jpg|png)$/.test(ext);
	}


}

module.exports = Image;
