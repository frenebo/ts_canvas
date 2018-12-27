using System.Collections.Generic;
using ValueWrappers;

namespace Layers {
  public class MissingValueNameException : System.Exception {
    public MissingValueNameException(string message) : base(message) {}
  }

  public class InvalidLayerTypeException : System.Exception {
    public InvalidLayerTypeException(string message) : base(message) {}
  }

  public abstract class Layer {
    public static Layer getNewLayerByType(string type) {
      if (type == "Repeat") {
        return new RepeatLayer();
      } else {
        throw new InvalidLayerTypeException(type);
      }
    }
    public abstract string getType();

    public abstract List<string> getValueNames();

    public abstract void setValueString(string valueName, string newValue);

    public abstract string getValueString(string valueName);

    public abstract bool getValueIsReadonly(string valueName);

    public abstract List<string> getPortNames();
    public abstract string getValueNameOfPort(string valueName);

    public Layer clone() {
      Layer cloneLayer = Layer.getNewLayerByType(this.getType());

      foreach (string valueName in this.getValueNames()) {
        cloneLayer.setValueString(valueName, this.getValueString(valueName));
      }

      return cloneLayer;
    }
  }

  internal class RepeatLayer : Layer {
    private readonly string inputPortName = "inputPort";
    private readonly string inputShapeName = "inputShape";
    private readonly ShapeWrapper inputShape = new ShapeWrapper(new List<int>() {100, 100, 100});

    private readonly string outputPortName = "outputPort";

    private readonly string outputShapeName = "outputShape";
    private readonly ShapeWrapper outputShape = new ShapeWrapper(new List<int>() {100, 100, 100});

    public override string getType() {
      return "Repeat";
    }

    public override List<string> getValueNames() {
      return new List<string>() {
        this.inputShapeName,
        this.outputShapeName,
      };
    }

    public override List<string> getPortNames() {
      return new List<string>() {
        this.inputPortName,
        this.outputPortName
      };
    }

    public override string getValueNameOfPort(string valueName) {
      if (valueName == this.inputPortName) return this.inputShapeName;
      else if (valueName == this.outputPortName) return this.outputShapeName;
      else throw new MissingValueNameException(valueName);
    }

    public override void setValueString(string valueName, string newValue) {
      if (valueName == this.inputShapeName) this.inputShape.setFromString(newValue);
      else if (valueName == this.outputShapeName) this.outputShape.setFromString(newValue);
      else throw new MissingValueNameException(valueName);
    }

    public override string getValueString(string valueName) {
      if (valueName == this.inputShapeName) return this.inputShape.getString();
      else if (valueName == this.outputShapeName) return this.outputShape.getString();
      else throw new MissingValueNameException(valueName);
    }

    public override bool getValueIsReadonly(string valueName) {
      if (valueName == this.inputShapeName) return false;
      else if (valueName == this.outputShapeName) return true;
      else throw new MissingValueNameException(valueName);
    }
  }
}
