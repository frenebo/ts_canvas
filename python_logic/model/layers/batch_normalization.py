
from .base_layer import BaseLayer
from ..value_wrappers import ShapeWrapper, IntWrapper, FloatWrapper, BooleanWrapper

class BatchNormalizationLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            field_val_wrappers=[
                ("input_shape", ShapeWrapper([244, 244, 3])),
                ("axis", IntWrapper(1)),
                ("momentum", FloatWrapper(0.99)),
                ("epsilon", FloatWrapper(0.001)),
                ("center", BooleanWrapper(True)),
                ("scale", BooleanWrapper(True)),
                ("output_shape", ShapeWrapper([244, 244, 3])),
            ],
            readonly_field_names=["output_shape"],
            input_ports_with_field_names=[
                ("input_shape_port", "input_shape"),
            ],
            output_ports_with_field_names=[
                ("output_shape_port", "output_shape"),
            ]
        )
    
    def update(self):
        self.get_field_val_wrapper("output_shape").set_value(
            self.get_field_val_wrapper("input_shape").get_value()
        )
    
    def clone(self):
        clone = BatchNormalizationLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone