/**
 * Cryptonote Node.JS Pool
 * https://github.com/dvandal/cryptonote-nodejs-pool
 *
 * Utilities functions
 **/

// Load required module
var elliptic = require('elliptic');
var crypto = require('crypto')
var ec = new elliptic.ec('secp256k1');
var vh = require("verushash");
var dateFormat = require("dateformat");
var cnUtil = require('cryptoforknote-util');
exports.cnUtil = cnUtil;
exports.dateFormat = dateFormat;

/**
 * Generate random instance id
 **/
exports.instanceId = function () {
  return crypto.randomBytes(3);
};

/**
 * Validate miner address
 **/
// var addressBase58Prefix = parseInt(cnUtil.address_decode(Buffer.from(config.poolServer.poolAddress)).toString());
// var integratedAddressBase58Prefix = config.poolServer.intAddressPrefix ? parseInt(config.poolServer.intAddressPrefix) : addressBase58Prefix + 1;

exports.warthogUtil = {
  convert_blob: function (buffer) {
    // Implement the Janushash conversion logic here
    // This should include the dual hashing mechanism and any specific formatting required by Warthog
    let sha256Hash = crypto.createHash("sha256").update(buffer).digest();
    let verushash = vh.hash(sha256Hash); // Replace with actual Verushash function
    return verushash;
  },
};

function decodeAddress(address) {
    // Convert the address from hex to a buffer
    const addressBuffer = Buffer.from(address, 'hex');

    // Split the address into the raw address part and the checksum
    const addrRaw = addressBuffer.slice(0, -4);
    const checksum = addressBuffer.slice(-4);

    // Validate the checksum
    const validChecksum = crypto.createHash('sha256').update(addrRaw).digest().slice(0, 4);
    if (!checksum.equals(validChecksum)) {
        throw new Error('Invalid address checksum');
    }

    // Return the raw address
    return addrRaw.toString('hex');
}


var decodedAddress = decodeAddress(config.poolServer.poolAddress);
if (decodedAddress === undefined) {
  throw new Error(
    "Failed to decode pool address. Please verify that the pool address is valid."
  );
}

var addressBase58Prefix = parseInt(decodedAddress.toString(), 10);
var integratedAddressBase58Prefix = config.poolServer.intAddressPrefix
  ? parseInt(config.poolServer.intAddressPrefix, 10)
  : addressBase58Prefix + 1;

// Get Address Prefix Function
function getAddressPrefix(address) {
    const addressBuffer = Buffer.from(address, 'hex');
    const addressPrefix = addressBuffer.readUInt8(0); // Assuming the prefix is the first byte
    return addressPrefix;
}
exports.getAddressPrefix = getAddressPrefix;

// Validate miner address
exports.validateMinerAddress = function (address) {
  var addressPrefix = getAddressPrefix(address);
  if (addressPrefix === addressBase58Prefix) return true;
  else if (addressPrefix === integratedAddressBase58Prefix) return true;
  return false;
};

// Return if value is an integrated address
exports.isIntegratedAddress = function (address) {
  var addressPrefix = getAddressPrefix(address);
  return addressPrefix === integratedAddressBase58Prefix;
};

/**
 * Cleanup special characters (fix for non latin characters)
 **/
function cleanupSpecialChars(str) {
  str = str.replace(/[ÀÁÂÃÄÅ]/g, "A");
  str = str.replace(/[àáâãäå]/g, "a");
  str = str.replace(/[ÈÉÊË]/g, "E");
  str = str.replace(/[èéêë]/g, "e");
  str = str.replace(/[ÌÎÏ]/g, "I");
  str = str.replace(/[ìîï]/g, "i");
  str = str.replace(/[ÒÔÖ]/g, "O");
  str = str.replace(/[òôö]/g, "o");
  str = str.replace(/[ÙÛÜ]/g, "U");
  str = str.replace(/[ùûü]/g, "u");
  return str.replace(/[^A-Za-z0-9\-\_]/gi, "");
}
exports.cleanupSpecialChars = cleanupSpecialChars;

/**
 * Get readable hashrate
 **/
exports.getReadableHashRate = function (hashrate) {
  var i = 0;
  var byteUnits = [" H", " KH", " MH", " GH", " TH", " PH"];
  while (hashrate > 1000) {
    hashrate = hashrate / 1000;
    i++;
  }
  return hashrate.toFixed(2) + byteUnits[i] + "/sec";
};

/**
 * Get readable coins
 **/
exports.getReadableCoins = function (coins, digits, withoutSymbol) {
  var coinDecimalPlaces =
    config.coinDecimalPlaces || config.coinUnits.toString().length - 1;
  var amount = (parseInt(coins || 0) / config.coinUnits).toFixed(
    digits || coinDecimalPlaces
  );
  return amount + (withoutSymbol ? "" : " " + config.symbol);
};

/**
 * Generate unique id
 **/
exports.uid = function () {
  var min = 100000000000000;
  var max = 999999999999999;
  var id = Math.floor(Math.random() * (max - min + 1)) + min;
  return id.toString();
};

/**
 * Ring buffer
 **/
exports.ringBuffer = function (maxSize) {
  var data = [];
  var cursor = 0;
  var isFull = false;

  return {
    append: function (x) {
      if (isFull) {
        data[cursor] = x;
        cursor = (cursor + 1) % maxSize;
      } else {
        data.push(x);
        cursor++;
        if (data.length === maxSize) {
          cursor = 0;
          isFull = true;
        }
      }
    },
    avg: function (plusOne) {
      var sum = data.reduce(function (a, b) {
        return a + b;
      }, plusOne || 0);
      return sum / ((isFull ? maxSize : cursor) + (plusOne ? 1 : 0));
    },
    size: function () {
      return isFull ? maxSize : cursor;
    },
    clear: function () {
      data = [];
      cursor = 0;
      isFull = false;
    },
  };
};
