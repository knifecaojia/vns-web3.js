"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (f) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }g.Web3Subscriptions = f();
  }
})(function () {
  var define, module, exports;return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
          }var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];return o(n || r);
          }, p, p.exports, r, e, n, t);
        }return n[i].exports;
      }for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
        o(t[i]);
      }return o;
    }return r;
  }()({ "BN": [function (require, module, exports) {
      (function (module, exports) {
        'use strict';

        // Utils

        function assert(val, msg) {
          if (!val) throw new Error(msg || 'Assertion failed');
        }

        // Could use `inherits` module, but don't want to move from single file
        // architecture yet.
        function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function TempCtor() {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }

        // BN

        function BN(number, base, endian) {
          if (BN.isBN(number)) {
            return number;
          }

          this.negative = 0;
          this.words = null;
          this.length = 0;

          // Reduction context
          this.red = null;

          if (number !== null) {
            if (base === 'le' || base === 'be') {
              endian = base;
              base = 10;
            }

            this._init(number || 0, base || 10, endian || 'be');
          }
        }
        if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object') {
          module.exports = BN;
        } else {
          exports.BN = BN;
        }

        BN.BN = BN;
        BN.wordSize = 26;

        var Buffer;
        try {
          Buffer = require('buffer').Buffer;
        } catch (e) {}

        BN.isBN = function isBN(num) {
          if (num instanceof BN) {
            return true;
          }

          return num !== null && (typeof num === "undefined" ? "undefined" : _typeof(num)) === 'object' && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
        };

        BN.max = function max(left, right) {
          if (left.cmp(right) > 0) return left;
          return right;
        };

        BN.min = function min(left, right) {
          if (left.cmp(right) < 0) return left;
          return right;
        };

        BN.prototype._init = function init(number, base, endian) {
          if (typeof number === 'number') {
            return this._initNumber(number, base, endian);
          }

          if ((typeof number === "undefined" ? "undefined" : _typeof(number)) === 'object') {
            return this._initArray(number, base, endian);
          }

          if (base === 'hex') {
            base = 16;
          }
          assert(base === (base | 0) && base >= 2 && base <= 36);

          number = number.toString().replace(/\s+/g, '');
          var start = 0;
          if (number[0] === '-') {
            start++;
          }

          if (base === 16) {
            this._parseHex(number, start);
          } else {
            this._parseBase(number, base, start);
          }

          if (number[0] === '-') {
            this.negative = 1;
          }

          this.strip();

          if (endian !== 'le') return;

          this._initArray(this.toArray(), base, endian);
        };

        BN.prototype._initNumber = function _initNumber(number, base, endian) {
          if (number < 0) {
            this.negative = 1;
            number = -number;
          }
          if (number < 0x4000000) {
            this.words = [number & 0x3ffffff];
            this.length = 1;
          } else if (number < 0x10000000000000) {
            this.words = [number & 0x3ffffff, number / 0x4000000 & 0x3ffffff];
            this.length = 2;
          } else {
            assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
            this.words = [number & 0x3ffffff, number / 0x4000000 & 0x3ffffff, 1];
            this.length = 3;
          }

          if (endian !== 'le') return;

          // Reverse the bytes
          this._initArray(this.toArray(), base, endian);
        };

        BN.prototype._initArray = function _initArray(number, base, endian) {
          // Perhaps a Uint8Array
          assert(typeof number.length === 'number');
          if (number.length <= 0) {
            this.words = [0];
            this.length = 1;
            return this;
          }

          this.length = Math.ceil(number.length / 3);
          this.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            this.words[i] = 0;
          }

          var j, w;
          var off = 0;
          if (endian === 'be') {
            for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
              w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
              this.words[j] |= w << off & 0x3ffffff;
              this.words[j + 1] = w >>> 26 - off & 0x3ffffff;
              off += 24;
              if (off >= 26) {
                off -= 26;
                j++;
              }
            }
          } else if (endian === 'le') {
            for (i = 0, j = 0; i < number.length; i += 3) {
              w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
              this.words[j] |= w << off & 0x3ffffff;
              this.words[j + 1] = w >>> 26 - off & 0x3ffffff;
              off += 24;
              if (off >= 26) {
                off -= 26;
                j++;
              }
            }
          }
          return this.strip();
        };

        function parseHex(str, start, end) {
          var r = 0;
          var len = Math.min(str.length, end);
          for (var i = start; i < len; i++) {
            var c = str.charCodeAt(i) - 48;

            r <<= 4;

            // 'a' - 'f'
            if (c >= 49 && c <= 54) {
              r |= c - 49 + 0xa;

              // 'A' - 'F'
            } else if (c >= 17 && c <= 22) {
              r |= c - 17 + 0xa;

              // '0' - '9'
            } else {
              r |= c & 0xf;
            }
          }
          return r;
        }

        BN.prototype._parseHex = function _parseHex(number, start) {
          // Create possibly bigger array to ensure that it fits the number
          this.length = Math.ceil((number.length - start) / 6);
          this.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            this.words[i] = 0;
          }

          var j, w;
          // Scan 24-bit chunks and add them to the number
          var off = 0;
          for (i = number.length - 6, j = 0; i >= start; i -= 6) {
            w = parseHex(number, i, i + 6);
            this.words[j] |= w << off & 0x3ffffff;
            // NOTE: `0x3fffff` is intentional here, 26bits max shift + 24bit hex limb
            this.words[j + 1] |= w >>> 26 - off & 0x3fffff;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
          if (i + 6 !== start) {
            w = parseHex(number, start, i + 6);
            this.words[j] |= w << off & 0x3ffffff;
            this.words[j + 1] |= w >>> 26 - off & 0x3fffff;
          }
          this.strip();
        };

        function parseBase(str, start, end, mul) {
          var r = 0;
          var len = Math.min(str.length, end);
          for (var i = start; i < len; i++) {
            var c = str.charCodeAt(i) - 48;

            r *= mul;

            // 'a'
            if (c >= 49) {
              r += c - 49 + 0xa;

              // 'A'
            } else if (c >= 17) {
              r += c - 17 + 0xa;

              // '0' - '9'
            } else {
              r += c;
            }
          }
          return r;
        }

        BN.prototype._parseBase = function _parseBase(number, base, start) {
          // Initialize as zero
          this.words = [0];
          this.length = 1;

          // Find length of limb in base
          for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
            limbLen++;
          }
          limbLen--;
          limbPow = limbPow / base | 0;

          var total = number.length - start;
          var mod = total % limbLen;
          var end = Math.min(total, total - mod) + start;

          var word = 0;
          for (var i = start; i < end; i += limbLen) {
            word = parseBase(number, i, i + limbLen, base);

            this.imuln(limbPow);
            if (this.words[0] + word < 0x4000000) {
              this.words[0] += word;
            } else {
              this._iaddn(word);
            }
          }

          if (mod !== 0) {
            var pow = 1;
            word = parseBase(number, i, number.length, base);

            for (i = 0; i < mod; i++) {
              pow *= base;
            }

            this.imuln(pow);
            if (this.words[0] + word < 0x4000000) {
              this.words[0] += word;
            } else {
              this._iaddn(word);
            }
          }
        };

        BN.prototype.copy = function copy(dest) {
          dest.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            dest.words[i] = this.words[i];
          }
          dest.length = this.length;
          dest.negative = this.negative;
          dest.red = this.red;
        };

        BN.prototype.clone = function clone() {
          var r = new BN(null);
          this.copy(r);
          return r;
        };

        BN.prototype._expand = function _expand(size) {
          while (this.length < size) {
            this.words[this.length++] = 0;
          }
          return this;
        };

        // Remove leading `0` from `this`
        BN.prototype.strip = function strip() {
          while (this.length > 1 && this.words[this.length - 1] === 0) {
            this.length--;
          }
          return this._normSign();
        };

        BN.prototype._normSign = function _normSign() {
          // -0 = 0
          if (this.length === 1 && this.words[0] === 0) {
            this.negative = 0;
          }
          return this;
        };

        BN.prototype.inspect = function inspect() {
          return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
        };

        /*
         var zeros = [];
        var groupSizes = [];
        var groupBases = [];
         var s = '';
        var i = -1;
        while (++i < BN.wordSize) {
          zeros[i] = s;
          s += '0';
        }
        groupSizes[0] = 0;
        groupSizes[1] = 0;
        groupBases[0] = 0;
        groupBases[1] = 0;
        var base = 2 - 1;
        while (++base < 36 + 1) {
          var groupSize = 0;
          var groupBase = 1;
          while (groupBase < (1 << BN.wordSize) / base) {
            groupBase *= base;
            groupSize += 1;
          }
          groupSizes[base] = groupSize;
          groupBases[base] = groupBase;
        }
         */

        var zeros = ['', '0', '00', '000', '0000', '00000', '000000', '0000000', '00000000', '000000000', '0000000000', '00000000000', '000000000000', '0000000000000', '00000000000000', '000000000000000', '0000000000000000', '00000000000000000', '000000000000000000', '0000000000000000000', '00000000000000000000', '000000000000000000000', '0000000000000000000000', '00000000000000000000000', '000000000000000000000000', '0000000000000000000000000'];

        var groupSizes = [0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

        var groupBases = [0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176];

        BN.prototype.toString = function toString(base, padding) {
          base = base || 10;
          padding = padding | 0 || 1;

          var out;
          if (base === 16 || base === 'hex') {
            out = '';
            var off = 0;
            var carry = 0;
            for (var i = 0; i < this.length; i++) {
              var w = this.words[i];
              var word = ((w << off | carry) & 0xffffff).toString(16);
              carry = w >>> 24 - off & 0xffffff;
              if (carry !== 0 || i !== this.length - 1) {
                out = zeros[6 - word.length] + word + out;
              } else {
                out = word + out;
              }
              off += 2;
              if (off >= 26) {
                off -= 26;
                i--;
              }
            }
            if (carry !== 0) {
              out = carry.toString(16) + out;
            }
            while (out.length % padding !== 0) {
              out = '0' + out;
            }
            if (this.negative !== 0) {
              out = '-' + out;
            }
            return out;
          }

          if (base === (base | 0) && base >= 2 && base <= 36) {
            // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
            var groupSize = groupSizes[base];
            // var groupBase = Math.pow(base, groupSize);
            var groupBase = groupBases[base];
            out = '';
            var c = this.clone();
            c.negative = 0;
            while (!c.isZero()) {
              var r = c.modn(groupBase).toString(base);
              c = c.idivn(groupBase);

              if (!c.isZero()) {
                out = zeros[groupSize - r.length] + r + out;
              } else {
                out = r + out;
              }
            }
            if (this.isZero()) {
              out = '0' + out;
            }
            while (out.length % padding !== 0) {
              out = '0' + out;
            }
            if (this.negative !== 0) {
              out = '-' + out;
            }
            return out;
          }

          assert(false, 'Base should be between 2 and 36');
        };

        BN.prototype.toNumber = function toNumber() {
          var ret = this.words[0];
          if (this.length === 2) {
            ret += this.words[1] * 0x4000000;
          } else if (this.length === 3 && this.words[2] === 0x01) {
            // NOTE: at this stage it is known that the top bit is set
            ret += 0x10000000000000 + this.words[1] * 0x4000000;
          } else if (this.length > 2) {
            assert(false, 'Number can only safely store up to 53 bits');
          }
          return this.negative !== 0 ? -ret : ret;
        };

        BN.prototype.toJSON = function toJSON() {
          return this.toString(16);
        };

        BN.prototype.toBuffer = function toBuffer(endian, length) {
          assert(typeof Buffer !== 'undefined');
          return this.toArrayLike(Buffer, endian, length);
        };

        BN.prototype.toArray = function toArray(endian, length) {
          return this.toArrayLike(Array, endian, length);
        };

        BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
          var byteLength = this.byteLength();
          var reqLength = length || Math.max(1, byteLength);
          assert(byteLength <= reqLength, 'byte array longer than desired length');
          assert(reqLength > 0, 'Requested array length <= 0');

          this.strip();
          var littleEndian = endian === 'le';
          var res = new ArrayType(reqLength);

          var b, i;
          var q = this.clone();
          if (!littleEndian) {
            // Assume big-endian
            for (i = 0; i < reqLength - byteLength; i++) {
              res[i] = 0;
            }

            for (i = 0; !q.isZero(); i++) {
              b = q.andln(0xff);
              q.iushrn(8);

              res[reqLength - i - 1] = b;
            }
          } else {
            for (i = 0; !q.isZero(); i++) {
              b = q.andln(0xff);
              q.iushrn(8);

              res[i] = b;
            }

            for (; i < reqLength; i++) {
              res[i] = 0;
            }
          }

          return res;
        };

        if (Math.clz32) {
          BN.prototype._countBits = function _countBits(w) {
            return 32 - Math.clz32(w);
          };
        } else {
          BN.prototype._countBits = function _countBits(w) {
            var t = w;
            var r = 0;
            if (t >= 0x1000) {
              r += 13;
              t >>>= 13;
            }
            if (t >= 0x40) {
              r += 7;
              t >>>= 7;
            }
            if (t >= 0x8) {
              r += 4;
              t >>>= 4;
            }
            if (t >= 0x02) {
              r += 2;
              t >>>= 2;
            }
            return r + t;
          };
        }

        BN.prototype._zeroBits = function _zeroBits(w) {
          // Short-cut
          if (w === 0) return 26;

          var t = w;
          var r = 0;
          if ((t & 0x1fff) === 0) {
            r += 13;
            t >>>= 13;
          }
          if ((t & 0x7f) === 0) {
            r += 7;
            t >>>= 7;
          }
          if ((t & 0xf) === 0) {
            r += 4;
            t >>>= 4;
          }
          if ((t & 0x3) === 0) {
            r += 2;
            t >>>= 2;
          }
          if ((t & 0x1) === 0) {
            r++;
          }
          return r;
        };

        // Return number of used bits in a BN
        BN.prototype.bitLength = function bitLength() {
          var w = this.words[this.length - 1];
          var hi = this._countBits(w);
          return (this.length - 1) * 26 + hi;
        };

        function toBitArray(num) {
          var w = new Array(num.bitLength());

          for (var bit = 0; bit < w.length; bit++) {
            var off = bit / 26 | 0;
            var wbit = bit % 26;

            w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
          }

          return w;
        }

        // Number of trailing zero bits
        BN.prototype.zeroBits = function zeroBits() {
          if (this.isZero()) return 0;

          var r = 0;
          for (var i = 0; i < this.length; i++) {
            var b = this._zeroBits(this.words[i]);
            r += b;
            if (b !== 26) break;
          }
          return r;
        };

        BN.prototype.byteLength = function byteLength() {
          return Math.ceil(this.bitLength() / 8);
        };

        BN.prototype.toTwos = function toTwos(width) {
          if (this.negative !== 0) {
            return this.abs().inotn(width).iaddn(1);
          }
          return this.clone();
        };

        BN.prototype.fromTwos = function fromTwos(width) {
          if (this.testn(width - 1)) {
            return this.notn(width).iaddn(1).ineg();
          }
          return this.clone();
        };

        BN.prototype.isNeg = function isNeg() {
          return this.negative !== 0;
        };

        // Return negative clone of `this`
        BN.prototype.neg = function neg() {
          return this.clone().ineg();
        };

        BN.prototype.ineg = function ineg() {
          if (!this.isZero()) {
            this.negative ^= 1;
          }

          return this;
        };

        // Or `num` with `this` in-place
        BN.prototype.iuor = function iuor(num) {
          while (this.length < num.length) {
            this.words[this.length++] = 0;
          }

          for (var i = 0; i < num.length; i++) {
            this.words[i] = this.words[i] | num.words[i];
          }

          return this.strip();
        };

        BN.prototype.ior = function ior(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuor(num);
        };

        // Or `num` with `this`
        BN.prototype.or = function or(num) {
          if (this.length > num.length) return this.clone().ior(num);
          return num.clone().ior(this);
        };

        BN.prototype.uor = function uor(num) {
          if (this.length > num.length) return this.clone().iuor(num);
          return num.clone().iuor(this);
        };

        // And `num` with `this` in-place
        BN.prototype.iuand = function iuand(num) {
          // b = min-length(num, this)
          var b;
          if (this.length > num.length) {
            b = num;
          } else {
            b = this;
          }

          for (var i = 0; i < b.length; i++) {
            this.words[i] = this.words[i] & num.words[i];
          }

          this.length = b.length;

          return this.strip();
        };

        BN.prototype.iand = function iand(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuand(num);
        };

        // And `num` with `this`
        BN.prototype.and = function and(num) {
          if (this.length > num.length) return this.clone().iand(num);
          return num.clone().iand(this);
        };

        BN.prototype.uand = function uand(num) {
          if (this.length > num.length) return this.clone().iuand(num);
          return num.clone().iuand(this);
        };

        // Xor `num` with `this` in-place
        BN.prototype.iuxor = function iuxor(num) {
          // a.length > b.length
          var a;
          var b;
          if (this.length > num.length) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }

          for (var i = 0; i < b.length; i++) {
            this.words[i] = a.words[i] ^ b.words[i];
          }

          if (this !== a) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }

          this.length = a.length;

          return this.strip();
        };

        BN.prototype.ixor = function ixor(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuxor(num);
        };

        // Xor `num` with `this`
        BN.prototype.xor = function xor(num) {
          if (this.length > num.length) return this.clone().ixor(num);
          return num.clone().ixor(this);
        };

        BN.prototype.uxor = function uxor(num) {
          if (this.length > num.length) return this.clone().iuxor(num);
          return num.clone().iuxor(this);
        };

        // Not ``this`` with ``width`` bitwidth
        BN.prototype.inotn = function inotn(width) {
          assert(typeof width === 'number' && width >= 0);

          var bytesNeeded = Math.ceil(width / 26) | 0;
          var bitsLeft = width % 26;

          // Extend the buffer with leading zeroes
          this._expand(bytesNeeded);

          if (bitsLeft > 0) {
            bytesNeeded--;
          }

          // Handle complete words
          for (var i = 0; i < bytesNeeded; i++) {
            this.words[i] = ~this.words[i] & 0x3ffffff;
          }

          // Handle the residue
          if (bitsLeft > 0) {
            this.words[i] = ~this.words[i] & 0x3ffffff >> 26 - bitsLeft;
          }

          // And remove leading zeroes
          return this.strip();
        };

        BN.prototype.notn = function notn(width) {
          return this.clone().inotn(width);
        };

        // Set `bit` of `this`
        BN.prototype.setn = function setn(bit, val) {
          assert(typeof bit === 'number' && bit >= 0);

          var off = bit / 26 | 0;
          var wbit = bit % 26;

          this._expand(off + 1);

          if (val) {
            this.words[off] = this.words[off] | 1 << wbit;
          } else {
            this.words[off] = this.words[off] & ~(1 << wbit);
          }

          return this.strip();
        };

        // Add `num` to `this` in-place
        BN.prototype.iadd = function iadd(num) {
          var r;

          // negative + positive
          if (this.negative !== 0 && num.negative === 0) {
            this.negative = 0;
            r = this.isub(num);
            this.negative ^= 1;
            return this._normSign();

            // positive + negative
          } else if (this.negative === 0 && num.negative !== 0) {
            num.negative = 0;
            r = this.isub(num);
            num.negative = 1;
            return r._normSign();
          }

          // a.length > b.length
          var a, b;
          if (this.length > num.length) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }

          var carry = 0;
          for (var i = 0; i < b.length; i++) {
            r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
            this.words[i] = r & 0x3ffffff;
            carry = r >>> 26;
          }
          for (; carry !== 0 && i < a.length; i++) {
            r = (a.words[i] | 0) + carry;
            this.words[i] = r & 0x3ffffff;
            carry = r >>> 26;
          }

          this.length = a.length;
          if (carry !== 0) {
            this.words[this.length] = carry;
            this.length++;
            // Copy the rest of the words
          } else if (a !== this) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }

          return this;
        };

        // Add `num` to `this`
        BN.prototype.add = function add(num) {
          var res;
          if (num.negative !== 0 && this.negative === 0) {
            num.negative = 0;
            res = this.sub(num);
            num.negative ^= 1;
            return res;
          } else if (num.negative === 0 && this.negative !== 0) {
            this.negative = 0;
            res = num.sub(this);
            this.negative = 1;
            return res;
          }

          if (this.length > num.length) return this.clone().iadd(num);

          return num.clone().iadd(this);
        };

        // Subtract `num` from `this` in-place
        BN.prototype.isub = function isub(num) {
          // this - (-num) = this + num
          if (num.negative !== 0) {
            num.negative = 0;
            var r = this.iadd(num);
            num.negative = 1;
            return r._normSign();

            // -this - num = -(this + num)
          } else if (this.negative !== 0) {
            this.negative = 0;
            this.iadd(num);
            this.negative = 1;
            return this._normSign();
          }

          // At this point both numbers are positive
          var cmp = this.cmp(num);

          // Optimization - zeroify
          if (cmp === 0) {
            this.negative = 0;
            this.length = 1;
            this.words[0] = 0;
            return this;
          }

          // a > b
          var a, b;
          if (cmp > 0) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }

          var carry = 0;
          for (var i = 0; i < b.length; i++) {
            r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
            carry = r >> 26;
            this.words[i] = r & 0x3ffffff;
          }
          for (; carry !== 0 && i < a.length; i++) {
            r = (a.words[i] | 0) + carry;
            carry = r >> 26;
            this.words[i] = r & 0x3ffffff;
          }

          // Copy rest of the words
          if (carry === 0 && i < a.length && a !== this) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }

          this.length = Math.max(this.length, i);

          if (a !== this) {
            this.negative = 1;
          }

          return this.strip();
        };

        // Subtract `num` from `this`
        BN.prototype.sub = function sub(num) {
          return this.clone().isub(num);
        };

        function smallMulTo(self, num, out) {
          out.negative = num.negative ^ self.negative;
          var len = self.length + num.length | 0;
          out.length = len;
          len = len - 1 | 0;

          // Peel one iteration (compiler can't do it, because of code complexity)
          var a = self.words[0] | 0;
          var b = num.words[0] | 0;
          var r = a * b;

          var lo = r & 0x3ffffff;
          var carry = r / 0x4000000 | 0;
          out.words[0] = lo;

          for (var k = 1; k < len; k++) {
            // Sum all words with the same `i + j = k` and accumulate `ncarry`,
            // note that ncarry could be >= 0x3ffffff
            var ncarry = carry >>> 26;
            var rword = carry & 0x3ffffff;
            var maxJ = Math.min(k, num.length - 1);
            for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
              var i = k - j | 0;
              a = self.words[i] | 0;
              b = num.words[j] | 0;
              r = a * b + rword;
              ncarry += r / 0x4000000 | 0;
              rword = r & 0x3ffffff;
            }
            out.words[k] = rword | 0;
            carry = ncarry | 0;
          }
          if (carry !== 0) {
            out.words[k] = carry | 0;
          } else {
            out.length--;
          }

          return out.strip();
        }

        // TODO(indutny): it may be reasonable to omit it for users who don't need
        // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
        // multiplication (like elliptic secp256k1).
        var comb10MulTo = function comb10MulTo(self, num, out) {
          var a = self.words;
          var b = num.words;
          var o = out.words;
          var c = 0;
          var lo;
          var mid;
          var hi;
          var a0 = a[0] | 0;
          var al0 = a0 & 0x1fff;
          var ah0 = a0 >>> 13;
          var a1 = a[1] | 0;
          var al1 = a1 & 0x1fff;
          var ah1 = a1 >>> 13;
          var a2 = a[2] | 0;
          var al2 = a2 & 0x1fff;
          var ah2 = a2 >>> 13;
          var a3 = a[3] | 0;
          var al3 = a3 & 0x1fff;
          var ah3 = a3 >>> 13;
          var a4 = a[4] | 0;
          var al4 = a4 & 0x1fff;
          var ah4 = a4 >>> 13;
          var a5 = a[5] | 0;
          var al5 = a5 & 0x1fff;
          var ah5 = a5 >>> 13;
          var a6 = a[6] | 0;
          var al6 = a6 & 0x1fff;
          var ah6 = a6 >>> 13;
          var a7 = a[7] | 0;
          var al7 = a7 & 0x1fff;
          var ah7 = a7 >>> 13;
          var a8 = a[8] | 0;
          var al8 = a8 & 0x1fff;
          var ah8 = a8 >>> 13;
          var a9 = a[9] | 0;
          var al9 = a9 & 0x1fff;
          var ah9 = a9 >>> 13;
          var b0 = b[0] | 0;
          var bl0 = b0 & 0x1fff;
          var bh0 = b0 >>> 13;
          var b1 = b[1] | 0;
          var bl1 = b1 & 0x1fff;
          var bh1 = b1 >>> 13;
          var b2 = b[2] | 0;
          var bl2 = b2 & 0x1fff;
          var bh2 = b2 >>> 13;
          var b3 = b[3] | 0;
          var bl3 = b3 & 0x1fff;
          var bh3 = b3 >>> 13;
          var b4 = b[4] | 0;
          var bl4 = b4 & 0x1fff;
          var bh4 = b4 >>> 13;
          var b5 = b[5] | 0;
          var bl5 = b5 & 0x1fff;
          var bh5 = b5 >>> 13;
          var b6 = b[6] | 0;
          var bl6 = b6 & 0x1fff;
          var bh6 = b6 >>> 13;
          var b7 = b[7] | 0;
          var bl7 = b7 & 0x1fff;
          var bh7 = b7 >>> 13;
          var b8 = b[8] | 0;
          var bl8 = b8 & 0x1fff;
          var bh8 = b8 >>> 13;
          var b9 = b[9] | 0;
          var bl9 = b9 & 0x1fff;
          var bh9 = b9 >>> 13;

          out.negative = self.negative ^ num.negative;
          out.length = 19;
          /* k = 0 */
          lo = Math.imul(al0, bl0);
          mid = Math.imul(al0, bh0);
          mid = mid + Math.imul(ah0, bl0) | 0;
          hi = Math.imul(ah0, bh0);
          var w0 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
          w0 &= 0x3ffffff;
          /* k = 1 */
          lo = Math.imul(al1, bl0);
          mid = Math.imul(al1, bh0);
          mid = mid + Math.imul(ah1, bl0) | 0;
          hi = Math.imul(ah1, bh0);
          lo = lo + Math.imul(al0, bl1) | 0;
          mid = mid + Math.imul(al0, bh1) | 0;
          mid = mid + Math.imul(ah0, bl1) | 0;
          hi = hi + Math.imul(ah0, bh1) | 0;
          var w1 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
          w1 &= 0x3ffffff;
          /* k = 2 */
          lo = Math.imul(al2, bl0);
          mid = Math.imul(al2, bh0);
          mid = mid + Math.imul(ah2, bl0) | 0;
          hi = Math.imul(ah2, bh0);
          lo = lo + Math.imul(al1, bl1) | 0;
          mid = mid + Math.imul(al1, bh1) | 0;
          mid = mid + Math.imul(ah1, bl1) | 0;
          hi = hi + Math.imul(ah1, bh1) | 0;
          lo = lo + Math.imul(al0, bl2) | 0;
          mid = mid + Math.imul(al0, bh2) | 0;
          mid = mid + Math.imul(ah0, bl2) | 0;
          hi = hi + Math.imul(ah0, bh2) | 0;
          var w2 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
          w2 &= 0x3ffffff;
          /* k = 3 */
          lo = Math.imul(al3, bl0);
          mid = Math.imul(al3, bh0);
          mid = mid + Math.imul(ah3, bl0) | 0;
          hi = Math.imul(ah3, bh0);
          lo = lo + Math.imul(al2, bl1) | 0;
          mid = mid + Math.imul(al2, bh1) | 0;
          mid = mid + Math.imul(ah2, bl1) | 0;
          hi = hi + Math.imul(ah2, bh1) | 0;
          lo = lo + Math.imul(al1, bl2) | 0;
          mid = mid + Math.imul(al1, bh2) | 0;
          mid = mid + Math.imul(ah1, bl2) | 0;
          hi = hi + Math.imul(ah1, bh2) | 0;
          lo = lo + Math.imul(al0, bl3) | 0;
          mid = mid + Math.imul(al0, bh3) | 0;
          mid = mid + Math.imul(ah0, bl3) | 0;
          hi = hi + Math.imul(ah0, bh3) | 0;
          var w3 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
          w3 &= 0x3ffffff;
          /* k = 4 */
          lo = Math.imul(al4, bl0);
          mid = Math.imul(al4, bh0);
          mid = mid + Math.imul(ah4, bl0) | 0;
          hi = Math.imul(ah4, bh0);
          lo = lo + Math.imul(al3, bl1) | 0;
          mid = mid + Math.imul(al3, bh1) | 0;
          mid = mid + Math.imul(ah3, bl1) | 0;
          hi = hi + Math.imul(ah3, bh1) | 0;
          lo = lo + Math.imul(al2, bl2) | 0;
          mid = mid + Math.imul(al2, bh2) | 0;
          mid = mid + Math.imul(ah2, bl2) | 0;
          hi = hi + Math.imul(ah2, bh2) | 0;
          lo = lo + Math.imul(al1, bl3) | 0;
          mid = mid + Math.imul(al1, bh3) | 0;
          mid = mid + Math.imul(ah1, bl3) | 0;
          hi = hi + Math.imul(ah1, bh3) | 0;
          lo = lo + Math.imul(al0, bl4) | 0;
          mid = mid + Math.imul(al0, bh4) | 0;
          mid = mid + Math.imul(ah0, bl4) | 0;
          hi = hi + Math.imul(ah0, bh4) | 0;
          var w4 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
          w4 &= 0x3ffffff;
          /* k = 5 */
          lo = Math.imul(al5, bl0);
          mid = Math.imul(al5, bh0);
          mid = mid + Math.imul(ah5, bl0) | 0;
          hi = Math.imul(ah5, bh0);
          lo = lo + Math.imul(al4, bl1) | 0;
          mid = mid + Math.imul(al4, bh1) | 0;
          mid = mid + Math.imul(ah4, bl1) | 0;
          hi = hi + Math.imul(ah4, bh1) | 0;
          lo = lo + Math.imul(al3, bl2) | 0;
          mid = mid + Math.imul(al3, bh2) | 0;
          mid = mid + Math.imul(ah3, bl2) | 0;
          hi = hi + Math.imul(ah3, bh2) | 0;
          lo = lo + Math.imul(al2, bl3) | 0;
          mid = mid + Math.imul(al2, bh3) | 0;
          mid = mid + Math.imul(ah2, bl3) | 0;
          hi = hi + Math.imul(ah2, bh3) | 0;
          lo = lo + Math.imul(al1, bl4) | 0;
          mid = mid + Math.imul(al1, bh4) | 0;
          mid = mid + Math.imul(ah1, bl4) | 0;
          hi = hi + Math.imul(ah1, bh4) | 0;
          lo = lo + Math.imul(al0, bl5) | 0;
          mid = mid + Math.imul(al0, bh5) | 0;
          mid = mid + Math.imul(ah0, bl5) | 0;
          hi = hi + Math.imul(ah0, bh5) | 0;
          var w5 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
          w5 &= 0x3ffffff;
          /* k = 6 */
          lo = Math.imul(al6, bl0);
          mid = Math.imul(al6, bh0);
          mid = mid + Math.imul(ah6, bl0) | 0;
          hi = Math.imul(ah6, bh0);
          lo = lo + Math.imul(al5, bl1) | 0;
          mid = mid + Math.imul(al5, bh1) | 0;
          mid = mid + Math.imul(ah5, bl1) | 0;
          hi = hi + Math.imul(ah5, bh1) | 0;
          lo = lo + Math.imul(al4, bl2) | 0;
          mid = mid + Math.imul(al4, bh2) | 0;
          mid = mid + Math.imul(ah4, bl2) | 0;
          hi = hi + Math.imul(ah4, bh2) | 0;
          lo = lo + Math.imul(al3, bl3) | 0;
          mid = mid + Math.imul(al3, bh3) | 0;
          mid = mid + Math.imul(ah3, bl3) | 0;
          hi = hi + Math.imul(ah3, bh3) | 0;
          lo = lo + Math.imul(al2, bl4) | 0;
          mid = mid + Math.imul(al2, bh4) | 0;
          mid = mid + Math.imul(ah2, bl4) | 0;
          hi = hi + Math.imul(ah2, bh4) | 0;
          lo = lo + Math.imul(al1, bl5) | 0;
          mid = mid + Math.imul(al1, bh5) | 0;
          mid = mid + Math.imul(ah1, bl5) | 0;
          hi = hi + Math.imul(ah1, bh5) | 0;
          lo = lo + Math.imul(al0, bl6) | 0;
          mid = mid + Math.imul(al0, bh6) | 0;
          mid = mid + Math.imul(ah0, bl6) | 0;
          hi = hi + Math.imul(ah0, bh6) | 0;
          var w6 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
          w6 &= 0x3ffffff;
          /* k = 7 */
          lo = Math.imul(al7, bl0);
          mid = Math.imul(al7, bh0);
          mid = mid + Math.imul(ah7, bl0) | 0;
          hi = Math.imul(ah7, bh0);
          lo = lo + Math.imul(al6, bl1) | 0;
          mid = mid + Math.imul(al6, bh1) | 0;
          mid = mid + Math.imul(ah6, bl1) | 0;
          hi = hi + Math.imul(ah6, bh1) | 0;
          lo = lo + Math.imul(al5, bl2) | 0;
          mid = mid + Math.imul(al5, bh2) | 0;
          mid = mid + Math.imul(ah5, bl2) | 0;
          hi = hi + Math.imul(ah5, bh2) | 0;
          lo = lo + Math.imul(al4, bl3) | 0;
          mid = mid + Math.imul(al4, bh3) | 0;
          mid = mid + Math.imul(ah4, bl3) | 0;
          hi = hi + Math.imul(ah4, bh3) | 0;
          lo = lo + Math.imul(al3, bl4) | 0;
          mid = mid + Math.imul(al3, bh4) | 0;
          mid = mid + Math.imul(ah3, bl4) | 0;
          hi = hi + Math.imul(ah3, bh4) | 0;
          lo = lo + Math.imul(al2, bl5) | 0;
          mid = mid + Math.imul(al2, bh5) | 0;
          mid = mid + Math.imul(ah2, bl5) | 0;
          hi = hi + Math.imul(ah2, bh5) | 0;
          lo = lo + Math.imul(al1, bl6) | 0;
          mid = mid + Math.imul(al1, bh6) | 0;
          mid = mid + Math.imul(ah1, bl6) | 0;
          hi = hi + Math.imul(ah1, bh6) | 0;
          lo = lo + Math.imul(al0, bl7) | 0;
          mid = mid + Math.imul(al0, bh7) | 0;
          mid = mid + Math.imul(ah0, bl7) | 0;
          hi = hi + Math.imul(ah0, bh7) | 0;
          var w7 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
          w7 &= 0x3ffffff;
          /* k = 8 */
          lo = Math.imul(al8, bl0);
          mid = Math.imul(al8, bh0);
          mid = mid + Math.imul(ah8, bl0) | 0;
          hi = Math.imul(ah8, bh0);
          lo = lo + Math.imul(al7, bl1) | 0;
          mid = mid + Math.imul(al7, bh1) | 0;
          mid = mid + Math.imul(ah7, bl1) | 0;
          hi = hi + Math.imul(ah7, bh1) | 0;
          lo = lo + Math.imul(al6, bl2) | 0;
          mid = mid + Math.imul(al6, bh2) | 0;
          mid = mid + Math.imul(ah6, bl2) | 0;
          hi = hi + Math.imul(ah6, bh2) | 0;
          lo = lo + Math.imul(al5, bl3) | 0;
          mid = mid + Math.imul(al5, bh3) | 0;
          mid = mid + Math.imul(ah5, bl3) | 0;
          hi = hi + Math.imul(ah5, bh3) | 0;
          lo = lo + Math.imul(al4, bl4) | 0;
          mid = mid + Math.imul(al4, bh4) | 0;
          mid = mid + Math.imul(ah4, bl4) | 0;
          hi = hi + Math.imul(ah4, bh4) | 0;
          lo = lo + Math.imul(al3, bl5) | 0;
          mid = mid + Math.imul(al3, bh5) | 0;
          mid = mid + Math.imul(ah3, bl5) | 0;
          hi = hi + Math.imul(ah3, bh5) | 0;
          lo = lo + Math.imul(al2, bl6) | 0;
          mid = mid + Math.imul(al2, bh6) | 0;
          mid = mid + Math.imul(ah2, bl6) | 0;
          hi = hi + Math.imul(ah2, bh6) | 0;
          lo = lo + Math.imul(al1, bl7) | 0;
          mid = mid + Math.imul(al1, bh7) | 0;
          mid = mid + Math.imul(ah1, bl7) | 0;
          hi = hi + Math.imul(ah1, bh7) | 0;
          lo = lo + Math.imul(al0, bl8) | 0;
          mid = mid + Math.imul(al0, bh8) | 0;
          mid = mid + Math.imul(ah0, bl8) | 0;
          hi = hi + Math.imul(ah0, bh8) | 0;
          var w8 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
          w8 &= 0x3ffffff;
          /* k = 9 */
          lo = Math.imul(al9, bl0);
          mid = Math.imul(al9, bh0);
          mid = mid + Math.imul(ah9, bl0) | 0;
          hi = Math.imul(ah9, bh0);
          lo = lo + Math.imul(al8, bl1) | 0;
          mid = mid + Math.imul(al8, bh1) | 0;
          mid = mid + Math.imul(ah8, bl1) | 0;
          hi = hi + Math.imul(ah8, bh1) | 0;
          lo = lo + Math.imul(al7, bl2) | 0;
          mid = mid + Math.imul(al7, bh2) | 0;
          mid = mid + Math.imul(ah7, bl2) | 0;
          hi = hi + Math.imul(ah7, bh2) | 0;
          lo = lo + Math.imul(al6, bl3) | 0;
          mid = mid + Math.imul(al6, bh3) | 0;
          mid = mid + Math.imul(ah6, bl3) | 0;
          hi = hi + Math.imul(ah6, bh3) | 0;
          lo = lo + Math.imul(al5, bl4) | 0;
          mid = mid + Math.imul(al5, bh4) | 0;
          mid = mid + Math.imul(ah5, bl4) | 0;
          hi = hi + Math.imul(ah5, bh4) | 0;
          lo = lo + Math.imul(al4, bl5) | 0;
          mid = mid + Math.imul(al4, bh5) | 0;
          mid = mid + Math.imul(ah4, bl5) | 0;
          hi = hi + Math.imul(ah4, bh5) | 0;
          lo = lo + Math.imul(al3, bl6) | 0;
          mid = mid + Math.imul(al3, bh6) | 0;
          mid = mid + Math.imul(ah3, bl6) | 0;
          hi = hi + Math.imul(ah3, bh6) | 0;
          lo = lo + Math.imul(al2, bl7) | 0;
          mid = mid + Math.imul(al2, bh7) | 0;
          mid = mid + Math.imul(ah2, bl7) | 0;
          hi = hi + Math.imul(ah2, bh7) | 0;
          lo = lo + Math.imul(al1, bl8) | 0;
          mid = mid + Math.imul(al1, bh8) | 0;
          mid = mid + Math.imul(ah1, bl8) | 0;
          hi = hi + Math.imul(ah1, bh8) | 0;
          lo = lo + Math.imul(al0, bl9) | 0;
          mid = mid + Math.imul(al0, bh9) | 0;
          mid = mid + Math.imul(ah0, bl9) | 0;
          hi = hi + Math.imul(ah0, bh9) | 0;
          var w9 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
          w9 &= 0x3ffffff;
          /* k = 10 */
          lo = Math.imul(al9, bl1);
          mid = Math.imul(al9, bh1);
          mid = mid + Math.imul(ah9, bl1) | 0;
          hi = Math.imul(ah9, bh1);
          lo = lo + Math.imul(al8, bl2) | 0;
          mid = mid + Math.imul(al8, bh2) | 0;
          mid = mid + Math.imul(ah8, bl2) | 0;
          hi = hi + Math.imul(ah8, bh2) | 0;
          lo = lo + Math.imul(al7, bl3) | 0;
          mid = mid + Math.imul(al7, bh3) | 0;
          mid = mid + Math.imul(ah7, bl3) | 0;
          hi = hi + Math.imul(ah7, bh3) | 0;
          lo = lo + Math.imul(al6, bl4) | 0;
          mid = mid + Math.imul(al6, bh4) | 0;
          mid = mid + Math.imul(ah6, bl4) | 0;
          hi = hi + Math.imul(ah6, bh4) | 0;
          lo = lo + Math.imul(al5, bl5) | 0;
          mid = mid + Math.imul(al5, bh5) | 0;
          mid = mid + Math.imul(ah5, bl5) | 0;
          hi = hi + Math.imul(ah5, bh5) | 0;
          lo = lo + Math.imul(al4, bl6) | 0;
          mid = mid + Math.imul(al4, bh6) | 0;
          mid = mid + Math.imul(ah4, bl6) | 0;
          hi = hi + Math.imul(ah4, bh6) | 0;
          lo = lo + Math.imul(al3, bl7) | 0;
          mid = mid + Math.imul(al3, bh7) | 0;
          mid = mid + Math.imul(ah3, bl7) | 0;
          hi = hi + Math.imul(ah3, bh7) | 0;
          lo = lo + Math.imul(al2, bl8) | 0;
          mid = mid + Math.imul(al2, bh8) | 0;
          mid = mid + Math.imul(ah2, bl8) | 0;
          hi = hi + Math.imul(ah2, bh8) | 0;
          lo = lo + Math.imul(al1, bl9) | 0;
          mid = mid + Math.imul(al1, bh9) | 0;
          mid = mid + Math.imul(ah1, bl9) | 0;
          hi = hi + Math.imul(ah1, bh9) | 0;
          var w10 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
          w10 &= 0x3ffffff;
          /* k = 11 */
          lo = Math.imul(al9, bl2);
          mid = Math.imul(al9, bh2);
          mid = mid + Math.imul(ah9, bl2) | 0;
          hi = Math.imul(ah9, bh2);
          lo = lo + Math.imul(al8, bl3) | 0;
          mid = mid + Math.imul(al8, bh3) | 0;
          mid = mid + Math.imul(ah8, bl3) | 0;
          hi = hi + Math.imul(ah8, bh3) | 0;
          lo = lo + Math.imul(al7, bl4) | 0;
          mid = mid + Math.imul(al7, bh4) | 0;
          mid = mid + Math.imul(ah7, bl4) | 0;
          hi = hi + Math.imul(ah7, bh4) | 0;
          lo = lo + Math.imul(al6, bl5) | 0;
          mid = mid + Math.imul(al6, bh5) | 0;
          mid = mid + Math.imul(ah6, bl5) | 0;
          hi = hi + Math.imul(ah6, bh5) | 0;
          lo = lo + Math.imul(al5, bl6) | 0;
          mid = mid + Math.imul(al5, bh6) | 0;
          mid = mid + Math.imul(ah5, bl6) | 0;
          hi = hi + Math.imul(ah5, bh6) | 0;
          lo = lo + Math.imul(al4, bl7) | 0;
          mid = mid + Math.imul(al4, bh7) | 0;
          mid = mid + Math.imul(ah4, bl7) | 0;
          hi = hi + Math.imul(ah4, bh7) | 0;
          lo = lo + Math.imul(al3, bl8) | 0;
          mid = mid + Math.imul(al3, bh8) | 0;
          mid = mid + Math.imul(ah3, bl8) | 0;
          hi = hi + Math.imul(ah3, bh8) | 0;
          lo = lo + Math.imul(al2, bl9) | 0;
          mid = mid + Math.imul(al2, bh9) | 0;
          mid = mid + Math.imul(ah2, bl9) | 0;
          hi = hi + Math.imul(ah2, bh9) | 0;
          var w11 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
          w11 &= 0x3ffffff;
          /* k = 12 */
          lo = Math.imul(al9, bl3);
          mid = Math.imul(al9, bh3);
          mid = mid + Math.imul(ah9, bl3) | 0;
          hi = Math.imul(ah9, bh3);
          lo = lo + Math.imul(al8, bl4) | 0;
          mid = mid + Math.imul(al8, bh4) | 0;
          mid = mid + Math.imul(ah8, bl4) | 0;
          hi = hi + Math.imul(ah8, bh4) | 0;
          lo = lo + Math.imul(al7, bl5) | 0;
          mid = mid + Math.imul(al7, bh5) | 0;
          mid = mid + Math.imul(ah7, bl5) | 0;
          hi = hi + Math.imul(ah7, bh5) | 0;
          lo = lo + Math.imul(al6, bl6) | 0;
          mid = mid + Math.imul(al6, bh6) | 0;
          mid = mid + Math.imul(ah6, bl6) | 0;
          hi = hi + Math.imul(ah6, bh6) | 0;
          lo = lo + Math.imul(al5, bl7) | 0;
          mid = mid + Math.imul(al5, bh7) | 0;
          mid = mid + Math.imul(ah5, bl7) | 0;
          hi = hi + Math.imul(ah5, bh7) | 0;
          lo = lo + Math.imul(al4, bl8) | 0;
          mid = mid + Math.imul(al4, bh8) | 0;
          mid = mid + Math.imul(ah4, bl8) | 0;
          hi = hi + Math.imul(ah4, bh8) | 0;
          lo = lo + Math.imul(al3, bl9) | 0;
          mid = mid + Math.imul(al3, bh9) | 0;
          mid = mid + Math.imul(ah3, bl9) | 0;
          hi = hi + Math.imul(ah3, bh9) | 0;
          var w12 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
          w12 &= 0x3ffffff;
          /* k = 13 */
          lo = Math.imul(al9, bl4);
          mid = Math.imul(al9, bh4);
          mid = mid + Math.imul(ah9, bl4) | 0;
          hi = Math.imul(ah9, bh4);
          lo = lo + Math.imul(al8, bl5) | 0;
          mid = mid + Math.imul(al8, bh5) | 0;
          mid = mid + Math.imul(ah8, bl5) | 0;
          hi = hi + Math.imul(ah8, bh5) | 0;
          lo = lo + Math.imul(al7, bl6) | 0;
          mid = mid + Math.imul(al7, bh6) | 0;
          mid = mid + Math.imul(ah7, bl6) | 0;
          hi = hi + Math.imul(ah7, bh6) | 0;
          lo = lo + Math.imul(al6, bl7) | 0;
          mid = mid + Math.imul(al6, bh7) | 0;
          mid = mid + Math.imul(ah6, bl7) | 0;
          hi = hi + Math.imul(ah6, bh7) | 0;
          lo = lo + Math.imul(al5, bl8) | 0;
          mid = mid + Math.imul(al5, bh8) | 0;
          mid = mid + Math.imul(ah5, bl8) | 0;
          hi = hi + Math.imul(ah5, bh8) | 0;
          lo = lo + Math.imul(al4, bl9) | 0;
          mid = mid + Math.imul(al4, bh9) | 0;
          mid = mid + Math.imul(ah4, bl9) | 0;
          hi = hi + Math.imul(ah4, bh9) | 0;
          var w13 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
          w13 &= 0x3ffffff;
          /* k = 14 */
          lo = Math.imul(al9, bl5);
          mid = Math.imul(al9, bh5);
          mid = mid + Math.imul(ah9, bl5) | 0;
          hi = Math.imul(ah9, bh5);
          lo = lo + Math.imul(al8, bl6) | 0;
          mid = mid + Math.imul(al8, bh6) | 0;
          mid = mid + Math.imul(ah8, bl6) | 0;
          hi = hi + Math.imul(ah8, bh6) | 0;
          lo = lo + Math.imul(al7, bl7) | 0;
          mid = mid + Math.imul(al7, bh7) | 0;
          mid = mid + Math.imul(ah7, bl7) | 0;
          hi = hi + Math.imul(ah7, bh7) | 0;
          lo = lo + Math.imul(al6, bl8) | 0;
          mid = mid + Math.imul(al6, bh8) | 0;
          mid = mid + Math.imul(ah6, bl8) | 0;
          hi = hi + Math.imul(ah6, bh8) | 0;
          lo = lo + Math.imul(al5, bl9) | 0;
          mid = mid + Math.imul(al5, bh9) | 0;
          mid = mid + Math.imul(ah5, bl9) | 0;
          hi = hi + Math.imul(ah5, bh9) | 0;
          var w14 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
          w14 &= 0x3ffffff;
          /* k = 15 */
          lo = Math.imul(al9, bl6);
          mid = Math.imul(al9, bh6);
          mid = mid + Math.imul(ah9, bl6) | 0;
          hi = Math.imul(ah9, bh6);
          lo = lo + Math.imul(al8, bl7) | 0;
          mid = mid + Math.imul(al8, bh7) | 0;
          mid = mid + Math.imul(ah8, bl7) | 0;
          hi = hi + Math.imul(ah8, bh7) | 0;
          lo = lo + Math.imul(al7, bl8) | 0;
          mid = mid + Math.imul(al7, bh8) | 0;
          mid = mid + Math.imul(ah7, bl8) | 0;
          hi = hi + Math.imul(ah7, bh8) | 0;
          lo = lo + Math.imul(al6, bl9) | 0;
          mid = mid + Math.imul(al6, bh9) | 0;
          mid = mid + Math.imul(ah6, bl9) | 0;
          hi = hi + Math.imul(ah6, bh9) | 0;
          var w15 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
          w15 &= 0x3ffffff;
          /* k = 16 */
          lo = Math.imul(al9, bl7);
          mid = Math.imul(al9, bh7);
          mid = mid + Math.imul(ah9, bl7) | 0;
          hi = Math.imul(ah9, bh7);
          lo = lo + Math.imul(al8, bl8) | 0;
          mid = mid + Math.imul(al8, bh8) | 0;
          mid = mid + Math.imul(ah8, bl8) | 0;
          hi = hi + Math.imul(ah8, bh8) | 0;
          lo = lo + Math.imul(al7, bl9) | 0;
          mid = mid + Math.imul(al7, bh9) | 0;
          mid = mid + Math.imul(ah7, bl9) | 0;
          hi = hi + Math.imul(ah7, bh9) | 0;
          var w16 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
          w16 &= 0x3ffffff;
          /* k = 17 */
          lo = Math.imul(al9, bl8);
          mid = Math.imul(al9, bh8);
          mid = mid + Math.imul(ah9, bl8) | 0;
          hi = Math.imul(ah9, bh8);
          lo = lo + Math.imul(al8, bl9) | 0;
          mid = mid + Math.imul(al8, bh9) | 0;
          mid = mid + Math.imul(ah8, bl9) | 0;
          hi = hi + Math.imul(ah8, bh9) | 0;
          var w17 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
          w17 &= 0x3ffffff;
          /* k = 18 */
          lo = Math.imul(al9, bl9);
          mid = Math.imul(al9, bh9);
          mid = mid + Math.imul(ah9, bl9) | 0;
          hi = Math.imul(ah9, bh9);
          var w18 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
          w18 &= 0x3ffffff;
          o[0] = w0;
          o[1] = w1;
          o[2] = w2;
          o[3] = w3;
          o[4] = w4;
          o[5] = w5;
          o[6] = w6;
          o[7] = w7;
          o[8] = w8;
          o[9] = w9;
          o[10] = w10;
          o[11] = w11;
          o[12] = w12;
          o[13] = w13;
          o[14] = w14;
          o[15] = w15;
          o[16] = w16;
          o[17] = w17;
          o[18] = w18;
          if (c !== 0) {
            o[19] = c;
            out.length++;
          }
          return out;
        };

        // Polyfill comb
        if (!Math.imul) {
          comb10MulTo = smallMulTo;
        }

        function bigMulTo(self, num, out) {
          out.negative = num.negative ^ self.negative;
          out.length = self.length + num.length;

          var carry = 0;
          var hncarry = 0;
          for (var k = 0; k < out.length - 1; k++) {
            // Sum all words with the same `i + j = k` and accumulate `ncarry`,
            // note that ncarry could be >= 0x3ffffff
            var ncarry = hncarry;
            hncarry = 0;
            var rword = carry & 0x3ffffff;
            var maxJ = Math.min(k, num.length - 1);
            for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
              var i = k - j;
              var a = self.words[i] | 0;
              var b = num.words[j] | 0;
              var r = a * b;

              var lo = r & 0x3ffffff;
              ncarry = ncarry + (r / 0x4000000 | 0) | 0;
              lo = lo + rword | 0;
              rword = lo & 0x3ffffff;
              ncarry = ncarry + (lo >>> 26) | 0;

              hncarry += ncarry >>> 26;
              ncarry &= 0x3ffffff;
            }
            out.words[k] = rword;
            carry = ncarry;
            ncarry = hncarry;
          }
          if (carry !== 0) {
            out.words[k] = carry;
          } else {
            out.length--;
          }

          return out.strip();
        }

        function jumboMulTo(self, num, out) {
          var fftm = new FFTM();
          return fftm.mulp(self, num, out);
        }

        BN.prototype.mulTo = function mulTo(num, out) {
          var res;
          var len = this.length + num.length;
          if (this.length === 10 && num.length === 10) {
            res = comb10MulTo(this, num, out);
          } else if (len < 63) {
            res = smallMulTo(this, num, out);
          } else if (len < 1024) {
            res = bigMulTo(this, num, out);
          } else {
            res = jumboMulTo(this, num, out);
          }

          return res;
        };

        // Cooley-Tukey algorithm for FFT
        // slightly revisited to rely on looping instead of recursion

        function FFTM(x, y) {
          this.x = x;
          this.y = y;
        }

        FFTM.prototype.makeRBT = function makeRBT(N) {
          var t = new Array(N);
          var l = BN.prototype._countBits(N) - 1;
          for (var i = 0; i < N; i++) {
            t[i] = this.revBin(i, l, N);
          }

          return t;
        };

        // Returns binary-reversed representation of `x`
        FFTM.prototype.revBin = function revBin(x, l, N) {
          if (x === 0 || x === N - 1) return x;

          var rb = 0;
          for (var i = 0; i < l; i++) {
            rb |= (x & 1) << l - i - 1;
            x >>= 1;
          }

          return rb;
        };

        // Performs "tweedling" phase, therefore 'emulating'
        // behaviour of the recursive algorithm
        FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
          for (var i = 0; i < N; i++) {
            rtws[i] = rws[rbt[i]];
            itws[i] = iws[rbt[i]];
          }
        };

        FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
          this.permute(rbt, rws, iws, rtws, itws, N);

          for (var s = 1; s < N; s <<= 1) {
            var l = s << 1;

            var rtwdf = Math.cos(2 * Math.PI / l);
            var itwdf = Math.sin(2 * Math.PI / l);

            for (var p = 0; p < N; p += l) {
              var rtwdf_ = rtwdf;
              var itwdf_ = itwdf;

              for (var j = 0; j < s; j++) {
                var re = rtws[p + j];
                var ie = itws[p + j];

                var ro = rtws[p + j + s];
                var io = itws[p + j + s];

                var rx = rtwdf_ * ro - itwdf_ * io;

                io = rtwdf_ * io + itwdf_ * ro;
                ro = rx;

                rtws[p + j] = re + ro;
                itws[p + j] = ie + io;

                rtws[p + j + s] = re - ro;
                itws[p + j + s] = ie - io;

                /* jshint maxdepth : false */
                if (j !== l) {
                  rx = rtwdf * rtwdf_ - itwdf * itwdf_;

                  itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                  rtwdf_ = rx;
                }
              }
            }
          }
        };

        FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
          var N = Math.max(m, n) | 1;
          var odd = N & 1;
          var i = 0;
          for (N = N / 2 | 0; N; N = N >>> 1) {
            i++;
          }

          return 1 << i + 1 + odd;
        };

        FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
          if (N <= 1) return;

          for (var i = 0; i < N / 2; i++) {
            var t = rws[i];

            rws[i] = rws[N - i - 1];
            rws[N - i - 1] = t;

            t = iws[i];

            iws[i] = -iws[N - i - 1];
            iws[N - i - 1] = -t;
          }
        };

        FFTM.prototype.normalize13b = function normalize13b(ws, N) {
          var carry = 0;
          for (var i = 0; i < N / 2; i++) {
            var w = Math.round(ws[2 * i + 1] / N) * 0x2000 + Math.round(ws[2 * i] / N) + carry;

            ws[i] = w & 0x3ffffff;

            if (w < 0x4000000) {
              carry = 0;
            } else {
              carry = w / 0x4000000 | 0;
            }
          }

          return ws;
        };

        FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
          var carry = 0;
          for (var i = 0; i < len; i++) {
            carry = carry + (ws[i] | 0);

            rws[2 * i] = carry & 0x1fff;carry = carry >>> 13;
            rws[2 * i + 1] = carry & 0x1fff;carry = carry >>> 13;
          }

          // Pad with zeroes
          for (i = 2 * len; i < N; ++i) {
            rws[i] = 0;
          }

          assert(carry === 0);
          assert((carry & ~0x1fff) === 0);
        };

        FFTM.prototype.stub = function stub(N) {
          var ph = new Array(N);
          for (var i = 0; i < N; i++) {
            ph[i] = 0;
          }

          return ph;
        };

        FFTM.prototype.mulp = function mulp(x, y, out) {
          var N = 2 * this.guessLen13b(x.length, y.length);

          var rbt = this.makeRBT(N);

          var _ = this.stub(N);

          var rws = new Array(N);
          var rwst = new Array(N);
          var iwst = new Array(N);

          var nrws = new Array(N);
          var nrwst = new Array(N);
          var niwst = new Array(N);

          var rmws = out.words;
          rmws.length = N;

          this.convert13b(x.words, x.length, rws, N);
          this.convert13b(y.words, y.length, nrws, N);

          this.transform(rws, _, rwst, iwst, N, rbt);
          this.transform(nrws, _, nrwst, niwst, N, rbt);

          for (var i = 0; i < N; i++) {
            var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
            iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
            rwst[i] = rx;
          }

          this.conjugate(rwst, iwst, N);
          this.transform(rwst, iwst, rmws, _, N, rbt);
          this.conjugate(rmws, _, N);
          this.normalize13b(rmws, N);

          out.negative = x.negative ^ y.negative;
          out.length = x.length + y.length;
          return out.strip();
        };

        // Multiply `this` by `num`
        BN.prototype.mul = function mul(num) {
          var out = new BN(null);
          out.words = new Array(this.length + num.length);
          return this.mulTo(num, out);
        };

        // Multiply employing FFT
        BN.prototype.mulf = function mulf(num) {
          var out = new BN(null);
          out.words = new Array(this.length + num.length);
          return jumboMulTo(this, num, out);
        };

        // In-place Multiplication
        BN.prototype.imul = function imul(num) {
          return this.clone().mulTo(num, this);
        };

        BN.prototype.imuln = function imuln(num) {
          assert(typeof num === 'number');
          assert(num < 0x4000000);

          // Carry
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = (this.words[i] | 0) * num;
            var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
            carry >>= 26;
            carry += w / 0x4000000 | 0;
            // NOTE: lo is 27bit maximum
            carry += lo >>> 26;
            this.words[i] = lo & 0x3ffffff;
          }

          if (carry !== 0) {
            this.words[i] = carry;
            this.length++;
          }

          return this;
        };

        BN.prototype.muln = function muln(num) {
          return this.clone().imuln(num);
        };

        // `this` * `this`
        BN.prototype.sqr = function sqr() {
          return this.mul(this);
        };

        // `this` * `this` in-place
        BN.prototype.isqr = function isqr() {
          return this.imul(this.clone());
        };

        // Math.pow(`this`, `num`)
        BN.prototype.pow = function pow(num) {
          var w = toBitArray(num);
          if (w.length === 0) return new BN(1);

          // Skip leading zeroes
          var res = this;
          for (var i = 0; i < w.length; i++, res = res.sqr()) {
            if (w[i] !== 0) break;
          }

          if (++i < w.length) {
            for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
              if (w[i] === 0) continue;

              res = res.mul(q);
            }
          }

          return res;
        };

        // Shift-left in-place
        BN.prototype.iushln = function iushln(bits) {
          assert(typeof bits === 'number' && bits >= 0);
          var r = bits % 26;
          var s = (bits - r) / 26;
          var carryMask = 0x3ffffff >>> 26 - r << 26 - r;
          var i;

          if (r !== 0) {
            var carry = 0;

            for (i = 0; i < this.length; i++) {
              var newCarry = this.words[i] & carryMask;
              var c = (this.words[i] | 0) - newCarry << r;
              this.words[i] = c | carry;
              carry = newCarry >>> 26 - r;
            }

            if (carry) {
              this.words[i] = carry;
              this.length++;
            }
          }

          if (s !== 0) {
            for (i = this.length - 1; i >= 0; i--) {
              this.words[i + s] = this.words[i];
            }

            for (i = 0; i < s; i++) {
              this.words[i] = 0;
            }

            this.length += s;
          }

          return this.strip();
        };

        BN.prototype.ishln = function ishln(bits) {
          // TODO(indutny): implement me
          assert(this.negative === 0);
          return this.iushln(bits);
        };

        // Shift-right in-place
        // NOTE: `hint` is a lowest bit before trailing zeroes
        // NOTE: if `extended` is present - it will be filled with destroyed bits
        BN.prototype.iushrn = function iushrn(bits, hint, extended) {
          assert(typeof bits === 'number' && bits >= 0);
          var h;
          if (hint) {
            h = (hint - hint % 26) / 26;
          } else {
            h = 0;
          }

          var r = bits % 26;
          var s = Math.min((bits - r) / 26, this.length);
          var mask = 0x3ffffff ^ 0x3ffffff >>> r << r;
          var maskedWords = extended;

          h -= s;
          h = Math.max(0, h);

          // Extended mode, copy masked part
          if (maskedWords) {
            for (var i = 0; i < s; i++) {
              maskedWords.words[i] = this.words[i];
            }
            maskedWords.length = s;
          }

          if (s === 0) {
            // No-op, we should not move anything at all
          } else if (this.length > s) {
            this.length -= s;
            for (i = 0; i < this.length; i++) {
              this.words[i] = this.words[i + s];
            }
          } else {
            this.words[0] = 0;
            this.length = 1;
          }

          var carry = 0;
          for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
            var word = this.words[i] | 0;
            this.words[i] = carry << 26 - r | word >>> r;
            carry = word & mask;
          }

          // Push carried bits as a mask
          if (maskedWords && carry !== 0) {
            maskedWords.words[maskedWords.length++] = carry;
          }

          if (this.length === 0) {
            this.words[0] = 0;
            this.length = 1;
          }

          return this.strip();
        };

        BN.prototype.ishrn = function ishrn(bits, hint, extended) {
          // TODO(indutny): implement me
          assert(this.negative === 0);
          return this.iushrn(bits, hint, extended);
        };

        // Shift-left
        BN.prototype.shln = function shln(bits) {
          return this.clone().ishln(bits);
        };

        BN.prototype.ushln = function ushln(bits) {
          return this.clone().iushln(bits);
        };

        // Shift-right
        BN.prototype.shrn = function shrn(bits) {
          return this.clone().ishrn(bits);
        };

        BN.prototype.ushrn = function ushrn(bits) {
          return this.clone().iushrn(bits);
        };

        // Test if n bit is set
        BN.prototype.testn = function testn(bit) {
          assert(typeof bit === 'number' && bit >= 0);
          var r = bit % 26;
          var s = (bit - r) / 26;
          var q = 1 << r;

          // Fast case: bit is much higher than all existing words
          if (this.length <= s) return false;

          // Check bit and return
          var w = this.words[s];

          return !!(w & q);
        };

        // Return only lowers bits of number (in-place)
        BN.prototype.imaskn = function imaskn(bits) {
          assert(typeof bits === 'number' && bits >= 0);
          var r = bits % 26;
          var s = (bits - r) / 26;

          assert(this.negative === 0, 'imaskn works only with positive numbers');

          if (this.length <= s) {
            return this;
          }

          if (r !== 0) {
            s++;
          }
          this.length = Math.min(s, this.length);

          if (r !== 0) {
            var mask = 0x3ffffff ^ 0x3ffffff >>> r << r;
            this.words[this.length - 1] &= mask;
          }

          return this.strip();
        };

        // Return only lowers bits of number
        BN.prototype.maskn = function maskn(bits) {
          return this.clone().imaskn(bits);
        };

        // Add plain number `num` to `this`
        BN.prototype.iaddn = function iaddn(num) {
          assert(typeof num === 'number');
          assert(num < 0x4000000);
          if (num < 0) return this.isubn(-num);

          // Possible sign change
          if (this.negative !== 0) {
            if (this.length === 1 && (this.words[0] | 0) < num) {
              this.words[0] = num - (this.words[0] | 0);
              this.negative = 0;
              return this;
            }

            this.negative = 0;
            this.isubn(num);
            this.negative = 1;
            return this;
          }

          // Add without checks
          return this._iaddn(num);
        };

        BN.prototype._iaddn = function _iaddn(num) {
          this.words[0] += num;

          // Carry
          for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
            this.words[i] -= 0x4000000;
            if (i === this.length - 1) {
              this.words[i + 1] = 1;
            } else {
              this.words[i + 1]++;
            }
          }
          this.length = Math.max(this.length, i + 1);

          return this;
        };

        // Subtract plain number `num` from `this`
        BN.prototype.isubn = function isubn(num) {
          assert(typeof num === 'number');
          assert(num < 0x4000000);
          if (num < 0) return this.iaddn(-num);

          if (this.negative !== 0) {
            this.negative = 0;
            this.iaddn(num);
            this.negative = 1;
            return this;
          }

          this.words[0] -= num;

          if (this.length === 1 && this.words[0] < 0) {
            this.words[0] = -this.words[0];
            this.negative = 1;
          } else {
            // Carry
            for (var i = 0; i < this.length && this.words[i] < 0; i++) {
              this.words[i] += 0x4000000;
              this.words[i + 1] -= 1;
            }
          }

          return this.strip();
        };

        BN.prototype.addn = function addn(num) {
          return this.clone().iaddn(num);
        };

        BN.prototype.subn = function subn(num) {
          return this.clone().isubn(num);
        };

        BN.prototype.iabs = function iabs() {
          this.negative = 0;

          return this;
        };

        BN.prototype.abs = function abs() {
          return this.clone().iabs();
        };

        BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
          var len = num.length + shift;
          var i;

          this._expand(len);

          var w;
          var carry = 0;
          for (i = 0; i < num.length; i++) {
            w = (this.words[i + shift] | 0) + carry;
            var right = (num.words[i] | 0) * mul;
            w -= right & 0x3ffffff;
            carry = (w >> 26) - (right / 0x4000000 | 0);
            this.words[i + shift] = w & 0x3ffffff;
          }
          for (; i < this.length - shift; i++) {
            w = (this.words[i + shift] | 0) + carry;
            carry = w >> 26;
            this.words[i + shift] = w & 0x3ffffff;
          }

          if (carry === 0) return this.strip();

          // Subtraction overflow
          assert(carry === -1);
          carry = 0;
          for (i = 0; i < this.length; i++) {
            w = -(this.words[i] | 0) + carry;
            carry = w >> 26;
            this.words[i] = w & 0x3ffffff;
          }
          this.negative = 1;

          return this.strip();
        };

        BN.prototype._wordDiv = function _wordDiv(num, mode) {
          var shift = this.length - num.length;

          var a = this.clone();
          var b = num;

          // Normalize
          var bhi = b.words[b.length - 1] | 0;
          var bhiBits = this._countBits(bhi);
          shift = 26 - bhiBits;
          if (shift !== 0) {
            b = b.ushln(shift);
            a.iushln(shift);
            bhi = b.words[b.length - 1] | 0;
          }

          // Initialize quotient
          var m = a.length - b.length;
          var q;

          if (mode !== 'mod') {
            q = new BN(null);
            q.length = m + 1;
            q.words = new Array(q.length);
            for (var i = 0; i < q.length; i++) {
              q.words[i] = 0;
            }
          }

          var diff = a.clone()._ishlnsubmul(b, 1, m);
          if (diff.negative === 0) {
            a = diff;
            if (q) {
              q.words[m] = 1;
            }
          }

          for (var j = m - 1; j >= 0; j--) {
            var qj = (a.words[b.length + j] | 0) * 0x4000000 + (a.words[b.length + j - 1] | 0);

            // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
            // (0x7ffffff)
            qj = Math.min(qj / bhi | 0, 0x3ffffff);

            a._ishlnsubmul(b, qj, j);
            while (a.negative !== 0) {
              qj--;
              a.negative = 0;
              a._ishlnsubmul(b, 1, j);
              if (!a.isZero()) {
                a.negative ^= 1;
              }
            }
            if (q) {
              q.words[j] = qj;
            }
          }
          if (q) {
            q.strip();
          }
          a.strip();

          // Denormalize
          if (mode !== 'div' && shift !== 0) {
            a.iushrn(shift);
          }

          return {
            div: q || null,
            mod: a
          };
        };

        // NOTE: 1) `mode` can be set to `mod` to request mod only,
        //       to `div` to request div only, or be absent to
        //       request both div & mod
        //       2) `positive` is true if unsigned mod is requested
        BN.prototype.divmod = function divmod(num, mode, positive) {
          assert(!num.isZero());

          if (this.isZero()) {
            return {
              div: new BN(0),
              mod: new BN(0)
            };
          }

          var div, mod, res;
          if (this.negative !== 0 && num.negative === 0) {
            res = this.neg().divmod(num, mode);

            if (mode !== 'mod') {
              div = res.div.neg();
            }

            if (mode !== 'div') {
              mod = res.mod.neg();
              if (positive && mod.negative !== 0) {
                mod.iadd(num);
              }
            }

            return {
              div: div,
              mod: mod
            };
          }

          if (this.negative === 0 && num.negative !== 0) {
            res = this.divmod(num.neg(), mode);

            if (mode !== 'mod') {
              div = res.div.neg();
            }

            return {
              div: div,
              mod: res.mod
            };
          }

          if ((this.negative & num.negative) !== 0) {
            res = this.neg().divmod(num.neg(), mode);

            if (mode !== 'div') {
              mod = res.mod.neg();
              if (positive && mod.negative !== 0) {
                mod.isub(num);
              }
            }

            return {
              div: res.div,
              mod: mod
            };
          }

          // Both numbers are positive at this point

          // Strip both numbers to approximate shift value
          if (num.length > this.length || this.cmp(num) < 0) {
            return {
              div: new BN(0),
              mod: this
            };
          }

          // Very short reduction
          if (num.length === 1) {
            if (mode === 'div') {
              return {
                div: this.divn(num.words[0]),
                mod: null
              };
            }

            if (mode === 'mod') {
              return {
                div: null,
                mod: new BN(this.modn(num.words[0]))
              };
            }

            return {
              div: this.divn(num.words[0]),
              mod: new BN(this.modn(num.words[0]))
            };
          }

          return this._wordDiv(num, mode);
        };

        // Find `this` / `num`
        BN.prototype.div = function div(num) {
          return this.divmod(num, 'div', false).div;
        };

        // Find `this` % `num`
        BN.prototype.mod = function mod(num) {
          return this.divmod(num, 'mod', false).mod;
        };

        BN.prototype.umod = function umod(num) {
          return this.divmod(num, 'mod', true).mod;
        };

        // Find Round(`this` / `num`)
        BN.prototype.divRound = function divRound(num) {
          var dm = this.divmod(num);

          // Fast case - exact division
          if (dm.mod.isZero()) return dm.div;

          var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

          var half = num.ushrn(1);
          var r2 = num.andln(1);
          var cmp = mod.cmp(half);

          // Round down
          if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;

          // Round up
          return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
        };

        BN.prototype.modn = function modn(num) {
          assert(num <= 0x3ffffff);
          var p = (1 << 26) % num;

          var acc = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            acc = (p * acc + (this.words[i] | 0)) % num;
          }

          return acc;
        };

        // In-place division by number
        BN.prototype.idivn = function idivn(num) {
          assert(num <= 0x3ffffff);

          var carry = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            var w = (this.words[i] | 0) + carry * 0x4000000;
            this.words[i] = w / num | 0;
            carry = w % num;
          }

          return this.strip();
        };

        BN.prototype.divn = function divn(num) {
          return this.clone().idivn(num);
        };

        BN.prototype.egcd = function egcd(p) {
          assert(p.negative === 0);
          assert(!p.isZero());

          var x = this;
          var y = p.clone();

          if (x.negative !== 0) {
            x = x.umod(p);
          } else {
            x = x.clone();
          }

          // A * x + B * y = x
          var A = new BN(1);
          var B = new BN(0);

          // C * x + D * y = y
          var C = new BN(0);
          var D = new BN(1);

          var g = 0;

          while (x.isEven() && y.isEven()) {
            x.iushrn(1);
            y.iushrn(1);
            ++g;
          }

          var yp = y.clone();
          var xp = x.clone();

          while (!x.isZero()) {
            for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1) {}
            if (i > 0) {
              x.iushrn(i);
              while (i-- > 0) {
                if (A.isOdd() || B.isOdd()) {
                  A.iadd(yp);
                  B.isub(xp);
                }

                A.iushrn(1);
                B.iushrn(1);
              }
            }

            for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) {}
            if (j > 0) {
              y.iushrn(j);
              while (j-- > 0) {
                if (C.isOdd() || D.isOdd()) {
                  C.iadd(yp);
                  D.isub(xp);
                }

                C.iushrn(1);
                D.iushrn(1);
              }
            }

            if (x.cmp(y) >= 0) {
              x.isub(y);
              A.isub(C);
              B.isub(D);
            } else {
              y.isub(x);
              C.isub(A);
              D.isub(B);
            }
          }

          return {
            a: C,
            b: D,
            gcd: y.iushln(g)
          };
        };

        // This is reduced incarnation of the binary EEA
        // above, designated to invert members of the
        // _prime_ fields F(p) at a maximal speed
        BN.prototype._invmp = function _invmp(p) {
          assert(p.negative === 0);
          assert(!p.isZero());

          var a = this;
          var b = p.clone();

          if (a.negative !== 0) {
            a = a.umod(p);
          } else {
            a = a.clone();
          }

          var x1 = new BN(1);
          var x2 = new BN(0);

          var delta = b.clone();

          while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
            for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1) {}
            if (i > 0) {
              a.iushrn(i);
              while (i-- > 0) {
                if (x1.isOdd()) {
                  x1.iadd(delta);
                }

                x1.iushrn(1);
              }
            }

            for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) {}
            if (j > 0) {
              b.iushrn(j);
              while (j-- > 0) {
                if (x2.isOdd()) {
                  x2.iadd(delta);
                }

                x2.iushrn(1);
              }
            }

            if (a.cmp(b) >= 0) {
              a.isub(b);
              x1.isub(x2);
            } else {
              b.isub(a);
              x2.isub(x1);
            }
          }

          var res;
          if (a.cmpn(1) === 0) {
            res = x1;
          } else {
            res = x2;
          }

          if (res.cmpn(0) < 0) {
            res.iadd(p);
          }

          return res;
        };

        BN.prototype.gcd = function gcd(num) {
          if (this.isZero()) return num.abs();
          if (num.isZero()) return this.abs();

          var a = this.clone();
          var b = num.clone();
          a.negative = 0;
          b.negative = 0;

          // Remove common factor of two
          for (var shift = 0; a.isEven() && b.isEven(); shift++) {
            a.iushrn(1);
            b.iushrn(1);
          }

          do {
            while (a.isEven()) {
              a.iushrn(1);
            }
            while (b.isEven()) {
              b.iushrn(1);
            }

            var r = a.cmp(b);
            if (r < 0) {
              // Swap `a` and `b` to make `a` always bigger than `b`
              var t = a;
              a = b;
              b = t;
            } else if (r === 0 || b.cmpn(1) === 0) {
              break;
            }

            a.isub(b);
          } while (true);

          return b.iushln(shift);
        };

        // Invert number in the field F(num)
        BN.prototype.invm = function invm(num) {
          return this.egcd(num).a.umod(num);
        };

        BN.prototype.isEven = function isEven() {
          return (this.words[0] & 1) === 0;
        };

        BN.prototype.isOdd = function isOdd() {
          return (this.words[0] & 1) === 1;
        };

        // And first word and num
        BN.prototype.andln = function andln(num) {
          return this.words[0] & num;
        };

        // Increment at the bit position in-line
        BN.prototype.bincn = function bincn(bit) {
          assert(typeof bit === 'number');
          var r = bit % 26;
          var s = (bit - r) / 26;
          var q = 1 << r;

          // Fast case: bit is much higher than all existing words
          if (this.length <= s) {
            this._expand(s + 1);
            this.words[s] |= q;
            return this;
          }

          // Add bit and propagate, if needed
          var carry = q;
          for (var i = s; carry !== 0 && i < this.length; i++) {
            var w = this.words[i] | 0;
            w += carry;
            carry = w >>> 26;
            w &= 0x3ffffff;
            this.words[i] = w;
          }
          if (carry !== 0) {
            this.words[i] = carry;
            this.length++;
          }
          return this;
        };

        BN.prototype.isZero = function isZero() {
          return this.length === 1 && this.words[0] === 0;
        };

        BN.prototype.cmpn = function cmpn(num) {
          var negative = num < 0;

          if (this.negative !== 0 && !negative) return -1;
          if (this.negative === 0 && negative) return 1;

          this.strip();

          var res;
          if (this.length > 1) {
            res = 1;
          } else {
            if (negative) {
              num = -num;
            }

            assert(num <= 0x3ffffff, 'Number is too big');

            var w = this.words[0] | 0;
            res = w === num ? 0 : w < num ? -1 : 1;
          }
          if (this.negative !== 0) return -res | 0;
          return res;
        };

        // Compare two numbers and return:
        // 1 - if `this` > `num`
        // 0 - if `this` == `num`
        // -1 - if `this` < `num`
        BN.prototype.cmp = function cmp(num) {
          if (this.negative !== 0 && num.negative === 0) return -1;
          if (this.negative === 0 && num.negative !== 0) return 1;

          var res = this.ucmp(num);
          if (this.negative !== 0) return -res | 0;
          return res;
        };

        // Unsigned comparison
        BN.prototype.ucmp = function ucmp(num) {
          // At this point both numbers have the same sign
          if (this.length > num.length) return 1;
          if (this.length < num.length) return -1;

          var res = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            var a = this.words[i] | 0;
            var b = num.words[i] | 0;

            if (a === b) continue;
            if (a < b) {
              res = -1;
            } else if (a > b) {
              res = 1;
            }
            break;
          }
          return res;
        };

        BN.prototype.gtn = function gtn(num) {
          return this.cmpn(num) === 1;
        };

        BN.prototype.gt = function gt(num) {
          return this.cmp(num) === 1;
        };

        BN.prototype.gten = function gten(num) {
          return this.cmpn(num) >= 0;
        };

        BN.prototype.gte = function gte(num) {
          return this.cmp(num) >= 0;
        };

        BN.prototype.ltn = function ltn(num) {
          return this.cmpn(num) === -1;
        };

        BN.prototype.lt = function lt(num) {
          return this.cmp(num) === -1;
        };

        BN.prototype.lten = function lten(num) {
          return this.cmpn(num) <= 0;
        };

        BN.prototype.lte = function lte(num) {
          return this.cmp(num) <= 0;
        };

        BN.prototype.eqn = function eqn(num) {
          return this.cmpn(num) === 0;
        };

        BN.prototype.eq = function eq(num) {
          return this.cmp(num) === 0;
        };

        //
        // A reduce context, could be using montgomery or something better, depending
        // on the `m` itself.
        //
        BN.red = function red(num) {
          return new Red(num);
        };

        BN.prototype.toRed = function toRed(ctx) {
          assert(!this.red, 'Already a number in reduction context');
          assert(this.negative === 0, 'red works only with positives');
          return ctx.convertTo(this)._forceRed(ctx);
        };

        BN.prototype.fromRed = function fromRed() {
          assert(this.red, 'fromRed works only with numbers in reduction context');
          return this.red.convertFrom(this);
        };

        BN.prototype._forceRed = function _forceRed(ctx) {
          this.red = ctx;
          return this;
        };

        BN.prototype.forceRed = function forceRed(ctx) {
          assert(!this.red, 'Already a number in reduction context');
          return this._forceRed(ctx);
        };

        BN.prototype.redAdd = function redAdd(num) {
          assert(this.red, 'redAdd works only with red numbers');
          return this.red.add(this, num);
        };

        BN.prototype.redIAdd = function redIAdd(num) {
          assert(this.red, 'redIAdd works only with red numbers');
          return this.red.iadd(this, num);
        };

        BN.prototype.redSub = function redSub(num) {
          assert(this.red, 'redSub works only with red numbers');
          return this.red.sub(this, num);
        };

        BN.prototype.redISub = function redISub(num) {
          assert(this.red, 'redISub works only with red numbers');
          return this.red.isub(this, num);
        };

        BN.prototype.redShl = function redShl(num) {
          assert(this.red, 'redShl works only with red numbers');
          return this.red.shl(this, num);
        };

        BN.prototype.redMul = function redMul(num) {
          assert(this.red, 'redMul works only with red numbers');
          this.red._verify2(this, num);
          return this.red.mul(this, num);
        };

        BN.prototype.redIMul = function redIMul(num) {
          assert(this.red, 'redMul works only with red numbers');
          this.red._verify2(this, num);
          return this.red.imul(this, num);
        };

        BN.prototype.redSqr = function redSqr() {
          assert(this.red, 'redSqr works only with red numbers');
          this.red._verify1(this);
          return this.red.sqr(this);
        };

        BN.prototype.redISqr = function redISqr() {
          assert(this.red, 'redISqr works only with red numbers');
          this.red._verify1(this);
          return this.red.isqr(this);
        };

        // Square root over p
        BN.prototype.redSqrt = function redSqrt() {
          assert(this.red, 'redSqrt works only with red numbers');
          this.red._verify1(this);
          return this.red.sqrt(this);
        };

        BN.prototype.redInvm = function redInvm() {
          assert(this.red, 'redInvm works only with red numbers');
          this.red._verify1(this);
          return this.red.invm(this);
        };

        // Return negative clone of `this` % `red modulo`
        BN.prototype.redNeg = function redNeg() {
          assert(this.red, 'redNeg works only with red numbers');
          this.red._verify1(this);
          return this.red.neg(this);
        };

        BN.prototype.redPow = function redPow(num) {
          assert(this.red && !num.red, 'redPow(normalNum)');
          this.red._verify1(this);
          return this.red.pow(this, num);
        };

        // Prime numbers with efficient reduction
        var primes = {
          k256: null,
          p224: null,
          p192: null,
          p25519: null
        };

        // Pseudo-Mersenne prime
        function MPrime(name, p) {
          // P = 2 ^ N - K
          this.name = name;
          this.p = new BN(p, 16);
          this.n = this.p.bitLength();
          this.k = new BN(1).iushln(this.n).isub(this.p);

          this.tmp = this._tmp();
        }

        MPrime.prototype._tmp = function _tmp() {
          var tmp = new BN(null);
          tmp.words = new Array(Math.ceil(this.n / 13));
          return tmp;
        };

        MPrime.prototype.ireduce = function ireduce(num) {
          // Assumes that `num` is less than `P^2`
          // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
          var r = num;
          var rlen;

          do {
            this.split(r, this.tmp);
            r = this.imulK(r);
            r = r.iadd(this.tmp);
            rlen = r.bitLength();
          } while (rlen > this.n);

          var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
          if (cmp === 0) {
            r.words[0] = 0;
            r.length = 1;
          } else if (cmp > 0) {
            r.isub(this.p);
          } else {
            r.strip();
          }

          return r;
        };

        MPrime.prototype.split = function split(input, out) {
          input.iushrn(this.n, 0, out);
        };

        MPrime.prototype.imulK = function imulK(num) {
          return num.imul(this.k);
        };

        function K256() {
          MPrime.call(this, 'k256', 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
        }
        inherits(K256, MPrime);

        K256.prototype.split = function split(input, output) {
          // 256 = 9 * 26 + 22
          var mask = 0x3fffff;

          var outLen = Math.min(input.length, 9);
          for (var i = 0; i < outLen; i++) {
            output.words[i] = input.words[i];
          }
          output.length = outLen;

          if (input.length <= 9) {
            input.words[0] = 0;
            input.length = 1;
            return;
          }

          // Shift by 9 limbs
          var prev = input.words[9];
          output.words[output.length++] = prev & mask;

          for (i = 10; i < input.length; i++) {
            var next = input.words[i] | 0;
            input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
            prev = next;
          }
          prev >>>= 22;
          input.words[i - 10] = prev;
          if (prev === 0 && input.length > 10) {
            input.length -= 10;
          } else {
            input.length -= 9;
          }
        };

        K256.prototype.imulK = function imulK(num) {
          // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
          num.words[num.length] = 0;
          num.words[num.length + 1] = 0;
          num.length += 2;

          // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
          var lo = 0;
          for (var i = 0; i < num.length; i++) {
            var w = num.words[i] | 0;
            lo += w * 0x3d1;
            num.words[i] = lo & 0x3ffffff;
            lo = w * 0x40 + (lo / 0x4000000 | 0);
          }

          // Fast length reduction
          if (num.words[num.length - 1] === 0) {
            num.length--;
            if (num.words[num.length - 1] === 0) {
              num.length--;
            }
          }
          return num;
        };

        function P224() {
          MPrime.call(this, 'p224', 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
        }
        inherits(P224, MPrime);

        function P192() {
          MPrime.call(this, 'p192', 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
        }
        inherits(P192, MPrime);

        function P25519() {
          // 2 ^ 255 - 19
          MPrime.call(this, '25519', '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
        }
        inherits(P25519, MPrime);

        P25519.prototype.imulK = function imulK(num) {
          // K = 0x13
          var carry = 0;
          for (var i = 0; i < num.length; i++) {
            var hi = (num.words[i] | 0) * 0x13 + carry;
            var lo = hi & 0x3ffffff;
            hi >>>= 26;

            num.words[i] = lo;
            carry = hi;
          }
          if (carry !== 0) {
            num.words[num.length++] = carry;
          }
          return num;
        };

        // Exported mostly for testing purposes, use plain name instead
        BN._prime = function prime(name) {
          // Cached version of prime
          if (primes[name]) return primes[name];

          var prime;
          if (name === 'k256') {
            prime = new K256();
          } else if (name === 'p224') {
            prime = new P224();
          } else if (name === 'p192') {
            prime = new P192();
          } else if (name === 'p25519') {
            prime = new P25519();
          } else {
            throw new Error('Unknown prime ' + name);
          }
          primes[name] = prime;

          return prime;
        };

        //
        // Base reduction engine
        //
        function Red(m) {
          if (typeof m === 'string') {
            var prime = BN._prime(m);
            this.m = prime.p;
            this.prime = prime;
          } else {
            assert(m.gtn(1), 'modulus must be greater than 1');
            this.m = m;
            this.prime = null;
          }
        }

        Red.prototype._verify1 = function _verify1(a) {
          assert(a.negative === 0, 'red works only with positives');
          assert(a.red, 'red works only with red numbers');
        };

        Red.prototype._verify2 = function _verify2(a, b) {
          assert((a.negative | b.negative) === 0, 'red works only with positives');
          assert(a.red && a.red === b.red, 'red works only with red numbers');
        };

        Red.prototype.imod = function imod(a) {
          if (this.prime) return this.prime.ireduce(a)._forceRed(this);
          return a.umod(this.m)._forceRed(this);
        };

        Red.prototype.neg = function neg(a) {
          if (a.isZero()) {
            return a.clone();
          }

          return this.m.sub(a)._forceRed(this);
        };

        Red.prototype.add = function add(a, b) {
          this._verify2(a, b);

          var res = a.add(b);
          if (res.cmp(this.m) >= 0) {
            res.isub(this.m);
          }
          return res._forceRed(this);
        };

        Red.prototype.iadd = function iadd(a, b) {
          this._verify2(a, b);

          var res = a.iadd(b);
          if (res.cmp(this.m) >= 0) {
            res.isub(this.m);
          }
          return res;
        };

        Red.prototype.sub = function sub(a, b) {
          this._verify2(a, b);

          var res = a.sub(b);
          if (res.cmpn(0) < 0) {
            res.iadd(this.m);
          }
          return res._forceRed(this);
        };

        Red.prototype.isub = function isub(a, b) {
          this._verify2(a, b);

          var res = a.isub(b);
          if (res.cmpn(0) < 0) {
            res.iadd(this.m);
          }
          return res;
        };

        Red.prototype.shl = function shl(a, num) {
          this._verify1(a);
          return this.imod(a.ushln(num));
        };

        Red.prototype.imul = function imul(a, b) {
          this._verify2(a, b);
          return this.imod(a.imul(b));
        };

        Red.prototype.mul = function mul(a, b) {
          this._verify2(a, b);
          return this.imod(a.mul(b));
        };

        Red.prototype.isqr = function isqr(a) {
          return this.imul(a, a.clone());
        };

        Red.prototype.sqr = function sqr(a) {
          return this.mul(a, a);
        };

        Red.prototype.sqrt = function sqrt(a) {
          if (a.isZero()) return a.clone();

          var mod3 = this.m.andln(3);
          assert(mod3 % 2 === 1);

          // Fast case
          if (mod3 === 3) {
            var pow = this.m.add(new BN(1)).iushrn(2);
            return this.pow(a, pow);
          }

          // Tonelli-Shanks algorithm (Totally unoptimized and slow)
          //
          // Find Q and S, that Q * 2 ^ S = (P - 1)
          var q = this.m.subn(1);
          var s = 0;
          while (!q.isZero() && q.andln(1) === 0) {
            s++;
            q.iushrn(1);
          }
          assert(!q.isZero());

          var one = new BN(1).toRed(this);
          var nOne = one.redNeg();

          // Find quadratic non-residue
          // NOTE: Max is such because of generalized Riemann hypothesis.
          var lpow = this.m.subn(1).iushrn(1);
          var z = this.m.bitLength();
          z = new BN(2 * z * z).toRed(this);

          while (this.pow(z, lpow).cmp(nOne) !== 0) {
            z.redIAdd(nOne);
          }

          var c = this.pow(z, q);
          var r = this.pow(a, q.addn(1).iushrn(1));
          var t = this.pow(a, q);
          var m = s;
          while (t.cmp(one) !== 0) {
            var tmp = t;
            for (var i = 0; tmp.cmp(one) !== 0; i++) {
              tmp = tmp.redSqr();
            }
            assert(i < m);
            var b = this.pow(c, new BN(1).iushln(m - i - 1));

            r = r.redMul(b);
            c = b.redSqr();
            t = t.redMul(c);
            m = i;
          }

          return r;
        };

        Red.prototype.invm = function invm(a) {
          var inv = a._invmp(this.m);
          if (inv.negative !== 0) {
            inv.negative = 0;
            return this.imod(inv).redNeg();
          } else {
            return this.imod(inv);
          }
        };

        Red.prototype.pow = function pow(a, num) {
          if (num.isZero()) return new BN(1).toRed(this);
          if (num.cmpn(1) === 0) return a.clone();

          var windowSize = 4;
          var wnd = new Array(1 << windowSize);
          wnd[0] = new BN(1).toRed(this);
          wnd[1] = a;
          for (var i = 2; i < wnd.length; i++) {
            wnd[i] = this.mul(wnd[i - 1], a);
          }

          var res = wnd[0];
          var current = 0;
          var currentLen = 0;
          var start = num.bitLength() % 26;
          if (start === 0) {
            start = 26;
          }

          for (i = num.length - 1; i >= 0; i--) {
            var word = num.words[i];
            for (var j = start - 1; j >= 0; j--) {
              var bit = word >> j & 1;
              if (res !== wnd[0]) {
                res = this.sqr(res);
              }

              if (bit === 0 && current === 0) {
                currentLen = 0;
                continue;
              }

              current <<= 1;
              current |= bit;
              currentLen++;
              if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

              res = this.mul(res, wnd[current]);
              currentLen = 0;
              current = 0;
            }
            start = 26;
          }

          return res;
        };

        Red.prototype.convertTo = function convertTo(num) {
          var r = num.umod(this.m);

          return r === num ? r.clone() : r;
        };

        Red.prototype.convertFrom = function convertFrom(num) {
          var res = num.clone();
          res.red = null;
          return res;
        };

        //
        // Montgomery method engine
        //

        BN.mont = function mont(num) {
          return new Mont(num);
        };

        function Mont(m) {
          Red.call(this, m);

          this.shift = this.m.bitLength();
          if (this.shift % 26 !== 0) {
            this.shift += 26 - this.shift % 26;
          }

          this.r = new BN(1).iushln(this.shift);
          this.r2 = this.imod(this.r.sqr());
          this.rinv = this.r._invmp(this.m);

          this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
          this.minv = this.minv.umod(this.r);
          this.minv = this.r.sub(this.minv);
        }
        inherits(Mont, Red);

        Mont.prototype.convertTo = function convertTo(num) {
          return this.imod(num.ushln(this.shift));
        };

        Mont.prototype.convertFrom = function convertFrom(num) {
          var r = this.imod(num.mul(this.rinv));
          r.red = null;
          return r;
        };

        Mont.prototype.imul = function imul(a, b) {
          if (a.isZero() || b.isZero()) {
            a.words[0] = 0;
            a.length = 1;
            return a;
          }

          var t = a.imul(b);
          var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
          var u = t.isub(c).iushrn(this.shift);
          var res = u;

          if (u.cmp(this.m) >= 0) {
            res = u.isub(this.m);
          } else if (u.cmpn(0) < 0) {
            res = u.iadd(this.m);
          }

          return res._forceRed(this);
        };

        Mont.prototype.mul = function mul(a, b) {
          if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

          var t = a.mul(b);
          var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
          var u = t.isub(c).iushrn(this.shift);
          var res = u;
          if (u.cmp(this.m) >= 0) {
            res = u.isub(this.m);
          } else if (u.cmpn(0) < 0) {
            res = u.iadd(this.m);
          }

          return res._forceRed(this);
        };

        Mont.prototype.invm = function invm(a) {
          // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
          var res = this.imod(a._invmp(this.m).mul(this.r2));
          return res._forceRed(this);
        };
      })(typeof module === 'undefined' || module, this);
    }, { "buffer": 1 }], 1: [function (require, module, exports) {}, {}], 2: [function (require, module, exports) {
      //     Underscore.js 1.8.3
      //     http://underscorejs.org
      //     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
      //     Underscore may be freely distributed under the MIT license.

      (function () {

        // Baseline setup
        // --------------

        // Establish the root object, `window` in the browser, or `exports` on the server.
        var root = this;

        // Save the previous value of the `_` variable.
        var previousUnderscore = root._;

        // Save bytes in the minified (but not gzipped) version:
        var ArrayProto = Array.prototype,
            ObjProto = Object.prototype,
            FuncProto = Function.prototype;

        // Create quick reference variables for speed access to core prototypes.
        var push = ArrayProto.push,
            slice = ArrayProto.slice,
            toString = ObjProto.toString,
            hasOwnProperty = ObjProto.hasOwnProperty;

        // All **ECMAScript 5** native function implementations that we hope to use
        // are declared here.
        var nativeIsArray = Array.isArray,
            nativeKeys = Object.keys,
            nativeBind = FuncProto.bind,
            nativeCreate = Object.create;

        // Naked function reference for surrogate-prototype-swapping.
        var Ctor = function Ctor() {};

        // Create a safe reference to the Underscore object for use below.
        var _ = function _(obj) {
          if (obj instanceof _) return obj;
          if (!(this instanceof _)) return new _(obj);
          this._wrapped = obj;
        };

        // Export the Underscore object for **Node.js**, with
        // backwards-compatibility for the old `require()` API. If we're in
        // the browser, add `_` as a global object.
        if (typeof exports !== 'undefined') {
          if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
          }
          exports._ = _;
        } else {
          root._ = _;
        }

        // Current version.
        _.VERSION = '1.8.3';

        // Internal function that returns an efficient (for current engines) version
        // of the passed-in callback, to be repeatedly applied in other Underscore
        // functions.
        var optimizeCb = function optimizeCb(func, context, argCount) {
          if (context === void 0) return func;
          switch (argCount == null ? 3 : argCount) {
            case 1:
              return function (value) {
                return func.call(context, value);
              };
            case 2:
              return function (value, other) {
                return func.call(context, value, other);
              };
            case 3:
              return function (value, index, collection) {
                return func.call(context, value, index, collection);
              };
            case 4:
              return function (accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
              };
          }
          return function () {
            return func.apply(context, arguments);
          };
        };

        // A mostly-internal function to generate callbacks that can be applied
        // to each element in a collection, returning the desired result — either
        // identity, an arbitrary callback, a property matcher, or a property accessor.
        var cb = function cb(value, context, argCount) {
          if (value == null) return _.identity;
          if (_.isFunction(value)) return optimizeCb(value, context, argCount);
          if (_.isObject(value)) return _.matcher(value);
          return _.property(value);
        };
        _.iteratee = function (value, context) {
          return cb(value, context, Infinity);
        };

        // An internal function for creating assigner functions.
        var createAssigner = function createAssigner(keysFunc, undefinedOnly) {
          return function (obj) {
            var length = arguments.length;
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
              var source = arguments[index],
                  keys = keysFunc(source),
                  l = keys.length;
              for (var i = 0; i < l; i++) {
                var key = keys[i];
                if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
              }
            }
            return obj;
          };
        };

        // An internal function for creating a new object that inherits from another.
        var baseCreate = function baseCreate(prototype) {
          if (!_.isObject(prototype)) return {};
          if (nativeCreate) return nativeCreate(prototype);
          Ctor.prototype = prototype;
          var result = new Ctor();
          Ctor.prototype = null;
          return result;
        };

        var property = function property(key) {
          return function (obj) {
            return obj == null ? void 0 : obj[key];
          };
        };

        // Helper for collection methods to determine whether a collection
        // should be iterated as an array or as an object
        // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
        // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
        var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
        var getLength = property('length');
        var isArrayLike = function isArrayLike(collection) {
          var length = getLength(collection);
          return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
        };

        // Collection Functions
        // --------------------

        // The cornerstone, an `each` implementation, aka `forEach`.
        // Handles raw objects in addition to array-likes. Treats all
        // sparse array-likes as if they were dense.
        _.each = _.forEach = function (obj, iteratee, context) {
          iteratee = optimizeCb(iteratee, context);
          var i, length;
          if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
              iteratee(obj[i], i, obj);
            }
          } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
              iteratee(obj[keys[i]], keys[i], obj);
            }
          }
          return obj;
        };

        // Return the results of applying the iteratee to each element.
        _.map = _.collect = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          var keys = !isArrayLike(obj) && _.keys(obj),
              length = (keys || obj).length,
              results = Array(length);
          for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
          }
          return results;
        };

        // Create a reducing function iterating left or right.
        function createReduce(dir) {
          // Optimized iterator function as using arguments.length
          // in the main function will deoptimize the, see #1991.
          function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
              var currentKey = keys ? keys[index] : index;
              memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            return memo;
          }

          return function (obj, iteratee, memo, context) {
            iteratee = optimizeCb(iteratee, context, 4);
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;
            // Determine the initial value if none is provided.
            if (arguments.length < 3) {
              memo = obj[keys ? keys[index] : index];
              index += dir;
            }
            return iterator(obj, iteratee, memo, keys, index, length);
          };
        }

        // **Reduce** builds up a single result from a list of values, aka `inject`,
        // or `foldl`.
        _.reduce = _.foldl = _.inject = createReduce(1);

        // The right-associative version of reduce, also known as `foldr`.
        _.reduceRight = _.foldr = createReduce(-1);

        // Return the first value which passes a truth test. Aliased as `detect`.
        _.find = _.detect = function (obj, predicate, context) {
          var key;
          if (isArrayLike(obj)) {
            key = _.findIndex(obj, predicate, context);
          } else {
            key = _.findKey(obj, predicate, context);
          }
          if (key !== void 0 && key !== -1) return obj[key];
        };

        // Return all the elements that pass a truth test.
        // Aliased as `select`.
        _.filter = _.select = function (obj, predicate, context) {
          var results = [];
          predicate = cb(predicate, context);
          _.each(obj, function (value, index, list) {
            if (predicate(value, index, list)) results.push(value);
          });
          return results;
        };

        // Return all the elements for which a truth test fails.
        _.reject = function (obj, predicate, context) {
          return _.filter(obj, _.negate(cb(predicate)), context);
        };

        // Determine whether all of the elements match a truth test.
        // Aliased as `all`.
        _.every = _.all = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = !isArrayLike(obj) && _.keys(obj),
              length = (keys || obj).length;
          for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
          }
          return true;
        };

        // Determine if at least one element in the object matches a truth test.
        // Aliased as `any`.
        _.some = _.any = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = !isArrayLike(obj) && _.keys(obj),
              length = (keys || obj).length;
          for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true;
          }
          return false;
        };

        // Determine if the array or object contains a given item (using `===`).
        // Aliased as `includes` and `include`.
        _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
          if (!isArrayLike(obj)) obj = _.values(obj);
          if (typeof fromIndex != 'number' || guard) fromIndex = 0;
          return _.indexOf(obj, item, fromIndex) >= 0;
        };

        // Invoke a method (with arguments) on every item in a collection.
        _.invoke = function (obj, method) {
          var args = slice.call(arguments, 2);
          var isFunc = _.isFunction(method);
          return _.map(obj, function (value) {
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value, args);
          });
        };

        // Convenience version of a common use case of `map`: fetching a property.
        _.pluck = function (obj, key) {
          return _.map(obj, _.property(key));
        };

        // Convenience version of a common use case of `filter`: selecting only objects
        // containing specific `key:value` pairs.
        _.where = function (obj, attrs) {
          return _.filter(obj, _.matcher(attrs));
        };

        // Convenience version of a common use case of `find`: getting the first object
        // containing specific `key:value` pairs.
        _.findWhere = function (obj, attrs) {
          return _.find(obj, _.matcher(attrs));
        };

        // Return the maximum element (or element-based computation).
        _.max = function (obj, iteratee, context) {
          var result = -Infinity,
              lastComputed = -Infinity,
              value,
              computed;
          if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
              value = obj[i];
              if (value > result) {
                result = value;
              }
            }
          } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index, list) {
              computed = iteratee(value, index, list);
              if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                result = value;
                lastComputed = computed;
              }
            });
          }
          return result;
        };

        // Return the minimum element (or element-based computation).
        _.min = function (obj, iteratee, context) {
          var result = Infinity,
              lastComputed = Infinity,
              value,
              computed;
          if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
              value = obj[i];
              if (value < result) {
                result = value;
              }
            }
          } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index, list) {
              computed = iteratee(value, index, list);
              if (computed < lastComputed || computed === Infinity && result === Infinity) {
                result = value;
                lastComputed = computed;
              }
            });
          }
          return result;
        };

        // Shuffle a collection, using the modern version of the
        // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
        _.shuffle = function (obj) {
          var set = isArrayLike(obj) ? obj : _.values(obj);
          var length = set.length;
          var shuffled = Array(length);
          for (var index = 0, rand; index < length; index++) {
            rand = _.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
          }
          return shuffled;
        };

        // Sample **n** random values from a collection.
        // If **n** is not specified, returns a single random element.
        // The internal `guard` argument allows it to work with `map`.
        _.sample = function (obj, n, guard) {
          if (n == null || guard) {
            if (!isArrayLike(obj)) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
          }
          return _.shuffle(obj).slice(0, Math.max(0, n));
        };

        // Sort the object's values by a criterion produced by an iteratee.
        _.sortBy = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          return _.pluck(_.map(obj, function (value, index, list) {
            return {
              value: value,
              index: index,
              criteria: iteratee(value, index, list)
            };
          }).sort(function (left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
              if (a > b || a === void 0) return 1;
              if (a < b || b === void 0) return -1;
            }
            return left.index - right.index;
          }), 'value');
        };

        // An internal function used for aggregate "group by" operations.
        var group = function group(behavior) {
          return function (obj, iteratee, context) {
            var result = {};
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index) {
              var key = iteratee(value, index, obj);
              behavior(result, value, key);
            });
            return result;
          };
        };

        // Groups the object's values by a criterion. Pass either a string attribute
        // to group by, or a function that returns the criterion.
        _.groupBy = group(function (result, value, key) {
          if (_.has(result, key)) result[key].push(value);else result[key] = [value];
        });

        // Indexes the object's values by a criterion, similar to `groupBy`, but for
        // when you know that your index values will be unique.
        _.indexBy = group(function (result, value, key) {
          result[key] = value;
        });

        // Counts instances of an object that group by a certain criterion. Pass
        // either a string attribute to count by, or a function that returns the
        // criterion.
        _.countBy = group(function (result, value, key) {
          if (_.has(result, key)) result[key]++;else result[key] = 1;
        });

        // Safely create a real, live array from anything iterable.
        _.toArray = function (obj) {
          if (!obj) return [];
          if (_.isArray(obj)) return slice.call(obj);
          if (isArrayLike(obj)) return _.map(obj, _.identity);
          return _.values(obj);
        };

        // Return the number of elements in an object.
        _.size = function (obj) {
          if (obj == null) return 0;
          return isArrayLike(obj) ? obj.length : _.keys(obj).length;
        };

        // Split a collection into two arrays: one whose elements all satisfy the given
        // predicate, and one whose elements all do not satisfy the predicate.
        _.partition = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var pass = [],
              fail = [];
          _.each(obj, function (value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
          });
          return [pass, fail];
        };

        // Array Functions
        // ---------------

        // Get the first element of an array. Passing **n** will return the first N
        // values in the array. Aliased as `head` and `take`. The **guard** check
        // allows it to work with `_.map`.
        _.first = _.head = _.take = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[0];
          return _.initial(array, array.length - n);
        };

        // Returns everything but the last entry of the array. Especially useful on
        // the arguments object. Passing **n** will return all the values in
        // the array, excluding the last N.
        _.initial = function (array, n, guard) {
          return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
        };

        // Get the last element of an array. Passing **n** will return the last N
        // values in the array.
        _.last = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[array.length - 1];
          return _.rest(array, Math.max(0, array.length - n));
        };

        // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
        // Especially useful on the arguments object. Passing an **n** will return
        // the rest N values in the array.
        _.rest = _.tail = _.drop = function (array, n, guard) {
          return slice.call(array, n == null || guard ? 1 : n);
        };

        // Trim out all falsy values from an array.
        _.compact = function (array) {
          return _.filter(array, _.identity);
        };

        // Internal implementation of a recursive `flatten` function.
        var flatten = function flatten(input, shallow, strict, startIndex) {
          var output = [],
              idx = 0;
          for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
            var value = input[i];
            if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
              //flatten current level of array or arguments object
              if (!shallow) value = flatten(value, shallow, strict);
              var j = 0,
                  len = value.length;
              output.length += len;
              while (j < len) {
                output[idx++] = value[j++];
              }
            } else if (!strict) {
              output[idx++] = value;
            }
          }
          return output;
        };

        // Flatten out an array, either recursively (by default), or just one level.
        _.flatten = function (array, shallow) {
          return flatten(array, shallow, false);
        };

        // Return a version of the array that does not contain the specified value(s).
        _.without = function (array) {
          return _.difference(array, slice.call(arguments, 1));
        };

        // Produce a duplicate-free version of the array. If the array has already
        // been sorted, you have the option of using a faster algorithm.
        // Aliased as `unique`.
        _.uniq = _.unique = function (array, isSorted, iteratee, context) {
          if (!_.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
          }
          if (iteratee != null) iteratee = cb(iteratee, context);
          var result = [];
          var seen = [];
          for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
                computed = iteratee ? iteratee(value, i, array) : value;
            if (isSorted) {
              if (!i || seen !== computed) result.push(value);
              seen = computed;
            } else if (iteratee) {
              if (!_.contains(seen, computed)) {
                seen.push(computed);
                result.push(value);
              }
            } else if (!_.contains(result, value)) {
              result.push(value);
            }
          }
          return result;
        };

        // Produce an array that contains the union: each distinct element from all of
        // the passed-in arrays.
        _.union = function () {
          return _.uniq(flatten(arguments, true, true));
        };

        // Produce an array that contains every item shared between all the
        // passed-in arrays.
        _.intersection = function (array) {
          var result = [];
          var argsLength = arguments.length;
          for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];
            if (_.contains(result, item)) continue;
            for (var j = 1; j < argsLength; j++) {
              if (!_.contains(arguments[j], item)) break;
            }
            if (j === argsLength) result.push(item);
          }
          return result;
        };

        // Take the difference between one array and a number of other arrays.
        // Only the elements present in just the first array will remain.
        _.difference = function (array) {
          var rest = flatten(arguments, true, true, 1);
          return _.filter(array, function (value) {
            return !_.contains(rest, value);
          });
        };

        // Zip together multiple lists into a single array -- elements that share
        // an index go together.
        _.zip = function () {
          return _.unzip(arguments);
        };

        // Complement of _.zip. Unzip accepts an array of arrays and groups
        // each array's elements on shared indices
        _.unzip = function (array) {
          var length = array && _.max(array, getLength).length || 0;
          var result = Array(length);

          for (var index = 0; index < length; index++) {
            result[index] = _.pluck(array, index);
          }
          return result;
        };

        // Converts lists into objects. Pass either a single array of `[key, value]`
        // pairs, or two parallel arrays of the same length -- one of keys, and one of
        // the corresponding values.
        _.object = function (list, values) {
          var result = {};
          for (var i = 0, length = getLength(list); i < length; i++) {
            if (values) {
              result[list[i]] = values[i];
            } else {
              result[list[i][0]] = list[i][1];
            }
          }
          return result;
        };

        // Generator function to create the findIndex and findLastIndex functions
        function createPredicateIndexFinder(dir) {
          return function (array, predicate, context) {
            predicate = cb(predicate, context);
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
              if (predicate(array[index], index, array)) return index;
            }
            return -1;
          };
        }

        // Returns the first index on an array-like that passes a predicate test
        _.findIndex = createPredicateIndexFinder(1);
        _.findLastIndex = createPredicateIndexFinder(-1);

        // Use a comparator function to figure out the smallest index at which
        // an object should be inserted so as to maintain order. Uses binary search.
        _.sortedIndex = function (array, obj, iteratee, context) {
          iteratee = cb(iteratee, context, 1);
          var value = iteratee(obj);
          var low = 0,
              high = getLength(array);
          while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) low = mid + 1;else high = mid;
          }
          return low;
        };

        // Generator function to create the indexOf and lastIndexOf functions
        function createIndexFinder(dir, predicateFind, sortedIndex) {
          return function (array, item, idx) {
            var i = 0,
                length = getLength(array);
            if (typeof idx == 'number') {
              if (dir > 0) {
                i = idx >= 0 ? idx : Math.max(idx + length, i);
              } else {
                length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
              }
            } else if (sortedIndex && idx && length) {
              idx = sortedIndex(array, item);
              return array[idx] === item ? idx : -1;
            }
            if (item !== item) {
              idx = predicateFind(slice.call(array, i, length), _.isNaN);
              return idx >= 0 ? idx + i : -1;
            }
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
              if (array[idx] === item) return idx;
            }
            return -1;
          };
        }

        // Return the position of the first occurrence of an item in an array,
        // or -1 if the item is not included in the array.
        // If the array is large and already in sort order, pass `true`
        // for **isSorted** to use binary search.
        _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
        _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        _.range = function (start, stop, step) {
          if (stop == null) {
            stop = start || 0;
            start = 0;
          }
          step = step || 1;

          var length = Math.max(Math.ceil((stop - start) / step), 0);
          var range = Array(length);

          for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
          }

          return range;
        };

        // Function (ahem) Functions
        // ------------------

        // Determines whether to execute a function as a constructor
        // or a normal function with the provided arguments
        var executeBound = function executeBound(sourceFunc, boundFunc, context, callingContext, args) {
          if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
          var self = baseCreate(sourceFunc.prototype);
          var result = sourceFunc.apply(self, args);
          if (_.isObject(result)) return result;
          return self;
        };

        // Create a function bound to a given object (assigning `this`, and arguments,
        // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
        // available.
        _.bind = function (func, context) {
          if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
          if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
          var args = slice.call(arguments, 2);
          var bound = function bound() {
            return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
          };
          return bound;
        };

        // Partially apply a function by creating a version that has had some of its
        // arguments pre-filled, without changing its dynamic `this` context. _ acts
        // as a placeholder, allowing any combination of arguments to be pre-filled.
        _.partial = function (func) {
          var boundArgs = slice.call(arguments, 1);
          var bound = function bound() {
            var position = 0,
                length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
              args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
            }
            while (position < arguments.length) {
              args.push(arguments[position++]);
            }return executeBound(func, bound, this, this, args);
          };
          return bound;
        };

        // Bind a number of an object's methods to that object. Remaining arguments
        // are the method names to be bound. Useful for ensuring that all callbacks
        // defined on an object belong to it.
        _.bindAll = function (obj) {
          var i,
              length = arguments.length,
              key;
          if (length <= 1) throw new Error('bindAll must be passed function names');
          for (i = 1; i < length; i++) {
            key = arguments[i];
            obj[key] = _.bind(obj[key], obj);
          }
          return obj;
        };

        // Memoize an expensive function by storing its results.
        _.memoize = function (func, hasher) {
          var memoize = function memoize(key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
          };
          memoize.cache = {};
          return memoize;
        };

        // Delays a function for the given number of milliseconds, and then calls
        // it with the arguments supplied.
        _.delay = function (func, wait) {
          var args = slice.call(arguments, 2);
          return setTimeout(function () {
            return func.apply(null, args);
          }, wait);
        };

        // Defers a function, scheduling it to run after the current call stack has
        // cleared.
        _.defer = _.partial(_.delay, _, 1);

        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time. Normally, the throttled function will run
        // as much as it can, without ever going more than once per `wait` duration;
        // but if you'd like to disable the execution on the leading edge, pass
        // `{leading: false}`. To disable execution on the trailing edge, ditto.
        _.throttle = function (func, wait, options) {
          var context, args, result;
          var timeout = null;
          var previous = 0;
          if (!options) options = {};
          var later = function later() {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          };
          return function () {
            var now = _.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
              if (timeout) {
                clearTimeout(timeout);
                timeout = null;
              }
              previous = now;
              result = func.apply(context, args);
              if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
              timeout = setTimeout(later, remaining);
            }
            return result;
          };
        };

        // Returns a function, that, as long as it continues to be invoked, will not
        // be triggered. The function will be called after it stops being called for
        // N milliseconds. If `immediate` is passed, trigger the function on the
        // leading edge, instead of the trailing.
        _.debounce = function (func, wait, immediate) {
          var timeout, args, context, timestamp, result;

          var later = function later() {
            var last = _.now() - timestamp;

            if (last < wait && last >= 0) {
              timeout = setTimeout(later, wait - last);
            } else {
              timeout = null;
              if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
              }
            }
          };

          return function () {
            context = this;
            args = arguments;
            timestamp = _.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
              result = func.apply(context, args);
              context = args = null;
            }

            return result;
          };
        };

        // Returns the first function passed as an argument to the second,
        // allowing you to adjust arguments, run code before and after, and
        // conditionally execute the original function.
        _.wrap = function (func, wrapper) {
          return _.partial(wrapper, func);
        };

        // Returns a negated version of the passed-in predicate.
        _.negate = function (predicate) {
          return function () {
            return !predicate.apply(this, arguments);
          };
        };

        // Returns a function that is the composition of a list of functions, each
        // consuming the return value of the function that follows.
        _.compose = function () {
          var args = arguments;
          var start = args.length - 1;
          return function () {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) {
              result = args[i].call(this, result);
            }return result;
          };
        };

        // Returns a function that will only be executed on and after the Nth call.
        _.after = function (times, func) {
          return function () {
            if (--times < 1) {
              return func.apply(this, arguments);
            }
          };
        };

        // Returns a function that will only be executed up to (but not including) the Nth call.
        _.before = function (times, func) {
          var memo;
          return function () {
            if (--times > 0) {
              memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
          };
        };

        // Returns a function that will be executed at most one time, no matter how
        // often you call it. Useful for lazy initialization.
        _.once = _.partial(_.before, 2);

        // Object Functions
        // ----------------

        // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
        var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
        var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

        function collectNonEnumProps(obj, keys) {
          var nonEnumIdx = nonEnumerableProps.length;
          var constructor = obj.constructor;
          var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

          // Constructor is a special case.
          var prop = 'constructor';
          if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

          while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
              keys.push(prop);
            }
          }
        }

        // Retrieve the names of an object's own properties.
        // Delegates to **ECMAScript 5**'s native `Object.keys`
        _.keys = function (obj) {
          if (!_.isObject(obj)) return [];
          if (nativeKeys) return nativeKeys(obj);
          var keys = [];
          for (var key in obj) {
            if (_.has(obj, key)) keys.push(key);
          } // Ahem, IE < 9.
          if (hasEnumBug) collectNonEnumProps(obj, keys);
          return keys;
        };

        // Retrieve all the property names of an object.
        _.allKeys = function (obj) {
          if (!_.isObject(obj)) return [];
          var keys = [];
          for (var key in obj) {
            keys.push(key);
          } // Ahem, IE < 9.
          if (hasEnumBug) collectNonEnumProps(obj, keys);
          return keys;
        };

        // Retrieve the values of an object's properties.
        _.values = function (obj) {
          var keys = _.keys(obj);
          var length = keys.length;
          var values = Array(length);
          for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
          }
          return values;
        };

        // Returns the results of applying the iteratee to each element of the object
        // In contrast to _.map it returns an object
        _.mapObject = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          var keys = _.keys(obj),
              length = keys.length,
              results = {},
              currentKey;
          for (var index = 0; index < length; index++) {
            currentKey = keys[index];
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
          }
          return results;
        };

        // Convert an object into a list of `[key, value]` pairs.
        _.pairs = function (obj) {
          var keys = _.keys(obj);
          var length = keys.length;
          var pairs = Array(length);
          for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
          }
          return pairs;
        };

        // Invert the keys and values of an object. The values must be serializable.
        _.invert = function (obj) {
          var result = {};
          var keys = _.keys(obj);
          for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
          }
          return result;
        };

        // Return a sorted list of the function names available on the object.
        // Aliased as `methods`
        _.functions = _.methods = function (obj) {
          var names = [];
          for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
          }
          return names.sort();
        };

        // Extend a given object with all the properties in passed-in object(s).
        _.extend = createAssigner(_.allKeys);

        // Assigns a given object with all the own properties in the passed-in object(s)
        // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
        _.extendOwn = _.assign = createAssigner(_.keys);

        // Returns the first key on an object that passes a predicate test
        _.findKey = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = _.keys(obj),
              key;
          for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
          }
        };

        // Return a copy of the object only containing the whitelisted properties.
        _.pick = function (object, oiteratee, context) {
          var result = {},
              obj = object,
              iteratee,
              keys;
          if (obj == null) return result;
          if (_.isFunction(oiteratee)) {
            keys = _.allKeys(obj);
            iteratee = optimizeCb(oiteratee, context);
          } else {
            keys = flatten(arguments, false, false, 1);
            iteratee = function iteratee(value, key, obj) {
              return key in obj;
            };
            obj = Object(obj);
          }
          for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) result[key] = value;
          }
          return result;
        };

        // Return a copy of the object without the blacklisted properties.
        _.omit = function (obj, iteratee, context) {
          if (_.isFunction(iteratee)) {
            iteratee = _.negate(iteratee);
          } else {
            var keys = _.map(flatten(arguments, false, false, 1), String);
            iteratee = function iteratee(value, key) {
              return !_.contains(keys, key);
            };
          }
          return _.pick(obj, iteratee, context);
        };

        // Fill in a given object with default properties.
        _.defaults = createAssigner(_.allKeys, true);

        // Creates an object that inherits from the given prototype object.
        // If additional properties are provided then they will be added to the
        // created object.
        _.create = function (prototype, props) {
          var result = baseCreate(prototype);
          if (props) _.extendOwn(result, props);
          return result;
        };

        // Create a (shallow-cloned) duplicate of an object.
        _.clone = function (obj) {
          if (!_.isObject(obj)) return obj;
          return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        };

        // Invokes interceptor with the obj, and then returns obj.
        // The primary purpose of this method is to "tap into" a method chain, in
        // order to perform operations on intermediate results within the chain.
        _.tap = function (obj, interceptor) {
          interceptor(obj);
          return obj;
        };

        // Returns whether an object has a given set of `key:value` pairs.
        _.isMatch = function (object, attrs) {
          var keys = _.keys(attrs),
              length = keys.length;
          if (object == null) return !length;
          var obj = Object(object);
          for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
          }
          return true;
        };

        // Internal recursive comparison function for `isEqual`.
        var eq = function eq(a, b, aStack, bStack) {
          // Identical objects are equal. `0 === -0`, but they aren't identical.
          // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
          if (a === b) return a !== 0 || 1 / a === 1 / b;
          // A strict comparison is necessary because `null == undefined`.
          if (a == null || b == null) return a === b;
          // Unwrap any wrapped objects.
          if (a instanceof _) a = a._wrapped;
          if (b instanceof _) b = b._wrapped;
          // Compare `[[Class]]` names.
          var className = toString.call(a);
          if (className !== toString.call(b)) return false;
          switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
              // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
              // equivalent to `new String("5")`.
              return '' + a === '' + b;
            case '[object Number]':
              // `NaN`s are equivalent, but non-reflexive.
              // Object(NaN) is equivalent to NaN
              if (+a !== +a) return +b !== +b;
              // An `egal` comparison is performed for other numeric values.
              return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
              // Coerce dates and booleans to numeric primitive values. Dates are compared by their
              // millisecond representations. Note that invalid dates with millisecond representations
              // of `NaN` are not equivalent.
              return +a === +b;
          }

          var areArrays = className === '[object Array]';
          if (!areArrays) {
            if ((typeof a === "undefined" ? "undefined" : _typeof(a)) != 'object' || (typeof b === "undefined" ? "undefined" : _typeof(b)) != 'object') return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && 'constructor' in a && 'constructor' in b) {
              return false;
            }
          }
          // Assume equality for cyclic structures. The algorithm for detecting cyclic
          // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

          // Initializing stack of traversed objects.
          // It's done here since we only need them for objects and arrays comparison.
          aStack = aStack || [];
          bStack = bStack || [];
          var length = aStack.length;
          while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
          }

          // Add the first object to the stack of traversed objects.
          aStack.push(a);
          bStack.push(b);

          // Recursively compare objects and arrays.
          if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
              if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
          } else {
            // Deep compare objects.
            var keys = _.keys(a),
                key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (_.keys(b).length !== length) return false;
            while (length--) {
              // Deep compare each member
              key = keys[length];
              if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
          }
          // Remove the first object from the stack of traversed objects.
          aStack.pop();
          bStack.pop();
          return true;
        };

        // Perform a deep comparison to check if two objects are equal.
        _.isEqual = function (a, b) {
          return eq(a, b);
        };

        // Is a given array, string, or object empty?
        // An "empty" object has no enumerable own-properties.
        _.isEmpty = function (obj) {
          if (obj == null) return true;
          if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
          return _.keys(obj).length === 0;
        };

        // Is a given value a DOM element?
        _.isElement = function (obj) {
          return !!(obj && obj.nodeType === 1);
        };

        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        _.isArray = nativeIsArray || function (obj) {
          return toString.call(obj) === '[object Array]';
        };

        // Is a given variable an object?
        _.isObject = function (obj) {
          var type = typeof obj === "undefined" ? "undefined" : _typeof(obj);
          return type === 'function' || type === 'object' && !!obj;
        };

        // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
        _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function (name) {
          _['is' + name] = function (obj) {
            return toString.call(obj) === '[object ' + name + ']';
          };
        });

        // Define a fallback version of the method in browsers (ahem, IE < 9), where
        // there isn't any inspectable "Arguments" type.
        if (!_.isArguments(arguments)) {
          _.isArguments = function (obj) {
            return _.has(obj, 'callee');
          };
        }

        // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
        // IE 11 (#1621), and in Safari 8 (#1929).
        if (typeof /./ != 'function' && (typeof Int8Array === "undefined" ? "undefined" : _typeof(Int8Array)) != 'object') {
          _.isFunction = function (obj) {
            return typeof obj == 'function' || false;
          };
        }

        // Is a given object a finite number?
        _.isFinite = function (obj) {
          return isFinite(obj) && !isNaN(parseFloat(obj));
        };

        // Is the given value `NaN`? (NaN is the only number which does not equal itself).
        _.isNaN = function (obj) {
          return _.isNumber(obj) && obj !== +obj;
        };

        // Is a given value a boolean?
        _.isBoolean = function (obj) {
          return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
        };

        // Is a given value equal to null?
        _.isNull = function (obj) {
          return obj === null;
        };

        // Is a given variable undefined?
        _.isUndefined = function (obj) {
          return obj === void 0;
        };

        // Shortcut function for checking if an object has a given property directly
        // on itself (in other words, not on a prototype).
        _.has = function (obj, key) {
          return obj != null && hasOwnProperty.call(obj, key);
        };

        // Utility Functions
        // -----------------

        // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
        // previous owner. Returns a reference to the Underscore object.
        _.noConflict = function () {
          root._ = previousUnderscore;
          return this;
        };

        // Keep the identity function around for default iteratees.
        _.identity = function (value) {
          return value;
        };

        // Predicate-generating functions. Often useful outside of Underscore.
        _.constant = function (value) {
          return function () {
            return value;
          };
        };

        _.noop = function () {};

        _.property = property;

        // Generates a function for a given object that returns a given property.
        _.propertyOf = function (obj) {
          return obj == null ? function () {} : function (key) {
            return obj[key];
          };
        };

        // Returns a predicate for checking whether an object has a given set of
        // `key:value` pairs.
        _.matcher = _.matches = function (attrs) {
          attrs = _.extendOwn({}, attrs);
          return function (obj) {
            return _.isMatch(obj, attrs);
          };
        };

        // Run a function **n** times.
        _.times = function (n, iteratee, context) {
          var accum = Array(Math.max(0, n));
          iteratee = optimizeCb(iteratee, context, 1);
          for (var i = 0; i < n; i++) {
            accum[i] = iteratee(i);
          }return accum;
        };

        // Return a random integer between min and max (inclusive).
        _.random = function (min, max) {
          if (max == null) {
            max = min;
            min = 0;
          }
          return min + Math.floor(Math.random() * (max - min + 1));
        };

        // A (possibly faster) way to get the current timestamp as an integer.
        _.now = Date.now || function () {
          return new Date().getTime();
        };

        // List of HTML entities for escaping.
        var escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '`': '&#x60;'
        };
        var unescapeMap = _.invert(escapeMap);

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        var createEscaper = function createEscaper(map) {
          var escaper = function escaper(match) {
            return map[match];
          };
          // Regexes for identifying a key that needs to be escaped
          var source = '(?:' + _.keys(map).join('|') + ')';
          var testRegexp = RegExp(source);
          var replaceRegexp = RegExp(source, 'g');
          return function (string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
          };
        };
        _.escape = createEscaper(escapeMap);
        _.unescape = createEscaper(unescapeMap);

        // If the value of the named `property` is a function then invoke it with the
        // `object` as context; otherwise, return it.
        _.result = function (object, property, fallback) {
          var value = object == null ? void 0 : object[property];
          if (value === void 0) {
            value = fallback;
          }
          return _.isFunction(value) ? value.call(object) : value;
        };

        // Generate a unique integer id (unique within the entire client session).
        // Useful for temporary DOM ids.
        var idCounter = 0;
        _.uniqueId = function (prefix) {
          var id = ++idCounter + '';
          return prefix ? prefix + id : id;
        };

        // By default, Underscore uses ERB-style template delimiters, change the
        // following template settings to use alternative delimiters.
        _.templateSettings = {
          evaluate: /<%([\s\S]+?)%>/g,
          interpolate: /<%=([\s\S]+?)%>/g,
          escape: /<%-([\s\S]+?)%>/g
        };

        // When customizing `templateSettings`, if you don't want to define an
        // interpolation, evaluation or escaping regex, we need one that is
        // guaranteed not to match.
        var noMatch = /(.)^/;

        // Certain characters need to be escaped so that they can be put into a
        // string literal.
        var escapes = {
          "'": "'",
          '\\': '\\',
          '\r': 'r',
          '\n': 'n',
          "\u2028": 'u2028',
          "\u2029": 'u2029'
        };

        var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

        var escapeChar = function escapeChar(match) {
          return '\\' + escapes[match];
        };

        // JavaScript micro-templating, similar to John Resig's implementation.
        // Underscore templating handles arbitrary delimiters, preserves whitespace,
        // and correctly escapes quotes within interpolated code.
        // NB: `oldSettings` only exists for backwards compatibility.
        _.template = function (text, settings, oldSettings) {
          if (!settings && oldSettings) settings = oldSettings;
          settings = _.defaults({}, settings, _.templateSettings);

          // Combine delimiters into one regular expression via alternation.
          var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');

          // Compile the template source, escaping string literals appropriately.
          var index = 0;
          var source = "__p+='";
          text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
              source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
              source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
              source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
          });
          source += "';\n";

          // If a variable is not specified, place data values in local scope.
          if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

          source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + 'return __p;\n';

          try {
            var render = new Function(settings.variable || 'obj', '_', source);
          } catch (e) {
            e.source = source;
            throw e;
          }

          var template = function template(data) {
            return render.call(this, data, _);
          };

          // Provide the compiled source as a convenience for precompilation.
          var argument = settings.variable || 'obj';
          template.source = 'function(' + argument + '){\n' + source + '}';

          return template;
        };

        // Add a "chain" function. Start chaining a wrapped Underscore object.
        _.chain = function (obj) {
          var instance = _(obj);
          instance._chain = true;
          return instance;
        };

        // OOP
        // ---------------
        // If Underscore is called as a function, it returns a wrapped object that
        // can be used OO-style. This wrapper holds altered versions of all the
        // underscore functions. Wrapped objects may be chained.

        // Helper function to continue chaining intermediate results.
        var result = function result(instance, obj) {
          return instance._chain ? _(obj).chain() : obj;
        };

        // Add your own custom functions to the Underscore object.
        _.mixin = function (obj) {
          _.each(_.functions(obj), function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
              var args = [this._wrapped];
              push.apply(args, arguments);
              return result(this, func.apply(_, args));
            };
          });
        };

        // Add all of the Underscore functions to the wrapper object.
        _.mixin(_);

        // Add all mutator Array functions to the wrapper.
        _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
          var method = ArrayProto[name];
          _.prototype[name] = function () {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
          };
        });

        // Add all accessor Array functions to the wrapper.
        _.each(['concat', 'join', 'slice'], function (name) {
          var method = ArrayProto[name];
          _.prototype[name] = function () {
            return result(this, method.apply(this._wrapped, arguments));
          };
        });

        // Extracts the result from a wrapped and chained object.
        _.prototype.value = function () {
          return this._wrapped;
        };

        // Provide unwrapping proxy for some methods used in engine operations
        // such as arithmetic and JSON stringification.
        _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

        _.prototype.toString = function () {
          return '' + this._wrapped;
        };

        // AMD registration happens at the end for compatibility with AMD loaders
        // that may not enforce next-turn semantics on modules. Even though general
        // practice for AMD registration is to be anonymous, underscore registers
        // as a named module because, like jQuery, it is a base library that is
        // popular enough to be bundled in a third party lib, but not be part of
        // an AMD load request. Those cases could generate an error when an
        // anonymous define() is called outside of a loader request.
        if (typeof define === 'function' && define.amd) {
          define('underscore', [], function () {
            return _;
          });
        }
      }).call(this);
    }, {}], 3: [function (require, module, exports) {
      /*
          This file is part of web3.js.
      
          web3.js is free software: you can redistribute it and/or modify
          it under the terms of the GNU Lesser General Public License as published by
          the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          web3.js is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Lesser General Public License for more details.
      
          You should have received a copy of the GNU Lesser General Public License
          along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
      */
      /**
       * @file errors.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @author Marek Kotewicz <marek@parity.io>
       * @date 2017
       */

      "use strict";

      module.exports = {
        ErrorResponse: function ErrorResponse(result) {
          var message = !!result && !!result.error && !!result.error.message ? result.error.message : JSON.stringify(result);
          return new Error('Returned error: ' + message);
        },
        InvalidNumberOfParams: function InvalidNumberOfParams(got, expected, method) {
          return new Error('Invalid number of parameters for "' + method + '". Got ' + got + ' expected ' + expected + '!');
        },
        InvalidConnection: function InvalidConnection(host) {
          return new Error('CONNECTION ERROR: Couldn\'t connect to node ' + host + '.');
        },
        InvalidProvider: function InvalidProvider() {
          return new Error('Provider not set or invalid');
        },
        InvalidResponse: function InvalidResponse(result) {
          var message = !!result && !!result.error && !!result.error.message ? result.error.message : 'Invalid JSON RPC response: ' + JSON.stringify(result);
          return new Error(message);
        },
        ConnectionTimeout: function ConnectionTimeout(ms) {
          return new Error('CONNECTION TIMEOUT: timeout of ' + ms + ' ms achived');
        }
      };
    }, {}], 4: [function (require, module, exports) {
      /*
          This file is part of web3.js.
      
          web3.js is free software: you can redistribute it and/or modify
          it under the terms of the GNU Lesser General Public License as published by
          the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          web3.js is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Lesser General Public License for more details.
      
          You should have received a copy of the GNU Lesser General Public License
          along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
      */
      /**
       * @file formatters.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @author Marek Kotewicz <marek@parity.io>
       * @date 2017
       */

      "use strict";

      var _ = require('underscore');
      var utils = require('web3-utils');
      var Iban = require('web3-vns-iban');

      /**
       * Should the format output to a big number
       *
       * @method outputBigNumberFormatter
       * @param {String|Number|BigNumber} number
       * @returns {BigNumber} object
       */
      var outputBigNumberFormatter = function outputBigNumberFormatter(number) {
        return utils.toBN(number).toString(10);
      };

      var isPredefinedBlockNumber = function isPredefinedBlockNumber(blockNumber) {
        return blockNumber === 'latest' || blockNumber === 'pending' || blockNumber === 'earliest';
      };

      var inputDefaultBlockNumberFormatter = function inputDefaultBlockNumberFormatter(blockNumber) {
        if (this && (blockNumber === undefined || blockNumber === null)) {
          return this.defaultBlock;
        }
        if (blockNumber === 'genesis' || blockNumber === 'earliest') {
          return '0x0';
        }
        return inputBlockNumberFormatter(blockNumber);
      };

      var inputBlockNumberFormatter = function inputBlockNumberFormatter(blockNumber) {
        if (blockNumber === undefined) {
          return undefined;
        } else if (isPredefinedBlockNumber(blockNumber)) {
          return blockNumber;
        }
        return utils.isHexStrict(blockNumber) ? _.isString(blockNumber) ? blockNumber.toLowerCase() : blockNumber : utils.numberToHex(blockNumber);
      };

      /**
       * Formats the input of a transaction and converts all values to HEX
       *
       * @method _txInputFormatter
       * @param {Object} transaction options
       * @returns object
       */
      var _txInputFormatter = function _txInputFormatter(options) {

        if (options.to) {
          // it might be contract creation
          options.to = inputAddressFormatter(options.to);
        }

        if (options.data && options.input) {
          throw new Error('You can\'t have "data" and "input" as properties of transactions at the same time, please use either "data" or "input" instead.');
        }

        if (!options.data && options.input) {
          options.data = options.input;
          delete options.input;
        }

        if (options.data && !utils.isHex(options.data)) {
          throw new Error('The data field must be HEX encoded data.');
        }

        // allow both
        if (options.gas || options.gasLimit) {
          options.gas = options.gas || options.gasLimit;
        }

        ['gasPrice', 'gas', 'value', 'nonce'].filter(function (key) {
          return options[key] !== undefined;
        }).forEach(function (key) {
          options[key] = utils.numberToHex(options[key]);
        });

        return options;
      };

      /**
       * Formats the input of a transaction and converts all values to HEX
       *
       * @method inputCallFormatter
       * @param {Object} transaction options
       * @returns object
      */
      var inputCallFormatter = function inputCallFormatter(options) {

        options = _txInputFormatter(options);

        var from = options.from || (this ? this.defaultAccount : null);

        if (from) {
          options.from = inputAddressFormatter(from);
        }

        return options;
      };

      /**
       * Formats the input of a transaction and converts all values to HEX
       *
       * @method inputTransactionFormatter
       * @param {Object} options
       * @returns object
      */
      var inputTransactionFormatter = function inputTransactionFormatter(options) {

        options = _txInputFormatter(options);

        // check from, only if not number, or object
        if (!_.isNumber(options.from) && !_.isObject(options.from)) {
          options.from = options.from || (this ? this.defaultAccount : null);

          if (!options.from && !_.isNumber(options.from)) {
            throw new Error('The send transactions "from" field must be defined!');
          }

          options.from = inputAddressFormatter(options.from);
        }

        return options;
      };

      /**
       * Hex encodes the data passed to eth_sign and personal_sign
       *
       * @method inputSignFormatter
       * @param {String} data
       * @returns {String}
       */
      var inputSignFormatter = function inputSignFormatter(data) {
        return utils.isHexStrict(data) ? data : utils.utf8ToHex(data);
      };

      /**
       * Formats the output of a transaction to its proper values
       *
       * @method outputTransactionFormatter
       * @param {Object} tx
       * @returns {Object}
      */
      var outputTransactionFormatter = function outputTransactionFormatter(tx) {
        if (tx.blockNumber !== null) tx.blockNumber = utils.hexToNumber(tx.blockNumber);
        if (tx.transactionIndex !== null) tx.transactionIndex = utils.hexToNumber(tx.transactionIndex);
        tx.nonce = utils.hexToNumber(tx.nonce);
        tx.gas = utils.hexToNumber(tx.gas);
        tx.gasPrice = outputBigNumberFormatter(tx.gasPrice);
        tx.value = outputBigNumberFormatter(tx.value);

        if (tx.to && utils.isAddress(tx.to)) {
          // tx.to could be `0x0` or `null` while contract creation
          tx.to = utils.toChecksumAddress(tx.to);
        } else {
          tx.to = null; // set to `null` if invalid address
        }

        if (tx.from) {
          tx.from = utils.toChecksumAddress(tx.from);
        }

        return tx;
      };

      /**
       * Formats the output of a transaction receipt to its proper values
       *
       * @method outputTransactionReceiptFormatter
       * @param {Object} receipt
       * @returns {Object}
      */
      var outputTransactionReceiptFormatter = function outputTransactionReceiptFormatter(receipt) {
        if ((typeof receipt === "undefined" ? "undefined" : _typeof(receipt)) !== 'object') {
          throw new Error('Received receipt is invalid: ' + receipt);
        }

        if (receipt.blockNumber !== null) receipt.blockNumber = utils.hexToNumber(receipt.blockNumber);
        if (receipt.transactionIndex !== null) receipt.transactionIndex = utils.hexToNumber(receipt.transactionIndex);
        receipt.cumulativeGasUsed = utils.hexToNumber(receipt.cumulativeGasUsed);
        receipt.gasUsed = utils.hexToNumber(receipt.gasUsed);

        if (_.isArray(receipt.logs)) {
          receipt.logs = receipt.logs.map(outputLogFormatter);
        }

        if (receipt.contractAddress) {
          receipt.contractAddress = utils.toChecksumAddress(receipt.contractAddress);
        }

        if (typeof receipt.status !== 'undefined') {
          receipt.status = Boolean(parseInt(receipt.status));
        }

        return receipt;
      };

      /**
       * Formats the output of a block to its proper values
       *
       * @method outputBlockFormatter
       * @param {Object} block
       * @returns {Object}
      */
      var outputBlockFormatter = function outputBlockFormatter(block) {

        // transform to number
        block.gasLimit = utils.hexToNumber(block.gasLimit);
        block.gasUsed = utils.hexToNumber(block.gasUsed);
        block.size = utils.hexToNumber(block.size);
        block.timestamp = utils.hexToNumber(block.timestamp);
        if (block.number !== null) block.number = utils.hexToNumber(block.number);

        if (block.difficulty) block.difficulty = outputBigNumberFormatter(block.difficulty);
        if (block.totalDifficulty) block.totalDifficulty = outputBigNumberFormatter(block.totalDifficulty);

        if (_.isArray(block.transactions)) {
          block.transactions.forEach(function (item) {
            if (!_.isString(item)) return outputTransactionFormatter(item);
          });
        }

        if (block.miner) block.miner = utils.toChecksumAddress(block.miner);

        return block;
      };

      /**
       * Formats the input of a log
       *
       * @method inputLogFormatter
       * @param {Object} log object
       * @returns {Object} log
      */
      var inputLogFormatter = function inputLogFormatter(options) {
        var toTopic = function toTopic(value) {

          if (value === null || typeof value === 'undefined') return null;

          value = String(value);

          if (value.indexOf('0x') === 0) return value;else return utils.fromUtf8(value);
        };

        if (options.fromBlock) options.fromBlock = inputBlockNumberFormatter(options.fromBlock);

        if (options.toBlock) options.toBlock = inputBlockNumberFormatter(options.toBlock);

        // make sure topics, get converted to hex
        options.topics = options.topics || [];
        options.topics = options.topics.map(function (topic) {
          return _.isArray(topic) ? topic.map(toTopic) : toTopic(topic);
        });

        toTopic = null;

        if (options.address) {
          options.address = _.isArray(options.address) ? options.address.map(function (addr) {
            return inputAddressFormatter(addr);
          }) : inputAddressFormatter(options.address);
        }

        return options;
      };

      /**
       * Formats the output of a log
       *
       * @method outputLogFormatter
       * @param {Object} log object
       * @returns {Object} log
      */
      var outputLogFormatter = function outputLogFormatter(log) {

        // generate a custom log id
        if (typeof log.blockHash === 'string' && typeof log.transactionHash === 'string' && typeof log.logIndex === 'string') {
          var shaId = utils.sha3(log.blockHash.replace('0x', '') + log.transactionHash.replace('0x', '') + log.logIndex.replace('0x', ''));
          log.id = 'log_' + shaId.replace('0x', '').substr(0, 8);
        } else if (!log.id) {
          log.id = null;
        }

        if (log.blockNumber !== null) log.blockNumber = utils.hexToNumber(log.blockNumber);
        if (log.transactionIndex !== null) log.transactionIndex = utils.hexToNumber(log.transactionIndex);
        if (log.logIndex !== null) log.logIndex = utils.hexToNumber(log.logIndex);

        if (log.address) {
          log.address = utils.toChecksumAddress(log.address);
        }

        return log;
      };

      /**
       * Formats the input of a whisper post and converts all values to HEX
       *
       * @method inputPostFormatter
       * @param {Object} transaction object
       * @returns {Object}
      */
      var inputPostFormatter = function inputPostFormatter(post) {

        // post.payload = utils.toHex(post.payload);

        if (post.ttl) post.ttl = utils.numberToHex(post.ttl);
        if (post.workToProve) post.workToProve = utils.numberToHex(post.workToProve);
        if (post.priority) post.priority = utils.numberToHex(post.priority);

        // fallback
        if (!_.isArray(post.topics)) {
          post.topics = post.topics ? [post.topics] : [];
        }

        // format the following options
        post.topics = post.topics.map(function (topic) {
          // convert only if not hex
          return topic.indexOf('0x') === 0 ? topic : utils.fromUtf8(topic);
        });

        return post;
      };

      /**
       * Formats the output of a received post message
       *
       * @method outputPostFormatter
       * @param {Object}
       * @returns {Object}
       */
      var outputPostFormatter = function outputPostFormatter(post) {

        post.expiry = utils.hexToNumber(post.expiry);
        post.sent = utils.hexToNumber(post.sent);
        post.ttl = utils.hexToNumber(post.ttl);
        post.workProved = utils.hexToNumber(post.workProved);
        // post.payloadRaw = post.payload;
        // post.payload = utils.hexToAscii(post.payload);

        // if (utils.isJson(post.payload)) {
        //     post.payload = JSON.parse(post.payload);
        // }

        // format the following options
        if (!post.topics) {
          post.topics = [];
        }
        post.topics = post.topics.map(function (topic) {
          return utils.toUtf8(topic);
        });

        return post;
      };

      var inputAddressFormatter = function inputAddressFormatter(address) {
        var iban = new Iban(address);
        if (iban.isValid() && iban.isDirect()) {
          return iban.toAddress().toLowerCase();
        } else if (utils.isAddress(address)) {
          return '0x' + address.toLowerCase().replace('0x', '');
        }
        throw new Error('Provided address "' + address + '" is invalid, the capitalization checksum test failed, or its an indrect IBAN address which can\'t be converted.');
      };

      var outputSyncingFormatter = function outputSyncingFormatter(result) {

        result.startingBlock = utils.hexToNumber(result.startingBlock);
        result.currentBlock = utils.hexToNumber(result.currentBlock);
        result.highestBlock = utils.hexToNumber(result.highestBlock);
        if (result.knownStates) {
          result.knownStates = utils.hexToNumber(result.knownStates);
          result.pulledStates = utils.hexToNumber(result.pulledStates);
        }

        return result;
      };

      module.exports = {
        inputDefaultBlockNumberFormatter: inputDefaultBlockNumberFormatter,
        inputBlockNumberFormatter: inputBlockNumberFormatter,
        inputCallFormatter: inputCallFormatter,
        inputTransactionFormatter: inputTransactionFormatter,
        inputAddressFormatter: inputAddressFormatter,
        inputPostFormatter: inputPostFormatter,
        inputLogFormatter: inputLogFormatter,
        inputSignFormatter: inputSignFormatter,
        outputBigNumberFormatter: outputBigNumberFormatter,
        outputTransactionFormatter: outputTransactionFormatter,
        outputTransactionReceiptFormatter: outputTransactionReceiptFormatter,
        outputBlockFormatter: outputBlockFormatter,
        outputLogFormatter: outputLogFormatter,
        outputPostFormatter: outputPostFormatter,
        outputSyncingFormatter: outputSyncingFormatter
      };
    }, { "underscore": 2, "web3-utils": 20, "web3-vns-iban": 24 }], 5: [function (require, module, exports) {
      /*
          This file is part of web3.js.
      
          web3.js is free software: you can redistribute it and/or modify
          it under the terms of the GNU Lesser General Public License as published by
          the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          web3.js is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Lesser General Public License for more details.
      
          You should have received a copy of the GNU Lesser General Public License
          along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
      */
      /**
       * @file index.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @date 2017
       */

      "use strict";

      var errors = require('./errors');
      var formatters = require('./formatters');

      module.exports = {
        errors: errors,
        formatters: formatters
      };
    }, { "./errors": 3, "./formatters": 4 }], 6: [function (require, module, exports) {
      'use strict';

      //
      // We store our EE objects in a plain object whose properties are event names.
      // If `Object.create(null)` is not supported we prefix the event names with a
      // `~` to make sure that the built-in object properties are not overridden or
      // used as an attack vector.
      // We also assume that `Object.create(null)` is available when the event name
      // is an ES6 Symbol.
      //

      var prefix = typeof Object.create !== 'function' ? '~' : false;

      /**
       * Representation of a single EventEmitter function.
       *
       * @param {Function} fn Event handler to be called.
       * @param {Mixed} context Context for function execution.
       * @param {Boolean} once Only emit once
       * @api private
       */
      function EE(fn, context, once) {
        this.fn = fn;
        this.context = context;
        this.once = once || false;
      }

      /**
       * Minimal EventEmitter interface that is molded against the Node.js
       * EventEmitter interface.
       *
       * @constructor
       * @api public
       */
      function EventEmitter() {} /* Nothing to set */

      /**
       * Holds the assigned EventEmitters by name.
       *
       * @type {Object}
       * @private
       */
      EventEmitter.prototype._events = undefined;

      /**
       * Return a list of assigned event listeners.
       *
       * @param {String} event The events that should be listed.
       * @param {Boolean} exists We only need to know if there are listeners.
       * @returns {Array|Boolean}
       * @api public
       */
      EventEmitter.prototype.listeners = function listeners(event, exists) {
        var evt = prefix ? prefix + event : event,
            available = this._events && this._events[evt];

        if (exists) return !!available;
        if (!available) return [];
        if (available.fn) return [available.fn];

        for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
          ee[i] = available[i].fn;
        }

        return ee;
      };

      /**
       * Emit an event to all registered event listeners.
       *
       * @param {String} event The name of the event.
       * @returns {Boolean} Indication if we've emitted an event.
       * @api public
       */
      EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;

        if (!this._events || !this._events[evt]) return false;

        var listeners = this._events[evt],
            len = arguments.length,
            args,
            i;

        if ('function' === typeof listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }

          for (i = 1, args = new Array(len - 1); i < len; i++) {
            args[i - 1] = arguments[i];
          }

          listeners.fn.apply(listeners.context, args);
        } else {
          var length = listeners.length,
              j;

          for (i = 0; i < length; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

            switch (len) {
              case 1:
                listeners[i].fn.call(listeners[i].context);break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);break;
              default:
                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }

                listeners[i].fn.apply(listeners[i].context, args);
            }
          }
        }

        return true;
      };

      /**
       * Register a new EventListener for the given event.
       *
       * @param {String} event Name of the event.
       * @param {Functon} fn Callback function.
       * @param {Mixed} context The context of the function.
       * @api public
       */
      EventEmitter.prototype.on = function on(event, fn, context) {
        var listener = new EE(fn, context || this),
            evt = prefix ? prefix + event : event;

        if (!this._events) this._events = prefix ? {} : Object.create(null);
        if (!this._events[evt]) this._events[evt] = listener;else {
          if (!this._events[evt].fn) this._events[evt].push(listener);else this._events[evt] = [this._events[evt], listener];
        }

        return this;
      };

      /**
       * Add an EventListener that's only called once.
       *
       * @param {String} event Name of the event.
       * @param {Function} fn Callback function.
       * @param {Mixed} context The context of the function.
       * @api public
       */
      EventEmitter.prototype.once = function once(event, fn, context) {
        var listener = new EE(fn, context || this, true),
            evt = prefix ? prefix + event : event;

        if (!this._events) this._events = prefix ? {} : Object.create(null);
        if (!this._events[evt]) this._events[evt] = listener;else {
          if (!this._events[evt].fn) this._events[evt].push(listener);else this._events[evt] = [this._events[evt], listener];
        }

        return this;
      };

      /**
       * Remove event listeners.
       *
       * @param {String} event The event we want to remove.
       * @param {Function} fn The listener that we need to find.
       * @param {Mixed} context Only remove listeners matching this context.
       * @param {Boolean} once Only remove once listeners.
       * @api public
       */
      EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;

        if (!this._events || !this._events[evt]) return this;

        var listeners = this._events[evt],
            events = [];

        if (fn) {
          if (listeners.fn) {
            if (listeners.fn !== fn || once && !listeners.once || context && listeners.context !== context) {
              events.push(listeners);
            }
          } else {
            for (var i = 0, length = listeners.length; i < length; i++) {
              if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
                events.push(listeners[i]);
              }
            }
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) {
          this._events[evt] = events.length === 1 ? events[0] : events;
        } else {
          delete this._events[evt];
        }

        return this;
      };

      /**
       * Remove all listeners or only the listeners for the specified event.
       *
       * @param {String} event The event want to remove all listeners for.
       * @api public
       */
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
        if (!this._events) return this;

        if (event) delete this._events[prefix ? prefix + event : event];else this._events = prefix ? {} : Object.create(null);

        return this;
      };

      //
      // Alias methods names because people roll like that.
      //
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.addListener = EventEmitter.prototype.on;

      //
      // This function doesn't apply anymore.
      //
      EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
        return this;
      };

      //
      // Expose the prefix.
      //
      EventEmitter.prefixed = prefix;

      //
      // Expose the module.
      //
      if ('undefined' !== typeof module) {
        module.exports = EventEmitter;
      }
    }, {}], 7: [function (require, module, exports) {
      arguments[4][2][0].apply(exports, arguments);
    }, { "dup": 2 }], 8: [function (require, module, exports) {
      /*
          This file is part of web3.js.
      
          web3.js is free software: you can redistribute it and/or modify
          it under the terms of the GNU Lesser General Public License as published by
          the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          web3.js is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Lesser General Public License for more details.
      
          You should have received a copy of the GNU Lesser General Public License
          along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
      */
      /**
       * @file subscription.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @date 2017
       */

      "use strict";

      var _ = require('underscore');
      var errors = require('web3-core-helpers').errors;
      var EventEmitter = require('eventemitter3');

      function Subscription(options) {
        EventEmitter.call(this);

        this.id = null;
        this.callback = _.identity;
        this.arguments = null;
        this._reconnectIntervalId = null;

        this.options = {
          subscription: options.subscription,
          type: options.type,
          requestManager: options.requestManager
        };
      }

      // INHERIT
      Subscription.prototype = Object.create(EventEmitter.prototype);
      Subscription.prototype.constructor = Subscription;

      /**
       * Should be used to extract callback from array of arguments. Modifies input param
       *
       * @method extractCallback
       * @param {Array} arguments
       * @return {Function|Null} callback, if exists
       */

      Subscription.prototype._extractCallback = function (args) {
        if (_.isFunction(args[args.length - 1])) {
          return args.pop(); // modify the args array!
        }
      };

      /**
       * Should be called to check if the number of arguments is correct
       *
       * @method validateArgs
       * @param {Array} arguments
       * @throws {Error} if it is not
       */

      Subscription.prototype._validateArgs = function (args) {
        var subscription = this.options.subscription;

        if (!subscription) subscription = {};

        if (!subscription.params) subscription.params = 0;

        if (args.length !== subscription.params) {
          throw errors.InvalidNumberOfParams(args.length, subscription.params + 1, args[0]);
        }
      };

      /**
       * Should be called to format input args of method
       *
       * @method formatInput
       * @param {Array}
       * @return {Array}
       */

      Subscription.prototype._formatInput = function (args) {
        var subscription = this.options.subscription;

        if (!subscription) {
          return args;
        }

        if (!subscription.inputFormatter) {
          return args;
        }

        var formattedArgs = subscription.inputFormatter.map(function (formatter, index) {
          return formatter ? formatter(args[index]) : args[index];
        });

        return formattedArgs;
      };

      /**
       * Should be called to format output(result) of method
       *
       * @method formatOutput
       * @param {Object}
       * @return {Object}
       */

      Subscription.prototype._formatOutput = function (result) {
        var subscription = this.options.subscription;

        return subscription && subscription.outputFormatter && result ? subscription.outputFormatter(result) : result;
      };

      /**
       * Should create payload from given input args
       *
       * @method toPayload
       * @param {Array} args
       * @return {Object}
       */
      Subscription.prototype._toPayload = function (args) {
        var params = [];
        this.callback = this._extractCallback(args) || _.identity;

        if (!this.subscriptionMethod) {
          this.subscriptionMethod = args.shift();

          // replace subscription with given name
          if (this.options.subscription.subscriptionName) {
            this.subscriptionMethod = this.options.subscription.subscriptionName;
          }
        }

        if (!this.arguments) {
          this.arguments = this._formatInput(args);
          this._validateArgs(this.arguments);
          args = []; // make empty after validation
        }

        // re-add subscriptionName
        params.push(this.subscriptionMethod);
        params = params.concat(this.arguments);

        if (args.length) {
          throw new Error('Only a callback is allowed as parameter on an already instantiated subscription.');
        }

        return {
          method: this.options.type + '_subscribe',
          params: params
        };
      };

      /**
       * Unsubscribes and clears callbacks
       *
       * @method unsubscribe
       * @return {Object}
       */
      Subscription.prototype.unsubscribe = function (callback) {
        this.options.requestManager.removeSubscription(this.id, callback);
        this.id = null;
        this.removeAllListeners();
        clearInterval(this._reconnectIntervalId);
      };

      /**
       * Subscribes and watches for changes
       *
       * @method subscribe
       * @param {String} subscription the subscription
       * @param {Object} options the options object with address topics and fromBlock
       * @return {Object}
       */
      Subscription.prototype.subscribe = function () {
        var _this = this;
        var args = Array.prototype.slice.call(arguments);
        var payload = this._toPayload(args);

        if (!payload) {
          return this;
        }

        if (!this.options.requestManager.provider) {
          var err1 = new Error('No provider set.');
          this.callback(err1, null, this);
          this.emit('error', err1);
          return this;
        }

        // throw error, if provider doesnt support subscriptions
        if (!this.options.requestManager.provider.on) {
          var err2 = new Error('The current provider doesn\'t support subscriptions: ' + this.options.requestManager.provider.constructor.name);
          this.callback(err2, null, this);
          this.emit('error', err2);
          return this;
        }

        // if id is there unsubscribe first
        if (this.id) {
          this.unsubscribe();
        }

        // store the params in the options object
        this.options.params = payload.params[1];

        // get past logs, if fromBlock is available
        if (payload.params[0] === 'logs' && _.isObject(payload.params[1]) && payload.params[1].hasOwnProperty('fromBlock') && isFinite(payload.params[1].fromBlock)) {
          // send the subscription request
          this.options.requestManager.send({
            method: 'vns_getLogs',
            params: [payload.params[1]]
          }, function (err, logs) {
            if (!err) {
              logs.forEach(function (log) {
                var output = _this._formatOutput(log);
                _this.callback(null, output, _this);
                _this.emit('data', output);
              });

              // TODO subscribe here? after the past logs?
            } else {
              _this.callback(err, null, _this);
              _this.emit('error', err);
            }
          });
        }

        // create subscription
        // TODO move to separate function? so that past logs can go first?

        if (_typeof(payload.params[1]) === 'object') delete payload.params[1].fromBlock;

        this.options.requestManager.send(payload, function (err, result) {
          if (!err && result) {
            _this.id = result;

            // call callback on notifications
            _this.options.requestManager.addSubscription(_this.id, payload.params[0], _this.options.type, function (err, result) {

              if (!err) {
                if (!_.isArray(result)) {
                  result = [result];
                }

                result.forEach(function (resultItem) {
                  var output = _this._formatOutput(resultItem);

                  if (_.isFunction(_this.options.subscription.subscriptionHandler)) {
                    return _this.options.subscription.subscriptionHandler.call(_this, output);
                  } else {
                    _this.emit('data', output);
                  }

                  // call the callback, last so that unsubscribe there won't affect the emit above
                  _this.callback(null, output, _this);
                });
              } else {
                // unsubscribe, but keep listeners
                _this.options.requestManager.removeSubscription(_this.id);

                // re-subscribe, if connection fails
                if (_this.options.requestManager.provider.once) {
                  _this._reconnectIntervalId = setInterval(function () {
                    // TODO check if that makes sense!
                    if (_this.options.requestManager.provider.reconnect) {
                      _this.options.requestManager.provider.reconnect();
                    }
                  }, 500);

                  _this.options.requestManager.provider.once('connect', function () {
                    clearInterval(_this._reconnectIntervalId);
                    _this.subscribe(_this.callback);
                  });
                }
                _this.emit('error', err);

                // call the callback, last so that unsubscribe there won't affect the emit above
                _this.callback(err, null, _this);
              }
            });
          } else {
            _this.callback(err, null, _this);
            _this.emit('error', err);
          }
        });

        // return an object to cancel the subscription
        return this;
      };

      module.exports = Subscription;
    }, { "eventemitter3": 6, "underscore": 7, "web3-core-helpers": 5 }], 9: [function (require, module, exports) {
      (function (module, exports) {
        'use strict';

        // Utils

        function assert(val, msg) {
          if (!val) throw new Error(msg || 'Assertion failed');
        }

        // Could use `inherits` module, but don't want to move from single file
        // architecture yet.
        function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function TempCtor() {};
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }

        // BN

        function BN(number, base, endian) {
          if (BN.isBN(number)) {
            return number;
          }

          this.negative = 0;
          this.words = null;
          this.length = 0;

          // Reduction context
          this.red = null;

          if (number !== null) {
            if (base === 'le' || base === 'be') {
              endian = base;
              base = 10;
            }

            this._init(number || 0, base || 10, endian || 'be');
          }
        }
        if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object') {
          module.exports = BN;
        } else {
          exports.BN = BN;
        }

        BN.BN = BN;
        BN.wordSize = 26;

        var Buffer;
        try {
          Buffer = require('buf' + 'fer').Buffer;
        } catch (e) {}

        BN.isBN = function isBN(num) {
          if (num instanceof BN) {
            return true;
          }

          return num !== null && (typeof num === "undefined" ? "undefined" : _typeof(num)) === 'object' && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
        };

        BN.max = function max(left, right) {
          if (left.cmp(right) > 0) return left;
          return right;
        };

        BN.min = function min(left, right) {
          if (left.cmp(right) < 0) return left;
          return right;
        };

        BN.prototype._init = function init(number, base, endian) {
          if (typeof number === 'number') {
            return this._initNumber(number, base, endian);
          }

          if ((typeof number === "undefined" ? "undefined" : _typeof(number)) === 'object') {
            return this._initArray(number, base, endian);
          }

          if (base === 'hex') {
            base = 16;
          }
          assert(base === (base | 0) && base >= 2 && base <= 36);

          number = number.toString().replace(/\s+/g, '');
          var start = 0;
          if (number[0] === '-') {
            start++;
          }

          if (base === 16) {
            this._parseHex(number, start);
          } else {
            this._parseBase(number, base, start);
          }

          if (number[0] === '-') {
            this.negative = 1;
          }

          this.strip();

          if (endian !== 'le') return;

          this._initArray(this.toArray(), base, endian);
        };

        BN.prototype._initNumber = function _initNumber(number, base, endian) {
          if (number < 0) {
            this.negative = 1;
            number = -number;
          }
          if (number < 0x4000000) {
            this.words = [number & 0x3ffffff];
            this.length = 1;
          } else if (number < 0x10000000000000) {
            this.words = [number & 0x3ffffff, number / 0x4000000 & 0x3ffffff];
            this.length = 2;
          } else {
            assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
            this.words = [number & 0x3ffffff, number / 0x4000000 & 0x3ffffff, 1];
            this.length = 3;
          }

          if (endian !== 'le') return;

          // Reverse the bytes
          this._initArray(this.toArray(), base, endian);
        };

        BN.prototype._initArray = function _initArray(number, base, endian) {
          // Perhaps a Uint8Array
          assert(typeof number.length === 'number');
          if (number.length <= 0) {
            this.words = [0];
            this.length = 1;
            return this;
          }

          this.length = Math.ceil(number.length / 3);
          this.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            this.words[i] = 0;
          }

          var j, w;
          var off = 0;
          if (endian === 'be') {
            for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
              w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
              this.words[j] |= w << off & 0x3ffffff;
              this.words[j + 1] = w >>> 26 - off & 0x3ffffff;
              off += 24;
              if (off >= 26) {
                off -= 26;
                j++;
              }
            }
          } else if (endian === 'le') {
            for (i = 0, j = 0; i < number.length; i += 3) {
              w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
              this.words[j] |= w << off & 0x3ffffff;
              this.words[j + 1] = w >>> 26 - off & 0x3ffffff;
              off += 24;
              if (off >= 26) {
                off -= 26;
                j++;
              }
            }
          }
          return this.strip();
        };

        function parseHex(str, start, end) {
          var r = 0;
          var len = Math.min(str.length, end);
          for (var i = start; i < len; i++) {
            var c = str.charCodeAt(i) - 48;

            r <<= 4;

            // 'a' - 'f'
            if (c >= 49 && c <= 54) {
              r |= c - 49 + 0xa;

              // 'A' - 'F'
            } else if (c >= 17 && c <= 22) {
              r |= c - 17 + 0xa;

              // '0' - '9'
            } else {
              r |= c & 0xf;
            }
          }
          return r;
        }

        BN.prototype._parseHex = function _parseHex(number, start) {
          // Create possibly bigger array to ensure that it fits the number
          this.length = Math.ceil((number.length - start) / 6);
          this.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            this.words[i] = 0;
          }

          var j, w;
          // Scan 24-bit chunks and add them to the number
          var off = 0;
          for (i = number.length - 6, j = 0; i >= start; i -= 6) {
            w = parseHex(number, i, i + 6);
            this.words[j] |= w << off & 0x3ffffff;
            // NOTE: `0x3fffff` is intentional here, 26bits max shift + 24bit hex limb
            this.words[j + 1] |= w >>> 26 - off & 0x3fffff;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
          if (i + 6 !== start) {
            w = parseHex(number, start, i + 6);
            this.words[j] |= w << off & 0x3ffffff;
            this.words[j + 1] |= w >>> 26 - off & 0x3fffff;
          }
          this.strip();
        };

        function parseBase(str, start, end, mul) {
          var r = 0;
          var len = Math.min(str.length, end);
          for (var i = start; i < len; i++) {
            var c = str.charCodeAt(i) - 48;

            r *= mul;

            // 'a'
            if (c >= 49) {
              r += c - 49 + 0xa;

              // 'A'
            } else if (c >= 17) {
              r += c - 17 + 0xa;

              // '0' - '9'
            } else {
              r += c;
            }
          }
          return r;
        }

        BN.prototype._parseBase = function _parseBase(number, base, start) {
          // Initialize as zero
          this.words = [0];
          this.length = 1;

          // Find length of limb in base
          for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
            limbLen++;
          }
          limbLen--;
          limbPow = limbPow / base | 0;

          var total = number.length - start;
          var mod = total % limbLen;
          var end = Math.min(total, total - mod) + start;

          var word = 0;
          for (var i = start; i < end; i += limbLen) {
            word = parseBase(number, i, i + limbLen, base);

            this.imuln(limbPow);
            if (this.words[0] + word < 0x4000000) {
              this.words[0] += word;
            } else {
              this._iaddn(word);
            }
          }

          if (mod !== 0) {
            var pow = 1;
            word = parseBase(number, i, number.length, base);

            for (i = 0; i < mod; i++) {
              pow *= base;
            }

            this.imuln(pow);
            if (this.words[0] + word < 0x4000000) {
              this.words[0] += word;
            } else {
              this._iaddn(word);
            }
          }
        };

        BN.prototype.copy = function copy(dest) {
          dest.words = new Array(this.length);
          for (var i = 0; i < this.length; i++) {
            dest.words[i] = this.words[i];
          }
          dest.length = this.length;
          dest.negative = this.negative;
          dest.red = this.red;
        };

        BN.prototype.clone = function clone() {
          var r = new BN(null);
          this.copy(r);
          return r;
        };

        BN.prototype._expand = function _expand(size) {
          while (this.length < size) {
            this.words[this.length++] = 0;
          }
          return this;
        };

        // Remove leading `0` from `this`
        BN.prototype.strip = function strip() {
          while (this.length > 1 && this.words[this.length - 1] === 0) {
            this.length--;
          }
          return this._normSign();
        };

        BN.prototype._normSign = function _normSign() {
          // -0 = 0
          if (this.length === 1 && this.words[0] === 0) {
            this.negative = 0;
          }
          return this;
        };

        BN.prototype.inspect = function inspect() {
          return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
        };

        /*
         var zeros = [];
        var groupSizes = [];
        var groupBases = [];
         var s = '';
        var i = -1;
        while (++i < BN.wordSize) {
          zeros[i] = s;
          s += '0';
        }
        groupSizes[0] = 0;
        groupSizes[1] = 0;
        groupBases[0] = 0;
        groupBases[1] = 0;
        var base = 2 - 1;
        while (++base < 36 + 1) {
          var groupSize = 0;
          var groupBase = 1;
          while (groupBase < (1 << BN.wordSize) / base) {
            groupBase *= base;
            groupSize += 1;
          }
          groupSizes[base] = groupSize;
          groupBases[base] = groupBase;
        }
         */

        var zeros = ['', '0', '00', '000', '0000', '00000', '000000', '0000000', '00000000', '000000000', '0000000000', '00000000000', '000000000000', '0000000000000', '00000000000000', '000000000000000', '0000000000000000', '00000000000000000', '000000000000000000', '0000000000000000000', '00000000000000000000', '000000000000000000000', '0000000000000000000000', '00000000000000000000000', '000000000000000000000000', '0000000000000000000000000'];

        var groupSizes = [0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

        var groupBases = [0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176];

        BN.prototype.toString = function toString(base, padding) {
          base = base || 10;
          padding = padding | 0 || 1;

          var out;
          if (base === 16 || base === 'hex') {
            out = '';
            var off = 0;
            var carry = 0;
            for (var i = 0; i < this.length; i++) {
              var w = this.words[i];
              var word = ((w << off | carry) & 0xffffff).toString(16);
              carry = w >>> 24 - off & 0xffffff;
              if (carry !== 0 || i !== this.length - 1) {
                out = zeros[6 - word.length] + word + out;
              } else {
                out = word + out;
              }
              off += 2;
              if (off >= 26) {
                off -= 26;
                i--;
              }
            }
            if (carry !== 0) {
              out = carry.toString(16) + out;
            }
            while (out.length % padding !== 0) {
              out = '0' + out;
            }
            if (this.negative !== 0) {
              out = '-' + out;
            }
            return out;
          }

          if (base === (base | 0) && base >= 2 && base <= 36) {
            // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
            var groupSize = groupSizes[base];
            // var groupBase = Math.pow(base, groupSize);
            var groupBase = groupBases[base];
            out = '';
            var c = this.clone();
            c.negative = 0;
            while (!c.isZero()) {
              var r = c.modn(groupBase).toString(base);
              c = c.idivn(groupBase);

              if (!c.isZero()) {
                out = zeros[groupSize - r.length] + r + out;
              } else {
                out = r + out;
              }
            }
            if (this.isZero()) {
              out = '0' + out;
            }
            while (out.length % padding !== 0) {
              out = '0' + out;
            }
            if (this.negative !== 0) {
              out = '-' + out;
            }
            return out;
          }

          assert(false, 'Base should be between 2 and 36');
        };

        BN.prototype.toNumber = function toNumber() {
          var ret = this.words[0];
          if (this.length === 2) {
            ret += this.words[1] * 0x4000000;
          } else if (this.length === 3 && this.words[2] === 0x01) {
            // NOTE: at this stage it is known that the top bit is set
            ret += 0x10000000000000 + this.words[1] * 0x4000000;
          } else if (this.length > 2) {
            assert(false, 'Number can only safely store up to 53 bits');
          }
          return this.negative !== 0 ? -ret : ret;
        };

        BN.prototype.toJSON = function toJSON() {
          return this.toString(16);
        };

        BN.prototype.toBuffer = function toBuffer(endian, length) {
          assert(typeof Buffer !== 'undefined');
          return this.toArrayLike(Buffer, endian, length);
        };

        BN.prototype.toArray = function toArray(endian, length) {
          return this.toArrayLike(Array, endian, length);
        };

        BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
          var byteLength = this.byteLength();
          var reqLength = length || Math.max(1, byteLength);
          assert(byteLength <= reqLength, 'byte array longer than desired length');
          assert(reqLength > 0, 'Requested array length <= 0');

          this.strip();
          var littleEndian = endian === 'le';
          var res = new ArrayType(reqLength);

          var b, i;
          var q = this.clone();
          if (!littleEndian) {
            // Assume big-endian
            for (i = 0; i < reqLength - byteLength; i++) {
              res[i] = 0;
            }

            for (i = 0; !q.isZero(); i++) {
              b = q.andln(0xff);
              q.iushrn(8);

              res[reqLength - i - 1] = b;
            }
          } else {
            for (i = 0; !q.isZero(); i++) {
              b = q.andln(0xff);
              q.iushrn(8);

              res[i] = b;
            }

            for (; i < reqLength; i++) {
              res[i] = 0;
            }
          }

          return res;
        };

        if (Math.clz32) {
          BN.prototype._countBits = function _countBits(w) {
            return 32 - Math.clz32(w);
          };
        } else {
          BN.prototype._countBits = function _countBits(w) {
            var t = w;
            var r = 0;
            if (t >= 0x1000) {
              r += 13;
              t >>>= 13;
            }
            if (t >= 0x40) {
              r += 7;
              t >>>= 7;
            }
            if (t >= 0x8) {
              r += 4;
              t >>>= 4;
            }
            if (t >= 0x02) {
              r += 2;
              t >>>= 2;
            }
            return r + t;
          };
        }

        BN.prototype._zeroBits = function _zeroBits(w) {
          // Short-cut
          if (w === 0) return 26;

          var t = w;
          var r = 0;
          if ((t & 0x1fff) === 0) {
            r += 13;
            t >>>= 13;
          }
          if ((t & 0x7f) === 0) {
            r += 7;
            t >>>= 7;
          }
          if ((t & 0xf) === 0) {
            r += 4;
            t >>>= 4;
          }
          if ((t & 0x3) === 0) {
            r += 2;
            t >>>= 2;
          }
          if ((t & 0x1) === 0) {
            r++;
          }
          return r;
        };

        // Return number of used bits in a BN
        BN.prototype.bitLength = function bitLength() {
          var w = this.words[this.length - 1];
          var hi = this._countBits(w);
          return (this.length - 1) * 26 + hi;
        };

        function toBitArray(num) {
          var w = new Array(num.bitLength());

          for (var bit = 0; bit < w.length; bit++) {
            var off = bit / 26 | 0;
            var wbit = bit % 26;

            w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
          }

          return w;
        }

        // Number of trailing zero bits
        BN.prototype.zeroBits = function zeroBits() {
          if (this.isZero()) return 0;

          var r = 0;
          for (var i = 0; i < this.length; i++) {
            var b = this._zeroBits(this.words[i]);
            r += b;
            if (b !== 26) break;
          }
          return r;
        };

        BN.prototype.byteLength = function byteLength() {
          return Math.ceil(this.bitLength() / 8);
        };

        BN.prototype.toTwos = function toTwos(width) {
          if (this.negative !== 0) {
            return this.abs().inotn(width).iaddn(1);
          }
          return this.clone();
        };

        BN.prototype.fromTwos = function fromTwos(width) {
          if (this.testn(width - 1)) {
            return this.notn(width).iaddn(1).ineg();
          }
          return this.clone();
        };

        BN.prototype.isNeg = function isNeg() {
          return this.negative !== 0;
        };

        // Return negative clone of `this`
        BN.prototype.neg = function neg() {
          return this.clone().ineg();
        };

        BN.prototype.ineg = function ineg() {
          if (!this.isZero()) {
            this.negative ^= 1;
          }

          return this;
        };

        // Or `num` with `this` in-place
        BN.prototype.iuor = function iuor(num) {
          while (this.length < num.length) {
            this.words[this.length++] = 0;
          }

          for (var i = 0; i < num.length; i++) {
            this.words[i] = this.words[i] | num.words[i];
          }

          return this.strip();
        };

        BN.prototype.ior = function ior(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuor(num);
        };

        // Or `num` with `this`
        BN.prototype.or = function or(num) {
          if (this.length > num.length) return this.clone().ior(num);
          return num.clone().ior(this);
        };

        BN.prototype.uor = function uor(num) {
          if (this.length > num.length) return this.clone().iuor(num);
          return num.clone().iuor(this);
        };

        // And `num` with `this` in-place
        BN.prototype.iuand = function iuand(num) {
          // b = min-length(num, this)
          var b;
          if (this.length > num.length) {
            b = num;
          } else {
            b = this;
          }

          for (var i = 0; i < b.length; i++) {
            this.words[i] = this.words[i] & num.words[i];
          }

          this.length = b.length;

          return this.strip();
        };

        BN.prototype.iand = function iand(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuand(num);
        };

        // And `num` with `this`
        BN.prototype.and = function and(num) {
          if (this.length > num.length) return this.clone().iand(num);
          return num.clone().iand(this);
        };

        BN.prototype.uand = function uand(num) {
          if (this.length > num.length) return this.clone().iuand(num);
          return num.clone().iuand(this);
        };

        // Xor `num` with `this` in-place
        BN.prototype.iuxor = function iuxor(num) {
          // a.length > b.length
          var a;
          var b;
          if (this.length > num.length) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }

          for (var i = 0; i < b.length; i++) {
            this.words[i] = a.words[i] ^ b.words[i];
          }

          if (this !== a) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }

          this.length = a.length;

          return this.strip();
        };

        BN.prototype.ixor = function ixor(num) {
          assert((this.negative | num.negative) === 0);
          return this.iuxor(num);
        };

        // Xor `num` with `this`
        BN.prototype.xor = function xor(num) {
          if (this.length > num.length) return this.clone().ixor(num);
          return num.clone().ixor(this);
        };

        BN.prototype.uxor = function uxor(num) {
          if (this.length > num.length) return this.clone().iuxor(num);
          return num.clone().iuxor(this);
        };

        // Not ``this`` with ``width`` bitwidth
        BN.prototype.inotn = function inotn(width) {
          assert(typeof width === 'number' && width >= 0);

          var bytesNeeded = Math.ceil(width / 26) | 0;
          var bitsLeft = width % 26;

          // Extend the buffer with leading zeroes
          this._expand(bytesNeeded);

          if (bitsLeft > 0) {
            bytesNeeded--;
          }

          // Handle complete words
          for (var i = 0; i < bytesNeeded; i++) {
            this.words[i] = ~this.words[i] & 0x3ffffff;
          }

          // Handle the residue
          if (bitsLeft > 0) {
            this.words[i] = ~this.words[i] & 0x3ffffff >> 26 - bitsLeft;
          }

          // And remove leading zeroes
          return this.strip();
        };

        BN.prototype.notn = function notn(width) {
          return this.clone().inotn(width);
        };

        // Set `bit` of `this`
        BN.prototype.setn = function setn(bit, val) {
          assert(typeof bit === 'number' && bit >= 0);

          var off = bit / 26 | 0;
          var wbit = bit % 26;

          this._expand(off + 1);

          if (val) {
            this.words[off] = this.words[off] | 1 << wbit;
          } else {
            this.words[off] = this.words[off] & ~(1 << wbit);
          }

          return this.strip();
        };

        // Add `num` to `this` in-place
        BN.prototype.iadd = function iadd(num) {
          var r;

          // negative + positive
          if (this.negative !== 0 && num.negative === 0) {
            this.negative = 0;
            r = this.isub(num);
            this.negative ^= 1;
            return this._normSign();

            // positive + negative
          } else if (this.negative === 0 && num.negative !== 0) {
            num.negative = 0;
            r = this.isub(num);
            num.negative = 1;
            return r._normSign();
          }

          // a.length > b.length
          var a, b;
          if (this.length > num.length) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }

          var carry = 0;
          for (var i = 0; i < b.length; i++) {
            r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
            this.words[i] = r & 0x3ffffff;
            carry = r >>> 26;
          }
          for (; carry !== 0 && i < a.length; i++) {
            r = (a.words[i] | 0) + carry;
            this.words[i] = r & 0x3ffffff;
            carry = r >>> 26;
          }

          this.length = a.length;
          if (carry !== 0) {
            this.words[this.length] = carry;
            this.length++;
            // Copy the rest of the words
          } else if (a !== this) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }

          return this;
        };

        // Add `num` to `this`
        BN.prototype.add = function add(num) {
          var res;
          if (num.negative !== 0 && this.negative === 0) {
            num.negative = 0;
            res = this.sub(num);
            num.negative ^= 1;
            return res;
          } else if (num.negative === 0 && this.negative !== 0) {
            this.negative = 0;
            res = num.sub(this);
            this.negative = 1;
            return res;
          }

          if (this.length > num.length) return this.clone().iadd(num);

          return num.clone().iadd(this);
        };

        // Subtract `num` from `this` in-place
        BN.prototype.isub = function isub(num) {
          // this - (-num) = this + num
          if (num.negative !== 0) {
            num.negative = 0;
            var r = this.iadd(num);
            num.negative = 1;
            return r._normSign();

            // -this - num = -(this + num)
          } else if (this.negative !== 0) {
            this.negative = 0;
            this.iadd(num);
            this.negative = 1;
            return this._normSign();
          }

          // At this point both numbers are positive
          var cmp = this.cmp(num);

          // Optimization - zeroify
          if (cmp === 0) {
            this.negative = 0;
            this.length = 1;
            this.words[0] = 0;
            return this;
          }

          // a > b
          var a, b;
          if (cmp > 0) {
            a = this;
            b = num;
          } else {
            a = num;
            b = this;
          }

          var carry = 0;
          for (var i = 0; i < b.length; i++) {
            r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
            carry = r >> 26;
            this.words[i] = r & 0x3ffffff;
          }
          for (; carry !== 0 && i < a.length; i++) {
            r = (a.words[i] | 0) + carry;
            carry = r >> 26;
            this.words[i] = r & 0x3ffffff;
          }

          // Copy rest of the words
          if (carry === 0 && i < a.length && a !== this) {
            for (; i < a.length; i++) {
              this.words[i] = a.words[i];
            }
          }

          this.length = Math.max(this.length, i);

          if (a !== this) {
            this.negative = 1;
          }

          return this.strip();
        };

        // Subtract `num` from `this`
        BN.prototype.sub = function sub(num) {
          return this.clone().isub(num);
        };

        function smallMulTo(self, num, out) {
          out.negative = num.negative ^ self.negative;
          var len = self.length + num.length | 0;
          out.length = len;
          len = len - 1 | 0;

          // Peel one iteration (compiler can't do it, because of code complexity)
          var a = self.words[0] | 0;
          var b = num.words[0] | 0;
          var r = a * b;

          var lo = r & 0x3ffffff;
          var carry = r / 0x4000000 | 0;
          out.words[0] = lo;

          for (var k = 1; k < len; k++) {
            // Sum all words with the same `i + j = k` and accumulate `ncarry`,
            // note that ncarry could be >= 0x3ffffff
            var ncarry = carry >>> 26;
            var rword = carry & 0x3ffffff;
            var maxJ = Math.min(k, num.length - 1);
            for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
              var i = k - j | 0;
              a = self.words[i] | 0;
              b = num.words[j] | 0;
              r = a * b + rword;
              ncarry += r / 0x4000000 | 0;
              rword = r & 0x3ffffff;
            }
            out.words[k] = rword | 0;
            carry = ncarry | 0;
          }
          if (carry !== 0) {
            out.words[k] = carry | 0;
          } else {
            out.length--;
          }

          return out.strip();
        }

        // TODO(indutny): it may be reasonable to omit it for users who don't need
        // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
        // multiplication (like elliptic secp256k1).
        var comb10MulTo = function comb10MulTo(self, num, out) {
          var a = self.words;
          var b = num.words;
          var o = out.words;
          var c = 0;
          var lo;
          var mid;
          var hi;
          var a0 = a[0] | 0;
          var al0 = a0 & 0x1fff;
          var ah0 = a0 >>> 13;
          var a1 = a[1] | 0;
          var al1 = a1 & 0x1fff;
          var ah1 = a1 >>> 13;
          var a2 = a[2] | 0;
          var al2 = a2 & 0x1fff;
          var ah2 = a2 >>> 13;
          var a3 = a[3] | 0;
          var al3 = a3 & 0x1fff;
          var ah3 = a3 >>> 13;
          var a4 = a[4] | 0;
          var al4 = a4 & 0x1fff;
          var ah4 = a4 >>> 13;
          var a5 = a[5] | 0;
          var al5 = a5 & 0x1fff;
          var ah5 = a5 >>> 13;
          var a6 = a[6] | 0;
          var al6 = a6 & 0x1fff;
          var ah6 = a6 >>> 13;
          var a7 = a[7] | 0;
          var al7 = a7 & 0x1fff;
          var ah7 = a7 >>> 13;
          var a8 = a[8] | 0;
          var al8 = a8 & 0x1fff;
          var ah8 = a8 >>> 13;
          var a9 = a[9] | 0;
          var al9 = a9 & 0x1fff;
          var ah9 = a9 >>> 13;
          var b0 = b[0] | 0;
          var bl0 = b0 & 0x1fff;
          var bh0 = b0 >>> 13;
          var b1 = b[1] | 0;
          var bl1 = b1 & 0x1fff;
          var bh1 = b1 >>> 13;
          var b2 = b[2] | 0;
          var bl2 = b2 & 0x1fff;
          var bh2 = b2 >>> 13;
          var b3 = b[3] | 0;
          var bl3 = b3 & 0x1fff;
          var bh3 = b3 >>> 13;
          var b4 = b[4] | 0;
          var bl4 = b4 & 0x1fff;
          var bh4 = b4 >>> 13;
          var b5 = b[5] | 0;
          var bl5 = b5 & 0x1fff;
          var bh5 = b5 >>> 13;
          var b6 = b[6] | 0;
          var bl6 = b6 & 0x1fff;
          var bh6 = b6 >>> 13;
          var b7 = b[7] | 0;
          var bl7 = b7 & 0x1fff;
          var bh7 = b7 >>> 13;
          var b8 = b[8] | 0;
          var bl8 = b8 & 0x1fff;
          var bh8 = b8 >>> 13;
          var b9 = b[9] | 0;
          var bl9 = b9 & 0x1fff;
          var bh9 = b9 >>> 13;

          out.negative = self.negative ^ num.negative;
          out.length = 19;
          /* k = 0 */
          lo = Math.imul(al0, bl0);
          mid = Math.imul(al0, bh0);
          mid = mid + Math.imul(ah0, bl0) | 0;
          hi = Math.imul(ah0, bh0);
          var w0 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
          w0 &= 0x3ffffff;
          /* k = 1 */
          lo = Math.imul(al1, bl0);
          mid = Math.imul(al1, bh0);
          mid = mid + Math.imul(ah1, bl0) | 0;
          hi = Math.imul(ah1, bh0);
          lo = lo + Math.imul(al0, bl1) | 0;
          mid = mid + Math.imul(al0, bh1) | 0;
          mid = mid + Math.imul(ah0, bl1) | 0;
          hi = hi + Math.imul(ah0, bh1) | 0;
          var w1 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
          w1 &= 0x3ffffff;
          /* k = 2 */
          lo = Math.imul(al2, bl0);
          mid = Math.imul(al2, bh0);
          mid = mid + Math.imul(ah2, bl0) | 0;
          hi = Math.imul(ah2, bh0);
          lo = lo + Math.imul(al1, bl1) | 0;
          mid = mid + Math.imul(al1, bh1) | 0;
          mid = mid + Math.imul(ah1, bl1) | 0;
          hi = hi + Math.imul(ah1, bh1) | 0;
          lo = lo + Math.imul(al0, bl2) | 0;
          mid = mid + Math.imul(al0, bh2) | 0;
          mid = mid + Math.imul(ah0, bl2) | 0;
          hi = hi + Math.imul(ah0, bh2) | 0;
          var w2 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
          w2 &= 0x3ffffff;
          /* k = 3 */
          lo = Math.imul(al3, bl0);
          mid = Math.imul(al3, bh0);
          mid = mid + Math.imul(ah3, bl0) | 0;
          hi = Math.imul(ah3, bh0);
          lo = lo + Math.imul(al2, bl1) | 0;
          mid = mid + Math.imul(al2, bh1) | 0;
          mid = mid + Math.imul(ah2, bl1) | 0;
          hi = hi + Math.imul(ah2, bh1) | 0;
          lo = lo + Math.imul(al1, bl2) | 0;
          mid = mid + Math.imul(al1, bh2) | 0;
          mid = mid + Math.imul(ah1, bl2) | 0;
          hi = hi + Math.imul(ah1, bh2) | 0;
          lo = lo + Math.imul(al0, bl3) | 0;
          mid = mid + Math.imul(al0, bh3) | 0;
          mid = mid + Math.imul(ah0, bl3) | 0;
          hi = hi + Math.imul(ah0, bh3) | 0;
          var w3 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
          w3 &= 0x3ffffff;
          /* k = 4 */
          lo = Math.imul(al4, bl0);
          mid = Math.imul(al4, bh0);
          mid = mid + Math.imul(ah4, bl0) | 0;
          hi = Math.imul(ah4, bh0);
          lo = lo + Math.imul(al3, bl1) | 0;
          mid = mid + Math.imul(al3, bh1) | 0;
          mid = mid + Math.imul(ah3, bl1) | 0;
          hi = hi + Math.imul(ah3, bh1) | 0;
          lo = lo + Math.imul(al2, bl2) | 0;
          mid = mid + Math.imul(al2, bh2) | 0;
          mid = mid + Math.imul(ah2, bl2) | 0;
          hi = hi + Math.imul(ah2, bh2) | 0;
          lo = lo + Math.imul(al1, bl3) | 0;
          mid = mid + Math.imul(al1, bh3) | 0;
          mid = mid + Math.imul(ah1, bl3) | 0;
          hi = hi + Math.imul(ah1, bh3) | 0;
          lo = lo + Math.imul(al0, bl4) | 0;
          mid = mid + Math.imul(al0, bh4) | 0;
          mid = mid + Math.imul(ah0, bl4) | 0;
          hi = hi + Math.imul(ah0, bh4) | 0;
          var w4 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
          w4 &= 0x3ffffff;
          /* k = 5 */
          lo = Math.imul(al5, bl0);
          mid = Math.imul(al5, bh0);
          mid = mid + Math.imul(ah5, bl0) | 0;
          hi = Math.imul(ah5, bh0);
          lo = lo + Math.imul(al4, bl1) | 0;
          mid = mid + Math.imul(al4, bh1) | 0;
          mid = mid + Math.imul(ah4, bl1) | 0;
          hi = hi + Math.imul(ah4, bh1) | 0;
          lo = lo + Math.imul(al3, bl2) | 0;
          mid = mid + Math.imul(al3, bh2) | 0;
          mid = mid + Math.imul(ah3, bl2) | 0;
          hi = hi + Math.imul(ah3, bh2) | 0;
          lo = lo + Math.imul(al2, bl3) | 0;
          mid = mid + Math.imul(al2, bh3) | 0;
          mid = mid + Math.imul(ah2, bl3) | 0;
          hi = hi + Math.imul(ah2, bh3) | 0;
          lo = lo + Math.imul(al1, bl4) | 0;
          mid = mid + Math.imul(al1, bh4) | 0;
          mid = mid + Math.imul(ah1, bl4) | 0;
          hi = hi + Math.imul(ah1, bh4) | 0;
          lo = lo + Math.imul(al0, bl5) | 0;
          mid = mid + Math.imul(al0, bh5) | 0;
          mid = mid + Math.imul(ah0, bl5) | 0;
          hi = hi + Math.imul(ah0, bh5) | 0;
          var w5 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
          w5 &= 0x3ffffff;
          /* k = 6 */
          lo = Math.imul(al6, bl0);
          mid = Math.imul(al6, bh0);
          mid = mid + Math.imul(ah6, bl0) | 0;
          hi = Math.imul(ah6, bh0);
          lo = lo + Math.imul(al5, bl1) | 0;
          mid = mid + Math.imul(al5, bh1) | 0;
          mid = mid + Math.imul(ah5, bl1) | 0;
          hi = hi + Math.imul(ah5, bh1) | 0;
          lo = lo + Math.imul(al4, bl2) | 0;
          mid = mid + Math.imul(al4, bh2) | 0;
          mid = mid + Math.imul(ah4, bl2) | 0;
          hi = hi + Math.imul(ah4, bh2) | 0;
          lo = lo + Math.imul(al3, bl3) | 0;
          mid = mid + Math.imul(al3, bh3) | 0;
          mid = mid + Math.imul(ah3, bl3) | 0;
          hi = hi + Math.imul(ah3, bh3) | 0;
          lo = lo + Math.imul(al2, bl4) | 0;
          mid = mid + Math.imul(al2, bh4) | 0;
          mid = mid + Math.imul(ah2, bl4) | 0;
          hi = hi + Math.imul(ah2, bh4) | 0;
          lo = lo + Math.imul(al1, bl5) | 0;
          mid = mid + Math.imul(al1, bh5) | 0;
          mid = mid + Math.imul(ah1, bl5) | 0;
          hi = hi + Math.imul(ah1, bh5) | 0;
          lo = lo + Math.imul(al0, bl6) | 0;
          mid = mid + Math.imul(al0, bh6) | 0;
          mid = mid + Math.imul(ah0, bl6) | 0;
          hi = hi + Math.imul(ah0, bh6) | 0;
          var w6 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
          w6 &= 0x3ffffff;
          /* k = 7 */
          lo = Math.imul(al7, bl0);
          mid = Math.imul(al7, bh0);
          mid = mid + Math.imul(ah7, bl0) | 0;
          hi = Math.imul(ah7, bh0);
          lo = lo + Math.imul(al6, bl1) | 0;
          mid = mid + Math.imul(al6, bh1) | 0;
          mid = mid + Math.imul(ah6, bl1) | 0;
          hi = hi + Math.imul(ah6, bh1) | 0;
          lo = lo + Math.imul(al5, bl2) | 0;
          mid = mid + Math.imul(al5, bh2) | 0;
          mid = mid + Math.imul(ah5, bl2) | 0;
          hi = hi + Math.imul(ah5, bh2) | 0;
          lo = lo + Math.imul(al4, bl3) | 0;
          mid = mid + Math.imul(al4, bh3) | 0;
          mid = mid + Math.imul(ah4, bl3) | 0;
          hi = hi + Math.imul(ah4, bh3) | 0;
          lo = lo + Math.imul(al3, bl4) | 0;
          mid = mid + Math.imul(al3, bh4) | 0;
          mid = mid + Math.imul(ah3, bl4) | 0;
          hi = hi + Math.imul(ah3, bh4) | 0;
          lo = lo + Math.imul(al2, bl5) | 0;
          mid = mid + Math.imul(al2, bh5) | 0;
          mid = mid + Math.imul(ah2, bl5) | 0;
          hi = hi + Math.imul(ah2, bh5) | 0;
          lo = lo + Math.imul(al1, bl6) | 0;
          mid = mid + Math.imul(al1, bh6) | 0;
          mid = mid + Math.imul(ah1, bl6) | 0;
          hi = hi + Math.imul(ah1, bh6) | 0;
          lo = lo + Math.imul(al0, bl7) | 0;
          mid = mid + Math.imul(al0, bh7) | 0;
          mid = mid + Math.imul(ah0, bl7) | 0;
          hi = hi + Math.imul(ah0, bh7) | 0;
          var w7 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
          w7 &= 0x3ffffff;
          /* k = 8 */
          lo = Math.imul(al8, bl0);
          mid = Math.imul(al8, bh0);
          mid = mid + Math.imul(ah8, bl0) | 0;
          hi = Math.imul(ah8, bh0);
          lo = lo + Math.imul(al7, bl1) | 0;
          mid = mid + Math.imul(al7, bh1) | 0;
          mid = mid + Math.imul(ah7, bl1) | 0;
          hi = hi + Math.imul(ah7, bh1) | 0;
          lo = lo + Math.imul(al6, bl2) | 0;
          mid = mid + Math.imul(al6, bh2) | 0;
          mid = mid + Math.imul(ah6, bl2) | 0;
          hi = hi + Math.imul(ah6, bh2) | 0;
          lo = lo + Math.imul(al5, bl3) | 0;
          mid = mid + Math.imul(al5, bh3) | 0;
          mid = mid + Math.imul(ah5, bl3) | 0;
          hi = hi + Math.imul(ah5, bh3) | 0;
          lo = lo + Math.imul(al4, bl4) | 0;
          mid = mid + Math.imul(al4, bh4) | 0;
          mid = mid + Math.imul(ah4, bl4) | 0;
          hi = hi + Math.imul(ah4, bh4) | 0;
          lo = lo + Math.imul(al3, bl5) | 0;
          mid = mid + Math.imul(al3, bh5) | 0;
          mid = mid + Math.imul(ah3, bl5) | 0;
          hi = hi + Math.imul(ah3, bh5) | 0;
          lo = lo + Math.imul(al2, bl6) | 0;
          mid = mid + Math.imul(al2, bh6) | 0;
          mid = mid + Math.imul(ah2, bl6) | 0;
          hi = hi + Math.imul(ah2, bh6) | 0;
          lo = lo + Math.imul(al1, bl7) | 0;
          mid = mid + Math.imul(al1, bh7) | 0;
          mid = mid + Math.imul(ah1, bl7) | 0;
          hi = hi + Math.imul(ah1, bh7) | 0;
          lo = lo + Math.imul(al0, bl8) | 0;
          mid = mid + Math.imul(al0, bh8) | 0;
          mid = mid + Math.imul(ah0, bl8) | 0;
          hi = hi + Math.imul(ah0, bh8) | 0;
          var w8 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
          w8 &= 0x3ffffff;
          /* k = 9 */
          lo = Math.imul(al9, bl0);
          mid = Math.imul(al9, bh0);
          mid = mid + Math.imul(ah9, bl0) | 0;
          hi = Math.imul(ah9, bh0);
          lo = lo + Math.imul(al8, bl1) | 0;
          mid = mid + Math.imul(al8, bh1) | 0;
          mid = mid + Math.imul(ah8, bl1) | 0;
          hi = hi + Math.imul(ah8, bh1) | 0;
          lo = lo + Math.imul(al7, bl2) | 0;
          mid = mid + Math.imul(al7, bh2) | 0;
          mid = mid + Math.imul(ah7, bl2) | 0;
          hi = hi + Math.imul(ah7, bh2) | 0;
          lo = lo + Math.imul(al6, bl3) | 0;
          mid = mid + Math.imul(al6, bh3) | 0;
          mid = mid + Math.imul(ah6, bl3) | 0;
          hi = hi + Math.imul(ah6, bh3) | 0;
          lo = lo + Math.imul(al5, bl4) | 0;
          mid = mid + Math.imul(al5, bh4) | 0;
          mid = mid + Math.imul(ah5, bl4) | 0;
          hi = hi + Math.imul(ah5, bh4) | 0;
          lo = lo + Math.imul(al4, bl5) | 0;
          mid = mid + Math.imul(al4, bh5) | 0;
          mid = mid + Math.imul(ah4, bl5) | 0;
          hi = hi + Math.imul(ah4, bh5) | 0;
          lo = lo + Math.imul(al3, bl6) | 0;
          mid = mid + Math.imul(al3, bh6) | 0;
          mid = mid + Math.imul(ah3, bl6) | 0;
          hi = hi + Math.imul(ah3, bh6) | 0;
          lo = lo + Math.imul(al2, bl7) | 0;
          mid = mid + Math.imul(al2, bh7) | 0;
          mid = mid + Math.imul(ah2, bl7) | 0;
          hi = hi + Math.imul(ah2, bh7) | 0;
          lo = lo + Math.imul(al1, bl8) | 0;
          mid = mid + Math.imul(al1, bh8) | 0;
          mid = mid + Math.imul(ah1, bl8) | 0;
          hi = hi + Math.imul(ah1, bh8) | 0;
          lo = lo + Math.imul(al0, bl9) | 0;
          mid = mid + Math.imul(al0, bh9) | 0;
          mid = mid + Math.imul(ah0, bl9) | 0;
          hi = hi + Math.imul(ah0, bh9) | 0;
          var w9 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
          w9 &= 0x3ffffff;
          /* k = 10 */
          lo = Math.imul(al9, bl1);
          mid = Math.imul(al9, bh1);
          mid = mid + Math.imul(ah9, bl1) | 0;
          hi = Math.imul(ah9, bh1);
          lo = lo + Math.imul(al8, bl2) | 0;
          mid = mid + Math.imul(al8, bh2) | 0;
          mid = mid + Math.imul(ah8, bl2) | 0;
          hi = hi + Math.imul(ah8, bh2) | 0;
          lo = lo + Math.imul(al7, bl3) | 0;
          mid = mid + Math.imul(al7, bh3) | 0;
          mid = mid + Math.imul(ah7, bl3) | 0;
          hi = hi + Math.imul(ah7, bh3) | 0;
          lo = lo + Math.imul(al6, bl4) | 0;
          mid = mid + Math.imul(al6, bh4) | 0;
          mid = mid + Math.imul(ah6, bl4) | 0;
          hi = hi + Math.imul(ah6, bh4) | 0;
          lo = lo + Math.imul(al5, bl5) | 0;
          mid = mid + Math.imul(al5, bh5) | 0;
          mid = mid + Math.imul(ah5, bl5) | 0;
          hi = hi + Math.imul(ah5, bh5) | 0;
          lo = lo + Math.imul(al4, bl6) | 0;
          mid = mid + Math.imul(al4, bh6) | 0;
          mid = mid + Math.imul(ah4, bl6) | 0;
          hi = hi + Math.imul(ah4, bh6) | 0;
          lo = lo + Math.imul(al3, bl7) | 0;
          mid = mid + Math.imul(al3, bh7) | 0;
          mid = mid + Math.imul(ah3, bl7) | 0;
          hi = hi + Math.imul(ah3, bh7) | 0;
          lo = lo + Math.imul(al2, bl8) | 0;
          mid = mid + Math.imul(al2, bh8) | 0;
          mid = mid + Math.imul(ah2, bl8) | 0;
          hi = hi + Math.imul(ah2, bh8) | 0;
          lo = lo + Math.imul(al1, bl9) | 0;
          mid = mid + Math.imul(al1, bh9) | 0;
          mid = mid + Math.imul(ah1, bl9) | 0;
          hi = hi + Math.imul(ah1, bh9) | 0;
          var w10 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
          w10 &= 0x3ffffff;
          /* k = 11 */
          lo = Math.imul(al9, bl2);
          mid = Math.imul(al9, bh2);
          mid = mid + Math.imul(ah9, bl2) | 0;
          hi = Math.imul(ah9, bh2);
          lo = lo + Math.imul(al8, bl3) | 0;
          mid = mid + Math.imul(al8, bh3) | 0;
          mid = mid + Math.imul(ah8, bl3) | 0;
          hi = hi + Math.imul(ah8, bh3) | 0;
          lo = lo + Math.imul(al7, bl4) | 0;
          mid = mid + Math.imul(al7, bh4) | 0;
          mid = mid + Math.imul(ah7, bl4) | 0;
          hi = hi + Math.imul(ah7, bh4) | 0;
          lo = lo + Math.imul(al6, bl5) | 0;
          mid = mid + Math.imul(al6, bh5) | 0;
          mid = mid + Math.imul(ah6, bl5) | 0;
          hi = hi + Math.imul(ah6, bh5) | 0;
          lo = lo + Math.imul(al5, bl6) | 0;
          mid = mid + Math.imul(al5, bh6) | 0;
          mid = mid + Math.imul(ah5, bl6) | 0;
          hi = hi + Math.imul(ah5, bh6) | 0;
          lo = lo + Math.imul(al4, bl7) | 0;
          mid = mid + Math.imul(al4, bh7) | 0;
          mid = mid + Math.imul(ah4, bl7) | 0;
          hi = hi + Math.imul(ah4, bh7) | 0;
          lo = lo + Math.imul(al3, bl8) | 0;
          mid = mid + Math.imul(al3, bh8) | 0;
          mid = mid + Math.imul(ah3, bl8) | 0;
          hi = hi + Math.imul(ah3, bh8) | 0;
          lo = lo + Math.imul(al2, bl9) | 0;
          mid = mid + Math.imul(al2, bh9) | 0;
          mid = mid + Math.imul(ah2, bl9) | 0;
          hi = hi + Math.imul(ah2, bh9) | 0;
          var w11 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
          w11 &= 0x3ffffff;
          /* k = 12 */
          lo = Math.imul(al9, bl3);
          mid = Math.imul(al9, bh3);
          mid = mid + Math.imul(ah9, bl3) | 0;
          hi = Math.imul(ah9, bh3);
          lo = lo + Math.imul(al8, bl4) | 0;
          mid = mid + Math.imul(al8, bh4) | 0;
          mid = mid + Math.imul(ah8, bl4) | 0;
          hi = hi + Math.imul(ah8, bh4) | 0;
          lo = lo + Math.imul(al7, bl5) | 0;
          mid = mid + Math.imul(al7, bh5) | 0;
          mid = mid + Math.imul(ah7, bl5) | 0;
          hi = hi + Math.imul(ah7, bh5) | 0;
          lo = lo + Math.imul(al6, bl6) | 0;
          mid = mid + Math.imul(al6, bh6) | 0;
          mid = mid + Math.imul(ah6, bl6) | 0;
          hi = hi + Math.imul(ah6, bh6) | 0;
          lo = lo + Math.imul(al5, bl7) | 0;
          mid = mid + Math.imul(al5, bh7) | 0;
          mid = mid + Math.imul(ah5, bl7) | 0;
          hi = hi + Math.imul(ah5, bh7) | 0;
          lo = lo + Math.imul(al4, bl8) | 0;
          mid = mid + Math.imul(al4, bh8) | 0;
          mid = mid + Math.imul(ah4, bl8) | 0;
          hi = hi + Math.imul(ah4, bh8) | 0;
          lo = lo + Math.imul(al3, bl9) | 0;
          mid = mid + Math.imul(al3, bh9) | 0;
          mid = mid + Math.imul(ah3, bl9) | 0;
          hi = hi + Math.imul(ah3, bh9) | 0;
          var w12 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
          w12 &= 0x3ffffff;
          /* k = 13 */
          lo = Math.imul(al9, bl4);
          mid = Math.imul(al9, bh4);
          mid = mid + Math.imul(ah9, bl4) | 0;
          hi = Math.imul(ah9, bh4);
          lo = lo + Math.imul(al8, bl5) | 0;
          mid = mid + Math.imul(al8, bh5) | 0;
          mid = mid + Math.imul(ah8, bl5) | 0;
          hi = hi + Math.imul(ah8, bh5) | 0;
          lo = lo + Math.imul(al7, bl6) | 0;
          mid = mid + Math.imul(al7, bh6) | 0;
          mid = mid + Math.imul(ah7, bl6) | 0;
          hi = hi + Math.imul(ah7, bh6) | 0;
          lo = lo + Math.imul(al6, bl7) | 0;
          mid = mid + Math.imul(al6, bh7) | 0;
          mid = mid + Math.imul(ah6, bl7) | 0;
          hi = hi + Math.imul(ah6, bh7) | 0;
          lo = lo + Math.imul(al5, bl8) | 0;
          mid = mid + Math.imul(al5, bh8) | 0;
          mid = mid + Math.imul(ah5, bl8) | 0;
          hi = hi + Math.imul(ah5, bh8) | 0;
          lo = lo + Math.imul(al4, bl9) | 0;
          mid = mid + Math.imul(al4, bh9) | 0;
          mid = mid + Math.imul(ah4, bl9) | 0;
          hi = hi + Math.imul(ah4, bh9) | 0;
          var w13 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
          w13 &= 0x3ffffff;
          /* k = 14 */
          lo = Math.imul(al9, bl5);
          mid = Math.imul(al9, bh5);
          mid = mid + Math.imul(ah9, bl5) | 0;
          hi = Math.imul(ah9, bh5);
          lo = lo + Math.imul(al8, bl6) | 0;
          mid = mid + Math.imul(al8, bh6) | 0;
          mid = mid + Math.imul(ah8, bl6) | 0;
          hi = hi + Math.imul(ah8, bh6) | 0;
          lo = lo + Math.imul(al7, bl7) | 0;
          mid = mid + Math.imul(al7, bh7) | 0;
          mid = mid + Math.imul(ah7, bl7) | 0;
          hi = hi + Math.imul(ah7, bh7) | 0;
          lo = lo + Math.imul(al6, bl8) | 0;
          mid = mid + Math.imul(al6, bh8) | 0;
          mid = mid + Math.imul(ah6, bl8) | 0;
          hi = hi + Math.imul(ah6, bh8) | 0;
          lo = lo + Math.imul(al5, bl9) | 0;
          mid = mid + Math.imul(al5, bh9) | 0;
          mid = mid + Math.imul(ah5, bl9) | 0;
          hi = hi + Math.imul(ah5, bh9) | 0;
          var w14 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
          w14 &= 0x3ffffff;
          /* k = 15 */
          lo = Math.imul(al9, bl6);
          mid = Math.imul(al9, bh6);
          mid = mid + Math.imul(ah9, bl6) | 0;
          hi = Math.imul(ah9, bh6);
          lo = lo + Math.imul(al8, bl7) | 0;
          mid = mid + Math.imul(al8, bh7) | 0;
          mid = mid + Math.imul(ah8, bl7) | 0;
          hi = hi + Math.imul(ah8, bh7) | 0;
          lo = lo + Math.imul(al7, bl8) | 0;
          mid = mid + Math.imul(al7, bh8) | 0;
          mid = mid + Math.imul(ah7, bl8) | 0;
          hi = hi + Math.imul(ah7, bh8) | 0;
          lo = lo + Math.imul(al6, bl9) | 0;
          mid = mid + Math.imul(al6, bh9) | 0;
          mid = mid + Math.imul(ah6, bl9) | 0;
          hi = hi + Math.imul(ah6, bh9) | 0;
          var w15 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
          w15 &= 0x3ffffff;
          /* k = 16 */
          lo = Math.imul(al9, bl7);
          mid = Math.imul(al9, bh7);
          mid = mid + Math.imul(ah9, bl7) | 0;
          hi = Math.imul(ah9, bh7);
          lo = lo + Math.imul(al8, bl8) | 0;
          mid = mid + Math.imul(al8, bh8) | 0;
          mid = mid + Math.imul(ah8, bl8) | 0;
          hi = hi + Math.imul(ah8, bh8) | 0;
          lo = lo + Math.imul(al7, bl9) | 0;
          mid = mid + Math.imul(al7, bh9) | 0;
          mid = mid + Math.imul(ah7, bl9) | 0;
          hi = hi + Math.imul(ah7, bh9) | 0;
          var w16 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
          w16 &= 0x3ffffff;
          /* k = 17 */
          lo = Math.imul(al9, bl8);
          mid = Math.imul(al9, bh8);
          mid = mid + Math.imul(ah9, bl8) | 0;
          hi = Math.imul(ah9, bh8);
          lo = lo + Math.imul(al8, bl9) | 0;
          mid = mid + Math.imul(al8, bh9) | 0;
          mid = mid + Math.imul(ah8, bl9) | 0;
          hi = hi + Math.imul(ah8, bh9) | 0;
          var w17 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
          w17 &= 0x3ffffff;
          /* k = 18 */
          lo = Math.imul(al9, bl9);
          mid = Math.imul(al9, bh9);
          mid = mid + Math.imul(ah9, bl9) | 0;
          hi = Math.imul(ah9, bh9);
          var w18 = (c + lo | 0) + ((mid & 0x1fff) << 13) | 0;
          c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
          w18 &= 0x3ffffff;
          o[0] = w0;
          o[1] = w1;
          o[2] = w2;
          o[3] = w3;
          o[4] = w4;
          o[5] = w5;
          o[6] = w6;
          o[7] = w7;
          o[8] = w8;
          o[9] = w9;
          o[10] = w10;
          o[11] = w11;
          o[12] = w12;
          o[13] = w13;
          o[14] = w14;
          o[15] = w15;
          o[16] = w16;
          o[17] = w17;
          o[18] = w18;
          if (c !== 0) {
            o[19] = c;
            out.length++;
          }
          return out;
        };

        // Polyfill comb
        if (!Math.imul) {
          comb10MulTo = smallMulTo;
        }

        function bigMulTo(self, num, out) {
          out.negative = num.negative ^ self.negative;
          out.length = self.length + num.length;

          var carry = 0;
          var hncarry = 0;
          for (var k = 0; k < out.length - 1; k++) {
            // Sum all words with the same `i + j = k` and accumulate `ncarry`,
            // note that ncarry could be >= 0x3ffffff
            var ncarry = hncarry;
            hncarry = 0;
            var rword = carry & 0x3ffffff;
            var maxJ = Math.min(k, num.length - 1);
            for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
              var i = k - j;
              var a = self.words[i] | 0;
              var b = num.words[j] | 0;
              var r = a * b;

              var lo = r & 0x3ffffff;
              ncarry = ncarry + (r / 0x4000000 | 0) | 0;
              lo = lo + rword | 0;
              rword = lo & 0x3ffffff;
              ncarry = ncarry + (lo >>> 26) | 0;

              hncarry += ncarry >>> 26;
              ncarry &= 0x3ffffff;
            }
            out.words[k] = rword;
            carry = ncarry;
            ncarry = hncarry;
          }
          if (carry !== 0) {
            out.words[k] = carry;
          } else {
            out.length--;
          }

          return out.strip();
        }

        function jumboMulTo(self, num, out) {
          var fftm = new FFTM();
          return fftm.mulp(self, num, out);
        }

        BN.prototype.mulTo = function mulTo(num, out) {
          var res;
          var len = this.length + num.length;
          if (this.length === 10 && num.length === 10) {
            res = comb10MulTo(this, num, out);
          } else if (len < 63) {
            res = smallMulTo(this, num, out);
          } else if (len < 1024) {
            res = bigMulTo(this, num, out);
          } else {
            res = jumboMulTo(this, num, out);
          }

          return res;
        };

        // Cooley-Tukey algorithm for FFT
        // slightly revisited to rely on looping instead of recursion

        function FFTM(x, y) {
          this.x = x;
          this.y = y;
        }

        FFTM.prototype.makeRBT = function makeRBT(N) {
          var t = new Array(N);
          var l = BN.prototype._countBits(N) - 1;
          for (var i = 0; i < N; i++) {
            t[i] = this.revBin(i, l, N);
          }

          return t;
        };

        // Returns binary-reversed representation of `x`
        FFTM.prototype.revBin = function revBin(x, l, N) {
          if (x === 0 || x === N - 1) return x;

          var rb = 0;
          for (var i = 0; i < l; i++) {
            rb |= (x & 1) << l - i - 1;
            x >>= 1;
          }

          return rb;
        };

        // Performs "tweedling" phase, therefore 'emulating'
        // behaviour of the recursive algorithm
        FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
          for (var i = 0; i < N; i++) {
            rtws[i] = rws[rbt[i]];
            itws[i] = iws[rbt[i]];
          }
        };

        FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
          this.permute(rbt, rws, iws, rtws, itws, N);

          for (var s = 1; s < N; s <<= 1) {
            var l = s << 1;

            var rtwdf = Math.cos(2 * Math.PI / l);
            var itwdf = Math.sin(2 * Math.PI / l);

            for (var p = 0; p < N; p += l) {
              var rtwdf_ = rtwdf;
              var itwdf_ = itwdf;

              for (var j = 0; j < s; j++) {
                var re = rtws[p + j];
                var ie = itws[p + j];

                var ro = rtws[p + j + s];
                var io = itws[p + j + s];

                var rx = rtwdf_ * ro - itwdf_ * io;

                io = rtwdf_ * io + itwdf_ * ro;
                ro = rx;

                rtws[p + j] = re + ro;
                itws[p + j] = ie + io;

                rtws[p + j + s] = re - ro;
                itws[p + j + s] = ie - io;

                /* jshint maxdepth : false */
                if (j !== l) {
                  rx = rtwdf * rtwdf_ - itwdf * itwdf_;

                  itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                  rtwdf_ = rx;
                }
              }
            }
          }
        };

        FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
          var N = Math.max(m, n) | 1;
          var odd = N & 1;
          var i = 0;
          for (N = N / 2 | 0; N; N = N >>> 1) {
            i++;
          }

          return 1 << i + 1 + odd;
        };

        FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
          if (N <= 1) return;

          for (var i = 0; i < N / 2; i++) {
            var t = rws[i];

            rws[i] = rws[N - i - 1];
            rws[N - i - 1] = t;

            t = iws[i];

            iws[i] = -iws[N - i - 1];
            iws[N - i - 1] = -t;
          }
        };

        FFTM.prototype.normalize13b = function normalize13b(ws, N) {
          var carry = 0;
          for (var i = 0; i < N / 2; i++) {
            var w = Math.round(ws[2 * i + 1] / N) * 0x2000 + Math.round(ws[2 * i] / N) + carry;

            ws[i] = w & 0x3ffffff;

            if (w < 0x4000000) {
              carry = 0;
            } else {
              carry = w / 0x4000000 | 0;
            }
          }

          return ws;
        };

        FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
          var carry = 0;
          for (var i = 0; i < len; i++) {
            carry = carry + (ws[i] | 0);

            rws[2 * i] = carry & 0x1fff;carry = carry >>> 13;
            rws[2 * i + 1] = carry & 0x1fff;carry = carry >>> 13;
          }

          // Pad with zeroes
          for (i = 2 * len; i < N; ++i) {
            rws[i] = 0;
          }

          assert(carry === 0);
          assert((carry & ~0x1fff) === 0);
        };

        FFTM.prototype.stub = function stub(N) {
          var ph = new Array(N);
          for (var i = 0; i < N; i++) {
            ph[i] = 0;
          }

          return ph;
        };

        FFTM.prototype.mulp = function mulp(x, y, out) {
          var N = 2 * this.guessLen13b(x.length, y.length);

          var rbt = this.makeRBT(N);

          var _ = this.stub(N);

          var rws = new Array(N);
          var rwst = new Array(N);
          var iwst = new Array(N);

          var nrws = new Array(N);
          var nrwst = new Array(N);
          var niwst = new Array(N);

          var rmws = out.words;
          rmws.length = N;

          this.convert13b(x.words, x.length, rws, N);
          this.convert13b(y.words, y.length, nrws, N);

          this.transform(rws, _, rwst, iwst, N, rbt);
          this.transform(nrws, _, nrwst, niwst, N, rbt);

          for (var i = 0; i < N; i++) {
            var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
            iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
            rwst[i] = rx;
          }

          this.conjugate(rwst, iwst, N);
          this.transform(rwst, iwst, rmws, _, N, rbt);
          this.conjugate(rmws, _, N);
          this.normalize13b(rmws, N);

          out.negative = x.negative ^ y.negative;
          out.length = x.length + y.length;
          return out.strip();
        };

        // Multiply `this` by `num`
        BN.prototype.mul = function mul(num) {
          var out = new BN(null);
          out.words = new Array(this.length + num.length);
          return this.mulTo(num, out);
        };

        // Multiply employing FFT
        BN.prototype.mulf = function mulf(num) {
          var out = new BN(null);
          out.words = new Array(this.length + num.length);
          return jumboMulTo(this, num, out);
        };

        // In-place Multiplication
        BN.prototype.imul = function imul(num) {
          return this.clone().mulTo(num, this);
        };

        BN.prototype.imuln = function imuln(num) {
          assert(typeof num === 'number');
          assert(num < 0x4000000);

          // Carry
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = (this.words[i] | 0) * num;
            var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
            carry >>= 26;
            carry += w / 0x4000000 | 0;
            // NOTE: lo is 27bit maximum
            carry += lo >>> 26;
            this.words[i] = lo & 0x3ffffff;
          }

          if (carry !== 0) {
            this.words[i] = carry;
            this.length++;
          }

          return this;
        };

        BN.prototype.muln = function muln(num) {
          return this.clone().imuln(num);
        };

        // `this` * `this`
        BN.prototype.sqr = function sqr() {
          return this.mul(this);
        };

        // `this` * `this` in-place
        BN.prototype.isqr = function isqr() {
          return this.imul(this.clone());
        };

        // Math.pow(`this`, `num`)
        BN.prototype.pow = function pow(num) {
          var w = toBitArray(num);
          if (w.length === 0) return new BN(1);

          // Skip leading zeroes
          var res = this;
          for (var i = 0; i < w.length; i++, res = res.sqr()) {
            if (w[i] !== 0) break;
          }

          if (++i < w.length) {
            for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
              if (w[i] === 0) continue;

              res = res.mul(q);
            }
          }

          return res;
        };

        // Shift-left in-place
        BN.prototype.iushln = function iushln(bits) {
          assert(typeof bits === 'number' && bits >= 0);
          var r = bits % 26;
          var s = (bits - r) / 26;
          var carryMask = 0x3ffffff >>> 26 - r << 26 - r;
          var i;

          if (r !== 0) {
            var carry = 0;

            for (i = 0; i < this.length; i++) {
              var newCarry = this.words[i] & carryMask;
              var c = (this.words[i] | 0) - newCarry << r;
              this.words[i] = c | carry;
              carry = newCarry >>> 26 - r;
            }

            if (carry) {
              this.words[i] = carry;
              this.length++;
            }
          }

          if (s !== 0) {
            for (i = this.length - 1; i >= 0; i--) {
              this.words[i + s] = this.words[i];
            }

            for (i = 0; i < s; i++) {
              this.words[i] = 0;
            }

            this.length += s;
          }

          return this.strip();
        };

        BN.prototype.ishln = function ishln(bits) {
          // TODO(indutny): implement me
          assert(this.negative === 0);
          return this.iushln(bits);
        };

        // Shift-right in-place
        // NOTE: `hint` is a lowest bit before trailing zeroes
        // NOTE: if `extended` is present - it will be filled with destroyed bits
        BN.prototype.iushrn = function iushrn(bits, hint, extended) {
          assert(typeof bits === 'number' && bits >= 0);
          var h;
          if (hint) {
            h = (hint - hint % 26) / 26;
          } else {
            h = 0;
          }

          var r = bits % 26;
          var s = Math.min((bits - r) / 26, this.length);
          var mask = 0x3ffffff ^ 0x3ffffff >>> r << r;
          var maskedWords = extended;

          h -= s;
          h = Math.max(0, h);

          // Extended mode, copy masked part
          if (maskedWords) {
            for (var i = 0; i < s; i++) {
              maskedWords.words[i] = this.words[i];
            }
            maskedWords.length = s;
          }

          if (s === 0) {
            // No-op, we should not move anything at all
          } else if (this.length > s) {
            this.length -= s;
            for (i = 0; i < this.length; i++) {
              this.words[i] = this.words[i + s];
            }
          } else {
            this.words[0] = 0;
            this.length = 1;
          }

          var carry = 0;
          for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
            var word = this.words[i] | 0;
            this.words[i] = carry << 26 - r | word >>> r;
            carry = word & mask;
          }

          // Push carried bits as a mask
          if (maskedWords && carry !== 0) {
            maskedWords.words[maskedWords.length++] = carry;
          }

          if (this.length === 0) {
            this.words[0] = 0;
            this.length = 1;
          }

          return this.strip();
        };

        BN.prototype.ishrn = function ishrn(bits, hint, extended) {
          // TODO(indutny): implement me
          assert(this.negative === 0);
          return this.iushrn(bits, hint, extended);
        };

        // Shift-left
        BN.prototype.shln = function shln(bits) {
          return this.clone().ishln(bits);
        };

        BN.prototype.ushln = function ushln(bits) {
          return this.clone().iushln(bits);
        };

        // Shift-right
        BN.prototype.shrn = function shrn(bits) {
          return this.clone().ishrn(bits);
        };

        BN.prototype.ushrn = function ushrn(bits) {
          return this.clone().iushrn(bits);
        };

        // Test if n bit is set
        BN.prototype.testn = function testn(bit) {
          assert(typeof bit === 'number' && bit >= 0);
          var r = bit % 26;
          var s = (bit - r) / 26;
          var q = 1 << r;

          // Fast case: bit is much higher than all existing words
          if (this.length <= s) return false;

          // Check bit and return
          var w = this.words[s];

          return !!(w & q);
        };

        // Return only lowers bits of number (in-place)
        BN.prototype.imaskn = function imaskn(bits) {
          assert(typeof bits === 'number' && bits >= 0);
          var r = bits % 26;
          var s = (bits - r) / 26;

          assert(this.negative === 0, 'imaskn works only with positive numbers');

          if (this.length <= s) {
            return this;
          }

          if (r !== 0) {
            s++;
          }
          this.length = Math.min(s, this.length);

          if (r !== 0) {
            var mask = 0x3ffffff ^ 0x3ffffff >>> r << r;
            this.words[this.length - 1] &= mask;
          }

          return this.strip();
        };

        // Return only lowers bits of number
        BN.prototype.maskn = function maskn(bits) {
          return this.clone().imaskn(bits);
        };

        // Add plain number `num` to `this`
        BN.prototype.iaddn = function iaddn(num) {
          assert(typeof num === 'number');
          assert(num < 0x4000000);
          if (num < 0) return this.isubn(-num);

          // Possible sign change
          if (this.negative !== 0) {
            if (this.length === 1 && (this.words[0] | 0) < num) {
              this.words[0] = num - (this.words[0] | 0);
              this.negative = 0;
              return this;
            }

            this.negative = 0;
            this.isubn(num);
            this.negative = 1;
            return this;
          }

          // Add without checks
          return this._iaddn(num);
        };

        BN.prototype._iaddn = function _iaddn(num) {
          this.words[0] += num;

          // Carry
          for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
            this.words[i] -= 0x4000000;
            if (i === this.length - 1) {
              this.words[i + 1] = 1;
            } else {
              this.words[i + 1]++;
            }
          }
          this.length = Math.max(this.length, i + 1);

          return this;
        };

        // Subtract plain number `num` from `this`
        BN.prototype.isubn = function isubn(num) {
          assert(typeof num === 'number');
          assert(num < 0x4000000);
          if (num < 0) return this.iaddn(-num);

          if (this.negative !== 0) {
            this.negative = 0;
            this.iaddn(num);
            this.negative = 1;
            return this;
          }

          this.words[0] -= num;

          if (this.length === 1 && this.words[0] < 0) {
            this.words[0] = -this.words[0];
            this.negative = 1;
          } else {
            // Carry
            for (var i = 0; i < this.length && this.words[i] < 0; i++) {
              this.words[i] += 0x4000000;
              this.words[i + 1] -= 1;
            }
          }

          return this.strip();
        };

        BN.prototype.addn = function addn(num) {
          return this.clone().iaddn(num);
        };

        BN.prototype.subn = function subn(num) {
          return this.clone().isubn(num);
        };

        BN.prototype.iabs = function iabs() {
          this.negative = 0;

          return this;
        };

        BN.prototype.abs = function abs() {
          return this.clone().iabs();
        };

        BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
          var len = num.length + shift;
          var i;

          this._expand(len);

          var w;
          var carry = 0;
          for (i = 0; i < num.length; i++) {
            w = (this.words[i + shift] | 0) + carry;
            var right = (num.words[i] | 0) * mul;
            w -= right & 0x3ffffff;
            carry = (w >> 26) - (right / 0x4000000 | 0);
            this.words[i + shift] = w & 0x3ffffff;
          }
          for (; i < this.length - shift; i++) {
            w = (this.words[i + shift] | 0) + carry;
            carry = w >> 26;
            this.words[i + shift] = w & 0x3ffffff;
          }

          if (carry === 0) return this.strip();

          // Subtraction overflow
          assert(carry === -1);
          carry = 0;
          for (i = 0; i < this.length; i++) {
            w = -(this.words[i] | 0) + carry;
            carry = w >> 26;
            this.words[i] = w & 0x3ffffff;
          }
          this.negative = 1;

          return this.strip();
        };

        BN.prototype._wordDiv = function _wordDiv(num, mode) {
          var shift = this.length - num.length;

          var a = this.clone();
          var b = num;

          // Normalize
          var bhi = b.words[b.length - 1] | 0;
          var bhiBits = this._countBits(bhi);
          shift = 26 - bhiBits;
          if (shift !== 0) {
            b = b.ushln(shift);
            a.iushln(shift);
            bhi = b.words[b.length - 1] | 0;
          }

          // Initialize quotient
          var m = a.length - b.length;
          var q;

          if (mode !== 'mod') {
            q = new BN(null);
            q.length = m + 1;
            q.words = new Array(q.length);
            for (var i = 0; i < q.length; i++) {
              q.words[i] = 0;
            }
          }

          var diff = a.clone()._ishlnsubmul(b, 1, m);
          if (diff.negative === 0) {
            a = diff;
            if (q) {
              q.words[m] = 1;
            }
          }

          for (var j = m - 1; j >= 0; j--) {
            var qj = (a.words[b.length + j] | 0) * 0x4000000 + (a.words[b.length + j - 1] | 0);

            // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
            // (0x7ffffff)
            qj = Math.min(qj / bhi | 0, 0x3ffffff);

            a._ishlnsubmul(b, qj, j);
            while (a.negative !== 0) {
              qj--;
              a.negative = 0;
              a._ishlnsubmul(b, 1, j);
              if (!a.isZero()) {
                a.negative ^= 1;
              }
            }
            if (q) {
              q.words[j] = qj;
            }
          }
          if (q) {
            q.strip();
          }
          a.strip();

          // Denormalize
          if (mode !== 'div' && shift !== 0) {
            a.iushrn(shift);
          }

          return {
            div: q || null,
            mod: a
          };
        };

        // NOTE: 1) `mode` can be set to `mod` to request mod only,
        //       to `div` to request div only, or be absent to
        //       request both div & mod
        //       2) `positive` is true if unsigned mod is requested
        BN.prototype.divmod = function divmod(num, mode, positive) {
          assert(!num.isZero());

          if (this.isZero()) {
            return {
              div: new BN(0),
              mod: new BN(0)
            };
          }

          var div, mod, res;
          if (this.negative !== 0 && num.negative === 0) {
            res = this.neg().divmod(num, mode);

            if (mode !== 'mod') {
              div = res.div.neg();
            }

            if (mode !== 'div') {
              mod = res.mod.neg();
              if (positive && mod.negative !== 0) {
                mod.iadd(num);
              }
            }

            return {
              div: div,
              mod: mod
            };
          }

          if (this.negative === 0 && num.negative !== 0) {
            res = this.divmod(num.neg(), mode);

            if (mode !== 'mod') {
              div = res.div.neg();
            }

            return {
              div: div,
              mod: res.mod
            };
          }

          if ((this.negative & num.negative) !== 0) {
            res = this.neg().divmod(num.neg(), mode);

            if (mode !== 'div') {
              mod = res.mod.neg();
              if (positive && mod.negative !== 0) {
                mod.isub(num);
              }
            }

            return {
              div: res.div,
              mod: mod
            };
          }

          // Both numbers are positive at this point

          // Strip both numbers to approximate shift value
          if (num.length > this.length || this.cmp(num) < 0) {
            return {
              div: new BN(0),
              mod: this
            };
          }

          // Very short reduction
          if (num.length === 1) {
            if (mode === 'div') {
              return {
                div: this.divn(num.words[0]),
                mod: null
              };
            }

            if (mode === 'mod') {
              return {
                div: null,
                mod: new BN(this.modn(num.words[0]))
              };
            }

            return {
              div: this.divn(num.words[0]),
              mod: new BN(this.modn(num.words[0]))
            };
          }

          return this._wordDiv(num, mode);
        };

        // Find `this` / `num`
        BN.prototype.div = function div(num) {
          return this.divmod(num, 'div', false).div;
        };

        // Find `this` % `num`
        BN.prototype.mod = function mod(num) {
          return this.divmod(num, 'mod', false).mod;
        };

        BN.prototype.umod = function umod(num) {
          return this.divmod(num, 'mod', true).mod;
        };

        // Find Round(`this` / `num`)
        BN.prototype.divRound = function divRound(num) {
          var dm = this.divmod(num);

          // Fast case - exact division
          if (dm.mod.isZero()) return dm.div;

          var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

          var half = num.ushrn(1);
          var r2 = num.andln(1);
          var cmp = mod.cmp(half);

          // Round down
          if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;

          // Round up
          return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
        };

        BN.prototype.modn = function modn(num) {
          assert(num <= 0x3ffffff);
          var p = (1 << 26) % num;

          var acc = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            acc = (p * acc + (this.words[i] | 0)) % num;
          }

          return acc;
        };

        // In-place division by number
        BN.prototype.idivn = function idivn(num) {
          assert(num <= 0x3ffffff);

          var carry = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            var w = (this.words[i] | 0) + carry * 0x4000000;
            this.words[i] = w / num | 0;
            carry = w % num;
          }

          return this.strip();
        };

        BN.prototype.divn = function divn(num) {
          return this.clone().idivn(num);
        };

        BN.prototype.egcd = function egcd(p) {
          assert(p.negative === 0);
          assert(!p.isZero());

          var x = this;
          var y = p.clone();

          if (x.negative !== 0) {
            x = x.umod(p);
          } else {
            x = x.clone();
          }

          // A * x + B * y = x
          var A = new BN(1);
          var B = new BN(0);

          // C * x + D * y = y
          var C = new BN(0);
          var D = new BN(1);

          var g = 0;

          while (x.isEven() && y.isEven()) {
            x.iushrn(1);
            y.iushrn(1);
            ++g;
          }

          var yp = y.clone();
          var xp = x.clone();

          while (!x.isZero()) {
            for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1) {}
            if (i > 0) {
              x.iushrn(i);
              while (i-- > 0) {
                if (A.isOdd() || B.isOdd()) {
                  A.iadd(yp);
                  B.isub(xp);
                }

                A.iushrn(1);
                B.iushrn(1);
              }
            }

            for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) {}
            if (j > 0) {
              y.iushrn(j);
              while (j-- > 0) {
                if (C.isOdd() || D.isOdd()) {
                  C.iadd(yp);
                  D.isub(xp);
                }

                C.iushrn(1);
                D.iushrn(1);
              }
            }

            if (x.cmp(y) >= 0) {
              x.isub(y);
              A.isub(C);
              B.isub(D);
            } else {
              y.isub(x);
              C.isub(A);
              D.isub(B);
            }
          }

          return {
            a: C,
            b: D,
            gcd: y.iushln(g)
          };
        };

        // This is reduced incarnation of the binary EEA
        // above, designated to invert members of the
        // _prime_ fields F(p) at a maximal speed
        BN.prototype._invmp = function _invmp(p) {
          assert(p.negative === 0);
          assert(!p.isZero());

          var a = this;
          var b = p.clone();

          if (a.negative !== 0) {
            a = a.umod(p);
          } else {
            a = a.clone();
          }

          var x1 = new BN(1);
          var x2 = new BN(0);

          var delta = b.clone();

          while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
            for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1) {}
            if (i > 0) {
              a.iushrn(i);
              while (i-- > 0) {
                if (x1.isOdd()) {
                  x1.iadd(delta);
                }

                x1.iushrn(1);
              }
            }

            for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) {}
            if (j > 0) {
              b.iushrn(j);
              while (j-- > 0) {
                if (x2.isOdd()) {
                  x2.iadd(delta);
                }

                x2.iushrn(1);
              }
            }

            if (a.cmp(b) >= 0) {
              a.isub(b);
              x1.isub(x2);
            } else {
              b.isub(a);
              x2.isub(x1);
            }
          }

          var res;
          if (a.cmpn(1) === 0) {
            res = x1;
          } else {
            res = x2;
          }

          if (res.cmpn(0) < 0) {
            res.iadd(p);
          }

          return res;
        };

        BN.prototype.gcd = function gcd(num) {
          if (this.isZero()) return num.abs();
          if (num.isZero()) return this.abs();

          var a = this.clone();
          var b = num.clone();
          a.negative = 0;
          b.negative = 0;

          // Remove common factor of two
          for (var shift = 0; a.isEven() && b.isEven(); shift++) {
            a.iushrn(1);
            b.iushrn(1);
          }

          do {
            while (a.isEven()) {
              a.iushrn(1);
            }
            while (b.isEven()) {
              b.iushrn(1);
            }

            var r = a.cmp(b);
            if (r < 0) {
              // Swap `a` and `b` to make `a` always bigger than `b`
              var t = a;
              a = b;
              b = t;
            } else if (r === 0 || b.cmpn(1) === 0) {
              break;
            }

            a.isub(b);
          } while (true);

          return b.iushln(shift);
        };

        // Invert number in the field F(num)
        BN.prototype.invm = function invm(num) {
          return this.egcd(num).a.umod(num);
        };

        BN.prototype.isEven = function isEven() {
          return (this.words[0] & 1) === 0;
        };

        BN.prototype.isOdd = function isOdd() {
          return (this.words[0] & 1) === 1;
        };

        // And first word and num
        BN.prototype.andln = function andln(num) {
          return this.words[0] & num;
        };

        // Increment at the bit position in-line
        BN.prototype.bincn = function bincn(bit) {
          assert(typeof bit === 'number');
          var r = bit % 26;
          var s = (bit - r) / 26;
          var q = 1 << r;

          // Fast case: bit is much higher than all existing words
          if (this.length <= s) {
            this._expand(s + 1);
            this.words[s] |= q;
            return this;
          }

          // Add bit and propagate, if needed
          var carry = q;
          for (var i = s; carry !== 0 && i < this.length; i++) {
            var w = this.words[i] | 0;
            w += carry;
            carry = w >>> 26;
            w &= 0x3ffffff;
            this.words[i] = w;
          }
          if (carry !== 0) {
            this.words[i] = carry;
            this.length++;
          }
          return this;
        };

        BN.prototype.isZero = function isZero() {
          return this.length === 1 && this.words[0] === 0;
        };

        BN.prototype.cmpn = function cmpn(num) {
          var negative = num < 0;

          if (this.negative !== 0 && !negative) return -1;
          if (this.negative === 0 && negative) return 1;

          this.strip();

          var res;
          if (this.length > 1) {
            res = 1;
          } else {
            if (negative) {
              num = -num;
            }

            assert(num <= 0x3ffffff, 'Number is too big');

            var w = this.words[0] | 0;
            res = w === num ? 0 : w < num ? -1 : 1;
          }
          if (this.negative !== 0) return -res | 0;
          return res;
        };

        // Compare two numbers and return:
        // 1 - if `this` > `num`
        // 0 - if `this` == `num`
        // -1 - if `this` < `num`
        BN.prototype.cmp = function cmp(num) {
          if (this.negative !== 0 && num.negative === 0) return -1;
          if (this.negative === 0 && num.negative !== 0) return 1;

          var res = this.ucmp(num);
          if (this.negative !== 0) return -res | 0;
          return res;
        };

        // Unsigned comparison
        BN.prototype.ucmp = function ucmp(num) {
          // At this point both numbers have the same sign
          if (this.length > num.length) return 1;
          if (this.length < num.length) return -1;

          var res = 0;
          for (var i = this.length - 1; i >= 0; i--) {
            var a = this.words[i] | 0;
            var b = num.words[i] | 0;

            if (a === b) continue;
            if (a < b) {
              res = -1;
            } else if (a > b) {
              res = 1;
            }
            break;
          }
          return res;
        };

        BN.prototype.gtn = function gtn(num) {
          return this.cmpn(num) === 1;
        };

        BN.prototype.gt = function gt(num) {
          return this.cmp(num) === 1;
        };

        BN.prototype.gten = function gten(num) {
          return this.cmpn(num) >= 0;
        };

        BN.prototype.gte = function gte(num) {
          return this.cmp(num) >= 0;
        };

        BN.prototype.ltn = function ltn(num) {
          return this.cmpn(num) === -1;
        };

        BN.prototype.lt = function lt(num) {
          return this.cmp(num) === -1;
        };

        BN.prototype.lten = function lten(num) {
          return this.cmpn(num) <= 0;
        };

        BN.prototype.lte = function lte(num) {
          return this.cmp(num) <= 0;
        };

        BN.prototype.eqn = function eqn(num) {
          return this.cmpn(num) === 0;
        };

        BN.prototype.eq = function eq(num) {
          return this.cmp(num) === 0;
        };

        //
        // A reduce context, could be using montgomery or something better, depending
        // on the `m` itself.
        //
        BN.red = function red(num) {
          return new Red(num);
        };

        BN.prototype.toRed = function toRed(ctx) {
          assert(!this.red, 'Already a number in reduction context');
          assert(this.negative === 0, 'red works only with positives');
          return ctx.convertTo(this)._forceRed(ctx);
        };

        BN.prototype.fromRed = function fromRed() {
          assert(this.red, 'fromRed works only with numbers in reduction context');
          return this.red.convertFrom(this);
        };

        BN.prototype._forceRed = function _forceRed(ctx) {
          this.red = ctx;
          return this;
        };

        BN.prototype.forceRed = function forceRed(ctx) {
          assert(!this.red, 'Already a number in reduction context');
          return this._forceRed(ctx);
        };

        BN.prototype.redAdd = function redAdd(num) {
          assert(this.red, 'redAdd works only with red numbers');
          return this.red.add(this, num);
        };

        BN.prototype.redIAdd = function redIAdd(num) {
          assert(this.red, 'redIAdd works only with red numbers');
          return this.red.iadd(this, num);
        };

        BN.prototype.redSub = function redSub(num) {
          assert(this.red, 'redSub works only with red numbers');
          return this.red.sub(this, num);
        };

        BN.prototype.redISub = function redISub(num) {
          assert(this.red, 'redISub works only with red numbers');
          return this.red.isub(this, num);
        };

        BN.prototype.redShl = function redShl(num) {
          assert(this.red, 'redShl works only with red numbers');
          return this.red.shl(this, num);
        };

        BN.prototype.redMul = function redMul(num) {
          assert(this.red, 'redMul works only with red numbers');
          this.red._verify2(this, num);
          return this.red.mul(this, num);
        };

        BN.prototype.redIMul = function redIMul(num) {
          assert(this.red, 'redMul works only with red numbers');
          this.red._verify2(this, num);
          return this.red.imul(this, num);
        };

        BN.prototype.redSqr = function redSqr() {
          assert(this.red, 'redSqr works only with red numbers');
          this.red._verify1(this);
          return this.red.sqr(this);
        };

        BN.prototype.redISqr = function redISqr() {
          assert(this.red, 'redISqr works only with red numbers');
          this.red._verify1(this);
          return this.red.isqr(this);
        };

        // Square root over p
        BN.prototype.redSqrt = function redSqrt() {
          assert(this.red, 'redSqrt works only with red numbers');
          this.red._verify1(this);
          return this.red.sqrt(this);
        };

        BN.prototype.redInvm = function redInvm() {
          assert(this.red, 'redInvm works only with red numbers');
          this.red._verify1(this);
          return this.red.invm(this);
        };

        // Return negative clone of `this` % `red modulo`
        BN.prototype.redNeg = function redNeg() {
          assert(this.red, 'redNeg works only with red numbers');
          this.red._verify1(this);
          return this.red.neg(this);
        };

        BN.prototype.redPow = function redPow(num) {
          assert(this.red && !num.red, 'redPow(normalNum)');
          this.red._verify1(this);
          return this.red.pow(this, num);
        };

        // Prime numbers with efficient reduction
        var primes = {
          k256: null,
          p224: null,
          p192: null,
          p25519: null
        };

        // Pseudo-Mersenne prime
        function MPrime(name, p) {
          // P = 2 ^ N - K
          this.name = name;
          this.p = new BN(p, 16);
          this.n = this.p.bitLength();
          this.k = new BN(1).iushln(this.n).isub(this.p);

          this.tmp = this._tmp();
        }

        MPrime.prototype._tmp = function _tmp() {
          var tmp = new BN(null);
          tmp.words = new Array(Math.ceil(this.n / 13));
          return tmp;
        };

        MPrime.prototype.ireduce = function ireduce(num) {
          // Assumes that `num` is less than `P^2`
          // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
          var r = num;
          var rlen;

          do {
            this.split(r, this.tmp);
            r = this.imulK(r);
            r = r.iadd(this.tmp);
            rlen = r.bitLength();
          } while (rlen > this.n);

          var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
          if (cmp === 0) {
            r.words[0] = 0;
            r.length = 1;
          } else if (cmp > 0) {
            r.isub(this.p);
          } else {
            r.strip();
          }

          return r;
        };

        MPrime.prototype.split = function split(input, out) {
          input.iushrn(this.n, 0, out);
        };

        MPrime.prototype.imulK = function imulK(num) {
          return num.imul(this.k);
        };

        function K256() {
          MPrime.call(this, 'k256', 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
        }
        inherits(K256, MPrime);

        K256.prototype.split = function split(input, output) {
          // 256 = 9 * 26 + 22
          var mask = 0x3fffff;

          var outLen = Math.min(input.length, 9);
          for (var i = 0; i < outLen; i++) {
            output.words[i] = input.words[i];
          }
          output.length = outLen;

          if (input.length <= 9) {
            input.words[0] = 0;
            input.length = 1;
            return;
          }

          // Shift by 9 limbs
          var prev = input.words[9];
          output.words[output.length++] = prev & mask;

          for (i = 10; i < input.length; i++) {
            var next = input.words[i] | 0;
            input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
            prev = next;
          }
          prev >>>= 22;
          input.words[i - 10] = prev;
          if (prev === 0 && input.length > 10) {
            input.length -= 10;
          } else {
            input.length -= 9;
          }
        };

        K256.prototype.imulK = function imulK(num) {
          // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
          num.words[num.length] = 0;
          num.words[num.length + 1] = 0;
          num.length += 2;

          // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
          var lo = 0;
          for (var i = 0; i < num.length; i++) {
            var w = num.words[i] | 0;
            lo += w * 0x3d1;
            num.words[i] = lo & 0x3ffffff;
            lo = w * 0x40 + (lo / 0x4000000 | 0);
          }

          // Fast length reduction
          if (num.words[num.length - 1] === 0) {
            num.length--;
            if (num.words[num.length - 1] === 0) {
              num.length--;
            }
          }
          return num;
        };

        function P224() {
          MPrime.call(this, 'p224', 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
        }
        inherits(P224, MPrime);

        function P192() {
          MPrime.call(this, 'p192', 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
        }
        inherits(P192, MPrime);

        function P25519() {
          // 2 ^ 255 - 19
          MPrime.call(this, '25519', '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
        }
        inherits(P25519, MPrime);

        P25519.prototype.imulK = function imulK(num) {
          // K = 0x13
          var carry = 0;
          for (var i = 0; i < num.length; i++) {
            var hi = (num.words[i] | 0) * 0x13 + carry;
            var lo = hi & 0x3ffffff;
            hi >>>= 26;

            num.words[i] = lo;
            carry = hi;
          }
          if (carry !== 0) {
            num.words[num.length++] = carry;
          }
          return num;
        };

        // Exported mostly for testing purposes, use plain name instead
        BN._prime = function prime(name) {
          // Cached version of prime
          if (primes[name]) return primes[name];

          var prime;
          if (name === 'k256') {
            prime = new K256();
          } else if (name === 'p224') {
            prime = new P224();
          } else if (name === 'p192') {
            prime = new P192();
          } else if (name === 'p25519') {
            prime = new P25519();
          } else {
            throw new Error('Unknown prime ' + name);
          }
          primes[name] = prime;

          return prime;
        };

        //
        // Base reduction engine
        //
        function Red(m) {
          if (typeof m === 'string') {
            var prime = BN._prime(m);
            this.m = prime.p;
            this.prime = prime;
          } else {
            assert(m.gtn(1), 'modulus must be greater than 1');
            this.m = m;
            this.prime = null;
          }
        }

        Red.prototype._verify1 = function _verify1(a) {
          assert(a.negative === 0, 'red works only with positives');
          assert(a.red, 'red works only with red numbers');
        };

        Red.prototype._verify2 = function _verify2(a, b) {
          assert((a.negative | b.negative) === 0, 'red works only with positives');
          assert(a.red && a.red === b.red, 'red works only with red numbers');
        };

        Red.prototype.imod = function imod(a) {
          if (this.prime) return this.prime.ireduce(a)._forceRed(this);
          return a.umod(this.m)._forceRed(this);
        };

        Red.prototype.neg = function neg(a) {
          if (a.isZero()) {
            return a.clone();
          }

          return this.m.sub(a)._forceRed(this);
        };

        Red.prototype.add = function add(a, b) {
          this._verify2(a, b);

          var res = a.add(b);
          if (res.cmp(this.m) >= 0) {
            res.isub(this.m);
          }
          return res._forceRed(this);
        };

        Red.prototype.iadd = function iadd(a, b) {
          this._verify2(a, b);

          var res = a.iadd(b);
          if (res.cmp(this.m) >= 0) {
            res.isub(this.m);
          }
          return res;
        };

        Red.prototype.sub = function sub(a, b) {
          this._verify2(a, b);

          var res = a.sub(b);
          if (res.cmpn(0) < 0) {
            res.iadd(this.m);
          }
          return res._forceRed(this);
        };

        Red.prototype.isub = function isub(a, b) {
          this._verify2(a, b);

          var res = a.isub(b);
          if (res.cmpn(0) < 0) {
            res.iadd(this.m);
          }
          return res;
        };

        Red.prototype.shl = function shl(a, num) {
          this._verify1(a);
          return this.imod(a.ushln(num));
        };

        Red.prototype.imul = function imul(a, b) {
          this._verify2(a, b);
          return this.imod(a.imul(b));
        };

        Red.prototype.mul = function mul(a, b) {
          this._verify2(a, b);
          return this.imod(a.mul(b));
        };

        Red.prototype.isqr = function isqr(a) {
          return this.imul(a, a.clone());
        };

        Red.prototype.sqr = function sqr(a) {
          return this.mul(a, a);
        };

        Red.prototype.sqrt = function sqrt(a) {
          if (a.isZero()) return a.clone();

          var mod3 = this.m.andln(3);
          assert(mod3 % 2 === 1);

          // Fast case
          if (mod3 === 3) {
            var pow = this.m.add(new BN(1)).iushrn(2);
            return this.pow(a, pow);
          }

          // Tonelli-Shanks algorithm (Totally unoptimized and slow)
          //
          // Find Q and S, that Q * 2 ^ S = (P - 1)
          var q = this.m.subn(1);
          var s = 0;
          while (!q.isZero() && q.andln(1) === 0) {
            s++;
            q.iushrn(1);
          }
          assert(!q.isZero());

          var one = new BN(1).toRed(this);
          var nOne = one.redNeg();

          // Find quadratic non-residue
          // NOTE: Max is such because of generalized Riemann hypothesis.
          var lpow = this.m.subn(1).iushrn(1);
          var z = this.m.bitLength();
          z = new BN(2 * z * z).toRed(this);

          while (this.pow(z, lpow).cmp(nOne) !== 0) {
            z.redIAdd(nOne);
          }

          var c = this.pow(z, q);
          var r = this.pow(a, q.addn(1).iushrn(1));
          var t = this.pow(a, q);
          var m = s;
          while (t.cmp(one) !== 0) {
            var tmp = t;
            for (var i = 0; tmp.cmp(one) !== 0; i++) {
              tmp = tmp.redSqr();
            }
            assert(i < m);
            var b = this.pow(c, new BN(1).iushln(m - i - 1));

            r = r.redMul(b);
            c = b.redSqr();
            t = t.redMul(c);
            m = i;
          }

          return r;
        };

        Red.prototype.invm = function invm(a) {
          var inv = a._invmp(this.m);
          if (inv.negative !== 0) {
            inv.negative = 0;
            return this.imod(inv).redNeg();
          } else {
            return this.imod(inv);
          }
        };

        Red.prototype.pow = function pow(a, num) {
          if (num.isZero()) return new BN(1);
          if (num.cmpn(1) === 0) return a.clone();

          var windowSize = 4;
          var wnd = new Array(1 << windowSize);
          wnd[0] = new BN(1).toRed(this);
          wnd[1] = a;
          for (var i = 2; i < wnd.length; i++) {
            wnd[i] = this.mul(wnd[i - 1], a);
          }

          var res = wnd[0];
          var current = 0;
          var currentLen = 0;
          var start = num.bitLength() % 26;
          if (start === 0) {
            start = 26;
          }

          for (i = num.length - 1; i >= 0; i--) {
            var word = num.words[i];
            for (var j = start - 1; j >= 0; j--) {
              var bit = word >> j & 1;
              if (res !== wnd[0]) {
                res = this.sqr(res);
              }

              if (bit === 0 && current === 0) {
                currentLen = 0;
                continue;
              }

              current <<= 1;
              current |= bit;
              currentLen++;
              if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

              res = this.mul(res, wnd[current]);
              currentLen = 0;
              current = 0;
            }
            start = 26;
          }

          return res;
        };

        Red.prototype.convertTo = function convertTo(num) {
          var r = num.umod(this.m);

          return r === num ? r.clone() : r;
        };

        Red.prototype.convertFrom = function convertFrom(num) {
          var res = num.clone();
          res.red = null;
          return res;
        };

        //
        // Montgomery method engine
        //

        BN.mont = function mont(num) {
          return new Mont(num);
        };

        function Mont(m) {
          Red.call(this, m);

          this.shift = this.m.bitLength();
          if (this.shift % 26 !== 0) {
            this.shift += 26 - this.shift % 26;
          }

          this.r = new BN(1).iushln(this.shift);
          this.r2 = this.imod(this.r.sqr());
          this.rinv = this.r._invmp(this.m);

          this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
          this.minv = this.minv.umod(this.r);
          this.minv = this.r.sub(this.minv);
        }
        inherits(Mont, Red);

        Mont.prototype.convertTo = function convertTo(num) {
          return this.imod(num.ushln(this.shift));
        };

        Mont.prototype.convertFrom = function convertFrom(num) {
          var r = this.imod(num.mul(this.rinv));
          r.red = null;
          return r;
        };

        Mont.prototype.imul = function imul(a, b) {
          if (a.isZero() || b.isZero()) {
            a.words[0] = 0;
            a.length = 1;
            return a;
          }

          var t = a.imul(b);
          var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
          var u = t.isub(c).iushrn(this.shift);
          var res = u;

          if (u.cmp(this.m) >= 0) {
            res = u.isub(this.m);
          } else if (u.cmpn(0) < 0) {
            res = u.iadd(this.m);
          }

          return res._forceRed(this);
        };

        Mont.prototype.mul = function mul(a, b) {
          if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

          var t = a.mul(b);
          var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
          var u = t.isub(c).iushrn(this.shift);
          var res = u;
          if (u.cmp(this.m) >= 0) {
            res = u.isub(this.m);
          } else if (u.cmpn(0) < 0) {
            res = u.iadd(this.m);
          }

          return res._forceRed(this);
        };

        Mont.prototype.invm = function invm(a) {
          // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
          var res = this.imod(a._invmp(this.m).mul(this.r2));
          return res._forceRed(this);
        };
      })(typeof module === 'undefined' || module, this);
    }, {}], 10: [function (require, module, exports) {
      // This was ported from https://github.com/emn178/js-sha3, with some minor
      // modifications and pruning. It is licensed under MIT:
      //
      // Copyright 2015-2016 Chen, Yi-Cyuan
      //  
      // Permission is hereby granted, free of charge, to any person obtaining
      // a copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to
      // permit persons to whom the Software is furnished to do so, subject to
      // the following conditions:
      // 
      // The above copyright notice and this permission notice shall be
      // included in all copies or substantial portions of the Software.
      // 
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
      // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
      // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
      // LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
      // OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
      // WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

      var HEX_CHARS = '0123456789abcdef'.split('');
      var KECCAK_PADDING = [1, 256, 65536, 16777216];
      var SHIFT = [0, 8, 16, 24];
      var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0, 2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648, 2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];

      var Keccak = function Keccak(bits) {
        return {
          blocks: [],
          reset: true,
          block: 0,
          start: 0,
          blockCount: 1600 - (bits << 1) >> 5,
          outputBlocks: bits >> 5,
          s: function (s) {
            return [].concat(s, s, s, s, s);
          }([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        };
      };

      var update = function update(state, message) {
        var length = message.length,
            blocks = state.blocks,
            byteCount = state.blockCount << 2,
            blockCount = state.blockCount,
            outputBlocks = state.outputBlocks,
            s = state.s,
            index = 0,
            i,
            code;

        // update
        while (index < length) {
          if (state.reset) {
            state.reset = false;
            blocks[0] = state.block;
            for (i = 1; i < blockCount + 1; ++i) {
              blocks[i] = 0;
            }
          }
          if (typeof message !== "string") {
            for (i = state.start; index < length && i < byteCount; ++index) {
              blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
            }
          } else {
            for (i = state.start; index < length && i < byteCount; ++index) {
              code = message.charCodeAt(index);
              if (code < 0x80) {
                blocks[i >> 2] |= code << SHIFT[i++ & 3];
              } else if (code < 0x800) {
                blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
              } else if (code < 0xd800 || code >= 0xe000) {
                blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
              } else {
                code = 0x10000 + ((code & 0x3ff) << 10 | message.charCodeAt(++index) & 0x3ff);
                blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
              }
            }
          }
          state.lastByteIndex = i;
          if (i >= byteCount) {
            state.start = i - byteCount;
            state.block = blocks[blockCount];
            for (i = 0; i < blockCount; ++i) {
              s[i] ^= blocks[i];
            }
            f(s);
            state.reset = true;
          } else {
            state.start = i;
          }
        }

        // finalize
        i = state.lastByteIndex;
        blocks[i >> 2] |= KECCAK_PADDING[i & 3];
        if (state.lastByteIndex === byteCount) {
          blocks[0] = blocks[blockCount];
          for (i = 1; i < blockCount + 1; ++i) {
            blocks[i] = 0;
          }
        }
        blocks[blockCount - 1] |= 0x80000000;
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        f(s);

        // toString
        var hex = '',
            i = 0,
            j = 0,
            block;
        while (j < outputBlocks) {
          for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
            block = s[i];
            hex += HEX_CHARS[block >> 4 & 0x0F] + HEX_CHARS[block & 0x0F] + HEX_CHARS[block >> 12 & 0x0F] + HEX_CHARS[block >> 8 & 0x0F] + HEX_CHARS[block >> 20 & 0x0F] + HEX_CHARS[block >> 16 & 0x0F] + HEX_CHARS[block >> 28 & 0x0F] + HEX_CHARS[block >> 24 & 0x0F];
          }
          if (j % blockCount === 0) {
            f(s);
            i = 0;
          }
        }
        return "0x" + hex;
      };

      var f = function f(s) {
        var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33, b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;

        for (n = 0; n < 48; n += 2) {
          c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
          c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
          c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
          c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
          c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
          c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
          c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
          c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
          c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
          c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

          h = c8 ^ (c2 << 1 | c3 >>> 31);
          l = c9 ^ (c3 << 1 | c2 >>> 31);
          s[0] ^= h;
          s[1] ^= l;
          s[10] ^= h;
          s[11] ^= l;
          s[20] ^= h;
          s[21] ^= l;
          s[30] ^= h;
          s[31] ^= l;
          s[40] ^= h;
          s[41] ^= l;
          h = c0 ^ (c4 << 1 | c5 >>> 31);
          l = c1 ^ (c5 << 1 | c4 >>> 31);
          s[2] ^= h;
          s[3] ^= l;
          s[12] ^= h;
          s[13] ^= l;
          s[22] ^= h;
          s[23] ^= l;
          s[32] ^= h;
          s[33] ^= l;
          s[42] ^= h;
          s[43] ^= l;
          h = c2 ^ (c6 << 1 | c7 >>> 31);
          l = c3 ^ (c7 << 1 | c6 >>> 31);
          s[4] ^= h;
          s[5] ^= l;
          s[14] ^= h;
          s[15] ^= l;
          s[24] ^= h;
          s[25] ^= l;
          s[34] ^= h;
          s[35] ^= l;
          s[44] ^= h;
          s[45] ^= l;
          h = c4 ^ (c8 << 1 | c9 >>> 31);
          l = c5 ^ (c9 << 1 | c8 >>> 31);
          s[6] ^= h;
          s[7] ^= l;
          s[16] ^= h;
          s[17] ^= l;
          s[26] ^= h;
          s[27] ^= l;
          s[36] ^= h;
          s[37] ^= l;
          s[46] ^= h;
          s[47] ^= l;
          h = c6 ^ (c0 << 1 | c1 >>> 31);
          l = c7 ^ (c1 << 1 | c0 >>> 31);
          s[8] ^= h;
          s[9] ^= l;
          s[18] ^= h;
          s[19] ^= l;
          s[28] ^= h;
          s[29] ^= l;
          s[38] ^= h;
          s[39] ^= l;
          s[48] ^= h;
          s[49] ^= l;

          b0 = s[0];
          b1 = s[1];
          b32 = s[11] << 4 | s[10] >>> 28;
          b33 = s[10] << 4 | s[11] >>> 28;
          b14 = s[20] << 3 | s[21] >>> 29;
          b15 = s[21] << 3 | s[20] >>> 29;
          b46 = s[31] << 9 | s[30] >>> 23;
          b47 = s[30] << 9 | s[31] >>> 23;
          b28 = s[40] << 18 | s[41] >>> 14;
          b29 = s[41] << 18 | s[40] >>> 14;
          b20 = s[2] << 1 | s[3] >>> 31;
          b21 = s[3] << 1 | s[2] >>> 31;
          b2 = s[13] << 12 | s[12] >>> 20;
          b3 = s[12] << 12 | s[13] >>> 20;
          b34 = s[22] << 10 | s[23] >>> 22;
          b35 = s[23] << 10 | s[22] >>> 22;
          b16 = s[33] << 13 | s[32] >>> 19;
          b17 = s[32] << 13 | s[33] >>> 19;
          b48 = s[42] << 2 | s[43] >>> 30;
          b49 = s[43] << 2 | s[42] >>> 30;
          b40 = s[5] << 30 | s[4] >>> 2;
          b41 = s[4] << 30 | s[5] >>> 2;
          b22 = s[14] << 6 | s[15] >>> 26;
          b23 = s[15] << 6 | s[14] >>> 26;
          b4 = s[25] << 11 | s[24] >>> 21;
          b5 = s[24] << 11 | s[25] >>> 21;
          b36 = s[34] << 15 | s[35] >>> 17;
          b37 = s[35] << 15 | s[34] >>> 17;
          b18 = s[45] << 29 | s[44] >>> 3;
          b19 = s[44] << 29 | s[45] >>> 3;
          b10 = s[6] << 28 | s[7] >>> 4;
          b11 = s[7] << 28 | s[6] >>> 4;
          b42 = s[17] << 23 | s[16] >>> 9;
          b43 = s[16] << 23 | s[17] >>> 9;
          b24 = s[26] << 25 | s[27] >>> 7;
          b25 = s[27] << 25 | s[26] >>> 7;
          b6 = s[36] << 21 | s[37] >>> 11;
          b7 = s[37] << 21 | s[36] >>> 11;
          b38 = s[47] << 24 | s[46] >>> 8;
          b39 = s[46] << 24 | s[47] >>> 8;
          b30 = s[8] << 27 | s[9] >>> 5;
          b31 = s[9] << 27 | s[8] >>> 5;
          b12 = s[18] << 20 | s[19] >>> 12;
          b13 = s[19] << 20 | s[18] >>> 12;
          b44 = s[29] << 7 | s[28] >>> 25;
          b45 = s[28] << 7 | s[29] >>> 25;
          b26 = s[38] << 8 | s[39] >>> 24;
          b27 = s[39] << 8 | s[38] >>> 24;
          b8 = s[48] << 14 | s[49] >>> 18;
          b9 = s[49] << 14 | s[48] >>> 18;

          s[0] = b0 ^ ~b2 & b4;
          s[1] = b1 ^ ~b3 & b5;
          s[10] = b10 ^ ~b12 & b14;
          s[11] = b11 ^ ~b13 & b15;
          s[20] = b20 ^ ~b22 & b24;
          s[21] = b21 ^ ~b23 & b25;
          s[30] = b30 ^ ~b32 & b34;
          s[31] = b31 ^ ~b33 & b35;
          s[40] = b40 ^ ~b42 & b44;
          s[41] = b41 ^ ~b43 & b45;
          s[2] = b2 ^ ~b4 & b6;
          s[3] = b3 ^ ~b5 & b7;
          s[12] = b12 ^ ~b14 & b16;
          s[13] = b13 ^ ~b15 & b17;
          s[22] = b22 ^ ~b24 & b26;
          s[23] = b23 ^ ~b25 & b27;
          s[32] = b32 ^ ~b34 & b36;
          s[33] = b33 ^ ~b35 & b37;
          s[42] = b42 ^ ~b44 & b46;
          s[43] = b43 ^ ~b45 & b47;
          s[4] = b4 ^ ~b6 & b8;
          s[5] = b5 ^ ~b7 & b9;
          s[14] = b14 ^ ~b16 & b18;
          s[15] = b15 ^ ~b17 & b19;
          s[24] = b24 ^ ~b26 & b28;
          s[25] = b25 ^ ~b27 & b29;
          s[34] = b34 ^ ~b36 & b38;
          s[35] = b35 ^ ~b37 & b39;
          s[44] = b44 ^ ~b46 & b48;
          s[45] = b45 ^ ~b47 & b49;
          s[6] = b6 ^ ~b8 & b0;
          s[7] = b7 ^ ~b9 & b1;
          s[16] = b16 ^ ~b18 & b10;
          s[17] = b17 ^ ~b19 & b11;
          s[26] = b26 ^ ~b28 & b20;
          s[27] = b27 ^ ~b29 & b21;
          s[36] = b36 ^ ~b38 & b30;
          s[37] = b37 ^ ~b39 & b31;
          s[46] = b46 ^ ~b48 & b40;
          s[47] = b47 ^ ~b49 & b41;
          s[8] = b8 ^ ~b0 & b2;
          s[9] = b9 ^ ~b1 & b3;
          s[18] = b18 ^ ~b10 & b12;
          s[19] = b19 ^ ~b11 & b13;
          s[28] = b28 ^ ~b20 & b22;
          s[29] = b29 ^ ~b21 & b23;
          s[38] = b38 ^ ~b30 & b32;
          s[39] = b39 ^ ~b31 & b33;
          s[48] = b48 ^ ~b40 & b42;
          s[49] = b49 ^ ~b41 & b43;

          s[0] ^= RC[n];
          s[1] ^= RC[n + 1];
        }
      };

      var keccak = function keccak(bits) {
        return function (str) {
          var msg;
          if (str.slice(0, 2) === "0x") {
            msg = [];
            for (var i = 2, l = str.length; i < l; i += 2) {
              msg.push(parseInt(str.slice(i, i + 2), 16));
            }
          } else {
            msg = str;
          }
          return update(Keccak(bits, bits), msg);
        };
      };

      module.exports = {
        keccak256: keccak(256),
        keccak512: keccak(512),
        keccak256s: keccak(256),
        keccak512s: keccak(512)
      };
    }, {}], 11: [function (require, module, exports) {
      'use strict';

      var BN = require('bn.js');
      var numberToBN = require('number-to-bn');

      var zero = new BN(0);
      var negative1 = new BN(-1);

      // complete ethereum unit map
      var unitMap = {
        'noether': '0', // eslint-disable-line
        'wei': '1', // eslint-disable-line
        'kwei': '1000', // eslint-disable-line
        'Kwei': '1000', // eslint-disable-line
        'babbage': '1000', // eslint-disable-line
        'femtoether': '1000', // eslint-disable-line
        'mwei': '1000000', // eslint-disable-line
        'Mwei': '1000000', // eslint-disable-line
        'lovelace': '1000000', // eslint-disable-line
        'picoether': '1000000', // eslint-disable-line
        'gwei': '1000000000', // eslint-disable-line
        'Gwei': '1000000000', // eslint-disable-line
        'shannon': '1000000000', // eslint-disable-line
        'nanoether': '1000000000', // eslint-disable-line
        'nano': '1000000000', // eslint-disable-line
        'szabo': '1000000000000', // eslint-disable-line
        'microether': '1000000000000', // eslint-disable-line
        'micro': '1000000000000', // eslint-disable-line
        'finney': '1000000000000000', // eslint-disable-line
        'milliether': '1000000000000000', // eslint-disable-line
        'milli': '1000000000000000', // eslint-disable-line
        'ether': '1000000000000000000', // eslint-disable-line
        'kether': '1000000000000000000000', // eslint-disable-line
        'grand': '1000000000000000000000', // eslint-disable-line
        'mether': '1000000000000000000000000', // eslint-disable-line
        'gether': '1000000000000000000000000000', // eslint-disable-line
        'tether': '1000000000000000000000000000000' };

      /**
       * Returns value of unit in Wei
       *
       * @method getValueOfUnit
       * @param {String} unit the unit to convert to, default ether
       * @returns {BigNumber} value of the unit (in Wei)
       * @throws error if the unit is not correct:w
       */
      function getValueOfUnit(unitInput) {
        var unit = unitInput ? unitInput.toLowerCase() : 'ether';
        var unitValue = unitMap[unit]; // eslint-disable-line

        if (typeof unitValue !== 'string') {
          throw new Error('[ethjs-unit] the unit provided ' + unitInput + ' doesn\'t exists, please use the one of the following units ' + JSON.stringify(unitMap, null, 2));
        }

        return new BN(unitValue, 10);
      }

      function numberToString(arg) {
        if (typeof arg === 'string') {
          if (!arg.match(/^-?[0-9.]+$/)) {
            throw new Error('while converting number to string, invalid number value \'' + arg + '\', should be a number matching (^-?[0-9.]+).');
          }
          return arg;
        } else if (typeof arg === 'number') {
          return String(arg);
        } else if ((typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && arg.toString && (arg.toTwos || arg.dividedToIntegerBy)) {
          if (arg.toPrecision) {
            return String(arg.toPrecision());
          } else {
            // eslint-disable-line
            return arg.toString(10);
          }
        }
        throw new Error('while converting number to string, invalid number value \'' + arg + '\' type ' + (typeof arg === "undefined" ? "undefined" : _typeof(arg)) + '.');
      }

      function fromWei(weiInput, unit, optionsInput) {
        var wei = numberToBN(weiInput); // eslint-disable-line
        var negative = wei.lt(zero); // eslint-disable-line
        var base = getValueOfUnit(unit);
        var baseLength = unitMap[unit].length - 1 || 1;
        var options = optionsInput || {};

        if (negative) {
          wei = wei.mul(negative1);
        }

        var fraction = wei.mod(base).toString(10); // eslint-disable-line

        while (fraction.length < baseLength) {
          fraction = '0' + fraction;
        }

        if (!options.pad) {
          fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
        }

        var whole = wei.div(base).toString(10); // eslint-disable-line

        if (options.commify) {
          whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        var value = '' + whole + (fraction == '0' ? '' : '.' + fraction); // eslint-disable-line

        if (negative) {
          value = '-' + value;
        }

        return value;
      }

      function toWei(etherInput, unit) {
        var ether = numberToString(etherInput); // eslint-disable-line
        var base = getValueOfUnit(unit);
        var baseLength = unitMap[unit].length - 1 || 1;

        // Is it negative?
        var negative = ether.substring(0, 1) === '-'; // eslint-disable-line
        if (negative) {
          ether = ether.substring(1);
        }

        if (ether === '.') {
          throw new Error('[ethjs-unit] while converting number ' + etherInput + ' to wei, invalid value');
        }

        // Split it into a whole and fractional part
        var comps = ether.split('.'); // eslint-disable-line
        if (comps.length > 2) {
          throw new Error('[ethjs-unit] while converting number ' + etherInput + ' to wei,  too many decimal points');
        }

        var whole = comps[0],
            fraction = comps[1]; // eslint-disable-line

        if (!whole) {
          whole = '0';
        }
        if (!fraction) {
          fraction = '0';
        }
        if (fraction.length > baseLength) {
          throw new Error('[ethjs-unit] while converting number ' + etherInput + ' to wei, too many decimal places');
        }

        while (fraction.length < baseLength) {
          fraction += '0';
        }

        whole = new BN(whole);
        fraction = new BN(fraction);
        var wei = whole.mul(base).add(fraction); // eslint-disable-line

        if (negative) {
          wei = wei.mul(negative1);
        }

        return new BN(wei.toString(10), 10);
      }

      module.exports = {
        unitMap: unitMap,
        numberToString: numberToString,
        getValueOfUnit: getValueOfUnit,
        fromWei: fromWei,
        toWei: toWei
      };
    }, { "bn.js": 9, "number-to-bn": 13 }], 12: [function (require, module, exports) {
      /**
       * Returns a `Boolean` on whether or not the a `String` starts with '0x'
       * @param {String} str the string input value
       * @return {Boolean} a boolean if it is or is not hex prefixed
       * @throws if the str input is not a string
       */
      module.exports = function isHexPrefixed(str) {
        if (typeof str !== 'string') {
          throw new Error("[is-hex-prefixed] value must be type 'string', is currently type " + (typeof str === "undefined" ? "undefined" : _typeof(str)) + ", while checking isHexPrefixed.");
        }

        return str.slice(0, 2) === '0x';
      };
    }, {}], 13: [function (require, module, exports) {
      var BN = require('bn.js');
      var stripHexPrefix = require('strip-hex-prefix');

      /**
       * Returns a BN object, converts a number value to a BN
       * @param {String|Number|Object} `arg` input a string number, hex string number, number, BigNumber or BN object
       * @return {Object} `output` BN object of the number
       * @throws if the argument is not an array, object that isn't a bignumber, not a string number or number
       */
      module.exports = function numberToBN(arg) {
        if (typeof arg === 'string' || typeof arg === 'number') {
          var multiplier = new BN(1); // eslint-disable-line
          var formattedString = String(arg).toLowerCase().trim();
          var isHexPrefixed = formattedString.substr(0, 2) === '0x' || formattedString.substr(0, 3) === '-0x';
          var stringArg = stripHexPrefix(formattedString); // eslint-disable-line
          if (stringArg.substr(0, 1) === '-') {
            stringArg = stripHexPrefix(stringArg.slice(1));
            multiplier = new BN(-1, 10);
          }
          stringArg = stringArg === '' ? '0' : stringArg;

          if (!stringArg.match(/^-?[0-9]+$/) && stringArg.match(/^[0-9A-Fa-f]+$/) || stringArg.match(/^[a-fA-F]+$/) || isHexPrefixed === true && stringArg.match(/^[0-9A-Fa-f]+$/)) {
            return new BN(stringArg, 16).mul(multiplier);
          }

          if ((stringArg.match(/^-?[0-9]+$/) || stringArg === '') && isHexPrefixed === false) {
            return new BN(stringArg, 10).mul(multiplier);
          }
        } else if ((typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && arg.toString && !arg.pop && !arg.push) {
          if (arg.toString(10).match(/^-?[0-9]+$/) && (arg.mul || arg.dividedToIntegerBy)) {
            return new BN(arg.toString(10), 10);
          }
        }

        throw new Error('[number-to-bn] while converting number ' + JSON.stringify(arg) + ' to BN.js instance, error: invalid number value. Value must be an integer, hex string, BN or BigNumber instance. Note, decimals are not supported.');
      };
    }, { "bn.js": 9, "strip-hex-prefix": 17 }], 14: [function (require, module, exports) {
      module.exports = window.crypto;
    }, {}], 15: [function (require, module, exports) {
      module.exports = require('crypto');
    }, { "crypto": 14 }], 16: [function (require, module, exports) {
      var randomHex = function randomHex(size, callback) {
        var crypto = require('./crypto.js');
        var isCallback = typeof callback === 'function';

        if (size > 65536) {
          if (isCallback) {
            callback(new Error('Requested too many random bytes.'));
          } else {
            throw new Error('Requested too many random bytes.');
          }
        };

        // is node
        if (typeof crypto !== 'undefined' && crypto.randomBytes) {

          if (isCallback) {
            crypto.randomBytes(size, function (err, result) {
              if (!err) {
                callback(null, '0x' + result.toString('hex'));
              } else {
                callback(error);
              }
            });
          } else {
            return '0x' + crypto.randomBytes(size).toString('hex');
          }

          // is browser
        } else {
          var cryptoLib;

          if (typeof crypto !== 'undefined') {
            cryptoLib = crypto;
          } else if (typeof msCrypto !== 'undefined') {
            cryptoLib = msCrypto;
          }

          if (cryptoLib && cryptoLib.getRandomValues) {
            var randomBytes = cryptoLib.getRandomValues(new Uint8Array(size));
            var returnValue = '0x' + Array.from(randomBytes).map(function (arr) {
              return arr.toString(16);
            }).join('');

            if (isCallback) {
              callback(null, returnValue);
            } else {
              return returnValue;
            }

            // not crypto object
          } else {
            var error = new Error('No "crypto" object available. This Browser doesn\'t support generating secure random bytes.');

            if (isCallback) {
              callback(error);
            } else {
              throw error;
            }
          }
        }
      };

      module.exports = randomHex;
    }, { "./crypto.js": 15 }], 17: [function (require, module, exports) {
      var isHexPrefixed = require('is-hex-prefixed');

      /**
       * Removes '0x' from a given `String` is present
       * @param {String} str the string value
       * @return {String|Optional} a string by pass if necessary
       */
      module.exports = function stripHexPrefix(str) {
        if (typeof str !== 'string') {
          return str;
        }

        return isHexPrefixed(str) ? str.slice(2) : str;
      };
    }, { "is-hex-prefixed": 12 }], 18: [function (require, module, exports) {
      arguments[4][2][0].apply(exports, arguments);
    }, { "dup": 2 }], 19: [function (require, module, exports) {
      (function (global) {
        /*! https://mths.be/utf8js v2.0.0 by @mathias */
        ;(function (root) {

          // Detect free variables `exports`
          var freeExports = (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == 'object' && exports;

          // Detect free variable `module`
          var freeModule = (typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module && module.exports == freeExports && module;

          // Detect free variable `global`, from Node.js or Browserified code,
          // and use it as `root`
          var freeGlobal = (typeof global === "undefined" ? "undefined" : _typeof(global)) == 'object' && global;
          if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
            root = freeGlobal;
          }

          /*--------------------------------------------------------------------------*/

          var stringFromCharCode = String.fromCharCode;

          // Taken from https://mths.be/punycode
          function ucs2decode(string) {
            var output = [];
            var counter = 0;
            var length = string.length;
            var value;
            var extra;
            while (counter < length) {
              value = string.charCodeAt(counter++);
              if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                // high surrogate, and there is a next character
                extra = string.charCodeAt(counter++);
                if ((extra & 0xFC00) == 0xDC00) {
                  // low surrogate
                  output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                } else {
                  // unmatched surrogate; only append this code unit, in case the next
                  // code unit is the high surrogate of a surrogate pair
                  output.push(value);
                  counter--;
                }
              } else {
                output.push(value);
              }
            }
            return output;
          }

          // Taken from https://mths.be/punycode
          function ucs2encode(array) {
            var length = array.length;
            var index = -1;
            var value;
            var output = '';
            while (++index < length) {
              value = array[index];
              if (value > 0xFFFF) {
                value -= 0x10000;
                output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                value = 0xDC00 | value & 0x3FF;
              }
              output += stringFromCharCode(value);
            }
            return output;
          }

          function checkScalarValue(codePoint) {
            if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
              throw Error('Lone surrogate U+' + codePoint.toString(16).toUpperCase() + ' is not a scalar value');
            }
          }
          /*--------------------------------------------------------------------------*/

          function createByte(codePoint, shift) {
            return stringFromCharCode(codePoint >> shift & 0x3F | 0x80);
          }

          function encodeCodePoint(codePoint) {
            if ((codePoint & 0xFFFFFF80) == 0) {
              // 1-byte sequence
              return stringFromCharCode(codePoint);
            }
            var symbol = '';
            if ((codePoint & 0xFFFFF800) == 0) {
              // 2-byte sequence
              symbol = stringFromCharCode(codePoint >> 6 & 0x1F | 0xC0);
            } else if ((codePoint & 0xFFFF0000) == 0) {
              // 3-byte sequence
              checkScalarValue(codePoint);
              symbol = stringFromCharCode(codePoint >> 12 & 0x0F | 0xE0);
              symbol += createByte(codePoint, 6);
            } else if ((codePoint & 0xFFE00000) == 0) {
              // 4-byte sequence
              symbol = stringFromCharCode(codePoint >> 18 & 0x07 | 0xF0);
              symbol += createByte(codePoint, 12);
              symbol += createByte(codePoint, 6);
            }
            symbol += stringFromCharCode(codePoint & 0x3F | 0x80);
            return symbol;
          }

          function utf8encode(string) {
            var codePoints = ucs2decode(string);
            var length = codePoints.length;
            var index = -1;
            var codePoint;
            var byteString = '';
            while (++index < length) {
              codePoint = codePoints[index];
              byteString += encodeCodePoint(codePoint);
            }
            return byteString;
          }

          /*--------------------------------------------------------------------------*/

          function readContinuationByte() {
            if (byteIndex >= byteCount) {
              throw Error('Invalid byte index');
            }

            var continuationByte = byteArray[byteIndex] & 0xFF;
            byteIndex++;

            if ((continuationByte & 0xC0) == 0x80) {
              return continuationByte & 0x3F;
            }

            // If we end up here, it’s not a continuation byte
            throw Error('Invalid continuation byte');
          }

          function decodeSymbol() {
            var byte1;
            var byte2;
            var byte3;
            var byte4;
            var codePoint;

            if (byteIndex > byteCount) {
              throw Error('Invalid byte index');
            }

            if (byteIndex == byteCount) {
              return false;
            }

            // Read first byte
            byte1 = byteArray[byteIndex] & 0xFF;
            byteIndex++;

            // 1-byte sequence (no continuation bytes)
            if ((byte1 & 0x80) == 0) {
              return byte1;
            }

            // 2-byte sequence
            if ((byte1 & 0xE0) == 0xC0) {
              var byte2 = readContinuationByte();
              codePoint = (byte1 & 0x1F) << 6 | byte2;
              if (codePoint >= 0x80) {
                return codePoint;
              } else {
                throw Error('Invalid continuation byte');
              }
            }

            // 3-byte sequence (may include unpaired surrogates)
            if ((byte1 & 0xF0) == 0xE0) {
              byte2 = readContinuationByte();
              byte3 = readContinuationByte();
              codePoint = (byte1 & 0x0F) << 12 | byte2 << 6 | byte3;
              if (codePoint >= 0x0800) {
                checkScalarValue(codePoint);
                return codePoint;
              } else {
                throw Error('Invalid continuation byte');
              }
            }

            // 4-byte sequence
            if ((byte1 & 0xF8) == 0xF0) {
              byte2 = readContinuationByte();
              byte3 = readContinuationByte();
              byte4 = readContinuationByte();
              codePoint = (byte1 & 0x0F) << 0x12 | byte2 << 0x0C | byte3 << 0x06 | byte4;
              if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
                return codePoint;
              }
            }

            throw Error('Invalid UTF-8 detected');
          }

          var byteArray;
          var byteCount;
          var byteIndex;
          function utf8decode(byteString) {
            byteArray = ucs2decode(byteString);
            byteCount = byteArray.length;
            byteIndex = 0;
            var codePoints = [];
            var tmp;
            while ((tmp = decodeSymbol()) !== false) {
              codePoints.push(tmp);
            }
            return ucs2encode(codePoints);
          }

          /*--------------------------------------------------------------------------*/

          var utf8 = {
            'version': '2.0.0',
            'encode': utf8encode,
            'decode': utf8decode
          };

          // Some AMD build optimizers, like r.js, check for specific condition patterns
          // like the following:
          if (typeof define == 'function' && _typeof(define.amd) == 'object' && define.amd) {
            define(function () {
              return utf8;
            });
          } else if (freeExports && !freeExports.nodeType) {
            if (freeModule) {
              // in Node.js or RingoJS v0.8.0+
              freeModule.exports = utf8;
            } else {
              // in Narwhal or RingoJS v0.7.0-
              var object = {};
              var hasOwnProperty = object.hasOwnProperty;
              for (var key in utf8) {
                hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
              }
            }
          } else {
            // in Rhino or a web browser
            root.utf8 = utf8;
          }
        })(this);
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {}], 20: [function (require, module, exports) {
      /*
       This file is part of web3.js.
      
       web3.js is free software: you can redistribute it and/or modify
       it under the terms of the GNU Lesser General Public License as published by
       the Free Software Foundation, either version 3 of the License, or
       (at your option) any later version.
      
       web3.js is distributed in the hope that it will be useful,
       but WITHOUT ANY WARRANTY; without even the implied warranty of
       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
       GNU Lesser General Public License for more details.
      
       You should have received a copy of the GNU Lesser General Public License
       along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
       */
      /**
       * @file utils.js
       * @author Marek Kotewicz <marek@parity.io>
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @date 2017
       */

      var _ = require('underscore');
      var ethjsUnit = require('ethjs-unit');
      var utils = require('./utils.js');
      var soliditySha3 = require('./soliditySha3.js');
      var randomHex = require('randomhex');

      /**
       * Fires an error in an event emitter and callback and returns the eventemitter
       *
       * @method _fireError
       * @param {Object} error a string, a error, or an object with {message, data}
       * @param {Object} emitter
       * @param {Function} reject
       * @param {Function} callback
       * @return {Object} the emitter
       */
      var _fireError = function _fireError(error, emitter, reject, callback) {
        /*jshint maxcomplexity: 10 */

        // add data if given
        if (_.isObject(error) && !(error instanceof Error) && error.data) {
          if (_.isObject(error.data) || _.isArray(error.data)) {
            error.data = JSON.stringify(error.data, null, 2);
          }

          error = error.message + "\n" + error.data;
        }

        if (_.isString(error)) {
          error = new Error(error);
        }

        if (_.isFunction(callback)) {
          callback(error);
        }
        if (_.isFunction(reject)) {
          // suppress uncatched error if an error listener is present
          // OR suppress uncatched error if an callback listener is present
          if (emitter && _.isFunction(emitter.listeners) && emitter.listeners('error').length || _.isFunction(callback)) {
            emitter.catch(function () {});
          }
          // reject later, to be able to return emitter
          setTimeout(function () {
            reject(error);
          }, 1);
        }

        if (emitter && _.isFunction(emitter.emit)) {
          // emit later, to be able to return emitter
          setTimeout(function () {
            emitter.emit('error', error);
            emitter.removeAllListeners();
          }, 1);
        }

        return emitter;
      };

      /**
       * Should be used to create full function/event name from json abi
       *
       * @method _jsonInterfaceMethodToString
       * @param {Object} json
       * @return {String} full function/event name
       */
      var _jsonInterfaceMethodToString = function _jsonInterfaceMethodToString(json) {
        if (_.isObject(json) && json.name && json.name.indexOf('(') !== -1) {
          return json.name;
        }

        return json.name + '(' + _flattenTypes(false, json.inputs).join(',') + ')';
      };

      /**
       * Should be used to flatten json abi inputs/outputs into an array of type-representing-strings
       *
       * @method _flattenTypes
       * @param {bool} includeTuple
       * @param {Object} puts
       * @return {Array} parameters as strings
       */
      var _flattenTypes = function _flattenTypes(includeTuple, puts) {
        // console.log("entered _flattenTypes. inputs/outputs: " + puts)
        var types = [];

        puts.forEach(function (param) {
          if (_typeof(param.components) === 'object') {
            if (param.type.substring(0, 5) !== 'tuple') {
              throw new Error('components found but type is not tuple; report on GitHub');
            }
            var suffix = '';
            var arrayBracket = param.type.indexOf('[');
            if (arrayBracket >= 0) {
              suffix = param.type.substring(arrayBracket);
            }
            var result = _flattenTypes(includeTuple, param.components);
            // console.log("result should have things: " + result)
            if (_.isArray(result) && includeTuple) {
              // console.log("include tuple word, and its an array. joining...: " + result.types)
              types.push('tuple(' + result.join(',') + ')' + suffix);
            } else if (!includeTuple) {
              // console.log("don't include tuple, but its an array. joining...: " + result)
              types.push('(' + result.join(',') + ')' + suffix);
            } else {
              // console.log("its a single type within a tuple: " + result.types)
              types.push('(' + result + ')');
            }
          } else {
            // console.log("its a type and not directly in a tuple: " + param.type)
            types.push(param.type);
          }
        });

        return types;
      };

      /**
       * Should be called to get ascii from it's hex representation
       *
       * @method hexToAscii
       * @param {String} hex
       * @returns {String} ascii string representation of hex value
       */
      var hexToAscii = function hexToAscii(hex) {
        if (!utils.isHexStrict(hex)) throw new Error('The parameter must be a valid HEX string.');

        var str = "";
        var i = 0,
            l = hex.length;
        if (hex.substring(0, 2) === '0x') {
          i = 2;
        }
        for (; i < l; i += 2) {
          var code = parseInt(hex.substr(i, 2), 16);
          str += String.fromCharCode(code);
        }

        return str;
      };

      /**
       * Should be called to get hex representation (prefixed by 0x) of ascii string
       *
       * @method asciiToHex
       * @param {String} str
       * @returns {String} hex representation of input string
       */
      var asciiToHex = function asciiToHex(str) {
        if (!str) return "0x00";
        var hex = "";
        for (var i = 0; i < str.length; i++) {
          var code = str.charCodeAt(i);
          var n = code.toString(16);
          hex += n.length < 2 ? '0' + n : n;
        }

        return "0x" + hex;
      };

      /**
       * Returns value of unit in Wei
       *
       * @method getUnitValue
       * @param {String} unit the unit to convert to, default ether
       * @returns {BN} value of the unit (in Wei)
       * @throws error if the unit is not correct:w
       */
      var getUnitValue = function getUnitValue(unit) {
        unit = unit ? unit.toLowerCase() : 'ether';
        if (!ethjsUnit.unitMap[unit]) {
          throw new Error('This unit "' + unit + '" doesn\'t exist, please use the one of the following units' + JSON.stringify(ethjsUnit.unitMap, null, 2));
        }
        return unit;
      };

      /**
       * Takes a number of wei and converts it to any other ether unit.
       *
       * Possible units are:
       *   SI Short   SI Full        Effigy       Other
       * - kwei       femtoether     babbage
       * - mwei       picoether      lovelace
       * - gwei       nanoether      shannon      nano
       * - --         microether     szabo        micro
       * - --         milliether     finney       milli
       * - ether      --             --
       * - kether                    --           grand
       * - mether
       * - gether
       * - tether
       *
       * @method fromWei
       * @param {Number|String} number can be a number, number string or a HEX of a decimal
       * @param {String} unit the unit to convert to, default ether
       * @return {String|Object} When given a BN object it returns one as well, otherwise a number
       */
      var fromWei = function fromWei(number, unit) {
        unit = getUnitValue(unit);

        if (!utils.isBN(number) && !_.isString(number)) {
          throw new Error('Please pass numbers as strings or BigNumber objects to avoid precision errors.');
        }

        return utils.isBN(number) ? ethjsUnit.fromWei(number, unit) : ethjsUnit.fromWei(number, unit).toString(10);
      };

      /**
       * Takes a number of a unit and converts it to wei.
       *
       * Possible units are:
       *   SI Short   SI Full        Effigy       Other
       * - kwei       femtoether     babbage
       * - mwei       picoether      lovelace
       * - gwei       nanoether      shannon      nano
       * - --         microether     szabo        micro
       * - --         microether     szabo        micro
       * - --         milliether     finney       milli
       * - ether      --             --
       * - kether                    --           grand
       * - mether
       * - gether
       * - tether
       *
       * @method toWei
       * @param {Number|String|BN} number can be a number, number string or a HEX of a decimal
       * @param {String} unit the unit to convert from, default ether
       * @return {String|Object} When given a BN object it returns one as well, otherwise a number
       */
      var toWei = function toWei(number, unit) {
        unit = getUnitValue(unit);

        if (!utils.isBN(number) && !_.isString(number)) {
          throw new Error('Please pass numbers as strings or BigNumber objects to avoid precision errors.');
        }

        return utils.isBN(number) ? ethjsUnit.toWei(number, unit) : ethjsUnit.toWei(number, unit).toString(10);
      };

      /**
       * Converts to a checksum address
       *
       * @method toChecksumAddress
       * @param {String} address the given HEX address
       * @return {String}
       */
      var toChecksumAddress = function toChecksumAddress(address) {
        if (typeof address === 'undefined') return '';

        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) throw new Error('Given address "' + address + '" is not a valid Ethereum address.');

        address = address.toLowerCase().replace(/^0x/i, '');
        var addressHash = utils.sha3(address).replace(/^0x/i, '');
        var checksumAddress = '0x';

        for (var i = 0; i < address.length; i++) {
          // If ith character is 9 to f then make it uppercase
          if (parseInt(addressHash[i], 16) > 7) {
            checksumAddress += address[i].toUpperCase();
          } else {
            checksumAddress += address[i];
          }
        }
        return checksumAddress;
      };

      module.exports = {
        _fireError: _fireError,
        _jsonInterfaceMethodToString: _jsonInterfaceMethodToString,
        _flattenTypes: _flattenTypes,
        // extractDisplayName: extractDisplayName,
        // extractTypeName: extractTypeName,
        randomHex: randomHex,
        _: _,
        BN: utils.BN,
        isBN: utils.isBN,
        isBigNumber: utils.isBigNumber,
        isHex: utils.isHex,
        isHexStrict: utils.isHexStrict,
        sha3: utils.sha3,
        keccak256: utils.sha3,
        soliditySha3: soliditySha3,
        isAddress: utils.isAddress,
        checkAddressChecksum: utils.checkAddressChecksum,
        toChecksumAddress: toChecksumAddress,
        toHex: utils.toHex,
        toBN: utils.toBN,

        bytesToHex: utils.bytesToHex,
        hexToBytes: utils.hexToBytes,

        hexToNumberString: utils.hexToNumberString,

        hexToNumber: utils.hexToNumber,
        toDecimal: utils.hexToNumber, // alias

        numberToHex: utils.numberToHex,
        fromDecimal: utils.numberToHex, // alias

        hexToUtf8: utils.hexToUtf8,
        hexToString: utils.hexToUtf8,
        toUtf8: utils.hexToUtf8,

        utf8ToHex: utils.utf8ToHex,
        stringToHex: utils.utf8ToHex,
        fromUtf8: utils.utf8ToHex,

        hexToAscii: hexToAscii,
        toAscii: hexToAscii,
        asciiToHex: asciiToHex,
        fromAscii: asciiToHex,

        unitMap: ethjsUnit.unitMap,
        toWei: toWei,
        fromWei: fromWei,

        padLeft: utils.leftPad,
        leftPad: utils.leftPad,
        padRight: utils.rightPad,
        rightPad: utils.rightPad,
        toTwosComplement: utils.toTwosComplement
      };
    }, { "./soliditySha3.js": 21, "./utils.js": 22, "ethjs-unit": 11, "randomhex": 16, "underscore": 18 }], 21: [function (require, module, exports) {
      /*
       This file is part of web3.js.
      
       web3.js is free software: you can redistribute it and/or modify
       it under the terms of the GNU Lesser General Public License as published by
       the Free Software Foundation, either version 3 of the License, or
       (at your option) any later version.
      
       web3.js is distributed in the hope that it will be useful,
       but WITHOUT ANY WARRANTY; without even the implied warranty of
       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
       GNU Lesser General Public License for more details.
      
       You should have received a copy of the GNU Lesser General Public License
       along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
       */
      /**
       * @file soliditySha3.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @date 2017
       */

      var _ = require('underscore');
      var BN = require('bn.js');
      var utils = require('./utils.js');

      var _elementaryName = function _elementaryName(name) {
        /*jshint maxcomplexity:false */

        if (name.startsWith('int[')) {
          return 'int256' + name.slice(3);
        } else if (name === 'int') {
          return 'int256';
        } else if (name.startsWith('uint[')) {
          return 'uint256' + name.slice(4);
        } else if (name === 'uint') {
          return 'uint256';
        } else if (name.startsWith('fixed[')) {
          return 'fixed128x128' + name.slice(5);
        } else if (name === 'fixed') {
          return 'fixed128x128';
        } else if (name.startsWith('ufixed[')) {
          return 'ufixed128x128' + name.slice(6);
        } else if (name === 'ufixed') {
          return 'ufixed128x128';
        }
        return name;
      };

      // Parse N from type<N>
      var _parseTypeN = function _parseTypeN(type) {
        var typesize = /^\D+(\d+).*$/.exec(type);
        return typesize ? parseInt(typesize[1], 10) : null;
      };

      // Parse N from type[<N>]
      var _parseTypeNArray = function _parseTypeNArray(type) {
        var arraySize = /^\D+\d*\[(\d+)\]$/.exec(type);
        return arraySize ? parseInt(arraySize[1], 10) : null;
      };

      var _parseNumber = function _parseNumber(arg) {
        var type = typeof arg === "undefined" ? "undefined" : _typeof(arg);
        if (type === 'string') {
          if (utils.isHexStrict(arg)) {
            return new BN(arg.replace(/0x/i, ''), 16);
          } else {
            return new BN(arg, 10);
          }
        } else if (type === 'number') {
          return new BN(arg);
        } else if (utils.isBigNumber(arg)) {
          return new BN(arg.toString(10));
        } else if (utils.isBN(arg)) {
          return arg;
        } else {
          throw new Error(arg + ' is not a number');
        }
      };

      var _solidityPack = function _solidityPack(type, value, arraySize) {
        /*jshint maxcomplexity:false */

        var size, num;
        type = _elementaryName(type);

        if (type === 'bytes') {

          if (value.replace(/^0x/i, '').length % 2 !== 0) {
            throw new Error('Invalid bytes characters ' + value.length);
          }

          return value;
        } else if (type === 'string') {
          return utils.utf8ToHex(value);
        } else if (type === 'bool') {
          return value ? '01' : '00';
        } else if (type.startsWith('address')) {
          if (arraySize) {
            size = 64;
          } else {
            size = 40;
          }

          if (!utils.isAddress(value)) {
            throw new Error(value + ' is not a valid address, or the checksum is invalid.');
          }

          return utils.leftPad(value.toLowerCase(), size);
        }

        size = _parseTypeN(type);

        if (type.startsWith('bytes')) {

          if (!size) {
            throw new Error('bytes[] not yet supported in solidity');
          }

          // must be 32 byte slices when in an array
          if (arraySize) {
            size = 32;
          }

          if (size < 1 || size > 32 || size < value.replace(/^0x/i, '').length / 2) {
            throw new Error('Invalid bytes' + size + ' for ' + value);
          }

          return utils.rightPad(value, size * 2);
        } else if (type.startsWith('uint')) {

          if (size % 8 || size < 8 || size > 256) {
            throw new Error('Invalid uint' + size + ' size');
          }

          num = _parseNumber(value);
          if (num.bitLength() > size) {
            throw new Error('Supplied uint exceeds width: ' + size + ' vs ' + num.bitLength());
          }

          if (num.lt(new BN(0))) {
            throw new Error('Supplied uint ' + num.toString() + ' is negative');
          }

          return size ? utils.leftPad(num.toString('hex'), size / 8 * 2) : num;
        } else if (type.startsWith('int')) {

          if (size % 8 || size < 8 || size > 256) {
            throw new Error('Invalid int' + size + ' size');
          }

          num = _parseNumber(value);
          if (num.bitLength() > size) {
            throw new Error('Supplied int exceeds width: ' + size + ' vs ' + num.bitLength());
          }

          if (num.lt(new BN(0))) {
            return num.toTwos(size).toString('hex');
          } else {
            return size ? utils.leftPad(num.toString('hex'), size / 8 * 2) : num;
          }
        } else {
          // FIXME: support all other types
          throw new Error('Unsupported or invalid type: ' + type);
        }
      };

      var _processSoliditySha3Args = function _processSoliditySha3Args(arg) {
        /*jshint maxcomplexity:false */

        if (_.isArray(arg)) {
          throw new Error('Autodetection of array types is not supported.');
        }

        var type,
            value = '';
        var hexArg, arraySize;

        // if type is given
        if (_.isObject(arg) && (arg.hasOwnProperty('v') || arg.hasOwnProperty('t') || arg.hasOwnProperty('value') || arg.hasOwnProperty('type'))) {
          type = arg.hasOwnProperty('t') ? arg.t : arg.type;
          value = arg.hasOwnProperty('v') ? arg.v : arg.value;

          // otherwise try to guess the type
        } else {

          type = utils.toHex(arg, true);
          value = utils.toHex(arg);

          if (!type.startsWith('int') && !type.startsWith('uint')) {
            type = 'bytes';
          }
        }

        if ((type.startsWith('int') || type.startsWith('uint')) && typeof value === 'string' && !/^(-)?0x/i.test(value)) {
          value = new BN(value);
        }

        // get the array size
        if (_.isArray(value)) {
          arraySize = _parseTypeNArray(type);
          if (arraySize && value.length !== arraySize) {
            throw new Error(type + ' is not matching the given array ' + JSON.stringify(value));
          } else {
            arraySize = value.length;
          }
        }

        if (_.isArray(value)) {
          hexArg = value.map(function (val) {
            return _solidityPack(type, val, arraySize).toString('hex').replace('0x', '');
          });
          return hexArg.join('');
        } else {
          hexArg = _solidityPack(type, value, arraySize);
          return hexArg.toString('hex').replace('0x', '');
        }
      };

      /**
       * Hashes solidity values to a sha3 hash using keccak 256
       *
       * @method soliditySha3
       * @return {Object} the sha3
       */
      var soliditySha3 = function soliditySha3() {
        /*jshint maxcomplexity:false */

        var args = Array.prototype.slice.call(arguments);

        var hexArgs = _.map(args, _processSoliditySha3Args);

        // console.log(args, hexArgs);
        // console.log('0x'+ hexArgs.join(''));

        return utils.sha3('0x' + hexArgs.join(''));
      };

      module.exports = soliditySha3;
    }, { "./utils.js": 22, "bn.js": 9, "underscore": 18 }], 22: [function (require, module, exports) {
      /*
       This file is part of web3.js.
      
       web3.js is free software: you can redistribute it and/or modify
       it under the terms of the GNU Lesser General Public License as published by
       the Free Software Foundation, either version 3 of the License, or
       (at your option) any later version.
      
       web3.js is distributed in the hope that it will be useful,
       but WITHOUT ANY WARRANTY; without even the implied warranty of
       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
       GNU Lesser General Public License for more details.
      
       You should have received a copy of the GNU Lesser General Public License
       along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
       */
      /**
       * @file utils.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @date 2017
       */

      var _ = require('underscore');
      var BN = require('bn.js');
      var numberToBN = require('number-to-bn');
      var utf8 = require('utf8');
      var Hash = require("eth-lib/lib/hash");

      /**
       * Returns true if object is BN, otherwise false
       *
       * @method isBN
       * @param {Object} object
       * @return {Boolean}
       */
      var isBN = function isBN(object) {
        return object instanceof BN || object && object.constructor && object.constructor.name === 'BN';
      };

      /**
       * Returns true if object is BigNumber, otherwise false
       *
       * @method isBigNumber
       * @param {Object} object
       * @return {Boolean}
       */
      var isBigNumber = function isBigNumber(object) {
        return object && object.constructor && object.constructor.name === 'BigNumber';
      };

      /**
       * Takes an input and transforms it into an BN
       *
       * @method toBN
       * @param {Number|String|BN} number, string, HEX string or BN
       * @return {BN} BN
       */
      var toBN = function toBN(number) {
        try {
          return numberToBN.apply(null, arguments);
        } catch (e) {
          throw new Error(e + ' Given value: "' + number + '"');
        }
      };

      /**
       * Takes and input transforms it into BN and if it is negative value, into two's complement
       *
       * @method toTwosComplement
       * @param {Number|String|BN} number
       * @return {String}
       */
      var toTwosComplement = function toTwosComplement(number) {
        return '0x' + toBN(number).toTwos(256).toString(16, 64);
      };

      /**
       * Checks if the given string is an address
       *
       * @method isAddress
       * @param {String} address the given HEX address
       * @return {Boolean}
       */
      var isAddress = function isAddress(address) {
        // check if it has the basic requirements of an address
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
          return false;
          // If it's ALL lowercase or ALL upppercase
        } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
          return true;
          // Otherwise check each case
        } else {
          return checkAddressChecksum(address);
        }
      };

      /**
       * Checks if the given string is a checksummed address
       *
       * @method checkAddressChecksum
       * @param {String} address the given HEX address
       * @return {Boolean}
       */
      var checkAddressChecksum = function checkAddressChecksum(address) {
        // Check each case
        address = address.replace(/^0x/i, '');
        var addressHash = sha3(address.toLowerCase()).replace(/^0x/i, '');

        for (var i = 0; i < 40; i++) {
          // the nth letter should be uppercase if the nth digit of casemap is 1
          if (parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i] || parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i]) {
            return false;
          }
        }
        return true;
      };

      /**
       * Should be called to pad string to expected length
       *
       * @method leftPad
       * @param {String} string to be padded
       * @param {Number} chars that result string should have
       * @param {String} sign, by default 0
       * @returns {String} right aligned string
       */
      var leftPad = function leftPad(string, chars, sign) {
        var hasPrefix = /^0x/i.test(string) || typeof string === 'number';
        string = string.toString(16).replace(/^0x/i, '');

        var padding = chars - string.length + 1 >= 0 ? chars - string.length + 1 : 0;

        return (hasPrefix ? '0x' : '') + new Array(padding).join(sign ? sign : "0") + string;
      };

      /**
       * Should be called to pad string to expected length
       *
       * @method rightPad
       * @param {String} string to be padded
       * @param {Number} chars that result string should have
       * @param {String} sign, by default 0
       * @returns {String} right aligned string
       */
      var rightPad = function rightPad(string, chars, sign) {
        var hasPrefix = /^0x/i.test(string) || typeof string === 'number';
        string = string.toString(16).replace(/^0x/i, '');

        var padding = chars - string.length + 1 >= 0 ? chars - string.length + 1 : 0;

        return (hasPrefix ? '0x' : '') + string + new Array(padding).join(sign ? sign : "0");
      };

      /**
       * Should be called to get hex representation (prefixed by 0x) of utf8 string
       *
       * @method utf8ToHex
       * @param {String} str
       * @returns {String} hex representation of input string
       */
      var utf8ToHex = function utf8ToHex(str) {
        str = utf8.encode(str);
        var hex = "";

        // remove \u0000 padding from either side
        str = str.replace(/^(?:\u0000)*/, '');
        str = str.split("").reverse().join("");
        str = str.replace(/^(?:\u0000)*/, '');
        str = str.split("").reverse().join("");

        for (var i = 0; i < str.length; i++) {
          var code = str.charCodeAt(i);
          // if (code !== 0) {
          var n = code.toString(16);
          hex += n.length < 2 ? '0' + n : n;
          // }
        }

        return "0x" + hex;
      };

      /**
       * Should be called to get utf8 from it's hex representation
       *
       * @method hexToUtf8
       * @param {String} hex
       * @returns {String} ascii string representation of hex value
       */
      var hexToUtf8 = function hexToUtf8(hex) {
        if (!isHexStrict(hex)) throw new Error('The parameter "' + hex + '" must be a valid HEX string.');

        var str = "";
        var code = 0;
        hex = hex.replace(/^0x/i, '');

        // remove 00 padding from either side
        hex = hex.replace(/^(?:00)*/, '');
        hex = hex.split("").reverse().join("");
        hex = hex.replace(/^(?:00)*/, '');
        hex = hex.split("").reverse().join("");

        var l = hex.length;

        for (var i = 0; i < l; i += 2) {
          code = parseInt(hex.substr(i, 2), 16);
          // if (code !== 0) {
          str += String.fromCharCode(code);
          // }
        }

        return utf8.decode(str);
      };

      /**
       * Converts value to it's number representation
       *
       * @method hexToNumber
       * @param {String|Number|BN} value
       * @return {String}
       */
      var hexToNumber = function hexToNumber(value) {
        if (!value) {
          return value;
        }

        return toBN(value).toNumber();
      };

      /**
       * Converts value to it's decimal representation in string
       *
       * @method hexToNumberString
       * @param {String|Number|BN} value
       * @return {String}
       */
      var hexToNumberString = function hexToNumberString(value) {
        if (!value) return value;

        return toBN(value).toString(10);
      };

      /**
       * Converts value to it's hex representation
       *
       * @method numberToHex
       * @param {String|Number|BN} value
       * @return {String}
       */
      var numberToHex = function numberToHex(value) {
        if (_.isNull(value) || _.isUndefined(value)) {
          return value;
        }

        if (!isFinite(value) && !isHexStrict(value)) {
          throw new Error('Given input "' + value + '" is not a number.');
        }

        var number = toBN(value);
        var result = number.toString(16);

        return number.lt(new BN(0)) ? '-0x' + result.substr(1) : '0x' + result;
      };

      /**
       * Convert a byte array to a hex string
       *
       * Note: Implementation from crypto-js
       *
       * @method bytesToHex
       * @param {Array} bytes
       * @return {String} the hex string
       */
      var bytesToHex = function bytesToHex(bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
          /* jshint ignore:start */
          hex.push((bytes[i] >>> 4).toString(16));
          hex.push((bytes[i] & 0xF).toString(16));
          /* jshint ignore:end */
        }
        return '0x' + hex.join("");
      };

      /**
       * Convert a hex string to a byte array
       *
       * Note: Implementation from crypto-js
       *
       * @method hexToBytes
       * @param {string} hex
       * @return {Array} the byte array
       */
      var hexToBytes = function hexToBytes(hex) {
        hex = hex.toString(16);

        if (!isHexStrict(hex)) {
          throw new Error('Given value "' + hex + '" is not a valid hex string.');
        }

        hex = hex.replace(/^0x/i, '');

        for (var bytes = [], c = 0; c < hex.length; c += 2) {
          bytes.push(parseInt(hex.substr(c, 2), 16));
        }return bytes;
      };

      /**
       * Auto converts any given value into it's hex representation.
       *
       * And even stringifys objects before.
       *
       * @method toHex
       * @param {String|Number|BN|Object} value
       * @param {Boolean} returnType
       * @return {String}
       */
      var toHex = function toHex(value, returnType) {
        /*jshint maxcomplexity: false */

        if (isAddress(value)) {
          return returnType ? 'address' : '0x' + value.toLowerCase().replace(/^0x/i, '');
        }

        if (_.isBoolean(value)) {
          return returnType ? 'bool' : value ? '0x01' : '0x00';
        }

        if (_.isObject(value) && !isBigNumber(value) && !isBN(value)) {
          return returnType ? 'string' : utf8ToHex(JSON.stringify(value));
        }

        // if its a negative number, pass it through numberToHex
        if (_.isString(value)) {
          if (value.indexOf('-0x') === 0 || value.indexOf('-0X') === 0) {
            return returnType ? 'int256' : numberToHex(value);
          } else if (value.indexOf('0x') === 0 || value.indexOf('0X') === 0) {
            return returnType ? 'bytes' : value;
          } else if (!isFinite(value)) {
            return returnType ? 'string' : utf8ToHex(value);
          }
        }

        return returnType ? value < 0 ? 'int256' : 'uint256' : numberToHex(value);
      };

      /**
       * Check if string is HEX, requires a 0x in front
       *
       * @method isHexStrict
       * @param {String} hex to be checked
       * @returns {Boolean}
       */
      var isHexStrict = function isHexStrict(hex) {
        return (_.isString(hex) || _.isNumber(hex)) && /^(-)?0x[0-9a-f]*$/i.test(hex);
      };

      /**
       * Check if string is HEX
       *
       * @method isHex
       * @param {String} hex to be checked
       * @returns {Boolean}
       */
      var isHex = function isHex(hex) {
        return (_.isString(hex) || _.isNumber(hex)) && /^(-0x|0x)?[0-9a-f]*$/i.test(hex);
      };

      /**
       * Returns true if given string is a valid Ethereum block header bloom.
       *
       * TODO UNDOCUMENTED
       *
       * @method isBloom
       * @param {String} hex encoded bloom filter
       * @return {Boolean}
       */
      var isBloom = function isBloom(bloom) {
        if (!/^(0x)?[0-9a-f]{512}$/i.test(bloom)) {
          return false;
        } else if (/^(0x)?[0-9a-f]{512}$/.test(bloom) || /^(0x)?[0-9A-F]{512}$/.test(bloom)) {
          return true;
        }
        return false;
      };

      /**
       * Returns true if given string is a valid log topic.
       *
       * TODO UNDOCUMENTED
       *
       * @method isTopic
       * @param {String} hex encoded topic
       * @return {Boolean}
       */
      var isTopic = function isTopic(topic) {
        if (!/^(0x)?[0-9a-f]{64}$/i.test(topic)) {
          return false;
        } else if (/^(0x)?[0-9a-f]{64}$/.test(topic) || /^(0x)?[0-9A-F]{64}$/.test(topic)) {
          return true;
        }
        return false;
      };

      /**
       * Hashes values to a sha3 hash using keccak 256
       *
       * To hash a HEX string the hex must have 0x in front.
       *
       * @method sha3
       * @return {String} the sha3 string
       */
      var SHA3_NULL_S = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

      var sha3 = function sha3(value) {
        if (isHexStrict(value) && /^0x/i.test(value.toString())) {
          value = hexToBytes(value);
        }

        var returnValue = Hash.keccak256(value); // jshint ignore:line

        if (returnValue === SHA3_NULL_S) {
          return null;
        } else {
          return returnValue;
        }
      };
      // expose the under the hood keccak256
      sha3._Hash = Hash;

      module.exports = {
        BN: BN,
        isBN: isBN,
        isBigNumber: isBigNumber,
        toBN: toBN,
        isAddress: isAddress,
        isBloom: isBloom, // TODO UNDOCUMENTED
        isTopic: isTopic, // TODO UNDOCUMENTED
        checkAddressChecksum: checkAddressChecksum,
        utf8ToHex: utf8ToHex,
        hexToUtf8: hexToUtf8,
        hexToNumber: hexToNumber,
        hexToNumberString: hexToNumberString,
        numberToHex: numberToHex,
        toHex: toHex,
        hexToBytes: hexToBytes,
        bytesToHex: bytesToHex,
        isHex: isHex,
        isHexStrict: isHexStrict,
        leftPad: leftPad,
        rightPad: rightPad,
        toTwosComplement: toTwosComplement,
        sha3: sha3
      };
    }, { "bn.js": 9, "eth-lib/lib/hash": 10, "number-to-bn": 13, "underscore": 18, "utf8": 19 }], 23: [function (require, module, exports) {
      arguments[4][9][0].apply(exports, arguments);
    }, { "dup": 9 }], 24: [function (require, module, exports) {
      /*
          This file is part of web3.js.
      
          web3.js is free software: you can redistribute it and/or modify
          it under the terms of the GNU Lesser General Public License as published by
          the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          web3.js is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Lesser General Public License for more details.
      
          You should have received a copy of the GNU Lesser General Public License
          along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
      */
      /**
       * @file iban.js
       *
       * Details: https://github.com/ethereum/wiki/wiki/ICAP:-Inter-exchange-Client-Address-Protocol
       *
       * @author Marek Kotewicz <marek@parity.io>
       * @date 2015
       */

      "use strict";

      var utils = require('web3-utils');
      var BigNumber = require('bn.js');

      var leftPad = function leftPad(string, bytes) {
        var result = string;
        while (result.length < bytes * 2) {
          result = '0' + result;
        }
        return result;
      };

      /**
       * Prepare an IBAN for mod 97 computation by moving the first 4 chars to the end and transforming the letters to
       * numbers (A = 10, B = 11, ..., Z = 35), as specified in ISO13616.
       *
       * @method iso13616Prepare
       * @param {String} iban the IBAN
       * @returns {String} the prepared IBAN
       */
      var iso13616Prepare = function iso13616Prepare(iban) {
        var A = 'A'.charCodeAt(0);
        var Z = 'Z'.charCodeAt(0);

        iban = iban.toUpperCase();
        iban = iban.substr(4) + iban.substr(0, 4);

        return iban.split('').map(function (n) {
          var code = n.charCodeAt(0);
          if (code >= A && code <= Z) {
            // A = 10, B = 11, ... Z = 35
            return code - A + 10;
          } else {
            return n;
          }
        }).join('');
      };

      /**
       * Calculates the MOD 97 10 of the passed IBAN as specified in ISO7064.
       *
       * @method mod9710
       * @param {String} iban
       * @returns {Number}
       */
      var mod9710 = function mod9710(iban) {
        var remainder = iban,
            block;

        while (remainder.length > 2) {
          block = remainder.slice(0, 9);
          remainder = parseInt(block, 10) % 97 + remainder.slice(block.length);
        }

        return parseInt(remainder, 10) % 97;
      };

      /**
       * This prototype should be used to create iban object from iban correct string
       *
       * @param {String} iban
       */
      var Iban = function Iban(iban) {
        this._iban = iban;
      };

      /**
       * This method should be used to create an ethereum address from a direct iban address
       *
       * @method toAddress
       * @param {String} iban address
       * @return {String} the ethereum address
       */
      Iban.toAddress = function (ib) {
        ib = new Iban(ib);

        if (!ib.isDirect()) {
          throw new Error('IBAN is indirect and can\'t be converted');
        }

        return ib.toAddress();
      };

      /**
       * This method should be used to create iban address from an ethereum address
       *
       * @method toIban
       * @param {String} address
       * @return {String} the IBAN address
       */
      Iban.toIban = function (address) {
        return Iban.fromAddress(address).toString();
      };

      /**
       * This method should be used to create iban object from an ethereum address
       *
       * @method fromAddress
       * @param {String} address
       * @return {Iban} the IBAN object
       */
      Iban.fromAddress = function (address) {
        if (!utils.isAddress(address)) {
          throw new Error('Provided address is not a valid address: ' + address);
        }

        address = address.replace('0x', '').replace('0X', '');

        var asBn = new BigNumber(address, 16);
        var base36 = asBn.toString(36);
        var padded = leftPad(base36, 15);
        return Iban.fromBban(padded.toUpperCase());
      };

      /**
       * Convert the passed BBAN to an IBAN for this country specification.
       * Please note that <i>"generation of the IBAN shall be the exclusive responsibility of the bank/branch servicing the account"</i>.
       * This method implements the preferred algorithm described in http://en.wikipedia.org/wiki/International_Bank_Account_Number#Generating_IBAN_check_digits
       *
       * @method fromBban
       * @param {String} bban the BBAN to convert to IBAN
       * @returns {Iban} the IBAN object
       */
      Iban.fromBban = function (bban) {
        var countryCode = 'XE';

        var remainder = mod9710(iso13616Prepare(countryCode + '00' + bban));
        var checkDigit = ('0' + (98 - remainder)).slice(-2);

        return new Iban(countryCode + checkDigit + bban);
      };

      /**
       * Should be used to create IBAN object for given institution and identifier
       *
       * @method createIndirect
       * @param {Object} options, required options are "institution" and "identifier"
       * @return {Iban} the IBAN object
       */
      Iban.createIndirect = function (options) {
        return Iban.fromBban('VNS' + options.institution + options.identifier);
      };

      /**
       * This method should be used to check if given string is valid iban object
       *
       * @method isValid
       * @param {String} iban string
       * @return {Boolean} true if it is valid IBAN
       */
      Iban.isValid = function (iban) {
        var i = new Iban(iban);
        return i.isValid();
      };

      /**
       * Should be called to check if iban is correct
       *
       * @method isValid
       * @returns {Boolean} true if it is, otherwise false
       */
      Iban.prototype.isValid = function () {
        return (/^XE[0-9]{2}(VNS[0-9A-Z]{13}|[0-9A-Z]{30,31})$/.test(this._iban) && mod9710(iso13616Prepare(this._iban)) === 1
        );
      };

      /**
       * Should be called to check if iban number is direct
       *
       * @method isDirect
       * @returns {Boolean} true if it is, otherwise false
       */
      Iban.prototype.isDirect = function () {
        return this._iban.length === 34 || this._iban.length === 35;
      };

      /**
       * Should be called to check if iban number if indirect
       *
       * @method isIndirect
       * @returns {Boolean} true if it is, otherwise false
       */
      Iban.prototype.isIndirect = function () {
        return this._iban.length === 20;
      };

      /**
       * Should be called to get iban checksum
       * Uses the mod-97-10 checksumming protocol (ISO/IEC 7064:2003)
       *
       * @method checksum
       * @returns {String} checksum
       */
      Iban.prototype.checksum = function () {
        return this._iban.substr(2, 2);
      };

      /**
       * Should be called to get institution identifier
       * eg. XREG
       *
       * @method institution
       * @returns {String} institution identifier
       */
      Iban.prototype.institution = function () {
        return this.isIndirect() ? this._iban.substr(7, 4) : '';
      };

      /**
       * Should be called to get client identifier within institution
       * eg. GAVOFYORK
       *
       * @method client
       * @returns {String} client identifier
       */
      Iban.prototype.client = function () {
        return this.isIndirect() ? this._iban.substr(11) : '';
      };

      /**
       * Should be called to get client direct address
       *
       * @method toAddress
       * @returns {String} ethereum address
       */
      Iban.prototype.toAddress = function () {
        if (this.isDirect()) {
          var base36 = this._iban.substr(4);
          var asBn = new BigNumber(base36, 36);
          return utils.toChecksumAddress(asBn.toString(16, 20));
        }

        return '';
      };

      Iban.prototype.toString = function () {
        return this._iban;
      };

      module.exports = Iban;
    }, { "bn.js": 23, "web3-utils": 20 }], "Web3Subscriptions": [function (require, module, exports) {
      /*
          This file is part of web3.js.
      
          web3.js is free software: you can redistribute it and/or modify
          it under the terms of the GNU Lesser General Public License as published by
          the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
      
          web3.js is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Lesser General Public License for more details.
      
          You should have received a copy of the GNU Lesser General Public License
          along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
      */
      /**
       * @file index.js
       * @author Fabian Vogelsteller <fabian@ethereum.org>
       * @date 2017
       */

      "use strict";

      var Subscription = require('./subscription.js');

      var Subscriptions = function Subscriptions(options) {
        this.name = options.name;
        this.type = options.type;
        this.subscriptions = options.subscriptions || {};
        this.requestManager = null;
      };

      Subscriptions.prototype.setRequestManager = function (rm) {
        this.requestManager = rm;
      };

      Subscriptions.prototype.attachToObject = function (obj) {
        var func = this.buildCall();
        var name = this.name.split('.');
        if (name.length > 1) {
          obj[name[0]] = obj[name[0]] || {};
          obj[name[0]][name[1]] = func;
        } else {
          obj[name[0]] = func;
        }
      };

      Subscriptions.prototype.buildCall = function () {
        var _this = this;

        return function () {
          if (!_this.subscriptions[arguments[0]]) {
            console.warn('Subscription ' + JSON.stringify(arguments[0]) + ' doesn\'t exist. Subscribing anyway.');
          }

          var subscription = new Subscription({
            subscription: _this.subscriptions[arguments[0]],
            requestManager: _this.requestManager,
            type: _this.type
          });

          return subscription.subscribe.apply(subscription, arguments);
        };
      };

      module.exports = {
        subscriptions: Subscriptions,
        subscription: Subscription
      };
    }, { "./subscription.js": 8 }] }, {}, ["Web3Subscriptions"])("Web3Subscriptions");
});
//# sourceMappingURL=web3-core-subscriptions.js.map