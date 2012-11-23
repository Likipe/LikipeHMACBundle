var LikipeHMAC = (function($) {
	/*
	CryptoJS v3.0.2
	code.google.com/p/crypto-js
	(c) 2009-2012 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = (function (Math, undefined) {
		/**
		 * CryptoJS namespace.
		 */
		var C = {};

		/**
		 * Library namespace.
		 */
		var C_lib = C.lib = {};

		/**
		 * Base object for prototypal inheritance.
		 */
		var Base = C_lib.Base = (function () {
			function F() {}

			return {
				/**
				 * Creates a new object that inherits from this object.
				 *
				 * @param {Object} overrides Properties to copy into the new object.
				 *
				 * @return {Object} The new object.
				 *
				 * @static
				 *
				 * @example
				 *
				 *	 var MyType = CryptoJS.lib.Base.extend({
				 *		 field: 'value',
				 *
				 *		 method: function () {
				 *		 }
				 *	 });
				 */
				extend: function (overrides) {
					// Spawn
					F.prototype = this;
					var subtype = new F();

					// Augment
					if (overrides) {
						subtype.mixIn(overrides);
					}

					// Reference supertype
					subtype.$super = this;

					return subtype;
				},

				/**
				 * Extends this object and runs the init method.
				 * Arguments to create() will be passed to init().
				 *
				 * @return {Object} The new object.
				 *
				 * @static
				 *
				 * @example
				 *
				 *	 var instance = MyType.create();
				 */
				create: function () {
					var instance = this.extend();
					instance.init.apply(instance, arguments);

					return instance;
				},

				/**
				 * Initializes a newly created object.
				 * Override this method to add some logic when your objects are created.
				 *
				 * @example
				 *
				 *	 var MyType = CryptoJS.lib.Base.extend({
				 *		 init: function () {
				 *			 // ...
				 *		 }
				 *	 });
				 */
				init: function () {
				},

				/**
				 * Copies properties into this object.
				 *
				 * @param {Object} properties The properties to mix in.
				 *
				 * @example
				 *
				 *	 MyType.mixIn({
				 *		 field: 'value'
				 *	 });
				 */
				mixIn: function (properties) {
					for (var propertyName in properties) {
						if (properties.hasOwnProperty(propertyName)) {
							this[propertyName] = properties[propertyName];
						}
					}

					// IE won't copy toString using the loop above
					// Other non-enumerable properties are:
					//   hasOwnProperty, isPrototypeOf, propertyIsEnumerable,
					//   toLocaleString, valueOf
					if (properties.hasOwnProperty('toString')) {
						this.toString = properties.toString;
					}
				},

				/**
				 * Creates a copy of this object.
				 *
				 * @return {Object} The clone.
				 *
				 * @example
				 *
				 *	 var clone = instance.clone();
				 */
				clone: function () {
					return this.$super.extend(this);
				}
			};
		}());

		/**
		 * An array of 32-bit words.
		 *
		 * @property {Array} words The array of 32-bit words.
		 * @property {number} sigBytes The number of significant bytes in this word array.
		 */
		var WordArray = C_lib.WordArray = Base.extend({
			/**
			 * Initializes a newly created word array.
			 *
			 * @param {Array} words (Optional) An array of 32-bit words.
			 * @param {number} sigBytes (Optional) The number of significant bytes in the words.
			 *
			 * @example
			 *
			 *	 var wordArray = CryptoJS.lib.WordArray.create();
			 *	 var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
			 *	 var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
			 */
			init: function (words, sigBytes) {
				words = this.words = words || [];
				
				if (sigBytes != undefined) {
					this.sigBytes = sigBytes;
				} else {
					this.sigBytes = words.length * 4;
				}
			},
			
			/**
			 * Converts this word array to a string.
			 *
			 * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
			 *
			 * @return {string} The stringified word array.
			 *
			 * @example
			 *
			 *	 var string = wordArray + '';
			 *	 var string = wordArray.toString();
			 *	 var string = wordArray.toString(CryptoJS.enc.Utf8);
			 */
			toString: function (encoder) {
				return (encoder || Hex).stringify(this);
			},
			
			/**
			 * Concatenates a word array to this word array.
			 *
			 * @param {WordArray} wordArray The word array to append.
			 *
			 * @return {WordArray} This word array.
			 *
			 * @example
			 *
			 *	 wordArray1.concat(wordArray2);
			 */
			concat: function (wordArray) {
				// Shortcuts
				var thisWords = this.words;
				var thatWords = wordArray.words;
				var thisSigBytes = this.sigBytes;
				var thatSigBytes = wordArray.sigBytes;

				// Clamp excess bits
				this.clamp();

				// Concat
				if (thisSigBytes % 4) {
					// Copy one byte at a time
					for (var i = 0; i < thatSigBytes; i++) {
						var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
						thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
					}
				} else if (thatWords.length > 0xffff) {
					// Copy one word at a time
					for (var i = 0; i < thatSigBytes; i += 4) {
						thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
					}
				} else {
					// Copy all words at once
					thisWords.push.apply(thisWords, thatWords);
				}
				this.sigBytes += thatSigBytes;

				// Chainable
				return this;
			},
			
			/**
			 * Removes insignificant bits.
			 *
			 * @example
			 *
			 *	 wordArray.clamp();
			 */
			clamp: function () {
				// Shortcuts
				var words = this.words;
				var sigBytes = this.sigBytes;
				
				// Clamp
				words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
				words.length = Math.ceil(sigBytes / 4);
			},
			
			/**
			 * Creates a copy of this word array.
			 *
			 * @return {WordArray} The clone.
			 *
			 * @example
			 *
			 *	 var clone = wordArray.clone();
			 */
			clone: function () {
				var clone = Base.clone.call(this);
				clone.words = this.words.slice(0);
				
				return clone;
			},
			
			/**
			 * Creates a word array filled with random bytes.
			 *
			 * @param {number} nBytes The number of random bytes to generate.
			 *
			 * @return {WordArray} The random word array.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var wordArray = CryptoJS.lib.WordArray.random(16);
			 */
			random: function (nBytes) {
				var words = [];
				for (var i = 0; i < nBytes; i += 4) {
					words.push((Math.random() * 0x100000000) | 0);
				}
				
				return WordArray.create(words, nBytes);
			}
		});
		
		/**
		 * Encoder namespace.
		 */
		var C_enc = C.enc = {};
		
		/**
		 * Hex encoding strategy.
		 */
		var Hex = C_enc.Hex = {
			/**
			 * Converts a word array to a hex string.
			 *
			 * @param {WordArray} wordArray The word array.
			 *
			 * @return {string} The hex string.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var hexString = CryptoJS.enc.Hex.stringify(wordArray);
			 */
			stringify: function (wordArray) {
				// Shortcuts
				var words = wordArray.words;
				var sigBytes = wordArray.sigBytes;
				
				// Convert
				var hexChars = [];
				for (var i = 0; i < sigBytes; i++) {
					var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
					hexChars.push((bite >>> 4).toString(16));
					hexChars.push((bite & 0x0f).toString(16));
				}
				
				return hexChars.join('');
			},

			/**
			 * Converts a hex string to a word array.
			 *
			 * @param {string} hexStr The hex string.
			 *
			 * @return {WordArray} The word array.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var wordArray = CryptoJS.enc.Hex.parse(hexString);
			 */
			parse: function (hexStr) {
				// Shortcut
				var hexStrLength = hexStr.length;

				// Convert
				var words = [];
				for (var i = 0; i < hexStrLength; i += 2) {
					words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
				}

				return WordArray.create(words, hexStrLength / 2);
			}
		};

		/**
		 * Latin1 encoding strategy.
		 */
		var Latin1 = C_enc.Latin1 = {
			/**
			 * Converts a word array to a Latin1 string.
			 *
			 * @param {WordArray} wordArray The word array.
			 *
			 * @return {string} The Latin1 string.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
			 */
			stringify: function (wordArray) {
				// Shortcuts
				var words = wordArray.words;
				var sigBytes = wordArray.sigBytes;

				// Convert
				var latin1Chars = [];
				for (var i = 0; i < sigBytes; i++) {
					var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
					latin1Chars.push(String.fromCharCode(bite));
				}

				return latin1Chars.join('');
			},

			/**
			 * Converts a Latin1 string to a word array.
			 *
			 * @param {string} latin1Str The Latin1 string.
			 *
			 * @return {WordArray} The word array.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
			 */
			parse: function (latin1Str) {
				// Shortcut
				var latin1StrLength = latin1Str.length;

				// Convert
				var words = [];
				for (var i = 0; i < latin1StrLength; i++) {
					words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
				}

				return WordArray.create(words, latin1StrLength);
			}
		};

		/**
		 * UTF-8 encoding strategy.
		 */
		var Utf8 = C_enc.Utf8 = {
			/**
			 * Converts a word array to a UTF-8 string.
			 *
			 * @param {WordArray} wordArray The word array.
			 *
			 * @return {string} The UTF-8 string.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
			 */
			stringify: function (wordArray) {
				try {
					return decodeURIComponent(escape(Latin1.stringify(wordArray)));
				} catch (e) {
					throw new Error('Malformed UTF-8 data');
				}
			},

			/**
			 * Converts a UTF-8 string to a word array.
			 *
			 * @param {string} utf8Str The UTF-8 string.
			 *
			 * @return {WordArray} The word array.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
			 */
			parse: function (utf8Str) {
				return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
			}
		};

		/**
		 * Abstract buffered block algorithm template.
		 * The property blockSize must be implemented in a concrete subtype.
		 *
		 * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
		 */
		var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
			/**
			 * Resets this block algorithm's data buffer to its initial state.
			 *
			 * @example
			 *
			 *	 bufferedBlockAlgorithm.reset();
			 */
			reset: function () {
				// Initial values
				this._data = WordArray.create();
				this._nDataBytes = 0;
			},

			/**
			 * Adds new data to this block algorithm's buffer.
			 *
			 * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
			 *
			 * @example
			 *
			 *	 bufferedBlockAlgorithm._append('data');
			 *	 bufferedBlockAlgorithm._append(wordArray);
			 */
			_append: function (data) {
				// Convert string to WordArray, else assume WordArray already
				if (typeof data == 'string') {
					data = Utf8.parse(data);
				}

				// Append
				this._data.concat(data);
				this._nDataBytes += data.sigBytes;
			},

			/**
			 * Processes available data blocks.
			 * This method invokes _doProcessBlock(dataWords, offset), which must be implemented by a concrete subtype.
			 *
			 * @param {boolean} flush Whether all blocks and partial blocks should be processed.
			 *
			 * @return {WordArray} The data after processing.
			 *
			 * @example
			 *
			 *	 var processedData = bufferedBlockAlgorithm._process();
			 *	 var processedData = bufferedBlockAlgorithm._process(!!'flush');
			 */
			_process: function (flush) {
				// Shortcuts
				var data = this._data;
				var dataWords = data.words;
				var dataSigBytes = data.sigBytes;
				var blockSize = this.blockSize;
				var blockSizeBytes = blockSize * 4;

				// Count blocks ready
				var nBlocksReady = dataSigBytes / blockSizeBytes;
				if (flush) {
					// Round up to include partial blocks
					nBlocksReady = Math.ceil(nBlocksReady);
				} else {
					// Round down to include only full blocks,
					// less the number of blocks that must remain in the buffer
					nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
				}

				// Count words ready
				var nWordsReady = nBlocksReady * blockSize;

				// Count bytes ready
				var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

				// Process blocks
				if (nWordsReady) {
					for (var offset = 0; offset < nWordsReady; offset += blockSize) {
						// Perform concrete-algorithm logic
						this._doProcessBlock(dataWords, offset);
					}

					// Remove processed words
					var processedWords = dataWords.splice(0, nWordsReady);
					data.sigBytes -= nBytesReady;
				}

				// Return processed words
				return WordArray.create(processedWords, nBytesReady);
			},

			/**
			 * Creates a copy of this object.
			 *
			 * @return {Object} The clone.
			 *
			 * @example
			 *
			 *	 var clone = bufferedBlockAlgorithm.clone();
			 */
			clone: function () {
				var clone = Base.clone.call(this);
				clone._data = this._data.clone();

				return clone;
			},

			_minBufferSize: 0
		});

		/**
		 * Abstract hasher template.
		 *
		 * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
		 */
		var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
			/**
			 * Configuration options.
			 */
			// cfg: Base.extend(),

			/**
			 * Initializes a newly created hasher.
			 *
			 * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
			 *
			 * @example
			 *
			 *	 var hasher = CryptoJS.algo.SHA256.create();
			 */
			init: function (cfg) {
				// Apply config defaults
				// this.cfg = this.cfg.extend(cfg);

				// Set initial values
				this.reset();
			},

			/**
			 * Resets this hasher to its initial state.
			 *
			 * @example
			 *
			 *	 hasher.reset();
			 */
			reset: function () {
				// Reset data buffer
				BufferedBlockAlgorithm.reset.call(this);

				// Perform concrete-hasher logic
				this._doReset();
			},

			/**
			 * Updates this hasher with a message.
			 *
			 * @param {WordArray|string} messageUpdate The message to append.
			 *
			 * @return {Hasher} This hasher.
			 *
			 * @example
			 *
			 *	 hasher.update('message');
			 *	 hasher.update(wordArray);
			 */
			update: function (messageUpdate) {
				// Append
				this._append(messageUpdate);

				// Update the hash
				this._process();

				// Chainable
				return this;
			},

			/**
			 * Finalizes the hash computation.
			 * Note that the finalize operation is effectively a destructive, read-once operation.
			 *
			 * @param {WordArray|string} messageUpdate (Optional) A final message update.
			 *
			 * @return {WordArray} The hash.
			 *
			 * @example
			 *
			 *	 var hash = hasher.finalize();
			 *	 var hash = hasher.finalize('message');
			 *	 var hash = hasher.finalize(wordArray);
			 */
			finalize: function (messageUpdate) {
				// Final message update
				if (messageUpdate) {
					this._append(messageUpdate);
				}

				// Perform concrete-hasher logic
				this._doFinalize();

				return this._hash;
			},

			/**
			 * Creates a copy of this object.
			 *
			 * @return {Object} The clone.
			 *
			 * @example
			 *
			 *	 var clone = hasher.clone();
			 */
			clone: function () {
				var clone = BufferedBlockAlgorithm.clone.call(this);
				clone._hash = this._hash.clone();

				return clone;
			},

			blockSize: 512/32,

			/**
			 * Creates a shortcut function to a hasher's object interface.
			 *
			 * @param {Hasher} hasher The hasher to create a helper for.
			 *
			 * @return {Function} The shortcut function.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
			 */
			_createHelper: function (hasher) {
				return function (message, cfg) {
					return hasher.create(cfg).finalize(message);
				};
			},

			/**
			 * Creates a shortcut function to the HMAC's object interface.
			 *
			 * @param {Hasher} hasher The hasher to use in this HMAC helper.
			 *
			 * @return {Function} The shortcut function.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
			 */
			_createHmacHelper: function (hasher) {
				return function (message, key) {
					return C_algo.HMAC.create(hasher, key).finalize(message);
				};
			}
		});

		/**
		 * Algorithm namespace.
		 */
		var C_algo = C.algo = {};

		return C;
	}(Math));
	
	/*
	CryptoJS v3.0.2
	code.google.com/p/crypto-js
	(c) 2009-2012 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	(function (CryptoJS) {
		// Shortcuts
		var C = CryptoJS;
		var C_lib = C.lib;
		var Base = C_lib.Base;
		var C_enc = C.enc;
		var Utf8 = C_enc.Utf8;
		var C_algo = C.algo;

		/**
		 * HMAC algorithm.
		 */
		var HMAC = C_algo.HMAC = Base.extend({
			/**
			 * Initializes a newly created HMAC.
			 *
			 * @param {Hasher} hasher The hash algorithm to use.
			 * @param {WordArray|string} key The secret key.
			 *
			 * @example
			 *
			 *	 var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
			 */
			init: function (hasher, key) {
				// Init hasher
				hasher = this._hasher = hasher.create();
				
				// Convert string to WordArray, else assume WordArray already
				if (typeof key == 'string') {
					key = Utf8.parse(key);
				}
				
				// Shortcuts
				var hasherBlockSize = hasher.blockSize;
				var hasherBlockSizeBytes = hasherBlockSize * 4;
				
				// Allow arbitrary length keys
				if (key.sigBytes > hasherBlockSizeBytes) {
					key = hasher.finalize(key);
				}
				
				// Clone key for inner and outer pads
				var oKey = this._oKey = key.clone();
				var iKey = this._iKey = key.clone();
				
				// Shortcuts
				var oKeyWords = oKey.words;
				var iKeyWords = iKey.words;
				
				// XOR keys with pad constants
				for (var i = 0; i < hasherBlockSize; i++) {
					oKeyWords[i] ^= 0x5c5c5c5c;
					iKeyWords[i] ^= 0x36363636;
				}
				oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
				
				// Set initial values
				this.reset();
			},
			
			/**
			 * Resets this HMAC to its initial state.
			 *
			 * @example
			 *
			 *	 hmacHasher.reset();
			 */
			reset: function () {
				// Shortcut
				var hasher = this._hasher;

				// Reset
				hasher.reset();
				hasher.update(this._iKey);
			},

			/**
			 * Updates this HMAC with a message.
			 *
			 * @param {WordArray|string} messageUpdate The message to append.
			 *
			 * @return {HMAC} This HMAC instance.
			 *
			 * @example
			 *
			 *	 hmacHasher.update('message');
			 *	 hmacHasher.update(wordArray);
			 */
			update: function (messageUpdate) {
				this._hasher.update(messageUpdate);

				// Chainable
				return this;
			},

			/**
			 * Finalizes the HMAC computation.
			 * Note that the finalize operation is effectively a destructive, read-once operation.
			 *
			 * @param {WordArray|string} messageUpdate (Optional) A final message update.
			 *
			 * @return {WordArray} The HMAC.
			 *
			 * @example
			 *
			 *	 var hmac = hmacHasher.finalize();
			 *	 var hmac = hmacHasher.finalize('message');
			 *	 var hmac = hmacHasher.finalize(wordArray);
			 */
			finalize: function (messageUpdate) {
				// Shortcut
				var hasher = this._hasher;

				// Compute HMAC
				var innerHash = hasher.finalize(messageUpdate);
				hasher.reset();
				var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

				return hmac;
			}
		});
	}(CryptoJS));
	
	/*
	CryptoJS v3.0.2
	code.google.com/p/crypto-js
	(c) 2009-2012 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	(function (Math, CryptoJS) {
		// Shortcuts
		var C = CryptoJS;
		var C_lib = C.lib;
		var WordArray = C_lib.WordArray;
		var Hasher = C_lib.Hasher;
		var C_algo = C.algo;

		// Initialization and round constants tables
		var H = [];
		var K = [];

		// Compute constants
		(function () {
			function isPrime(n) {
				var sqrtN = Math.sqrt(n);
				for (var factor = 2; factor <= sqrtN; factor++) {
					if (!(n % factor)) {
						return false;
					}
				}

				return true;
			}

			function getFractionalBits(n) {
				return ((n - (n | 0)) * 0x100000000) | 0;
			}

			var n = 2;
			var nPrime = 0;
			while (nPrime < 64) {
				if (isPrime(n)) {
					if (nPrime < 8) {
						H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
					}
					K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

					nPrime++;
				}

				n++;
			}
		}());

		// Reusable object
		var W = [];

		/**
		 * SHA-256 hash algorithm.
		 */
		var SHA256 = C_algo.SHA256 = Hasher.extend({
			_doReset: function () {
				this._hash = WordArray.create(H.slice(0));
			},

			_doProcessBlock: function (M, offset) {
				// Shortcut
				var H = this._hash.words;

				// Working variables
				var a = H[0];
				var b = H[1];
				var c = H[2];
				var d = H[3];
				var e = H[4];
				var f = H[5];
				var g = H[6];
				var h = H[7];

				// Computation
				for (var i = 0; i < 64; i++) {
					if (i < 16) {
						W[i] = M[offset + i] | 0;
					} else {
						var gamma0x = W[i - 15];
						var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
						              ((gamma0x << 14) | (gamma0x >>> 18)) ^
						               (gamma0x >>> 3);

						var gamma1x = W[i - 2];
						var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
						              ((gamma1x << 13) | (gamma1x >>> 19)) ^
						               (gamma1x >>> 10);

						W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
					}

					var ch  = (e & f) ^ (~e & g);
					var maj = (a & b) ^ (a & c) ^ (b & c);

					var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
					var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

					var t1 = h + sigma1 + ch + K[i] + W[i];
					var t2 = sigma0 + maj;

					h = g;
					g = f;
					f = e;
					e = (d + t1) | 0;
					d = c;
					c = b;
					b = a;
					a = (t1 + t2) | 0;
				}

				// Intermediate hash value
				H[0] = (H[0] + a) | 0;
				H[1] = (H[1] + b) | 0;
				H[2] = (H[2] + c) | 0;
				H[3] = (H[3] + d) | 0;
				H[4] = (H[4] + e) | 0;
				H[5] = (H[5] + f) | 0;
				H[6] = (H[6] + g) | 0;
				H[7] = (H[7] + h) | 0;
			},

			_doFinalize: function () {
				// Shortcuts
				var data = this._data;
				var dataWords = data.words;

				var nBitsTotal = this._nDataBytes * 8;
				var nBitsLeft = data.sigBytes * 8;

				// Add padding
				dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
				dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
				data.sigBytes = dataWords.length * 4;

				// Hash final blocks
				this._process();
			}
		});

		/**
		 * Shortcut function to the hasher's object interface.
		 *
		 * @param {WordArray|string} message The message to hash.
		 *
		 * @return {WordArray} The hash.
		 *
		 * @static
		 *
		 * @example
		 *
		 *	 var hash = CryptoJS.SHA256('message');
		 *	 var hash = CryptoJS.SHA256(wordArray);
		 */
		C.SHA256 = Hasher._createHelper(SHA256);

		/**
		 * Shortcut function to the HMAC's object interface.
		 *
		 * @param {WordArray|string} message The message to hash.
		 * @param {WordArray|string} key The secret key.
		 *
		 * @return {WordArray} The HMAC.
		 *
		 * @static
		 *
		 * @example
		 *
		 *	 var hmac = CryptoJS.HmacSHA256(message, key);
		 */
		C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
	}(Math, CryptoJS));
	
	/*
	CryptoJS v3.0.2
	code.google.com/p/crypto-js
	(c) 2009-2012 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	(function (C) {
		// Shortcuts
		var C_lib = C.lib;
		var WordArray = C_lib.WordArray;
		var C_enc = C.enc;

		/**
		 * Base64 encoding strategy.
		 */
		var Base64 = C_enc.Base64 = {
			/**
			 * Converts a word array to a Base64 string.
			 *
			 * @param {WordArray} wordArray The word array.
			 *
			 * @return {string} The Base64 string.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var base64String = CryptoJS.enc.Base64.stringify(wordArray);
			 */
			stringify: function (wordArray) {
				// Shortcuts
				var words = wordArray.words;
				var sigBytes = wordArray.sigBytes;
				var map = this._map;
				
				// Clamp excess bits
				wordArray.clamp();
				
				// Convert
				var base64Chars = [];
				for (var i = 0; i < sigBytes; i += 3) {
					var byte1 = (words[i >>> 2]	   >>> (24 - (i % 4) * 8))          & 0xff;
					var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
					var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;
					
					var triplet = (byte1 << 16) | (byte2 << 8) | byte3;
					
					for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
						base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
					}
				}
				
				// Add padding
				var paddingChar = map.charAt(64);
				if (paddingChar) {
					while (base64Chars.length % 4) {
						base64Chars.push(paddingChar);
					}
				}
				
				return base64Chars.join('');
			},
			
			/**
			 * Converts a Base64 string to a word array.
			 *
			 * @param {string} base64Str The Base64 string.
			 *
			 * @return {WordArray} The word array.
			 *
			 * @static
			 *
			 * @example
			 *
			 *	 var wordArray = CryptoJS.enc.Base64.parse(base64String);
			 */
			parse: function (base64Str) {
				// Ignore whitespaces
				base64Str = base64Str.replace(/\s/g, '');

				// Shortcuts
				var base64StrLength = base64Str.length;
				var map = this._map;

				// Ignore padding
				var paddingChar = map.charAt(64);
				if (paddingChar) {
					var paddingIndex = base64Str.indexOf(paddingChar);
					if (paddingIndex != -1) {
						base64StrLength = paddingIndex;
					}
				}

				// Convert
				var words = [];
				var nBytes = 0;
				for (var i = 0; i < base64StrLength; i++) {
					if (i % 4) {
						var bitsHigh = map.indexOf(base64Str.charAt(i - 1)) << ((i % 4) * 2);
						var bitsLow  = map.indexOf(base64Str.charAt(i)) >>> (6 - (i % 4) * 2);
						words[nBytes >>> 2] |= (bitsHigh | bitsLow) << (24 - (nBytes % 4) * 8);
						nBytes++;
					}
				}

				return WordArray.create(words, nBytes);
			},

			_map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
		};
	}(CryptoJS));
	
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
	
	var consoleError = function(message) {
		if(console.error) {
			console.error("LikipeHMAC: " + message);
		}
	}
	
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
			consoleError("Cannot generate header, credentials not set.");
			
			return;
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
			secret     = hmac_key.toString();
			identifier = hmac_id.toString();
			
			if(identifier.match(/"/)) {
				consoleError("LikipeHMAC: Identifier contains \" which is a forbidden character.");
			}
			
			exports.setCredentials = function(hmac_id, hmac_key) {
				consoleError("LikipeHMAC: Setting the API key again is not allowed.");
			};
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
})(jQuery);