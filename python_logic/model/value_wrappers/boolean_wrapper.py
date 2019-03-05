from .base_value_wrapper import BaseValueWrapper
from .value_wrapper_exception import ValueWrapperException

class BooleanWrapper(BaseValueWrapper):    
    def clone_value(self, value):
        return value
    
    def validate_value(self, value):
        if type(value) != bool:
            return "Value must be boolean"
        return None
    
    def compare_values(self, val1, val2):
        raise NotImplementedError()
    
    def stringify_value(self, value):
        raise NotImplementedError()
    
    def parse_string(self, value_string):
        processed = value_string.lower().strip()
        if processed == "true":
            return True
        elif processed == "false":
            return False
        else:
            raise ValueWrapperException("Value is not a boolean")