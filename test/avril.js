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
});