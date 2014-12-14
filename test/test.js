/**
 * Created by Simon on 5/12/2014.
 */

var testdb = require('./testdb');
var should = require('should');
var populate = require('../index.js');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

describe('when populating a single doc and single field', function(){
    var db;
    var finalCars;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.findOne({ model: 'Focus' }, function(err, cars){
                populate(cars, 'maker.owner', function(err, popCars){
                    finalCars = popCars;
                    done();
                });
            });
        });
    });

    it('should return a single doc', function(){
        should.exist(finalCars);
        Array.isArray(finalCars).should.eql(false);
    });

    it('should be the same doc', function(){
        finalCars._doc.should.have.property('model');
    });

    it('should have the same initial data', function(){
        finalCars._doc.model.should.eql('Focus');
    });

    it('should have populated the nested object', function(){
        finalCars._doc.maker._doc.should.have.property('name');
        finalCars._doc.maker._doc.name.should.eql('Ford');
    });
});

describe('when populating a single doc with some array fields', function(){
    var db;
    var finalCars;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.findOne({ model: 'Focus' }, function(err, cars){
                populate(cars, 'maker.employees drivers', function(err, popCars){
                    finalCars = popCars;
                    done();
                });
            });
        });
    });

    it('should return correct number of docs', function(){
        should.exist(finalCars);
    });

    it('should be the right doc', function(){
        finalCars._doc.should.have.property('model');
        finalCars._doc.model.should.eql('Focus');
    });

    it('should have populated the first array', function(){
        finalCars._doc.drivers.length.should.eql(2);
        finalCars._doc.drivers[0]._doc.should.have.property('firstName');
    });

    it('should have populated the nested array', function(){
        finalCars._doc.maker._doc.should.have.property('employees');
        finalCars._doc.maker._doc.employees.length.should.eql(3);
        finalCars._doc.maker._doc.employees[0]._doc.should.have.property('firstName');
    });
});

describe('when populating multiple docs with a single field', function(){
    var db;
    var finalCars;
    var falcon, focus;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.find(function(err, cars){
                populate(cars, 'maker.owner', function(err, popCars){
                    finalCars = popCars;
                    finalCars.forEach(function(car){
                        if (car._doc.model === 'Falcon'){
                            falcon = car;
                        }
                        else {
                            focus = car;
                        }
                    });
                    done();
                });
            });
        });
    });

    it('should return the right number of docs', function(){
        should.exist(finalCars);
        Array.isArray(finalCars).should.eql(true);
        finalCars.length.should.eql(2);
    });

    it('should be the same docs', function(){
        falcon._doc.model.should.eql('Falcon');
        focus._doc.model.should.eql('Focus');
    });

    it('should have populated the nested object', function(){
        falcon._doc.maker.should.have.property('_doc');
        focus._doc.maker.should.have.property('_doc');
    });
});

describe('when populating single fields in nested arrays', function(){
    var db;
    var falcon;
    var janet;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.findOne({ model: 'Falcon' }, function(err, cars){
                populate(cars, 'drivers.friend', function(err, popCars){
                    falcon = popCars;
                    falcon._doc.drivers.forEach(function(driver){
                        if (driver.firstName === 'Janet'){
                            janet = driver;
                        }
                    });
                    done();
                });
            });
        });
    });

    it('should have populated each array element', function(){
        should.exist(janet);
    });

    it('should have populated object in array', function(){
        janet._doc.friend.should.have.property('_doc');
        janet._doc.friend._doc.firstName.should.eql('Greg');
    });
});

describe('when populating multiple objects on the same doc', function(){
    var maker;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.findOne(function(err, cars){
                populate(cars, 'maker.ceo maker.owner', function(err, popCars){
                    maker = popCars._doc.maker._doc;
                    done();
                });
            });
        });
    });

    it('should populate ceo field', function(){
        maker.ceo.should.have.property('_doc');
    });

    it('should populate owner field', function(){
        maker.owner.should.have.property('_doc');
    });
});

describe('when populating multiple docs and multiple fields with arrays', function(){
    var db;
    var finalCars;
    var falcon;
    var focus;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.find(function(err, cars){
                populate(cars, 'maker.owner maker.employees drivers', function(err, popCars){
                    finalCars = popCars;
                    finalCars.forEach(function(car){
                        if (car._doc.model === 'Falcon'){
                            falcon = car;
                        }
                        else {
                            focus = car;
                        }
                    });
                    done();
                });
            });
        });
    });

    it('should have the right number of docs', function(){
        should.exist(finalCars);
        finalCars.length.should.eql(2);
    });

    it('should have populated single fields in both docs', function(){
        falcon._doc.maker._doc.should.have.property('name');
        focus._doc.maker._doc.should.have.property('name');
    });

    it('should have populated first array in both docs', function(){
        falcon._doc.drivers[0]._doc.should.have.property('firstName');
        focus._doc.drivers[0]._doc.should.have.property('firstName');
    });

    it('should have populated nested arrays in both docs', function(){
        falcon._doc.maker._doc.employees[0]._doc.should.have.property('firstName');
        focus._doc.maker._doc.employees[0]._doc.should.have.property('firstName');
    });

    it('should have populated nested single fields in both docs', function(){
        falcon._doc.maker._doc.owner._doc.should.have.property('firstName');
        focus._doc.maker._doc.owner._doc.should.have.property('firstName');
    });
});

describe('when passing dodgy data', function(){
    var db;
    var docs;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.find(function(err, validDocs){
                docs = validDocs;
                done();
            });
        });
    });

    it('should ignore null or empty path', function(done){
        populate(docs, null, function(err, result){
            should.not.exist(err);
            should.exist(result);
            done();
        });
    });

    it('should return error on null doc/s', function(done){
        populate(null, 'something', function(err, result){
            should.exist(err);
            should.not.exist(result);
            done();
        });
    });

    it('should ignore extra whitespace', function(done){
        populate(docs, '  maker.ceo        something     huh ', function(err, result){
            should.exist(result);
            result[0]._doc.maker.should.have.property('ceo');
            done();
        });
    });

    it('should ignore non-existent fields', function(done){
        populate(docs, 'i.dont.exist neither.do.i me.too', function(err, result){
            should.exist(result);
            should.not.exist(err);
            result.length.should.eql(docs.length);
            done();
        });
    });
});

describe('when populating with lean option', function(){
    var db;
    var finalCars;
    before(function(done){
        testdb.init(function(initDb){
            db = initDb;

            db.Car.find(function(err, cars){
                populate(cars, 'maker.owner maker.employees drivers maker.employees ', function(err, popCars){
                    finalCars = popCars;
                    done();
                }, true);
            });
        });
    });

    it('should return the same number of docs', function(){
        finalCars.length.should.eql(2);
    });

    it('should have leaned the first level of each object in array', function(){
        finalCars.forEach(function(car){
            car.should.not.have.property('_doc');
            car.should.have.property('model');
        });
    });

    it('should have leaned the second level of each object in array', function(){
        finalCars.forEach(function(car){
            car.maker.should.not.have.property('_doc');
            car.maker.should.have.property('name');
        });
    });

    it('should have leaned the third level of each object in array', function(){
        finalCars.forEach(function(car){
            car.maker.employees.forEach(function(employee){
                employee.should.have.property('firstName');
            });
        });
    });
});

describe('when populating deeply nested objects', function(){
    var One, Two, Three, Four;
    before(function(done){
        var oneSchema = new mongoose.Schema({
            data: String,
            two: { type: mongoose.Schema.ObjectId, ref: 'Two' }
        });

        var twoSchema = new mongoose.Schema({
            data: String,
            threes: [{ type: mongoose.Schema.ObjectId, ref: 'Three' }]
        });

        var threeSchema = new mongoose.Schema({
            data: String,
            four: { type: mongoose.Schema.ObjectId, ref: 'Four' }
        });

        var fourSchema = new mongoose.Schema({
            data: String,
            one: [{ type: mongoose.Schema.ObjectId, ref: 'One' }]
        });

        One = mongoose.model('One', oneSchema);
        Two = mongoose.model('Two', twoSchema);
        Three = mongoose.model('Three', threeSchema);
        Four = mongoose.model('Four', fourSchema);

        var one = new One({_id:ObjectId(), data:'one'});
        var two = new Two({_id:ObjectId(), data:'two'});
        var threeOne = new Three({_id:ObjectId(), data:'three-one'});
        var threeTwo = new Three({_id:ObjectId(), data:'three-two'});
        var fourOne = new Four({_id:ObjectId(), data:'four-one'});
        var fourTwo = new Four({_id:ObjectId(), data:'four-two'});

        one.two = two._id;
        two.threes = [threeOne._id, threeTwo._id];
        threeOne.four = fourOne._id;
        threeTwo.four = fourTwo._id;

        one.save(function(){
            two.save(function(){
                threeOne.save(function(){
                    threeTwo.save(function(){
                        fourOne.save(function(){
                            fourTwo.save(function(){
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('should populate data in first layer of deeply nested object without lean', function(done){
        One.findOne(function(err, one){
            populate(one, 'two.threes.four', function(err, one){
                one.two.data.should.eql('two');
                done();
            });
        });
    });

    it('should populate data in second layer of deeply nested object without lean', function(done){
        One.findOne(function(err, one){
            populate(one, 'two.threes.four', function(err, one){
                one.two.threes[0].data.should.eql('three-one');
                one.two.threes[1].data.should.eql('three-two');
                done();
            });
        });
    });

    it('should populate data in third layer of deeply nested object without lean', function(done) {
        One.findOne(function (err, one) {
            populate(one, 'two.threes.four', function (err, one) {
                one.two.threes[0].four.data.should.eql('four-one');
                one.two.threes[1].four.data.should.eql('four-two');
                done();
            });
        });
    });
});