from .base_value_wrapper import BaseValueWrapper
from .value_wrapper_exception import ValueWrapperException

class FloatWrapper(BaseValueWrapper):
    def __init__(self, val):
        super().__init__(val)
    
    def copy_value(self, value):
        return float(value)
    
    def validate_value(self, value):
        if not (isinstance(value, int) or isinstance(value, float)):
            return "Value is not a number"
    
    def compare_values(self, val1, val2):
        return val1 == val2
    
    def stringify_value(self, value):
        return str(value)
    
    def parse_string(self, value_string):
        try:
            return float(value_string)
        except:
            raise ValueWrapperException("Invalid float \"" + value_string + "\"")