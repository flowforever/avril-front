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
                res.push({ i: i, name:'name' + i , id: avril.guid() })
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

            this.timeout(1000000);

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

            describe('#av-each', function(){
                it('#virtualScope should have 5 children', function(){
                    expect( $('#virtualScope li:visible').length ).equal(5)
                });

                it('#realScope should have 10 children', function(){
                    expect( $('#basicArray li:visible').length ).equal(10)
                });

                it('#realScope should have 11 children', function(){
                    mvvm.array('$root.basicArray').add({ name: rootModel.basicForm.firstName, id: avril.guid() });
                    expect( $('#basicArray li:visible').length ).equal(11);
                    expect( mvvm.getVal('basicArray[10].name') ).equal(rootModel.basicForm.firstName);
                    expect( mvvm.getVal('$root.basicArray[10].name') ).equal(rootModel.basicForm.firstName);
                });

            });

        });

    });



})();


