/*!
 * struct.js - struct object for bcoin
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const enforce = require('./enforce');
const BufferReader = require('./reader');
const BufferWriter = require('./writer');
const StaticWriter = require('./staticwriter');
const {custom} = require('./custom');

/**
 * Struct
 */

class Struct {
  constructor() {}

  /**
   * @param {this} obj
   * @returns {this}
   */

  inject(obj) {
    enforce(obj instanceof this.constructor, 'obj', 'struct');
    return this.decode(obj.encode());
  }

  /**
   * @returns {this}
   */

  clone() {
    // @ts-ignore
    const copy = new this.constructor();
    return copy.inject(this);
  }

  /*
   * Bindable
   */

  /**
   * @param {*} [extra]
   * @returns {Number}
   */

  getSize(extra) {
    return -1;
  }

  /**
   * @param {BufferWriter|StaticWriter} bw
   * @param {*} [extra]
   * @returns {BufferWriter|StaticWriter}
   */

  write(bw, extra) {
    return bw;
  }

  /**
   * @param {BufferReader} br
   * @param {*} [extra]
   * @returns {this}
   */

  read(br, extra) {
    return this;
  }

  /**
   * @returns {String}
   */

  toString() {
    return Object.prototype.toString.call(this);
  }

  /**
   * @param {String} str
   * @param {*} [extra]
   * @returns {this}
   */

  fromString(str, extra) {
    return this;
  }

  /**
   * @returns {Object}
   */

  getJSON() {
    return this;
  }

  /**
   * @param {Object} json
   * @param {*} [extra]
   * @returns {this}
   */

  fromJSON(json, extra) {
    return this;
  }

  /**
   * @param {Object} options
   * @param {*} [extra]
   * @returns {this}
   */

  fromOptions(options, extra) {
    return this;
  }

  /**
   * @param {Object} options
   * @param {*} [extra]
   * @returns {this}
   */

  from(options, extra) {
    return this.fromOptions(options, extra);
  }

  /**
   * @returns {*}
   */

  format() {
    return this.getJSON();
  }

  /*
   * API
   */

  /**
   * @param {*} [extra]
   * @returns {Buffer}
   */

  encode(extra) {
    const size = this.getSize(extra);
    const bw = size === -1
      ? new BufferWriter()
      : new StaticWriter(size);

    this.write(bw, extra);

    return bw.render();
  }

  /**
   * @param {Buffer} data
   * @param {*} [extra]
   * @returns {this}
   */

  decode(data, extra) {
    const br = new BufferReader(data);

    this.read(br, extra);

    return this;
  }

  /**
   * @param {*} [extra]
   * @returns {String}
   */

  toHex(extra) {
    return this.encode(extra).toString('hex');
  }

  /**
   * @param {String} str
   * @param {*} [extra]
   * @returns {this}
   */

  fromHex(str, extra) {
    enforce(typeof str === 'string', 'str', 'string');

    const size = str.length >>> 1;
    const data = Buffer.from(str, 'hex');

    if (data.length !== size)
      throw new Error('Invalid hex string.');

    return this.decode(data, extra);
  }

  /**
   * @param {*} [extra]
   * @returns {String}
   */

  toBase64(extra) {
    return this.encode(extra).toString('base64');
  }

  /**
   * @param {String} str
   * @param {*} [extra]
   * @returns {this}
   */

  fromBase64(str, extra) {
    enforce(typeof str === 'string', 'str', 'string');

    const data = Buffer.from(str, 'base64');

    if (str.length > size64(data.length))
      throw new Error('Invalid base64 string.');

    return this.decode(data, extra);
  }

  /**
   * @returns {Object}
   */

  toJSON() {
    return this.getJSON();
  }

  [custom]() {
    return this.format();
  }

  /*
   * Static API
   */

  static read(br, extra) {
    return new this().read(br, extra);
  }

  static decode(data, extra) {
    return new this().decode(data, extra);
  }

  static fromHex(str, extra) {
    return new this().fromHex(str, extra);
  }

  static fromBase64(str, extra) {
    return new this().fromBase64(str, extra);
  }

  static fromString(str, extra) {
    return new this().fromString(str, extra);
  }

  static fromJSON(json, extra) {
    return new this().fromJSON(json, extra);
  }

  static fromOptions(options, extra) {
    return new this().fromOptions(options, extra);
  }

  static from(options, extra) {
    return new this().from(options, extra);
  }

  /*
   * Aliases
   */

  /**
   * @param {BufferWriter|StaticWriter} bw
   * @param {*} [extra]
   * @returns {BufferWriter|StaticWriter}
   */

  toWriter(bw, extra) {
    return this.write(bw, extra);
  }

  /**
   * @param {BufferReader} br
   * @param {*} [extra]
   * @returns {this}
   */

  fromReader(br, extra) {
    return this.read(br, extra);
  }

  /**
   * @param {*} [extra]
   * @returns {Buffer}
   */

  toRaw(extra) {
    return this.encode(extra);
  }

  /**
   * @param {Buffer} data
   * @param {*} [extra]
   * @returns {this}
   */

  fromRaw(data, extra) {
    return this.decode(data, extra);
  }

  /*
   * Static Aliases
   */

  static fromReader(br, extra) {
    return this.read(br, extra);
  }

  static fromRaw(data, extra) {
    return this.decode(data, extra);
  }
}

/*
 * Helpers
 */

function size64(size) {
  const expect = ((4 * size / 3) + 3) & ~3;
  return expect >>> 0;
}

/*
 * Expose
 */

module.exports = Struct;
