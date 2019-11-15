
from keras.layers import Conv2D

class LayerMissingFieldException(Exception):
    """Raise when a layer field function isn't passed a required field"""

class InvalidFieldValueException(Exception):
    """Raise when a layer field has an invalid value"""

class LayerComputeException(Exception):
    """Raise when there's a problem calculating layer fields"""

def assert_shape_list_value(name, arr, dim_count=None):
    if not isinstance(arr, list):
        raise InvalidFieldValueException(name, "Value must be number array")

    if dim_count is not None:
        if len(arr) is not dim_count:
            raise InvalidFieldValueException(name, "Value must have {0} dimensions".format(dim_count))

    for i, dim in enumerate(arr):
        if (not isinstance(dim, int)) and (not isinstance(dim, float)):
            raise InvalidFieldValueException(name, "Dimension {0} must be an number".format(i + 1))

        if int(dim) != dim:
            raise InvalidFieldValueException(name, "Dimension {0} must be a positive integer".format(i + 1))

        if dim <= 0:
            raise InvalidFieldValueException(name, "Dimension {0} must be a positive integer".format(i + 1))

def assert_num_value(name, val, require_integer=None):
    if (not isinstance(val, int)) and (not isinstance(val, float)):
        raise InvalidFieldValueException(name, "Value must be a number")

    if require_integer is not None:
        if int(val) != val:
            raise InvalidFieldValueException(name, "Value must be an integer")

def get_output_shape(layer, input_shape):
    # first dimension None is for batch
    # input_with_none = [None] + input_shape
    output_with_none = list(layer.compute_output_shape([None] + input_shape))
    return output_with_none[1:]

def get_conv2d_fields(fields):
    input_shape = None
    kernel_size = None
    filters = None

    try:
        input_shape = fields["input_shape"]
        kernel_size = fields["kernel_size"]
        filters = fields["filters"]
    except KeyError as e:
        raise LayerMissingFieldException(str(e))

    assert_shape_list_value("input_shape", input_shape, 3)
    assert_shape_list_value("kernel_size", kernel_size, 2)
    assert_num_value("filters", filters, require_integer=True)

    layer = Conv2D(kernel_size=kernel_size, filters=filters)

    # first dimension None is for batch
    output_shape = get_output_shape(layer, input_shape)

    try:
        assert_shape_list_value("output_shape", output_shape)
    except InvalidFieldValueException:
        raise LayerComputeException("Could not create valid output shape")

    return {
        "output_shape": output_shape,
    }
