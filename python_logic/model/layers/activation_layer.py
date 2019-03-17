from .base_layer import BaseLayer
from ..value_wrappers import ShapeWrapper
from .common_value_wrappers import activation_enum_wrapper

class ActivationLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            field_val_wrappers=[
                ("input_shape", ShapeWrapper([244, 244, 3])),
                ("activation", activation_enum_wrapper()),
                ("output_shape", ShapeWrapper([244, 244, 3])),
            ],
            readonly_field_names=["output_shape"],
            input_ports_with_field_names=[
                ("input_shape_port", "input_shape")
            ],
            output_ports_with_field_names=[
                ("output_shape_port", "output_shape")
            ]
        )
    
    def update(self):
        input_shape = self.get_field_val_wrapper("input_shape").get_value()
        self.get_field_val_wrapper("output_shape").set_value(input_shape)
    
    def clone(self):
        clone = ActivationLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone