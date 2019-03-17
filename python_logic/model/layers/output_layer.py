from .base_layer import BaseLayer
from ..value_wrappers import ShapeWrapper

class OutputLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            [
                ("input_shape", ShapeWrapper([244, 244, 3])),
            ],
            [],
            [
                ("input_shape_port", "input_shape")
            ],
            []
        )
    
    def update(self):
        pass
    
    def clone(self):
        clone = OutputLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone