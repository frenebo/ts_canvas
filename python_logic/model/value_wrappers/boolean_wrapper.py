from .base_value_wrapper import BaseValueWrapper
from .value_wrapper_exception import ValueWrapperException

class BooleanWrapper(BaseValueWrapper):    
    def copy_value(self, value):
        return value
    
    def validate_value(self, value):
        if type(value) != bool:
            return "Value must be boolean"
        return None
    
    def compare_values(self, val1, val2):
        return val1 == val2
    
    def stringify_value(self, value):
        return "true" if value else "false"
    
    def parse_string(self, value_string):
        processed = value_string.lower().strip()
        if processed == "true":
            return True
        elif processed == "false":
            return False
        else:
            raise ValueWrapperException("Value is not \"true\" or \"false\"")