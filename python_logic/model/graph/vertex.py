from .port import Port

class Vertex:
    def __init__(self, label, ports, x_pos, y_pos):
        assert isinstance(label, str), "Assert label argument to constructor is string"
        assert isinstance(ports, dict), "Assert port argument to constructor is dict"
        
        for port_id in ports:
            assert isinstance(port_id, str), "Assert port ids are strings"
            assert isinstance(ports[port_id], Port), "Assert port dict values are Ports"
        
        self._label = label
        self._x_pos = x_pos
        self._y_pos = y_pos
        
        self._ports = ports
    
    def clone(self):
        cloned_ports = {}
        for port_id in self._ports:
            cloned_ports[port_id] = self._ports[port_id].clone()
        
        return Vertex(self._label, cloned_ports, self._x_pos, self._y_pos)
    
    def has_port(self, port_id):
        return port_id in self._ports
    
    def get_port(self, port_id):
        return self._ports[port_id]
    
    def port_ids(self):
        return list(self._ports.keys())
    
    def set_x(self, new_x):
        self._x_pos = new_x
    
    def set_y(self, new_y):
        self._y_pos = new_y
    
    def to_json_serializable(self):
        ports = {}
        for port_id in self._ports:
            ports[port_id] = self._ports[port_id].to_json_serializable()
        return {
            "label": self._label,
            "geo": {
                "x": self._x_pos,
                "y": self._y_pos,
            },
            "ports": ports
        }
