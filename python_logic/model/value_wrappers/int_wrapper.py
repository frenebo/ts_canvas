from .base_value_wrapper import BaseValueWrapper
from .value_wrapper_exception import ValueWrapperException

class IntWrapper(BaseValueWrapper):
    def __init__(self, val):
        super().__init__(val)
    
    def copy_value(self, value):
        return int(value)
    
    def validate_value(self, value):
        if not (isinstance(value, int) or isinstance(value, float)):
            return "Value is not a number"
        if int(value) != value:
            return "Value is not an integer"
    
    def compare_values(self, val1, val2):
        return val1 == val2
    
    def stringify_value(self, value):
        return str(value)
    
    def parse_string(self, value_string):
        try:
            return int(value_string)
        except:
            raise ValueWrapperException("Invalid integer \"" + value_string + "\"")