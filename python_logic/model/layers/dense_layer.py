from .base_layer import BaseLayer
from .layer_update_exception import LayerUpdateException
from ..value_wrappers import IntWrapper, EnumStringWrapper, BooleanWrapper, ShapeWrapper

class DenseLayer(BaseLayer):
    def __init__(self):
        super().__init__(
            {
                "input_shape": ShapeWrapper([100]),
                "units": IntWrapper(0),
                "activation": EnumStringWrapper(
                    ["activation", "relu", "elu"],
                    "activation"
                ),
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