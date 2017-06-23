// Mod
const console = require('console-wrapper');
const {is, not, any} = require('@honeo/check');

// Var
const {cache, validationAndResolve} = require('./lib/shared.js');
const ObjectizeFS = Object.create(null); // 返り値

// 先にrequire(File)するとコケる
ObjectizeFS.Directory = require('./lib/directory.js');
ObjectizeFS.File = require('./lib/file.js');
ObjectizeFS.JSON = require('./lib/json.js');
ObjectizeFS.ZIP = require('./lib/zip.js');
ObjectizeFS.RAR = require('./lib/rar.js');
ObjectizeFS.Utility = require('./lib/utility.js');
ObjectizeFS.cache = cache;
ObjectizeFS.debug = function(bool){
	if( is.true(bool) ){
		console.enable();
	}else if( is.false(bool) ){
		console.disable();
	}
}

module.exports = ObjectizeFS;
