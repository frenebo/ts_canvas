from .base_layer import BaseLayer
from ..value_wrappers import IntWrapper

class RepeatIntLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            {
                "inputInt": IntWrapper(0),
                "outputInt": IntWrapper(0)
            },
            ["outputInt"],
            [
                ("input_port", "inputInt"),
            ],
            [
                ("output_port", "outputInt"),
            ]
        )
    
    def update(self):
        self._field_val_wrappers["outputInt"].set_value(
            self._field_val_wrappers["inputInt"].get_value()
        )
    
    def clone(self):
        clone_layer = RepeatIntLayer()
        clone_layer._field_val_wrappers["outputInt"].set_value(
            self._field_val_wrappers["outputInt"].get_value()
        )
        
        clone_layer._field_val_wrappers["inputInt"].set_value(
            self._field_val_wrappers["inputInt"].get_value()
        )
        return clone_layer