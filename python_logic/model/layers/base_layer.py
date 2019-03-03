from ..value_wrappers import BaseValueWrapper

class BaseLayer:
    def __init__(self, field_val_wrappers, output_field_names):
        assert isinstance(field_val_wrappers, dict), "Assert field val wrappers is a dict"
        for field_name in field_val_wrappers:
            assert isinstance(field_name, str), "Assert field names are strings"
            assert isinstance(field_val_wrappers[field_name], BaseValueWrapper), "Assert field value wrappers instances of BaseValueWrapper"
        
        assert isinstance(output_field_names, list), "Assert output field names is a list"
        for field_name in output_field_names:
            assert field_name in field_val_wrappers, "Assert output field names are all in field_val_wrappers"
        
        self._field_val_wrappers = field_val_wrappers
        self._output_field_names = output_field_names
    
    def output_field_names(self):
        return self._output_field_names
    
    def field_names(self):
        return list(self._field_val_wrappers.keys())
    
    def has_field(self, field_name):
        return field_name in self._field_val_wrappers
    
    def validate_field_value_string(self, field_name, value_string):
        return self._field_val_wrappers[field_name].validate_value_string(value_string)
    
    def set_field_value_string(self, field_name, new_value):
        if field_name in self._output_field_names:
            # @TODO: use a custom exception
            raise Exception("Can't set value of output field")
        
        self._field_val_wrappers[field_name].set_value_string(new_value)
    
    def get_field_value_string(self, field_name):
        return self._field_val_wrappers[field_name].get_value_string()
    
    def is_field_read_only(self, field_name):
        return field_name in self._output_field_names
    
    def update(self):
        raise NotImplementedError()
    
    def clone(self):
        raise NotImplementedError()