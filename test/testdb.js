/**
 * Created by Simon on 5/12/2014.
 */

var mongoose = require('mongoose');
var async = require('async');

var initialized = false;

module.exports.init = function(done) {
    if (!initialized) {
        initialized = true;
        mongoose.connect('mongodb://localhost/test');

        var ObjectId = mongoose.Schema.ObjectId;

        var carSchema = new mongoose.Schema({
            model: String,
            maker: {type: ObjectId, ref: 'Maker'},
            drivers: [{type: ObjectId, ref: 'Person'}]
        });

        var makerSchema = new mongoose.Schema({
            name: String,
            owner: {type: ObjectId, ref: 'Person'},
            ceo: { type: ObjectId, ref: 'Person' },
            employees: [{type: ObjectId, ref: 'Person'}]
        });

        var personSchema = new mongoose.Schema({
            firstName: String,
            friend: { type: ObjectId, ref: 'Person' }
        });
    }

    var Car = mongoose.model('Car', carSchema);
    var Maker = mongoose.model('Maker', makerSchema);
    var Person = mongoose.model('Person', personSchema);
    var db = {
        Car: Car,
        Maker: Maker,
        Person: Person
    };

    Car.collection.drop(function(){
        Maker.collection.drop(function(){
            Person.collection.drop(function(){
                finishedDrop();
            });
        });
    });

    function finishedDrop(){
        var greg = new Person({firstName: 'Greg'});
        var mike = new Person({firstName: 'Mike'});
        var lisa = new Person({firstName: 'Lisa'});
        var janet;

        greg.save(function (err, greg) {
            mike.save(function (err, mike) {
                lisa.save(function (err, lisa) {
                    janet = new Person({firstName: 'Janet', friend: greg._id });
                    janet.save(function (err, janet) {
                        createMakers(greg, mike, lisa, janet);
                    });
                });
            });
        });

        function createMakers(greg, mike, lisa, janet) {
            var ford = new Maker({
                name: 'Ford',
                owner: greg._id,
                ceo: mike._id,
                employees: [mike._id, lisa._id, janet._id]
            });

            ford.save(function (err, ford) {
                var focus = new Car({
                    model: 'Focus',
                    maker: ford._id,
                    drivers: [greg._id, lisa._id]
                });

                var falcon = new Car({
                    model: 'Falcon',
                    maker: ford._id,
                    drivers: [mike._id, janet._id]
                });

                focus.save(function () {
                    falcon.save(function(){
                        done(db);
                    });
                });
            });
        }
    }
};

