(function (global) {

	"use strict";

	var Appacitive = global.Appacitive;

	var accessTypes = ['allow', 'deny'];

	var states = ['create', 'read', 'update', 'delete', 'manageaccess'];

	var validatePermission = function(permissions) {
		var res = [];
		permissions.forEach(function(p) {
			if (_type.isString(p) && states.indexOf(p.toLowerCase()) != -1) {
				res.push(p.toLowerCase());
			}
		});

		return res;
	};

	Appacitive._Acl = function(o, setSnapshot) {

		var acls = o || [];		

		if (!_type.isArray(acls)) acls = [];

		var _snapshot = {} ;

		if (setSnapshot) {
			_snapshot = JSON.parse(JSON.stringify(acls));
		}

		acls = JSON.parse(JSON.stringify(acls));

		this.acls = acls;

		var changed = [];

		var setPermission = function(access, type, sid, permissions) {
			if (!sid) throw new Error("Specify valid user or usergroup");

			if ((sid instanceof Appacitive.Object) && sid.typeName == 'user' && !sid.isNew()) {
				sid = sid.id;
			} 

			var acl = acls.filter(function(a) { return  (a.sid == sid && a.type == type ); }), exists = false;

			if (!acl || acl.length == 0) {
			 	acl = { sid: sid, type: type, deny: [], allow: [] };
			 	acls.push(acl);
			}
			else acl = acl[0];
			
			if (!acl.allow) acl.allow = [];
			if (!acl.deny) acl.deny = [];

			permissions = validatePermission(permissions);

			var chAcl = changed.filter(function(a) { return (a.sid == sid && a.type == type); });
			if (!chAcl || chAcl.length == 0) {
			  	chAcl = { sid: sid, type: type };
				changed.push(chAcl);
			} else chAcl = chAcl[0];
			
			permissions.forEach(function(p) {
				for (var i = 0; i < accessTypes.length; i = i + 1) {
					var ind = acl[accessTypes[i]].indexOf(p);
					if (ind != -1) {
						acl[accessTypes[i]].splice(ind, 1);
						break;
					}
				}

				if (access != 'dontcare') {
					acl[access].push(p);
				}

				chAcl[p] = access;
			});

			return this;
		};

		var setPermissions = function(access, type, sids, permissions) {
			if (!sids) throw new Error("Please provide valid id or name for setting acls");
			if (!permissions) throw new Error("Please provide valid access permissions for setting acls");

			if (!_type.isArray(permissions)) permissions = [permissions];

			if (_type.isArray(sids)) {
				sids.forEach(function(sid) {
					setPermission(access, type, sid, permissions);
				});
			} else {
				setPermission(access, type, sids, permissions);	
			}

			return this;
		};

		var setUpOps = function() {

			acls.allowUser = function(sids, permissions) {
				return setPermissions.apply(this, ['allow', 'user', sids, permissions]);
			};

			acls.allowGroup = function(sids, permissions) {
				return setPermissions.apply(this, ['allow', 'usergroup', sids, permissions]);
			};

			acls.denyUser = function(sids, permissions) {
				return setPermissions.apply(this, ['deny', 'user', sids, permissions]);
			};

			acls.denyGroup = function(sids, permissions) {
				return setPermissions.apply(this, ['deny', 'usergroup', sids, permissions]);
			};

			acls.resetUser = function(sids, permissions) {
				return setPermissions.apply(this, ['dontcare', 'user', sids, permissions]);
			};

			acls.resetGroup = function(sids, permissions) {
				return setPermissions.apply(this, ['dontcare', 'usergroup', sids, permissions]);
			};

			acls.allowAnonymous = function(permissions) {
				return setPermissions.apply(this, ['allow', 'usergroup', ['anonymous'], permissions]);
			};

			acls.denyAnonymous = function(permissions) {
				return setPermissions.apply(this, ['deny', 'usergroup', ['anonymous'], permissions]);
			};

			acls.resetAnonymous = function(permissions) {
				return setPermissions.apply(this, ['dontcare', 'usergroup', ['anonymous'], permissions]);
			};

			acls.allowLoggedIn = function(permissions) {
				return setPermissions.apply(this, ['allow', 'usergroup', ['anonymous'], permissions]);
			};

			acls.denyLoggedIn = function(permissions) {
				return setPermissions.apply(this, ['deny', 'usergroup', ['anonymous'], permissions]);
			};

			acls.resetLoggedIn = function(permissions) {
				return setPermissions.apply(this, ['dontcare', 'usergroup', ['anonymous'], permissions]);
			};
		};

		this._rollback = function() {
			changed = [];
			acls = JSON.parse(JSON.stringify(_snapshot));
			setUpOps();
			return this;
		};

		this.getChanged = function() {
			var chAcls = [];
			changed.forEach(function(a) {
				var acl = { sid: a.sid, type: a.type, allow: [], deny: [], dontcare: [] };
				states.forEach(function(s) {
					if (a[s]) {
						acl[a[s]].push(s);
					}
				});

				accessTypes.forEach(function(at) {
					if (acl[at].length == 0) delete acl[at];
				});

				if (acl['dontcare'].length == 0) delete acl['dontcare'];

				chAcls.push(acl);
			});

			if (chAcls.length == 0) return null;

			return chAcls;
		};

		this.toJSON = this.getChanged;

		this.merge = function() {
			changed = [];
			return this;
		};

		setUpOps();

		return this;
	};

	var _groupManager = function() {
		
		var _addRemoveMembers = function(op, groupName, members, options) {

			if (!groupName || !_type.isString(groupName) ||  groupName.length === 0) throw new Error("Please specify valid groupname"); 

			if (!_type.isArray(members)) members = [members];

			var cmd = {};

			cmd[op] = [];

			members.forEach(function(m) {
				if (!m) return;

				if ((m instanceof Appacitive.Object)  && m.typeName == 'user' && !m.isNew()) {
					cmd[op].push(m.id);
				} else if (_type.isString(m)) {
					cmd[op].push(m);
				}
			});


			if (cmd[op].length == 0) throw new Error("Please specify valid members as second argument");

			var request = new Appacitive._Request({
				method: 'POST',
				type: 'usergroup',
				op: 'getUpdateUrl',
				args: [groupName],
				data: cmd,
				entity: this,
				options: options,
				onSuccess: function(data) {
					request.promise.fulfill(data);
				}
			});

			return request.send();
		};

		this.addMembers = function(groupName, members, options) {
			return _addRemoveMembers('add', groupName, members);
		};

		this.removeMembers = function(groupName, members, options) {
			return _addRemoveMembers('remove', groupName, members);
		};
	};

	Appacitive.Group = new _groupManager();

})(global);
	