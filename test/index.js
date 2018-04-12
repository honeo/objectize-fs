const packagejson = require('../package.json');
console.log(`${packagejson.name} v${packagejson.version}`);

// Modules
const Test = require('@honeo/test');
const Archiver = require('archiver');
const fse = require('fs-extra');
const path = require('path');
const {is, not, any} = require('@honeo/check');
const {Directory, File, JSON, ZIP, RAR, Utility, cache, debug} = require('../');
const ospath = require('ospath');

// debug(true);

// Var
const exampleDir = path.resolve('example');
const option = {
	chtmpdir: true,
	exit: true,
	async init(){
		// キャッシュをクリア
		cache.clear();
		// ワーキングディレクトリを掃除
		await fse.emptyDir('./');
		// test/exampleの中身をワーキングディレクトリへコピー
		const list = await fse.readdir(exampleDir);
		for(let targetPath of list){
			const targetFullpath = path.join(exampleDir, targetPath);
			const targetAfterFullPath = path.join('./', targetPath);
			await fse.copy(targetFullpath, targetAfterFullPath);
		}
	},
	prefix: ''
}

// Main, readme順
Test([

	/// Directory

	// fileへのパスでinstanceが作成できたら失敗
	// インスタンスがEventEmitter, Directoryを継承していれば成功。
	async function(){
		console.log('new Directory(path)');
		try{
			const dir = await new Directory('hoge.txt');
			return false;
		}catch(e){
			const dir = await new Directory('./');
			return is.true(
				dir instanceof Directory
			);
		}
	},

	async function(){
		console.log('Directory.make()');
		const dir_tmp = await Directory.make('./tmp');
		return fse.existsSync(dir_tmp.path);
	},

	async function(){
		console.log('Directory#cd()');
		const dir = await new Directory('foo');
		const cd_before = process.cwd();
		await dir.cd();
		const cd_after = process.cwd();
		process.chdir(cd_before);
		return cd_before!==cd_after;
	},

	// 実行前の要素数がDirectory,ofs両方のAPIから見て1以上で、実行後にどちらも要素数になっていれば成功
	async function(){
		console.log('Directory#clear()');
		const dir = await new Directory('./');
		const num_before_dir = await dir.getContents().then( (arr)=>{
			return arr.length;
		});
		const num_before_fs = await fse.readdir('./').then( (arr)=>{
			return arr.length;
		});
		await dir.clear();

		const num_after_dir = await dir.getContents().then( (arr)=>{
			return arr.length;
		});
		const num_after_fs =	await fse.readdir('./').then( (arr)=>{
			return arr.length;
		});
		return is.true(
			num_before_dir!==0,
			num_before_fs!==0,
			num_after_dir===0,
			num_after_fs===0
		);
	},

	async function(){
		console.log('Directory#copy(dirPath)');
		const dir_foo = await new Directory('./foo');
		const dir_bar = await dir_foo.copy('bar');
		return is.true(
			dir_bar.name==='bar',
			fse.existsSync('bar')
		);
	},
	async function(){
		console.log('Directory#copy(dirPath_duplication)');
		const dir = await Directory.make('bar');
		return dir.copy('foo/bar').catch( (error)=>{
			return true;
		});
	},
	async function(){
		console.log('Directory#copy(dirPath_duplication, true)');
		const dir = await Directory.make('bar');
		const dirB = await dir.copy('foo/bar', true);
		return is.true(
			dirB.name==='bar',
			fse.existsSync('foo/bar')
		);
	},
	async function(){
		console.log('Directory#date()');
		const dir = await new Directory('./');
		const date = await dir.date();
		return is.date(
			date.a,
			date.m,
			date.c,
			date.birth
		);
	},
	async function(){
		console.log('Directory#delete()');
		const dir = await Directory.make('./tmp');
		const result = await dir.delete();
		return is.true(
			result===undefined,
			!fse.existsSync('./tmp')
		);
	},
	async function(){
		console.log('Directory#get()');
		const dir = await new Directory('./');
		const res1 = await dir.get('foo');
		const res2 = await dir.get('hoge.txt');
		const res3 = await dir.get('foo', {file: false});
		const res4 = await dir.get('hoge.txt', {directory: false});
		const res5 = await dir.get('piyo.piyo'); // 存在しないケース
		const res6 = await dir.get('foo', {async filter(target){
			const list = await target.list();
			return !!list.length;
		}});
		const res7 = await dir.get('foo', {filter(target){ // 失敗するケース
			return target.isFile;
		}});
		return is.truthy(res1, res2, res3, res4, !res5, res6, !res7);
	},
	async function(){
		console.log('Directory#getContents()');
		const dir = await new Directory('./');
		const bool1 = await dir.getContents().then( (arr)=>{
			return arr.length===7;
		});
		const bool2 = await dir.getContents({file: false}).then( (arr)=>{
			return arr.length===2;
		});
		const bool3 = await dir.getContents({directory: false}).then( (arr)=>{
			return arr.length===5;
		});
		const bool4 = await dir.getContents({greedy: true}).then( (arr)=>{
			return arr.length===9;
		});
		const _bool5 = await dir.getContents({async filter(target){
			return target.isZIP;
		}});
		const bool5 = _bool5.length===1;
		return is.true(
			bool1, bool2, bool3, bool4, bool5
		);
	},
	async function(){
		console.log('Directory#getDirs(), getDirectories()');
		const dir = await new Directory('./');
		const arr1 = await dir.getDirectories();
		const arr2 = await dir.getDirs({greedy: true});
		return is.true(
			arr1.length===2,
			arr2.length===3
		);
	},
	async function(){
		console.log('Directory#getFiles()');
		const dir = await new Directory('./');
		const arr1 = await dir.getFiles();
		const arr2 = await dir.getFiles({greedy: true});
		return is.true(
			arr1.length===5,
			arr2.length===6
		);
	},

	async function(){
		console.log('Directory#getParentDirectory()');
		const dir_foo = await new Directory('foo');
		const dir_bar = await new Directory('foo/bar');
		return dir_foo===(await dir_bar.getParentDirectory());
	},
	async function(){
		console.log('Directory#getParentDir()');
		const dir_foo = await new Directory('foo');
		const dir_bar = await new Directory('foo/bar');
		return dir_foo===(await dir_bar.getParentDir());
	},

	async function(){
		console.log('Directory#has()');
		const dir = await new Directory('./');
		const res1 = await dir.has('foo');
		const res2 = await dir.has('hoge.txt');
		const res3 = await dir.has('foo', {file: false});
		const res4 = await dir.has('hoge.txt', {directory: false});
		const res5 = await dir.has('piyo.piyo'); // 存在しないケース
		const res6 = await dir.has('foo', {filter(target){
			return target.isDirectory;
		}});
		const res7 = await dir.has('foo', {filter(target){ // 失敗するケース
			return target.isFile;
		}});
		return is.true(res1, res2, res3, res4, !res5, res6, !res7);
	},

	async function(){
		console.log('Directory#list()');
		const dir = await new Directory('./');
		const arr = await dir.list();
		return arr.length===7;
	},
	async function(){
		console.log('Directory#isLive()');
		const dir = await Directory.make('./tmp');
		const status_live = await dir.isLive();
		await dir.delete();
		const status_dead = await dir.isLive();
		return is.true(
			status_live,
			!status_dead
		);
	},
	async function(){
		console.log('Directory#move(dirPath)');
		await fse.mkdirSync('hoge');
		const dir = await new Directory('hoge');
		await dir.move('foo');
		return is.true(
			!fse.existsSync('hoge'),
			fse.existsSync('foo/hoge'),
			dir.path===path.join(process.cwd(), 'foo/hoge')
		);
	},
	async function(){
		console.log('Directory#move(dirPath_duplication)');
		const dir = await Directory.make('bar');
		try{
			await dir.move('foo');
			return false;
		}catch(e){
			console.log('catch');
			return is.true(
				fse.existsSync('bar'),
				fse.existsSync('foo/bar')
			);
		}
	},
	async function(){
		console.log('Directory#move(dirPath_duplication, true)');
		const dir = await Directory.make('bar');
		await dir.move('foo', true);
		return is.true(
			!fse.existsSync('bar'),
			fse.existsSync('foo/bar'),
			dir.path!==process.cwd()
		);
	},
	async function(){
		console.log('Directory#open()');
		return true;
	},

	async function(){
		console.log('Directory#rename()');
		const dir = await new Directory('foo');
		const dir_renamed = await dir.rename('bar');
		return is.true(
			!fse.existsSync('foo'),
			fse.existsSync('bar'),
			dir.name==='bar',
			dir.path===path.join(dir.base, 'bar'),
			dir===dir_renamed
		);
	},

	// option.overwrite 上書き成功ならテスト成功
	async function(){
		console.log('Directory#rename(, {overwrite})');
		const dir = await Directory.make('bar');
		const dir_renamed = await dir.rename('foo', true);
		return is.true(
			!fse.existsSync('bar'),
			fse.existsSync('foo'),
			dir.name==='foo',
			dir.path===path.join(dir.base, 'foo'),
			dir===dir_renamed
		);
	},

	// option.overwrite 上書き失敗すれば成功
	async function(){
		console.log('Directory#rename() case-overwrite-fail');
		const dir = await Directory.make('bar');
		try{
			await dir.rename('foo');
			return false;
		}catch(e){
			return true;
		}
	},

	async function(){
		console.log('Directory#size()');
		const dir = await new Directory('./');
		const size = await dir.size();
		return 0<size;
	},
	async function(){
		console.log('Directory#search()');
		const dir = await new Directory('./');
		const res1 = await dir.search('hoge.txt');
		const res2 = await dir.search('fuga.txt');
		const res3 = await dir.search(/^hoge\.txt$/);
		const res4 = await dir.search(/^foo$/);
		const res5 = await dir.search(/^fooo$/);
		const res6 = await dir.search('foobar.txt', {file:true, directory:false, greedy: true});
		const res7 = await dir.search(/./, {greedy: true, global: true});
		const res8 = await dir.search(/./, {
			file: true,
			directory: false,
			greedy: true,
			global: true,
			async filter(file){
				return file.ext==='json'
			}
		});
		return is.truthy(
			res1, !res2, res3, res4, !res5, res6, res7.length===9, res8.length===1
		);
	},

	async function(){
		console.log('Directory#search() case-callback');
		const dir = await new Directory('./');
		const resultArr = await dir.search( (instance)=>{
			return instance.isFile && instance.ext==='txt';
		}, {
			global: true,
			greedy: true
		});
		return resultArr.length===2;
	},

	async function(){
		console.log('Directory#trash()');
		const dir = await Directory.make('./tmp');
		const result = await dir.trash();
		return is.true(
			!fse.existsSync('./tmp')
		);
	},

	async function(){
		console.log('Directory#base');
		const dir = await new Directory('./');
		return dir.base===path.resolve('../');
	},

	async function(){
		console.log('Directory#isDirectory');
		const dir = await new Directory('./');
		return is.true(dir.isDirectory);
	},

	async function(){
		console.log('Directory#isDir');
		const dir = await new Directory('./');
		return is.true(dir.isDir);
	},

	async function(){
		console.log('Directory#path');
		const dir = await new Directory('./');
		return dir.path===path.resolve('./');
	},


	/// File

	// ディレクトリのパスで作成できれば失敗。
	// インスタンスがFile,EventEmitterを継承していれば成功。
	async function(){
		console.log('new File(path)');
		try{
			const file = await new File('./');
			return true;
		}catch(e){
			const file = await new File('hoge.txt');
			return is.true(
				file instanceof File,
			);
		}
	},
	async function(){
		console.log('File.make()');
		const file = await File.make('text.txt', 'hogefugapiyo');
		return is.true(
			fse.existsSync('text.txt'),
			file instanceof File
		);
	},

	async function(){
		console.log('File#autoExt()');
		const zip = await new ZIP('fuga.zip');
		await zip.rename('fuga'); // 拡張子を削除
		const result = await zip.autoExt();
		console.log(result.name, result.basename, result.ext);
		return is.true(
			zip===result,
			result.name==='fuga.zip',
			result.basename==='fuga',
			result.ext==='zip'
		);
	},

	async function(){
		console.log('File#autoExt() インスタンス変化');
		await fse.copy('./fuga.zip', './fuga');
		const file = await new File('./fuga');
		const zip = await file.autoExt();
		return zip.isZIP;
	},

	async function(){
		console.log('File#base');
		const file = await new File('hoge.txt');
		const path_parentDir = path.resolve('./')
		return file.base===path_parentDir;
	},
	async function(){
		console.log('File#basename');
		const file = await new File('hoge.txt');
		return file.basename==='hoge';
	},
	async function(){
		console.log('File#copy(filePath)');
		const file = await new File('hoge.txt');
		const fileB = await file.copy('fuga.txt');
		return is.true(
			fileB.name==='fuga.txt',
			fse.existsSync('fuga.txt')
		)
	},
	async function(){
		console.log('File#copy(filePath_overwrite, true)');
		const file = await new File('hoge.txt');
		const fileB = await file.copy('foo/bar/foobar.txt', true);
		return is.true(
			fileB.name==='foobar.txt',
			fse.existsSync('foo/bar/foobar.txt'),
			fse.readFileSync('foo/bar/foobar.txt', 'utf8')==='hogehoge'
		)
	},
	async function(){
		console.log('File#copy(filePath_overwrite, false)');
		const file = await new File('hoge.txt');
		try{
			const fileB = await file.copy('foo/bar/foobar.txt', false);
			return false;
		}catch(e){
			return is.true(
				fse.readFileSync('foo/bar/foobar.txt', 'utf8')==='foobar'
			)
		}
	},
	async function(){
		console.log('File#date()');
		const file = await new File('hoge.txt');
		const date = await file.date();
		return is.date(
			date.a,
			date.m,
			date.c,
			date.birth
		);
	},
	async function(){
		console.log('File#delete()');
		const file = await new File('hoge.txt');
		const result = await file.delete();
		return is.true(
			result===undefined,
			!fse.existsSync('hoge.txt')
		);
	},
	async function(){
		console.log('File#ext');
		const file = await new File('hoge.txt');
		return file.ext==='txt';
	},

	async function(){
		console.log('File#getParentDirectory()');
		const file = await new File('foo/bar/foobar.txt');
		const parentDir = await file.getParentDirectory();
		return parentDir.name==='bar';
	},
	async function(){
		console.log('File#getParentDir()');
		const file = await new File('foo/bar/foobar.txt');
		const parentDir = await file.getParentDir();
		return parentDir.name==='bar';
	},

	async function(){
		console.log('File#isFile');
		const file = await new File('hoge.txt');
		return is.true(file.isFile);
	},
	async function(){
		console.log('File#isLive()');
		const file = await new File('hoge.txt');
		const status_live = await file.isLive();
		await file.delete();
		const status_dead = await file.isLive();
		return is.true(
			status_live,
			!status_dead
		);
	},
	async function(){
		console.log('File#move(dirPath)');
		const file = await new File('hoge.txt');
		await file.move('foo');
		return is.true(
			!fse.existsSync('hoge.txt'),
			fse.existsSync('foo/hoge.txt')
		);
	},
	async function(){
		console.log('File#move(dirPath_duplication)');
		await fse.writeFile('foobar.txt', '');
		const file = await new File('foobar.txt');
		try{
			await file.move('foo/bar');
			return false;
		}catch(e){
			return is.true(
				fse.existsSync('foobar.txt'),
				fse.existsSync('foo/bar/foobar.txt')
			);
		}
	},
	async function(){
		console.log('File#move(dirPath_duplication, true)');
		await fse.writeFile('foobar.txt', '');
		const file = await new File('foobar.txt');
		await file.move('foo/bar', true);
		return is.true(
			!fse.existsSync('foobar.txt'),
			fse.existsSync('foo/bar/foobar.txt')
		);
	},
	async function(){
		console.log('File#name');
		const file = await new File('hoge.txt');
		return file.name==='hoge.txt';
	},
	async function(){
		console.log('File#open()');
		return true;
	},
	async function(){
		console.log('File#path');
		const file = await new File('hoge.txt');
		return file.path===path.resolve('./hoge.txt');
	},
	async function(){
		console.log('File#read()');
		const file = await new File('hoge.txt');
		const content = await file.read();
		return content==='hogehoge';
	},
	async function(){
		console.log('File#rename()');
		const file = await new File('hoge.txt');
		const file_renamed = await file.rename('fuga.txt');
		return is.true(
			file.name==='fuga.txt',
			file.basename==='fuga',
			file.ext==='txt',
			fse.existsSync('fuga.txt'),
			!fse.existsSync('hoge.txt'),
			file.path===path.join(file.base, 'fuga.txt'),
			file===file_renamed
		);
	},
	async function(){
		console.log('File#size()');
		const file = await new File('hoge.txt');
		const size_before = await file.size();
		fse.writeFileSync('hoge.txt', 'hogehogefugapiyoyo') // hoge.txtへ追記してファイルサイズUP
		const size_after = await file.size();
		return is.true(
			is.num(size_before, size_after),
			size_before < size_after
		);
	},
	async function(){
		console.log('File#trash()');
		const file = await new File('hoge.txt');
		const result = await file.trash();
		return is.true(
			!fse.existsSync('hoge.txt')
		);
	},
	async function(){
		console.log('File#write()');
		const file = await new File('hoge.txt');
		await file.write('fugafuga');
		return fse.readFileSync(file.path, 'utf8')==='fugafuga';
	},

	async function(){
		console.log('File#path');
		const file = await new File('hoge.txt');
		return file.path===path.resolve('hoge.txt');
	},



	// JSON
	async function(){
		console.log('new JSON(jsonPath)');
		const json = await new JSON('piyo.json');
		return json instanceof JSON;
	},
	async function(){
		console.log('JSON.make(filename)');
		const json = await JSON.make('piyo2.json');
		return fse.exists('piyo2.json');
	},
	async function(){
		console.log('JSON.make(filename, object)');
		const json = await JSON.make('piyo2.json', {pi: 'yo'});
		const stats = await fse.stat('piyo2.json');
		return 0 < stats.size;
	},
	async function(){
		console.log('JSON#read(filename)');
		const json = await new JSON('piyo.json');
		const obj = await json.read();
		return is.true(
			Object.keys(obj).length===1,
			obj.piyo==='piyopiyo'
		);
	},
	async function(){
		console.log('JSON#write(obj)');
		const json = await new JSON('piyo.json');
		await json.write({piyo2: 'piyo2'});
		const obj = await fse.readJson('piyo.json');
		return obj.piyo2==='piyo2';
	},
	async function(){
		console.log('JSON#isJSON');
		const json = await new JSON('piyo.json');
		return json.isJSON;
	},
	async function(){
		console.log('JSON#space');
		const json = await new JSON('piyo.json');
		return json.space===2;
	},

	// ZIP, その他Constractorのzip関連method
	async function(){
		console.log('new ZIP(zipPath)');
		const zip = await new ZIP('fuga.zip');
		return zip instanceof ZIP;
	},
	async function(){
		console.log('ZIP.make(filePath)');
		const file = await new File('hoge.txt');
		const zip = await ZIP.make(file);
		return zip instanceof ZIP;
	},
	async function(){
		console.log('ZIP.make(filePath, outputZipPath)');
		const file = await new File('hoge.txt');
		const zip = await ZIP.make(file, 'hogege.zip');
		return is.true(
			zip instanceof ZIP,
			zip.name==='hogege.zip'
		);
	},
	async function(){
		console.log('ZIP.make(dirPath)');
		const dir = await new Directory('foo');
		const zip = await ZIP.make(dir);
		return zip instanceof ZIP;
	},
	async function(){
		console.log('ZIP.make(dirPath, outputZipPath)');
		const dir = await new Directory('foo');
		const zip = await ZIP.make(dir, 'foooo.zip');
		return is.true(
			zip instanceof ZIP,
			zip.name==='foooo.zip'
		);
	},
	async function(){
		console.log('ZIP.make([filePath, dirPath])');
		const file = await new File('hoge.txt');
		const dir = await new Directory('foo');
		const zip = await ZIP.make([file, dir]);
		return is.true(
			zip instanceof ZIP,
			zip.name==='hoge.zip'
		);
	},
	async function(){
		console.log('ZIP.make([filePath, dirPath], outputZipPath)');
		const file = await new File('hoge.txt');
		const dir = await new Directory('foo');
		const zip = await ZIP.make([file, dir], 'hogefoo.zip');
		return is.true(
			zip instanceof ZIP,
			zip.name==='hogefoo.zip'
		);
	},

	async function(){
		console.log('ZIP#unzip(zipPath)');
		const zip = await new ZIP('fuga.zip');
		const dir = await zip.unzip();
		return fse.existsSync('fuga.txt');
	},

	async function(){
		console.log('ZIP#list()');
		const file = await new File('hoge.txt');
		const dir = await new Directory('foo');
		const zip = await ZIP.make([file, dir], 'hogefoo.zip');
		const arr = await zip.list();
		return arr.length===3;
	},

	async function(){
		console.log('ZIP#isZIP');
		const zip = await new ZIP('fuga.zip');
		return is.true(zip.isZIP);
	},
	async function(){
		console.log('Directory#zip()');
		const dir = await new Directory('foo');
		const zip = await dir.zip();
		return is.true(
			zip.name==='foo.zip',
			fse.existsSync('foo.zip'),
			zip instanceof ZIP
		);
	},
	async function(){
		console.log('Directory#zip(outputZipPath)');
		const dir = await new Directory('foo');
		const zip = await dir.zip('fooooo.zip');
		return is.true(
			zip.name==='fooooo.zip',
			fse.existsSync('fooooo.zip'),
			zip instanceof ZIP
		);
	},
	async function(){
		console.log('File#zip()');
		const file = await new File('hoge.txt');
		const zip = await file.zip();
		return is.true(
			fse.existsSync('./hoge.zip'),
			zip.name==='hoge.zip'
		);
	},
	async function(){
		console.log('File#zip() rename');
		const file = await new File('hoge.txt');
		const zip = await file.zip('hogege.zip');
		return is.true(
			fse.existsSync('./hogege.zip'),
			zip.name==='hogege.zip'
		);
	},

	// RAR
	async function(){
		console.log('new RAR()');
		const rar = await new RAR('example.rar');
		return rar instanceof RAR;
	},

	async function(){
		console.log('RAR#extract()');
		const rar = await new RAR('example.rar');
		const dir = await rar.extract('example/hoge.txt', './');
		return is.true(
			dir instanceof Directory,
			await fse.exists('example'),
			await fse.exists('example/hoge.txt'),
		);
	},

	async function(){
		console.log('RAR#extract() encrypt');
		const rar = await new RAR('example-encrypted.rar');
		const dir = await rar.extract('example-encrypted/hoge.txt', './', 'password');
		return is.true(
			dir instanceof Directory,
			await fse.exists('example-encrypted'),
			await fse.exists('example-encrypted/hoge.txt'),
		);
	},

	async function(){
		console.log('RAR#extractAll()');
		const rar = await new RAR('example.rar');
		const dir = await rar.extractAll('./');
		return is.true(
			dir instanceof Directory,
			await fse.exists('example'),
			await fse.exists('example/hoge.txt'),
			await fse.exists('example/foo'),
			await fse.exists('example/foo/bar.txt'),
			await fse.exists('example/empty')
		);
	},

	async function(){
		console.log('RAR#extractAll() encrypt');
		const rar = await new RAR('example-encrypted.rar');
		const dir = await rar.extractAll('./', 'password');
		return is.true(
			dir instanceof Directory,
			await fse.exists('example-encrypted'),
			await fse.exists('example-encrypted/hoge.txt'),
			await fse.exists('example-encrypted/foo'),
			await fse.exists('example-encrypted/foo/bar.txt'),
			await fse.exists('example-encrypted/empty')
		);
	},

	async function(){
		console.log('RAR#list()');
		const rar = await new RAR('example.rar');
		const list = await rar.list();
		return list.length===5;
	},

	async function(){
		console.log('RAR#list() encrypt');
		const rar = await new RAR('example-encrypted.rar');
		const list = await rar.list('password');
		return list.length===5;
	},

	async function(){
		console.log('RAR#isRAR');
		const rar = await new RAR('example.rar');
		return rar.isRAR;
	},



	// Utility
	async function(){
		console.log('Utility.getInstance()');
		const file = await new File('hoge.txt');
		const dir = await new Directory('foo');
		const json = await new JSON('piyo.json');
		const zip = await new ZIP('fuga.zip');
		const rar = await new RAR('example.rar');
		return is.true(
			file instanceof File,
			dir instanceof Directory,
			json instanceof JSON,
			zip instanceof ZIP,
			rar instanceof RAR
		);
	},

	async function(){
		console.log('Utility.getDesktop()');
		// 実体がない環境ならスルー
		if( fse.existsSync(ospath.desktop()) ){
			const dir_desktop = await Utility.getDesktop();
			return dir_desktop.path===ospath.desktop();
		}else{
			return true;
		}
	},

	async function(){
		console.log('Utility.getHomeDir()');
		const dir_home = await Utility.getHomeDir();
		return dir_home.path===ospath.home();
	},
	async function(){
		console.log('Utility.getTempDir()');
		const dir_temp = await Utility.getTempDir();
		return dir_temp.path===ospath.tmp();
	},

	async function(){
		console.log('Utility.download()');
		const file = await Utility.download('http://example.com/', './index.html');
		const size = await file.size();
		const text = await file.read();
		return is.true(
			0 < size,
			text.includes('Example')
		);
	}

], option).catch( (error)=>{
	console.log(error);
});
