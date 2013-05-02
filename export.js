
if (typeof module != 'undefined') {
	module.exports = function(apikey) {
		global.Appacitive.initialize({apikey:apikey});
		return global.Appacitive;
	}
}