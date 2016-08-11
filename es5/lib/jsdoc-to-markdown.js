'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var version = require('../../package').version;
var UsageStats = require('usage-stats');
var usageStats = new UsageStats({
  appName: 'jsdoc2md',
  version: version,
  tid: 'UA-70853320-3'
});

exports.render = function (options) {
  return stats('render', options, render);
};
exports.renderSync = function (options) {
  return stats('renderSync', options, renderSync, true);
};
exports.getTemplateData = function (options) {
  return stats('getTemplateData', options, getTemplateData);
};
exports.getTemplateDataSync = function (options) {
  return stats('getTemplateDataSync', options, getTemplateDataSync, true);
};
exports.getJsdocData = function (options) {
  return stats('getJsdocData', options, getJsdocData);
};
exports.getJsdocDataSync = function (options) {
  return stats('getJsdocDataSync', options, getJsdocDataSync, true);
};
exports.clear = function () {
  return stats('clear', null, clear);
};

exports._usageStats = usageStats;

function render(options) {
  options = options || {};
  var dmd = require('dmd').async;
  var dmdOptions = new DmdOptions(options);
  return getTemplateData(options).then(function (templateData) {
    return dmd(templateData, dmdOptions);
  });
}

function renderSync(options) {
  options = options || {};
  var dmd = require('dmd');
  var dmdOptions = new DmdOptions(options);
  return dmd(getTemplateDataSync(options), dmdOptions);
}

function getTemplateData(options) {
  options = options || {};
  var jsdocParse = require('jsdoc-parse');
  return getJsdocData(options).then(jsdocParse);
}

function getTemplateDataSync(options) {
  options = options || {};
  var jsdocParse = require('jsdoc-parse');
  var jsdocData = getJsdocDataSync(options);
  return jsdocParse(jsdocData, options);
}

function getJsdocData(options) {
  options = options || {};
  var jsdocApi = require('jsdoc-api');
  var jsdocOptions = new JsdocOptions(options);
  return jsdocApi.explain(jsdocOptions);
}

function getJsdocDataSync(options) {
  options = options || {};
  var jsdocApi = require('jsdoc-api');
  var jsdocOptions = new JsdocOptions(options);
  return jsdocApi.explainSync(jsdocOptions);
}

function clear() {
  var jsdocApi = require('jsdoc-api');
  var dmd = require('dmd');
  return jsdocApi.cache.clear().then(function () {
    return dmd.cache.clear();
  });
}

var JsdocOptions = function JsdocOptions(options) {
  _classCallCheck(this, JsdocOptions);

  options = options || {};
  this.cache = true;
  this.pedantic = true;

  this.files = options.files;

  this.source = options.source;

  this.configure = options.configure;

  this.html = options.html;
};

var DmdOptions = function DmdOptions(options) {
  _classCallCheck(this, DmdOptions);

  var arrayify = require('array-back');

  this.template = options.template || '{{>main}}';

  this['heading-depth'] = options['heading-depth'] || 2;

  this['example-lang'] = options['example-lang'] || 'js';

  this.plugin = arrayify(options.plugin);

  this.helper = arrayify(options.helper);

  this.partial = arrayify(options.partial);

  this['name-format'] = options['name-format'];

  this['no-gfm'] = options['no-gfm'];

  this.separators = options.separators;

  this['module-index-format'] = options['module-index-format'] || 'dl';

  this['global-index-format'] = options['global-index-format'] || 'dl';

  this['param-list-format'] = options['param-list-format'] || 'table';

  this['property-list-format'] = options['property-list-format'] || 'table';

  this['member-index-format'] = options['member-index-format'] || 'grouped';
};

function stats(screenName, options, command, sync) {
  if (options['no-usage-stats']) {
    usageStats.disable();
    return command(options);
  } else {
    usageStats.start();
    usageStats.screenView(screenName);
    if (options) {
      Object.keys(options).forEach(function (option) {
        var dontSend = ['files', 'source'];
        usageStats.event('option', option, dontSend.includes(option) ? undefined : options[option]);
      });
    }
    if (sync) {
      try {
        var output = command(options);
        usageStats.end().send();
        return output;
      } catch (err) {
        usageStats.exception(err.message, 1);
        throw err;
      }
    } else {
      return command(options).then(function (output) {
        usageStats.end().send();
        return output;
      }).catch(function (err) {
        usageStats.exception(err.message, true);
        usageStats.end().send();
        throw err;
      });
    }
  }
}