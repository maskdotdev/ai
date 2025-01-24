# Create the static array
# Add push, pop, find methods

from typing import dataclass_transform


class Array:
    # Initialize the array
    def __init__(self, initial_capacity: int = 4, size: int = 0) -> None:
        """
        capacity is how many items fit in the array
        size is how many elements are currently in the array
        data is the underlying storage that holds the items
        """
        self.inital_capacity = initial_capacity
        self.capacity = initial_capacity
        self.size = size
        self.data = self.allocate_storage(self.capacity)

    def allocate_storage(self, capacity: int) -> dict[int, None]:
        # Since this is python this is a fake static array
        # All arrays in python are dynamic
        storage = {i: None for i in range(capacity)}
        return storage

    def push(self, element):
        """pushes an element to the end of the array"""
        if self.size == self.capacity:
            # resize the array's capacity (doubling)
            self.resize(2 * self.capacity)
            # assingn the element to the current size
            # this works because if we have 3 elements in the
            # array, but the capacity is 4
            # we can add another element to the array at position number 3
            # which should be the 4th item, because python is 0-based index
            self.data[self.size] = element
            self.size += 1

    def pop(self):
        """removes and element from the end of the array"""
        if self.size == 0:
            raise Exception("There are no elements to remove from this array")

        # get the element
        # We do minus 1 here because of the 0-based index
        element = self.data[self.size - 1]

        # Reduce the size of the array, because we are removing an item
        self.size = self.size - 1

        # If the size of the array is less tha 1/4th of the capacity
        # and greater than the initial capacity we split the capacity
        # in half to save space
        if self.size <= self.capacity / 4 and self.size > self.inital_capacity:
            # self.capacity(self.capacity / 2)
            self.resize(self.capacity / 2)

        return element

    def find(self, element):
        for key, value in self.data.items():
            if element == value:
                return key
        return -1

    def resize(self, new_capacity):
        """
        creates a new data with the new capacity
        replaces the old data with the new data with expanded capacity

        updates capacity to extended capacity
        """
        new_data = self.allocate_storage(new_capacity)
        for index in range(self.size - 1):
            new_data[index] = self.data[index]

        self.data = new_data
        self.capacity = new_capacity

    def __repr__(self) -> str:
        return ", ".join([f"{k}:{v}" for k, v in self.data.items()])


if __name__ == "__main__":
    array = Array()

    print("array: ", array)
