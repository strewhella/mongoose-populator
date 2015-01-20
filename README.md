mongoose-populator [![Build Status](https://travis-ci.org/strewhella/mongoose-populator.svg?branch=master)](https://travis-ci.org/strewhella/mongoose-populator)
==================

Recursive population of mongoose documents, including lean option

**Usage**

Requiring the module will return the population function

`var populate = require('mongoose-populator');`

The signature for this function: `populate(docs, paths, callback, [lean])`

For example, populating some cars, as in the `test` folder:

```
Car.findOne({ model: 'Focus' }, function(err, cars){
    populate(cars, 'maker.owner', function(err, populatedCars){
        // Use the result
    });
});
```

This will populate the `maker` field on each car, as well as the `owner` field on each `maker`

Multiple fields can be requested, separated by spaces, of any arbitrary length and can also include arrays at any depth: `'some.field some.other.field'`

Note each field along the chain will be populated, including array fields.

You can also specify the `lean` option, which will cause all returned documents, nested or otherwise, to be *leaned* out.