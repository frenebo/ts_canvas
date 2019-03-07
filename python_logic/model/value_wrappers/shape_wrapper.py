from .base_value_wrapper import BaseValueWrapper
from .value_wrapper_exception import ValueWrapperException

class ShapeWrapper(BaseValueWrapper):
    def __init__(self, value, min_dimension_count=1, max_dimension_count=100):
        self._min_dimension_count = min_dimension_count
        self._max_dimension_count = max_dimension_count
        super().__init__(value)
    
    def copy_value(self, value):
        # creates a copy of the list value
        return list(value)
    
    def validate_value(self, value):
        if not isinstance(value, list):
            return "Value must be a list of numbers"
        
        for pos, element in enumerate(value, 1):
            if not isinstance(element, int):
                return "Element #"+str(pos)+" is not an integer"
            if element <= 0:
                return "Element #"+str(pos)+" is not a positive integer"
        if self._max_dimension_count == self._min_dimension_count and len(value) != self._max_dimension_count:
            return "Value must have " + str(self._max_dimension_count) + " dimensions"
        
        if len(value) < self._min_dimension_count or len(value) > self._max_dimension_count:
            return "Value must have between "+str(self._min_dimension_count)+" and " + str(self._max_dimension_count) + " dimensions"
    
    def compare_values(self, val1, val2):
        if len(val1) != len(val2):
            return False
        for i in range(len(val1)):
            if val1[i] != val2[i]:
                return False
        
        return True
    
    def stringify_value(self, value):
        stringified = "("
        
        for i, el in enumerate(value):
            if i != 0:
                stringified += ", "
            stringified += str(el)
        
        stringified += ")"
        
        return stringified
    
    def parse_string(self, value_string):
        trimmed = value_string.strip()
        if len(trimmed) == 0:
            raise ValueWrapperException("String is empty - could not parse")
        if trimmed[0] != "(":
            raise ValueWrapperException("Shape string must begin with an open parenthesis")
        if trimmed[len(trimmed) - 1] != ")":
            raise ValueWrapperException("Shape string must end with a close parenthesis")
        
        without_parenthesis = trimmed[1:-1]
        split_vals = without_parenthesis.split(",")

        parsed_value = []

        # pos starts at one for first item in list, not zero
        for pos, split_val in enumerate(split_vals, 1):
            stripped_val = split_val.strip()
            if len(stripped_val) == 0:
                raise ValueWrapperException("Value #"+str(pos)+" is empty")
            try:
                parsed_value.append(int(stripped_val))
            except ValueError:
                raise ValueWrapperException("Could not parse value #"+str(pos)+" as an integer")
        
        return parsed_value