
class Port:
    def __init__(self, side, position, port_type, value_name):
        assert side in ["left", "right", "top", "bottom"], "Assert port side is acceptable value"
        assert port_type in ["input", "output"], "Assert port type is acceptable value"
        assert isinstance(position, int) or isinstance(position, float), "Assert position is a number"
        assert isinstance(value_name, str), "Assert value name is a string"
        
        self._side = side
        self._position = position
        self._port_type = port_type
        self._value_name = value_name
    
    def clone(self):
        return Port(self._side, self._position, self._port_type, self._value_name)
    
    def value_name(self):
        return self._value_name
    
    def port_type(self):
        return self._port_type
    
    def to_json_serializable(self):
        return {
            "side": self._side,
            "position": self._position,
            "portType": self._port_type
        }