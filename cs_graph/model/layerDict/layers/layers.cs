using System.Collections.Generic;
using ValueWrappers;

namespace Layers {
  public class MissingValueNameException : System.Exception {
    public MissingValueNameException(string message) : base(message) {}
  }

  public class InvalidLayerTypeException : System.Exception {
    public InvalidLayerTypeException(string message) : base(message) {}
  }

  internal class UpdateException : System.Exception {
    public UpdateException(string message) : base(message) {}
  }

  public class LayersValidated {
    public List<string> errors;
    public List<string> warnings;
    
    public LayersValidated(List<string> errors, List<string> warnings) {
      this.errors = errors;
      this.warnings = warnings;
    }
  }

  public abstract class Layer {
    public static Layer getNewLayerByType(string type) {
      if (type == "Repeat") {
        return new RepeatLayer();
      } else if (type == "Add") {
        return new AddLayer();
      } else {
        throw new InvalidLayerTypeException(type);
      }
    }
    public abstract string getType();

    public List<string> getValueNames() {
      return new List<string>(this.wrapperInterfaces.Keys);
    }

    public string validateFieldString(string valueName, string newValue) {
      return this.wrapperInterfaces[valueName].validateStringValue(newValue);
    }

    public bool compareFieldValue(string valueName, string compareValue) {
      return this.wrapperInterfaces[valueName].compareStringValue(compareValue);
    }
    
    public string getValueString(string valueName) {
      return this.wrapperInterfaces[valueName].getStringValue();
    }

    public bool getValueIsReadonly(string valueName) {
      return this.wrappersReadonlyInfo[valueName];
    }

    public void setFields(Dictionary<string, string> fieldValues) {
      foreach (KeyValuePair<string, string> entry in fieldValues) {
        this.wrapperInterfaces[entry.Key].setFromString(entry.Value);
      }
      
      this.update();
    }

    public Layers.LayersValidated validateSetFields(Dictionary<string, string> fieldValues) {
      Layer cloneLayer = this.clone();
      foreach (KeyValuePair<string, string> entry in fieldValues) {
        if (cloneLayer.getValueIsReadonly(entry.Key)) {
          return new Layers.LayersValidated(
            new List<string>() { $"Field \"{entry.Key}\" is read-only" },
            new List<string>()
          );
        }

        string validatedField = cloneLayer.validateFieldString(entry.Key, entry.Value);

        if (validatedField != null) {
          return new Layers.LayersValidated(
            new List<string>() { $"Field \"{entry.Key}\" has invalid value: {validatedField}" },
            new List<string>()
          );
        }
      }

      try {
        cloneLayer.update();
      } catch (UpdateException e) {
        return new Layers.LayersValidated(
          new List<string>() { e.Message },
          new List<string>()
        );
      } catch {
        return new Layers.LayersValidated(
          new List<string>() { "Unknown layer error" },
          new List<string>()
        );
      }

      return new Layers.LayersValidated(new List<string>(), new List<string>());
    }

    public List<string> getPortNames() {
      return new List<string>(this.portNamesToValueNames.Keys);
    }
    public string getValueNameOfPort(string valueName) {
      return this.portNamesToValueNames[valueName];
    }

    public Layer clone() {
      Layer cloneLayer = Layer.getNewLayerByType(this.getType());

      foreach (string valueName in this.getValueNames()) {
        cloneLayer.wrapperInterfaces[valueName].setFromString(this.getValueString(valueName));
      }

      return cloneLayer;
    }

    protected abstract Dictionary<string, ValueWrappers.WrapperStringInterface> wrapperInterfaces {get;}
    protected abstract Dictionary<string, bool> wrappersReadonlyInfo {get;}
    protected abstract Dictionary<string, string> portNamesToValueNames {get;}
    protected abstract void update();
  }

  internal class RepeatLayer : Layer {
    protected override Dictionary<string, ValueWrappers.WrapperStringInterface> wrapperInterfaces {get;}
    protected override Dictionary<string, bool> wrappersReadonlyInfo {get;}
    protected override Dictionary<string, string> portNamesToValueNames {get;}
    private readonly ShapeWrapper inputShape = new ShapeWrapper(new List<float>() {100, 100, 100});

    private readonly ShapeWrapper outputShape = new ShapeWrapper(new List<float>() {100, 100, 100});

    public RepeatLayer() {
      this.wrapperInterfaces = new Dictionary<string, ValueWrappers.WrapperStringInterface>() {
        {"inputShape", this.inputShape.getStringInterface()},
        {"outputShape", this.outputShape.getStringInterface()},
      };
      this.wrappersReadonlyInfo = new Dictionary<string, bool>() {
        {"inputShape", false},
        {"outputShape", true},
      };
      this.portNamesToValueNames = new Dictionary<string, string>() {
        {"inputPort", "inputShape"},
        {"outputPort", "outputShape"},
      };
    }

    public override string getType() {
      return "Repeat";
    }

    protected override void update() {
      this.outputShape.setValue(this.inputShape.getValue());
    }
  }

  internal class AddLayer : Layer {
    protected override Dictionary<string, ValueWrappers.WrapperStringInterface> wrapperInterfaces {get;}
    protected override Dictionary<string, bool> wrappersReadonlyInfo {get;}
    protected override Dictionary<string, string> portNamesToValueNames {get;}
    private readonly NumberWrapper inputNum1 = new NumberWrapper(0);

    private readonly NumberWrapper inputNum2 = new NumberWrapper(0);

    private readonly NumberWrapper outputNum = new NumberWrapper(0);

    public AddLayer() {
      this.wrapperInterfaces = new Dictionary<string, ValueWrappers.WrapperStringInterface>() {
        {"input 1", this.inputNum1.getStringInterface()},
        {"input 2", this.inputNum2.getStringInterface()},
        {"output", this.outputNum.getStringInterface()},
      };
      this.wrappersReadonlyInfo = new Dictionary<string, bool>() {
        {"input 1", false},
        {"input 2", false},
        {"output", true},
      };
      this.portNamesToValueNames = new Dictionary<string, string>() {
        {"inputPort1", "input 1"},
        {"inputPort1", "input 2"},
        {"outputPort", "output"},
      };
    }

    public override string getType() {
      return "Add";
    }

    protected override void update() {
      this.outputNum.setValue(this.inputNum1.getValue() + this.inputNum2.getValue());
    }
  }
}
