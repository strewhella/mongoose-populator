/**
 * Created by Simon on 5/12/2014.
 */

var async = require('async');

module.exports = exec;

// Reorganises the requested paths so each each level is its own array element
function buildTrails(paths){
    paths = paths.trim().split(' ');
    var trails = [];
    var depth = 0;
    paths.forEach(function(path){
        if (path !== '') {
            var trail = path.trim().split('.');
            depth = trail.length > depth ? trail.length : depth;
            trails.push(trail);
        }
    });

    var combinedTrails = [];
    for (var i = 0; i < depth; ++i){
        var command = {};
        trails.forEach(function(trail){
            if (trail[i]){
                command[trail[i]] = 1;
            }
        });
        combinedTrails.push(Object.keys(command).join(' '));
    }

    return combinedTrails;
}

function exec(docs, paths, done, lean){
    if (!paths) paths = '';
    if (!docs) return done(new Error('No doc/s provided for population'));

    // Decompose the paths into a tree of calls
    // Can safely allow calls to non-existent fields since mongoose ignores them
    var trails = buildTrails(paths);
    var pathCalls = [];

    if (Array.isArray(docs)){
        docs.forEach(function(doc){
            pathCalls.push({ doc: doc, fieldList: trails.slice() });
        });
    }
    else {
        pathCalls.push({doc: docs, fieldList: trails });
    }

    // Call populate for each doc, will only return once all are complete
    async.map(pathCalls, populate, function(err){
        if (lean){
            docs = toObject(docs);
        }
        done(err, docs);
    });
}

function toObject(input){
    if (input && input.hasOwnProperty('_doc')){
        input = input.toObject();
    }

    if (Array.isArray(input)){
        input = input.map(function(item){ return toObject(item); });
    }

    return input;
}

// Recursive population function
// NB. Calling slice on each fieldList is important so there's a new fieldList per recurse
function populate(params, done){
    // End the recursion when we've recursed all fields
    if (params.fieldList.length === 0) return done(null);

    // If its an array, split out the docs and recurse for each
    if (Array.isArray(params.doc)){
        var arrayCalls = params.doc.map(function(doc){
            return { doc: doc, fieldList: params.fieldList.slice() }
        });
        async.map(arrayCalls, populate, done);
    }
    else {
        var fields = params.fieldList.shift();
        params.doc.populate(fields, function (err, populatedDoc) {
            if (err) return done(err);

            // Split the fields back out and recurse over the fields they reference
            var fieldCalls = [];
            fields.split(' ').forEach(function(field){
                var newDoc = populatedDoc._doc[field];
                if (newDoc) {
                    fieldCalls.push({doc: newDoc, fieldList: params.fieldList.slice()});
                }
            });
            async.map(fieldCalls, populate, done);
        });
    }
}