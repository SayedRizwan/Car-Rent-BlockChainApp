App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        return App.initWeb3();
    },

    // Instance Web3
    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            // Only useful in a development environment
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');

        }
        web3 = new Web3(App.web3Provider);
     
     
// (async () => {
//     const accounts = await web3.eth.getAccounts();
//     console.log(accounts);
  
//     const balance = await web3.eth.getBalance(accounts[0]);
//     console.log("balance", web3.utils.fromWei(balance, "ether"));
//   })();
//----------------------------------------
    // const accounts = web3.eth.getAccounts();
    // console.log(accounts);
  
    // const balance =  web3.eth.getBalance(accounts[0]);
    // console.log("balance", web3.utils.fromWei(balance, "ether"));

//-------------------------

        return App.initContract();
    },

    // Instance contract
    initContract: function () {
        $.getJSON('Renting.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            App.contracts.Renting = TruffleContract(data);
            // Set the provider for our contract
            App.contracts.Renting.setProvider(App.web3Provider);
            // Use our contract to retrieve value data

            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.log(error);
                }
                else
                {
                  
                    console.log(accounts);
                }
                var wrapperAccounts = $('#wrapperAccounts');

                accounts.forEach(account => {
                    wrapperAccounts.append(`<option value=${account}> ${account} </option>`);
                })

            })

            App.getCars();
        });
        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '.btn-value', function (e) {
            var $this = $(this);
            $this.button('loading');
            App.handleAddCar(e);
        });

        $(document).on('click', '.btn-rent', function (e) {
            var $this = $(this);
            $this.button('loading');
            App.handleRentCar(e);
        });

        $(document).on('click', '.btn-free', function (e) {
            var $this = $(this);
            $this.button('loading');
            App.handleFreeCar(e);
        });

        $(document).on('click', '.btn-remove', function (e) {
            var $this = $(this);
            $this.button('loading');
            App.handleRemoveCar(e);
        });
    },

    getCars: function () {
        var carsInstance;
        App.contracts.Renting.deployed().then(function (instance) {
            carsInstance = instance;

            carsInstance.getNumCars.call().then(function (numCars) {
                var wrapperCars = $('#wrapperCars');
                wrapperCars.empty();
				var proposalCar = $('#proposalCar');

                for (var i = 0; i < numCars; i++) {
                    carsInstance.getCar.call(i).then(function (data) {
                        var idx = data[0];

                        proposalCar.find('.owner').text(data[1]);
                        proposalCar.find('.panel-title').text(data[2]);
                        proposalCar.find('.price').text(data[3]);
                        proposalCar.find('.available').text(data[4]);
                        proposalCar.find('.btn-rent').attr('data-car', idx);
                        proposalCar.find('.btn-free').attr('data-car', idx);
                        proposalCar.find('.btn-free').attr('data-owner', data[1]);
                        proposalCar.find('.btn-remove').attr('data-car', idx);

                        if (data[4] == true) {
                            proposalCar.find('.rentedBy').text("not rented");
                            if (data[1] == $('#wrapperAccounts').val()) {
                                proposalCar.find('.btn-rent').attr('disabled', true);
                                proposalCar.find('.btn-remove').attr('disabled', false);
                            } else {
                                proposalCar.find('.btn-rent').attr('disabled', false);
                                proposalCar.find('.btn-remove').attr('disabled', true);
                            }
                            proposalCar.find('.btn-free').attr('disabled', true);
                        } else {
                            proposalCar.find('.rentedBy').text(data[5]);
                            proposalCar.find('.btn-remove').attr('disabled', true);
                            if (data[5] == $('#wrapperAccounts').val()) {
                                proposalCar.find('.btn-free').attr('disabled', false);
                                proposalCar.find('.btn-rent').attr('disabled', true);
                            } else {
                                proposalCar.find('.btn-rent').attr('disabled', true);
                                proposalCar.find('.btn-free').attr('disabled', true);
                            }
                        }

                        wrapperCars.append(proposalCar.html());
                    }).catch(function (err) {
                        console.log(err.message);
                    });
                }
            }).catch(function (err) {
                console.log(err.message);
            });
        }).catch(function (err) {
            console.log(err.message);
        });
        $('button').button('reset');
    },

    handleAddCar: function (event) {
        event.preventDefault();

        var carInstance;
        var value = $('.input-value').val();
        var price = $('.input-price').val();

        console.log($('#wrapperAccounts').val(), value, price)

        App.contracts.Renting.deployed().then(function (instance) {
            carInstance = instance;

            return carInstance.addCar(value, price, {
                from: $('#wrapperAccounts').val(),
                gas: 1000000,
            });
        }).then(function (result) {
            var event = carInstance.CreatedCarEvent();
            App.handleEvent(event);

            $('.input-value').val(''); // clean input
            $('.input-price').val(''); // clean price
        }).catch(function (err) {
            console.log(err.message);
            $('button').button('reset');
        });
    },

    handleRentCar: function (event) {
        event.preventDefault();

        var carInstance;
        var carInt = parseInt($(event.target).data('car'));

        console.log("rent car, ", $('#wrapperAccounts').val(), carInt);

        App.contracts.Renting.deployed().then(function (instance) {
            carInstance = instance;

            return carInstance.rentCar(carInt, {
                from: $('#wrapperAccounts').val(),
                gas: 1000000
            });
        }).then(function (result) {
            var event = carInstance.CreatedRentEvent();
            App.handleEvent(event);
        }).catch(function (err) {
            console.log(err.message);
            $('button').button('reset');
        });
    },

    handleFreeCar: function (event) {
        event.preventDefault();

        var carInstance;
        var carInt = parseInt($(event.target).data('car'));
        var owner = $(event.target).data('owner');

        console.log("free car, ", $('#wrapperAccounts').val(), carInt, owner);

        App.contracts.Renting.deployed().then(function (instance) {
            carInstance = instance;

            var ret = carInstance.freeCar(carInt, {
                from: $('#wrapperAccounts').val(),
                gas: 1000000,
                value: web3.toWei(10, "ether")
            });

            carInstance.withdrawEarnings({
                from: owner,
                gas: 1000000
            });

            return ret;
        }).then(function (result) {
            var event = carInstance.CreatedFreeEvent();
            App.handleEvent(event);
        }).catch(function (err) {
            console.log(err.message);
            $('button').button('reset');
        });
    },

    handleRemoveCar: function (event) {
        event.preventDefault();

        var carInstance;
        var carInt = parseInt($(event.target).data('car'));

        console.log("remove car, ", $('#wrapperAccounts').val(), carInt);

        App.contracts.Renting.deployed().then(function (instance) {
            carInstance = instance;

            return carInstance.removeCar(carInt, {
                from: $('#wrapperAccounts').val(),
                gas: 1000000
            });
        }).then(function (result) {
            var event = carInstance.CreatedRemoveEvent();
            App.handleEvent(event);
        }).catch(function (err) {
            console.log(err.message);
            $('button').button('reset');
        });
    },

    handleEvent: function (event) {
        console.log('Waiting for a event...');
        event.watch(function (error, result) {
            if (!error) {
                App.getCars();
            } else {
                console.log(error);
            }
            event.stopWatching();
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});

function accountChanged() {
    console.log(`account = ${$('#wrapperAccounts').val()}`);
    App.getCars();
}
