from .base_layer import BaseLayer
from ..value_wrappers import ShapeWrapper
from .layer_update_exception import LayerUpdateException

class AddLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            [
                ("first_input_shape", ShapeWrapper([244, 244, 3])),
                ("second_input_shape", ShapeWrapper([244, 244, 3])),
                ("output_shape", ShapeWrapper([244, 244, 3])),
            ],
            ["output_shape"],
            [
                ("first_input_shape_port", "first_input_shape"),
                ("second_input_shape_port", "second_input_shape"),
            ],
            [
                ("output_shape_port", "output_shape")
            ]
        )
    
    def update(self):
        first_input_shape_wrapper = self.get_field_val_wrapper("first_input_shape")
        second_input_shape_wrapper = self.get_field_val_wrapper("second_input_shape")

        if not first_input_shape_wrapper.compare_to_value(second_input_shape_wrapper.get_value()):
            raise LayerUpdateException("The input shapes to add layer must agree")
        
        self.get_field_val_wrapper("output_shape").set_value(
            first_input_shape_wrapper.get_value()
        )


    def clone(self):
        clone = AddLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone