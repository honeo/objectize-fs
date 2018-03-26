/*
	共通で使い回すやつ
*/

// Modules
const fse = require('fs-extra');
const path = require('path');
const LRUCache = require('@honeo/lru-cache');


/*
	Statsか確認
*/
function isStats(arg){
	return arg instanceof fse.Stats;
}

/*
	lru-cacheのインスタンス
*/
const cache = new LRUCache({
	capacity: 1000,
	expire: 1000*60*60 // 1h
});

/*
	インスタンスのプライベートプロパティ参照に使うSymbol
		厳密にはプライベートにならないけど特に問題ない。
*/
const symbol_path = Symbol();

module.exports = {
	cache,
	isStats,
	symbol_path
}
