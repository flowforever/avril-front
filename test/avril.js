/**
 * Created by trump.wang on 2014/6/27.
 */
describe('avril.js', function(){
    describe('#namespace()',function(){
        avril.namespace('test.ns.test');
        it('test.ns.test should be defined', function(){
            expect(typeof test.ns.test).to.equal('object');
        });
    });

    describe('#getHash()',function(){
       var objA = {} , hashObjA = avril.getHash(objA)
           , objB = {} , hashObjB = avril.getHash(objB)
           , strA = 'string A', hashStrA = avril.getHash(strA)
           , strB = 'string B', hashStrB = avril.getHash(strB)
           , strAa = 'string A', hashStrAa = avril.getHash(strAa)
           , booleanTrue = true, hashBooleanTrue = avril.getHash(booleanTrue)
           , booleanFalse = false, hashBooleanFalse = avril.getHash(booleanFalse)
           , nullVal = null, hashNullVal = avril.getHash(nullVal);

        it('objA != objB', function(){
            expect(hashObjA).not.equal(hashObjB);
        });

        it('strA != strB', function(){
            expect(hashStrA).not.equal(hashStrB);
        })
    });

    describe('#array()', function(){
       it('.each 5 times', function(){
           var arr = [1,2,3,4,5];
           var results = [];

           avril.array(arr).each(function(item){
               results.push(item);
           });

           expect(results.length).equal( arr.length );

           expect(results[2]).equal(arr[2]);

       }) ;

        it('.where should only have 3 results', function(){
            var arr = [1,2,3,4,5];
            var results = avril.array(arr).where(function(item, index){
                return item >= 3;
            }).value();

            expect(results.length).equal(3);
            expect(results[0]).equal(3);
        });

        it('.remove should only have 3 results', function(){
            var arr = [1,2,3,4,5];

            var results = avril.array(arr).remove(function(item, index){
                return item < 3;
            }).value();

            expect( avril.getHash(arr) ).equal( avril.getHash(results));

            expect(results.length).equal(3);

            expect(results[2]).equal(5);

        });

        it('lambada .where should only have 3 results', function(){
            var arr = [1,2,3,4,5];

            var results = avril.array(arr).where('o => o >= 3;').value();

            expect(results.length).equal(3);
            expect(results[0]).equal(3);
        });

        it('lambada .remove should only have 3 results', function(){
            var arr = [1,2,3,4,5];

            var results = avril.array(arr).remove('o => o<3').value();

            expect( avril.getHash(arr) ).equal( avril.getHash(results));

            expect(results.length).equal(3);

            expect(results[2]).equal(5);

        });
    });
});