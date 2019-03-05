from .base_value_wrapper import BaseValueWrapper

class EnumStringWrapper(BaseValueWrapper):
    def __init__(self, valid_vals, value):
        assert isinstance(valid_vals, list), "Assert valid_vals argument to enum string wrapper constructor is a list"
        
        for val in valid_vals:
            assert isinstance(val, str), "Assert that elements of valid_vals argument to enum string wrapper are strings"
        
        self.valid_vals = valid_vals
        super().__init__(value)

    def copy_value(self, value):
        return value
    
    def validate_value(self, value):
        if not isinstance(value, str):
            return "Value must be string"
        
        if value not in self.valid_vals:
            error_message = "Value must be one of these values: "
            for i, valid_val in enumerate(self.valid_vals):
                if i != 0:
                    error_message += ", "
                error_message += valid_val
            return error_message
        
        return None
    
    def compare_values(self, val1, val2):
        return val1 == val2
    
    def stringify_value(self, value):
        return value
    
    def parse_string(self, value_string):
        return value_string
