/**
 * Created by Simon on 5/12/2014.
 */

var _ = require('underscore');
var async = require('async');

module.exports = exec;
module.exports.lean = lean;

function exec(docs, paths, done){
    if (!paths) return done();

    var pathLists = paths.split(' ');
    var pathCalls = [];
    pathLists.forEach(function(path){
        if (Array.isArray(docs)){
            docs.forEach(function(doc){
                pathCalls.push({ doc: doc, fieldList: path.split('.') });
            });
        }
        else {
            pathCalls.push({doc: docs, fieldList: path.split('.')});
        }
    });

    async.map(pathCalls, populate, function(err, docs){
        done(err, docs);
    });

    return module.exports;
}

function lean(input){
    if (input && input.hasOwnProperty('_doc')){
        input = input.toObject();
    }

    if (Array.isArray(input)){
        input = input.map(function(item){ return lean(item); });
    }

    return input;
}

function populate(params, done){
    console.error('[' + params.fieldList + ']\n');
    if (params.fieldList.length === 0) return done(null, params.doc);

    if (Array.isArray(params.doc)){
        var calls = params.doc.map(function(doc){ return { doc: doc, fieldList: params.fieldList.slice() }});
        async.map(calls, populate, done);
    }
    else {
        var field = params.fieldList.shift();
        params.doc.populate(field, function (err, populatedDoc) {
            //if (err) return done(err);
            populate({doc: populatedDoc._doc[field], fieldList: params.fieldList }, done);
        });
    }
}