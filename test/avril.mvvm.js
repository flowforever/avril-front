/**
 * Created by trump.wang on 2014/6/27.
 */

(function(){
    var Mvvm = avril.Mvvm
        , mvvm = avril.mvvm;

    Mvvm.defaults.force_delay = false;
    Mvvm.defaults.show_dev_info = true;

    var rootModel = {
        basicArray: function(){
            var res = [];
            for(var i=0;i<10;i++){
                res.push({ i: i, name:'name' + i , guid: avril.guid() })
            }
            return res;
        }()
        , basicForm: {
            firstName: 'Judd'
            , lastName: 'Trump'
            , nFirstName: 'new Judd'
        }
    };

    for(var k in rootModel){
        mvvm.setVal(k , rootModel[k]);
    }




    $(function(){

        avril.mvvm.bindDom(document);

        describe('avril.mvvm.js', function(){

            this.timeout(100000);

            describe('#av-bind', function(){

                it('form#form0 input[name=firstName] value should be :'+ rootModel.basicForm.firstName, function(){
                    expect($('input[name=firstName]').val()).equal(rootModel.basicForm.firstName);
                });

                it('form#form0 input[name=fullName] value should be :'+ rootModel.basicForm.firstName +' '+ rootModel.basicForm.lastName, function(){
                    expect($('input[name=fullName]').val()).equal(rootModel.basicForm.firstName+ ' ' + rootModel.basicForm.lastName);
                });

                it('form#form0 input[name=firstName] value change to :'+ rootModel.basicForm.nFirstName, function(done){
                    setTimeout(function(){
                        $('input[name=firstName]').val( rootModel.basicForm.nFirstName).trigger('change');


                        expect($('input[name=firstName]').val()).equal(rootModel.basicForm.nFirstName);

                        expect($('input[name=fullName]').val()).equal(rootModel.basicForm.nFirstName+ ' ' + rootModel.basicForm.lastName);

                        done();
                    },2000)
                })
            })
        });

    });



})();


