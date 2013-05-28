
if (typeof module != 'undefined') {
	module.exports = function(options) {
		global.Appacitive.initialize(options);
		return global.Appacitive;
	}
}