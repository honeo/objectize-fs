console.log('test-image.js');

// Modules
const Test = require('@honeo/test');
const fse = require('fs-extra');
const path = require('path');
const {is, not, any} = require('@honeo/check');
const {Image, cache, debug} = require('../');

// debug(true);

// Var
const exampleDir = path.resolve('./example-image');
const option = {
	chtmpdir: true,
	exit: true,
	async init(){
		// キャッシュをクリア
		cache.clear();
		// 作業Dirを掃除
		await fse.emptyDir('./');
		// ./exampleの中身を作業Dirへコピー
		const list = await fse.readdir(exampleDir);
		for(let targetPath of list){
			const targetFullpath = path.join(exampleDir, targetPath);
			const targetAfterFullPath = path.join('./', targetPath);
			await fse.copy(targetFullpath, targetAfterFullPath);
		}
	},
	prefix: 'Image'
}

return Test([

	async function(){
		console.log('new Image()');
		const image_bmp = await new Image('./sakura_modoki.bmp');
		const image_jpg = await new Image('./sakura_modoki.jpg');
		const image_png = await new Image('./sakura_modoki.png');
		return is.true(
			image_bmp instanceof Image,
			image_jpg instanceof Image,
			image_png instanceof Image
		);
	},

	async function(){
		console.log('new Image() validation');
		try{
			await new Image('./hoge.txt');
			return false;
		}catch(e){
			return true;
		}
	},

	async function(){
		console.log('Image.isValidExtension()');
		return is.true(
			Image.isValidExtension('bmp'),
			Image.isValidExtension('png'),
			Image.isValidExtension('jpg'),
			!Image.isValidExtension('hoge'),
		);
	},

	async function(){
		console.log('Image.isValidExtension() validation');
		try{
			!Image.isValidExtension(true);
			!Image.isValidExtension();
			return false;
		}catch(e){
			return true;
		}
	},


	async function(){
		console.log('Image.make() case: buffer');
		const buffer = await fse.readFile('./sakura_modoki.bmp');
		const size_buffer = buffer.length;
		const image = await Image.make('./output-buffer.bmp', buffer);
		const size_image = await image.size();
		return is.true(
			await fse.exists('./output-buffer.bmp'),
			size_image===size_buffer
		);
	},

	// dummyimageでは.bmpを取れないためローカルの静的HTTPDを用意したい
	async function(){
		console.log('Image.make() case: DL');
		const image_png = await Image.make(
			'./image.png',
			'https://dummyimage.com/320x240.png'
		);
		const image_png_size = await image_png.size();
		const image_jpg = await Image.make(
			'./image.jpg',
			'https://dummyimage.com/320x240.jpg'
		);
		const image_jpg_size = await image_jpg.size();
		return is.true(
			await fse.exists('./image.png'),
			await fse.exists('./image.jpg'),
			image_png.name==='image.png',
			image_jpg.name==='image.jpg',
			image_png_size!==image_jpg_size
		);
	},


	async function(){
		console.log('Image#output()');
		const image_bmp = await new Image('./sakura_modoki.bmp');
		const image_png = await image_bmp.output('./output.png', {
			greyscale: true,
			quality: 100,
			resize: ['jimp.AUTO', 250]
		});
		return is.true(
			await fse.exists('./output.png'),
			await image_bmp.size() > await image_png.size()
		);
	},

	async function(){
		console.log('Image#isImage');
		const image_bmp = await new Image('./sakura_modoki.bmp');
		const image_jpg = await new Image('./sakura_modoki.jpg');
		const image_png = await new Image('./sakura_modoki.png');
		return is.true(
			image_bmp.isImage,
			image_jpg.isImage,
			image_png.isImage
		);
	}



], option);
