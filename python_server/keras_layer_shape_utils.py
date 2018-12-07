from keras.layers import Dense, Conv2D

class LayerComputeException(Exception):
    def __init__(self, message, field_name, *args):
        self.message = message
        self.field_name = field_name # optional

        super(LayerShapeComputeException, self).__init__(message, field_name, *args)

def dense_shape_func(
    input_shape,
    units):
    if not isinstance(input_shape, list):
        raise LayerComputeException("Parameter must be list of numbers", "input_shape")

    for input_dim in input_shape:
        if (not (isinstance(input_dim, int) or isinstance(input_dim, float))) or int(input_dim) != input_dim or input_dim <= 0:
            raise LayerComputeException("Parameter must be a list of positive integers", "input_shape")

    if len(input_shape) < 2:
        raise LayerComputeException("Parameter must have at least two dimensions", "input_shape")

    if not (isinstance(units, int) or isinstance(units, float)):
        raise LayerComputeException("Argument must be a number", "units")

    if int(units) != units:
        raise LayerComputeException("Argument must be an integer", "units")

    if units <= 0:
        raise LayerComputeException("Argument must be positive", "units")

    try:
        layer = Dense(units=units)
        return {
            "output_shape": layer.compute_output_shape(input_shape),
        }

    except Exception as e:
        raise LayerComputeException("Failed to compute output shape")

def conv2d_shape_func(
    input_shape,
    filters,
    kernel_size,
    strides,
    padding,
    dilation_rate):
    layer = Conv2D(
        filters=filters,
        kernel_size=kernel_size,
        strides=strides,
        padding=padding,
    )
    return {
        "output_shape": layer.compute_output_shape(input_shape)
    }

def get_out_params(layer_name, layer_args):
    if layer_name == "Dense":
        return dense_shape_func(**layer_args)
    elif layer_name == "Conv2D":
        return conv2d_shape_func(**layer_args)
    else:
        return None

# if __name__ == "__main__":
#     print(dense_shape_func([224, 224, 3], 5))
#     print(conv2d_shape_func([224, 224, 3], 4, [1, 2], [2, 3], "valid", 2))
