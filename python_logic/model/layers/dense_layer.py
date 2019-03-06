from .base_layer import BaseLayer
from .layer_update_exception import LayerUpdateException
from ..value_wrappers import IntWrapper, EnumStringWrapper, BooleanWrapper, ShapeWrapper, ValueWrapperException
from .common_value_wrappers import activation_enum_wrapper
from keras.layers import Dense

class DenseLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            {
                "input_shape": ShapeWrapper([100]),
                "units": IntWrapper(3),
                "activation": activation_enum_wrapper(),
                # "use_bias": BooleanWrapper(True),
                "output_shape": ShapeWrapper([100]),
            },
            ["output_shape"],
            [
                ("input_shape_port", "input_shape"),
            ],
            [
                ("output_shape_port", "output_shape"),
            ]
        )
        self.update()
    
    def update(self):
        input_shape = self._field_val_wrappers["input_shape"].get_value()
        # add None as first dimension
        input_shape = [None] + input_shape
        activation_function = self._field_val_wrappers["activation"].get_value()
        
        units = self._field_val_wrappers["units"].get_value()
        
        if units <= 1:
            raise LayerUpdateException("Units must be a positive integer")

        output_shape = None
        
        try:
            layer = Dense(units=units, activation=activation_function)
            # skip first dimension to remove None dim
            output_shape = list(layer.compute_output_shape(input_shape))[1:]
        except Exception as exp:
            raise LayerUpdateException("Unknown keras error: " + str(exp))
        
        try:
            self._field_val_wrappers["output_shape"].set_value(output_shape)
        except ValueWrapperException as exp:
            raise LayerUpdateException("Could not set output shape to " + str(output_shape) + ": " + str(exp))
    
    def clone(self):
        clone = DenseLayer()
        BaseLayer.copy_layer_fields(self, clone)
        return clone