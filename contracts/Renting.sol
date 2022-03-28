pragma solidity >=0.4.21 <0.6.0;

contract Renting {
    struct Car {
        address payable owner;
        address rentedBy;
        string description;
        uint price;
        uint rentingTime;
        bool available;
    }

    Car[] public cars;

    event CreatedCarEvent();
    event CreatedRentEvent();
    event CreatedFreeEvent();
    event CreatedRemoveEvent();

    function getNumCars() public view returns (uint) {
        return cars.length;
    }

    // returns owner address, car description, price, available
    function getCar(uint pos) public view returns (uint, address, string memory, uint, bool, address) {
        Car storage c = cars[pos];
        return (pos, c.owner, c.description, c.price, c.available, c.rentedBy);
    }

    function addCar(string memory _description, uint _price) public returns (bool) {
        Car memory car;
        emit CreatedCarEvent();

        car.owner = msg.sender;
        car.description = _description;
        car.price = _price;
        car.available = true;
        car.rentingTime = 0;

        cars.push(car);

        return true;
    }

    function rentCar(uint pos) public returns (bool) {
        require(cars[pos].owner != msg.sender);
        if (cars[pos].available == true) {
            Car storage c = cars[pos];
            c.available = false;
            c.rentedBy = msg.sender;
            c.rentingTime = now;
            emit CreatedRentEvent();
            return true;
        }

        return false;
    }

    function freeCar(uint pos) public payable returns (bool) {
        require(cars[pos].rentedBy == msg.sender);
        if (cars[pos].available == false) {
            Car storage c = cars[pos];
            c.available = true;

            cars[pos].owner.transfer(msg.value);

            c.rentingTime = 0;
            emit CreatedFreeEvent();
            return true;
        }
        return false;
    }

    function withdrawEarnings() public payable {
        uint amount = 10 * 10 ** 18; // 10 eth
        msg.sender.transfer(amount);
    }

    function removeCar(uint pos) public returns (bool) {
        if (pos >= cars.length) {
            return false;
        }

        for (uint i = pos; i < cars.length - 1; i++){
            cars[i] = cars[i+1];
        }

        delete cars[cars.length - 1];
        cars.length--;

        return true;
    }
}
