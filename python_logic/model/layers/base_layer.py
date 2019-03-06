from ..value_wrappers import BaseValueWrapper, ValueWrapperException

class BaseLayer:
    def __init__(
        self,
        field_val_wrappers,
        readonly_field_names,
        input_ports_with_field_names,
        output_ports_with_field_names,
        ):
        assert isinstance(field_val_wrappers, dict), "Assert field val wrappers is a dict"
        for field_name in field_val_wrappers:
            assert isinstance(field_name, str), "Assert field names are strings"
            assert isinstance(field_val_wrappers[field_name], BaseValueWrapper), "Assert field value wrappers instances of BaseValueWrapper"
        
        
        assert isinstance(readonly_field_names, list), "Assert BaseLayer constructor argument is a list"
        for field_name in readonly_field_names:
            assert isinstance(field_name, str), "Assert BaseLayer constructor argument is a list of strings"
            assert field_name in field_val_wrappers, "Assert field names are all in field_val_wrappers"
        
        for ports_with_field_names in [input_ports_with_field_names, output_ports_with_field_names]:
            assert isinstance(ports_with_field_names, list), "Assert ports with field names argument is a list of port name-field name pairs"
            for port_and_name in ports_with_field_names:
                assert isinstance(port_and_name, tuple), "Assert port name-field name pairs are tuples"
                assert len(port_and_name) == 2, "Assert port name-field name pairs are tuples with two values"
                assert isinstance(port_and_name[0], str), "Assert port name is string in port name-field name pair"
                assert isinstance(port_and_name[1], str), "Assert field name is string in port name-field name pair"
        # @TODO : check that there are no conflicting input and output port names
        
        self._field_val_wrappers = field_val_wrappers
        self._readonly_field_names = readonly_field_names
        self._input_ports_with_field_names = input_ports_with_field_names
        self._output_ports_with_field_names = output_ports_with_field_names
    
    @staticmethod
    def copy_layer_fields(source_layer, target_layer):
        for field_name in source_layer._field_val_wrappers:
            target_layer._field_val_wrappers[field_name].set_value_string(
                source_layer._field_val_wrappers[field_name].get_value_string()
            )

    def port_names(self):
        names = []
        
        for pair in self._input_ports_with_field_names + self._output_ports_with_field_names:
            names.append(pair[0])
        
        return names
    
    # @QUESTION : should there be less methods here?
    def input_port_count(self):
        return len(self._input_ports_with_field_names)
    
    def output_port_count(self):
        return len(self._output_ports_with_field_names)
    
    def port_is_input(self, port_name):
        for pair in self._input_ports_with_field_names:
            if pair[0] == port_name:
                return True
        return False
    
    def field_name_of_port(self, port_name):
        for pair in self._input_ports_with_field_names + self._output_ports_with_field_names:
            if pair[0] == port_name:
                return pair[1]
        
        raise KeyError(port_name)

    def field_names(self):
        return list(self._field_val_wrappers.keys())
    
    def get_field_val_wrapper(self, field_name):
        return self._field_val_wrappers[field_name]

    def is_field_read_only(self, field_name):
        return field_name in self._readonly_field_names
    
    def update(self):
        raise NotImplementedError()
    
    def clone(self):
        raise NotImplementedError()