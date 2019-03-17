from .base_layer import BaseLayer
from ..value_wrappers import ShapeWrapper
from .layer_update_exception import LayerUpdateException

class ReshapeLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            [
                ("input_shape", ShapeWrapper([244, 244, 3])),
                ("target_shape", ShapeWrapper([244, 244, 3])),
                ("output_shape", ShapeWrapper([244, 244, 3])),
            ],
            ["output_shape"],
            [
                ("input_shape_port", "input_shape")
            ],
            [
                ("output_shape_port", "output_shape")
            ]
        )
    
    def update(self):
        input_shape = self.get_field_val_wrapper("input_shape").get_value()
        target_shape = self.get_field_val_wrapper("target_shape").get_value()
        input_shape_dim_product = 1
        for dim in input_shape:
            input_shape_dim_product *= dim
        target_shape_dim_product = 1
        for dim in target_shape:
            target_shape_dim_product *= dim
        
        if input_shape_dim_product != target_shape_dim_product:
                raise LayerUpdateException("The products of the input shape ({}) and the target shape ({}) must be the same.".format(input_shape_dim_product, target_shape_dim_product))
        self.get_field_val_wrapper("output_shape").set_value(target_shape)

    
    def clone(self):
        clone = ReshapeLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone