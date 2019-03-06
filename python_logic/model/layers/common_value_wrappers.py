from ..value_wrappers import EnumStringWrapper

def activation_enum_wrapper():
    return EnumStringWrapper(
        "linear",
        ["linear", "relu", "elu"],
    )
