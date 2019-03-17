from .base_layer import BaseLayer
from ..value_wrappers import ShapeWrapper

class InputLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            [
                ("output_shape", ShapeWrapper([244, 244, 3])),
            ],
            [],
            [],
            [
                ("output_shape_port", "output_shape")
            ]
        )
    
    def update(self):
        pass
    
    def clone(self):
        clone = InputLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone