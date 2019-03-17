from .base_layer import BaseLayer
from ..value_wrappers import IntWrapper

class RepeatIntLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            [
                ("inputInt", IntWrapper(0)),
                ("outputInt", IntWrapper(0)),
            ],
            ["outputInt"],
            [
                ("input_port", "inputInt"),
            ],
            [
                ("output_port", "outputInt"),
            ]
        )
    
    def update(self):
        self.get_field_val_wrapper("outputInt").set_value(
            self.get_field_val_wrapper("inputInt").get_value()
        )
    
    def clone(self):
        clone = RepeatIntLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone