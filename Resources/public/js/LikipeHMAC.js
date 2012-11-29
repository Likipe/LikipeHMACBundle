var LikipeHMAC = (function($, CryptoJS) {
	
	var secret         = '';
	var identifier     = '';
	var nonceGenerator = null;
	var doDebug        = false;
	/* Ajax */
	var ajaxBeforeSend = function() {};
	var ajaxComplete   = function() {};
	/* To prevent endless recursive looping in case $.ajax is replaced with LikipeHMAC.ajax */
	var jQueryAjax     = $.ajax;
	
	
	var consoleLog = function(message) {
		if(console.log) {
			console.log("LikipeHMAC: " + message);
		}
	};
	
	var debugLog = function(message) {
		if(doDebug) {
			consoleLog(message);
		}
	}
	
	
	var encrypt = function(value) {
		return CryptoJS.HmacSHA256(value, secret).toString(CryptoJS.enc.Base64);
	};
	
	
	var randomBytes = function (n) {
		var bytes = [];
			
		/* Use secure random-number generator if available (e.g. in WebKit) */
		if(window.crypto && window.crypto.getRandomValues) {
			var buf = new Uint8Array(n);
				
			window.crypto.getRandomValues(buf);
				
			for (var i = 0; i < n; i++) {
				bytes.push(buf[i]);
			}
		}
		else {
			for (var bytes = []; n > 0; n--) {
				bytes.push(Math.floor(Math.random() * 256));
			}
		}
		
		return bytes;
	};
		
	var charMap = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.split("");
		
	var byteString = function(length) {
		return randomBytes(length / 2 | 0).map(function(b) {
			return charMap[b / 64 | 0] + charMap[b % 64 | 0];
		}).join("");
	};
	
	var createNonce = function() {
		return (new Date()).getTime() + ':' + byteString(64);
	};
	
	
	var escapeHTML = function(s) {
		return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
	};
	
	var qualifyURI = function(url) {
		var el = document.createElement('div');
		
		el.innerHTML= '<a href="'+escapeHTML(url)+'">x</a>';
		
		/* TODO: Mozilla has a known bug for the hash property:
		         https://bugzilla.mozilla.org/show_bug.cgi?id=483304
		         it will unescape the value after the "#" sign. */
		return el.firstChild.pathname + el.firstChild.search + el.firstChild.hash;
	};
	
	
	var signRequest = function(jqXHR, settings) {
		debugLog("Executing beforeSend");
		if(secret.length == 0 || identifier.length == 0) {
			throw new Error("Cannot generate header, credentials not set.");
		}
		
		var port  = window.location.port;
		var nonce = nonceGenerator();
		var body  = typeof settings.data !== 'undefined' ? settings.data.toString() : '';
		
		if(port == null || typeof port === 'string' && port.length == 0) {
			port = window.location.protocol == "https:" ? 443 : 80;
		}
		
		debugLog("Payload: \"" + body + "\"");
		
		var bodyHash = body.length > 0 ? CryptoJS.SHA256(body).toString(CryptoJS.enc.Base64) : '';
		
		var normalizedRequest = nonce + "\n" +
			settings.type.toUpperCase() + "\n" +
			qualifyURI(settings.url) + "\n" +
			window.location.hostname.toLowerCase() + "\n" +
			port + "\n" +
			bodyHash + "\n" +
			'' /* ext value, empty */;
		
		debugLog("request: " + normalizedRequest);
		
		jqXHR.setRequestHeader("Authorization", "MAC id=\"" + identifier +
		    "\" nonce=\"" + nonce +
		    "\" mac=\"" + encrypt(normalizedRequest) + "\"" +
		    (bodyHash.length != 0 ? " bodyhash=\"" + bodyHash + "\"" : "")
		);
	};
	
	
	var exports = {
		setCredentials: function(hmac_id, hmac_key) {
			if( ! hmac_id instanceof String) {
				throw new Error("LikipeHMAC: Identifier must be a string.");
			}
			if( ! hmac_key instanceof String) {
				throw new Error("LikipeHMAC: Key must be a string.");
			}
			if((new RegExp(/"/)).test(hmac_id)) {
				throw new Error("LikipeHMAC: Identifier contains \" which is a forbidden character.");
			}
			
			secret     = hmac_key.toString();
			identifier = hmac_id.toString();
		},
		setNonceGenerator: function(generator) {
			nonceGenerator = generator;
		},
		setDebug: function(debug) {
			doDebug = debug;
		},
		
		nonce_generators: {
			default: createNonce
		},
		
		ajax: function(url, settings) {
			debugLog("Wrapping .ajax()");
			
			if(typeof url === "object") {
				settings = url;
				url      = undefined;
			}
			
			settings = typeof settings !== 'undefined' ? settings : {};
			
			if(settings.hasOwnProperty('beforeSend')) {
				var oldBeforeSend = settings.beforeSend;
				
				settings.beforeSend = function(jqXHR, settings) {
					var ret = oldBeforeSend(jqXHR, settings);
					
					ajaxBeforeSend(jqXHR, settings);
					signRequest(jqXHR, settings);
					
					return ret;
				};
			}
			else {
				settings.beforeSend = function(jqXHR, settings) {
					ajaxBeforeSend(jqXHR, settings);
					signRequest(jqXHR, settings);
				};
			}
			
			if(settings.hasOwnProperty('complete')) {
				var oldComplete = settings.complete;
				
				settings.complete = function(jqXHR, settings) {
					var ret = oldComplete(jqXHR, settings);
					
					ajaxComplete(jqXHR, settings);
					
					return ret;
				};
			}
			else {
				settings.complete = ajaxComplete;
			}
			
			settings.cache  = true;  /* Prevent jQuery from adding ?_={TIMESTAMP} to the URL */
			settings.global = false;
			
			return jQueryAjax(url, settings);
		},
		ajaxSend: function(callback) {
			ajaxBeforeSend = callback;
		},
		ajaxComplete: function(callback) {
			ajaxComplete = callback;
		},
		getScript: function(url, callback) {
			return exports.get(url, undefined, callback, "script");
		},
		getJSON: function(url, data, callback) {
			return exports.get(url, data, callback, "json");
		}
	};
	
	$.each(["get", "post", "put", "delete"], function(i, method) {
		/* Cloned from jQuery: */
		exports[method] = function(url, data, callback, type) {
			if(typeof data === "function") {
				type = type || callback;
				callback = data;
				data = undefined;
			}
			
			return exports.ajax({
				type: method,
				url: url,
				data: data,
				success: callback,
				dataType: type
			});
		};
	});
	
	/* Default nonce generator */
	nonceGenerator = createNonce;
	
	return exports;
})(jQuery, CryptoJS);