var esprima = require('esprima');
var escodegen = require('escodegen');

var traverse = function (node, cb) {
    if (Array.isArray(node)) {
        node.forEach(function (x) {
            x.parent = node;
            traverse(x, cb);
        });
    }
    else if (node && typeof node === 'object') {
        cb(node);
        
        Object.keys(node).forEach(function (key) {
            if (key === 'parent' || !node[key]) return;
            node[key].parent = node;
            traverse(node[key], cb);
        });
    }
};

var walk = function (src, cb) {
    var ast = esprima.parse(src);
    traverse(ast, cb);
};

var exports = module.exports = function (src, opts) {
    return exports.find(src, opts).strings;
};

exports.find = function (src, opts) {
    if (!opts) opts = {};
    var word = opts.word === undefined ? 'require' : opts.word;
    if (typeof src !== 'string') src = String(src);
    src = src.replace(/^#![^\n]*\n/, '');
    
    function isRequire (node) {
        var c = node.callee;
        return c
            && node.type === 'CallExpression'
            && c.type === 'Identifier'
            && c.name === word
        ;
    }
    
    var modules = { strings : [], expressions : [] };
    
    if (src.indexOf(word) == -1) return modules;
    
    walk(src, function (node) {
        if (!isRequire(node)) return;
        if (node.arguments.length
        && node.arguments[0].type === 'Literal') {
            if(opts.includeLeft) {
                modules.strings.push({module: node.arguments[0].value, variable: parent.left.name});
            } else {
                modules.strings.push(node.arguments[0].value);
            }
        }
        else {
            modules.expressions.push(escodegen.generate(node.arguments[0]));
        }
    });
    
    return modules;
};
