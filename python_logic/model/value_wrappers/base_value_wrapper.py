from .value_wrapper_exception import ValueWrapperException

class BaseValueWrapper:
    def __init__(self, value):
        self.set_value(value)
    
    def set_value(self, value):
        validated = self.validate_value(value)
        if validated is not None:
            raise ValueWrapperException(validated)
        
        self._value = self.copy_value(value)
    
    def get_value(self):
        return self.copy_value(self._value)
    
    def get_value_string(self):
        return self.stringify_value(self._value)
    
    def set_value_string(self, value):
        self.set_value(self.parse_string(value))
    
    def validate_value_string(self, value_string):
        try:
            return self.validate_value(self.parse_string(value_string))
        except ValueWrapperException as exp:
            return str(exp)
    
    def compare_to_value(self, value):
        try:
            return compare_values(self._value, value)
        except:
            return False
    
    def copy_value(self, value):
        raise NotImplementedError()
    
    def validate_value(self, value):
        raise NotImplementedError()
    
    def compare_values(self, val1, val2):
        raise NotImplementedError()
    
    def stringify_value(self, value):
        raise NotImplementedError()
    
    def parse_string(self, value_string):
        raise NotImplementedError()