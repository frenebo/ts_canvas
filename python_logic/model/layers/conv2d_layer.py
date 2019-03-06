from .base_layer import BaseLayer
from .layer_update_exception import LayerUpdateException
from ..value_wrappers import IntWrapper, EnumStringWrapper, BooleanWrapper, ShapeWrapper, ValueWrapperException
from .common_value_wrappers import activation_enum_wrapper
from keras.layers import Conv2D

class Conv2DLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            {
                # only a 3 dimension value is allowed
                "input_shape": ShapeWrapper(
                    [100, 100, 3],
                    min_dimension_count=3,
                    max_dimension_count=3,
                ),
                # only a 2 dimension value is allowed
                "kernel_size": ShapeWrapper(
                    [3, 3],
                    min_dimension_count=2,
                    max_dimension_count=2,
                ),
                "strides": ShapeWrapper(
                    [1, 1],
                    min_dimension_count=2,
                    max_dimension_count=2,
                ),
                "padding": EnumStringWrapper(
                    "same",
                    ["same", "valid"]
                ),
                "filters": IntWrapper(3),
                "activation": activation_enum_wrapper(),
                "output_shape": ShapeWrapper([100, 100, 3])
            },
            ["output_shape"],
            [
                ("input_port", "input_shape"),
            ],
            [
                ("output_port", "output_shape")
            ],
        )
        self.update()
    
    def update(self):
        input_shape = self._field_val_wrappers["input_shape"].get_value()
        kernel_size = self._field_val_wrappers["kernel_size"].get_value()
        strides = self._field_val_wrappers["strides"].get_value()
        padding = self._field_val_wrappers["padding"].get_value()
        activation = self._field_val_wrappers["activation"].get_value()
        filters = self._field_val_wrappers["filters"].get_value()

        output_shape = None
        try:
            layer = Conv2D(filters=filters, kernel_size=kernel_size, strides=strides, padding=padding, activation=activation)
            # Add a None as first dimension for keras, remove the None from output dimension
            output_shape = list(layer.compute_output_shape([None] + input_shape))[1:]
        except Exception as exp:
            raise LayerUpdateException("Unknown keras error: " + str(exp))
        
        try:
            self._field_val_wrappers["output_shape"].set_value(output_shape)
        except ValueWrapperException as exp:
            raise LayerUpdateException("Could not set output shape to " + str(output_shape) + ": " + str(exp))
    
    def clone(self):
        clone = Conv2DLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone